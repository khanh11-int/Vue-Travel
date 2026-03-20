import { computed, reactive, readonly } from 'vue'

const STORAGE_KEYS = {
  user: 'vietvoyage_user',
  users: 'vietvoyage_users',
  adminSession: 'vietvoyage_admin_session'
}

const defaultUsers = [
  {
    id: 1,
    fullName: 'Admin Việt Voyage',
    email: 'admin@vietvoyage.vn',
    password: '123456',
    role: 'admin'
  },
  {
    id: 2,
    fullName: 'Khách du lịch Việt',
    email: 'user@vietvoyage.vn',
    password: '123456',
    role: 'customer'
  }
]

const readStorage = (key, fallback) => {
  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : fallback
  } catch (error) {
    return fallback
  }
}

const persistStorage = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

const state = reactive({
  currentUser: null,
  users: defaultUsers
})

const bootstrapState = () => {
  if (typeof window === 'undefined') return
  state.users = readStorage(STORAGE_KEYS.users, defaultUsers)
  state.currentUser = readStorage(STORAGE_KEYS.user, null)
}

bootstrapState()

export const useAuthStore = () => {
  const isLoggedIn = computed(() => Boolean(state.currentUser))
  const isAdmin = computed(() => state.currentUser?.role === 'admin')

  const syncUser = (user) => {
    state.currentUser = user
    persistStorage(STORAGE_KEYS.user, user)

    if (user?.role === 'admin') {
      window.localStorage.setItem(STORAGE_KEYS.adminSession, 'active')
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.adminSession)
    }
  }

  const login = ({ email, password, asAdmin = false }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const user = state.users.find((entry) => entry.email.toLowerCase() === normalizedEmail)

    if (!user || user.password !== password) {
      return {
        success: false,
        message: 'Email hoặc mật khẩu chưa đúng.'
      }
    }

    if (asAdmin && user.role !== 'admin') {
      return {
        success: false,
        message: 'Tài khoản này không có quyền admin mock.'
      }
    }

    syncUser(user)

    return {
      success: true,
      user,
      message: user.role === 'admin' ? 'Đăng nhập admin thành công.' : 'Đăng nhập thành công.'
    }
  }

  const register = ({ fullName, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const exists = state.users.some((entry) => entry.email.toLowerCase() === normalizedEmail)

    if (exists) {
      return {
        success: false,
        message: 'Email này đã tồn tại, vui lòng dùng email khác.'
      }
    }

    const newUser = {
      id: Date.now(),
      fullName,
      email: normalizedEmail,
      password,
      role: 'customer'
    }

    state.users = [newUser, ...state.users]
    persistStorage(STORAGE_KEYS.users, state.users)
    syncUser(newUser)

    return {
      success: true,
      user: newUser,
      message: 'Đăng ký thành công và đã đăng nhập.'
    }
  }

  const logout = () => {
    state.currentUser = null
    window.localStorage.removeItem(STORAGE_KEYS.user)
    window.localStorage.removeItem(STORAGE_KEYS.adminSession)
  }

  return {
    state: readonly(state),
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout
  }
}