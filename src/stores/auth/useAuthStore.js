import { defineStore } from 'pinia'
import {
  AUTH_CHANGED_EVENT,
  clearStoredAuthSession,
  getStoredAuthSession,
  getStoredAuthUsers,
  saveStoredAuthSession,
  saveStoredAuthUsers
} from '@/utils/travelStorage'

const defaultUsers = [
  {
    id: 1,
    fullName: 'Admin Vtravel',
    email: 'admin@vtravel.vn',
    password: '123456',
    role: 'admin',
    phone: '0912345678',
    address: 'Quận 1, TP.HCM'
  },
  {
    id: 2,
    fullName: 'Khách du lịch Việt',
    email: 'user@vtravel.vn',
    password: '123456',
    role: 'customer',
    phone: '0987654321',
    address: 'Cầu Giấy, Hà Nội'
  }
]

/**
 * Chuyển user raw thành public user để không lộ password ra state/UI.
 * @param {Object|null} user - User nguồn.
 * @returns {Object|null} User public hoặc null.
 */
const toPublicUser = (user) => {
  if (!user) return null
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    address: user.address || ''
  }
}

/**
 * Đảm bảo danh sách user luôn là mảng hợp lệ.
 * @param {*} value - Giá trị bất kỳ.
 * @returns {Array<Object>} Danh sách user.
 */
const ensureUsersArray = (value) => (Array.isArray(value) ? value : [...defaultUsers])

/**
 * Lấy dữ liệu user ban đầu từ storage, có fallback mặc định.
 * @returns {Array<Object>} Danh sách user ban đầu.
 */
const resolveInitialUsers = () => ensureUsersArray(getStoredAuthUsers(defaultUsers))

/**
 * Xác định người dùng hiện tại dựa trên session hoặc key legacy.
 * @param {Array<Object>} users - Danh sách user hiện có.
 * @returns {Object|null} User đang đăng nhập hoặc null.
 */
const resolveInitialCurrentUser = (users) => {
  const safeUsers = ensureUsersArray(users)
  const savedSession = getStoredAuthSession()

  if (savedSession?.user?.id) {
    const matchedUser = safeUsers.find((entry) => entry.id === savedSession.user.id)
    return toPublicUser(matchedUser || savedSession.user)
  }

  // Không tự đăng nhập từ key legacy để tránh trạng thái "đã logout nhưng vẫn vào như đã login".
  return null
}

export const useAuthStore = defineStore('auth', {
  /**
   * Khởi tạo auth state từ dữ liệu storage.
   * @returns {Object} Auth state ban đầu.
   */
  state: () => {
    const users = resolveInitialUsers()
    return {
      currentUser: resolveInitialCurrentUser(users),
      users,
      loading: false,
      error: null
    }
  },

  getters: {
    /**
     * Kiểm tra trạng thái đăng nhập hiện tại.
     * @param {Object} state - Auth state hiện tại.
     * @returns {boolean} True nếu đã đăng nhập.
     */
    isLoggedIn(state) {
      return Boolean(state.currentUser)
    },

    /**
     * Kiểm tra user hiện tại có quyền admin hay không.
     * @param {Object} state - Auth state hiện tại.
     * @returns {boolean} True nếu role là admin.
     */
    isAdmin(state) {
      return state.currentUser?.role === 'admin'
    }
  },

  actions: {
    /**
     * Nạp lại user/session từ storage để đồng bộ trạng thái auth lúc khởi động.
     * @returns {Promise<boolean>} Luôn trả true khi hoàn tất.
     */
    async bootstrapState() {
      const users = ensureUsersArray(getStoredAuthUsers(defaultUsers))
      this.users = users
      this.currentUser = resolveInitialCurrentUser(users)
      return true
    },

    /**
     * Xử lý đăng nhập, lưu session và phát sự kiện auth-changed.
     * @param {Object|string} emailOrPayload - Payload login hoặc email.
     * @param {string} maybePassword - Mật khẩu khi truyền dạng tham số rời.
     * @returns {Promise<Object>} Kết quả đăng nhập có success/message/user.
     */
    async login(emailOrPayload, maybePassword) {
      this.loading = true
      this.error = null
      try {
        const email = typeof emailOrPayload === 'object' ? emailOrPayload?.email : emailOrPayload
        const password = typeof emailOrPayload === 'object' ? emailOrPayload?.password : maybePassword
        const users = Array.isArray(this.users) ? this.users : []
        const normalizedEmail = String(email || '').trim().toLowerCase()
        const foundUser = users.find((u) => u.email.toLowerCase() === normalizedEmail && u.password === password)
        if (!foundUser) {
          throw new Error('Email hoặc mật khẩu không chính xác')
        }
        this.currentUser = toPublicUser(foundUser)
        saveStoredAuthSession({ user: this.currentUser })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: this.currentUser }))
        }

        return {
          success: true,
          user: this.currentUser,
          message: this.currentUser?.role === 'admin' ? 'Đăng nhập admin thành công.' : 'Đăng nhập thành công.'
        }
      } catch (err) {
        this.error = err.message || 'Lỗi đăng nhập'
        return {
          success: false,
          message: this.error,
          user: null
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Đăng ký tài khoản mới, tự đăng nhập và phát sự kiện auth-changed.
     * @param {Object} payload - Dữ liệu đăng ký từ form.
     * @returns {Promise<Object>} Kết quả đăng ký có success/message/user.
     */
    async register(payload) {
      this.loading = true
      this.error = null
      try {
        const { fullName, email, password, phone, address } = payload
        const normalizedEmail = email.trim().toLowerCase()
        const normalizedPhone = phone.replace(/\D/g, '')

        const users = Array.isArray(this.users) ? this.users : []
        if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
          throw new Error('Email đã tồn tại')
        }

        const newUser = {
          id: Math.max(...users.map((u) => u.id || 0), 0) + 1,
          fullName: fullName || '',
          email: normalizedEmail,
          password,
          role: 'customer',
          phone: normalizedPhone,
          address: address || ''
        }

        this.users = [newUser, ...users]
        saveStoredAuthUsers(this.users)
        this.currentUser = toPublicUser(newUser)
        saveStoredAuthSession({ user: this.currentUser })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: this.currentUser }))
        }

        return {
          success: true,
          user: this.currentUser,
          message: 'Đăng ký thành công và đã đăng nhập.'
        }
      } catch (err) {
        this.error = err.message || 'Lỗi đăng ký'
        return {
          success: false,
          message: this.error,
          user: null
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Đăng xuất: xóa user hiện tại, xóa session storage và phát sự kiện auth-changed.
     * @returns {void}
     */
    logout() {
      this.currentUser = null
      clearStoredAuthSession()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: null }))
      }
    },

    /**
     * Xóa thông báo lỗi auth hiện tại.
     * @returns {void}
     */
    clearError() {
      this.error = null
    }
  }
})
