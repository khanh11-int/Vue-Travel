import { defineStore } from 'pinia'
import {
  AUTH_CHANGED_EVENT,
  clearStoredAuthSession,
  getLegacyAuthUser,
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

const ensureUsersArray = (value) => (Array.isArray(value) ? value : [...defaultUsers])

const resolveInitialUsers = () => ensureUsersArray(getStoredAuthUsers(defaultUsers))

const resolveInitialCurrentUser = (users) => {
  const safeUsers = ensureUsersArray(users)
  const savedSession = getStoredAuthSession()

  if (savedSession?.user?.id) {
    const matchedUser = safeUsers.find((entry) => entry.id === savedSession.user.id)
    return toPublicUser(matchedUser || savedSession.user)
  }

  return getLegacyAuthUser()
}

export const useAuthStore = defineStore('auth', {
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
    isLoggedIn(state) {
      return Boolean(state.currentUser)
    },

    isAdmin(state) {
      return state.currentUser?.role === 'admin'
    }
  },

  actions: {
    async bootstrapState() {
      const users = ensureUsersArray(getStoredAuthUsers(defaultUsers))
      this.users = users
      this.currentUser = resolveInitialCurrentUser(users)
      return true
    },

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

    logout() {
      this.currentUser = null
      clearStoredAuthSession()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: null }))
      }
    },

    clearError() {
      this.error = null
    }
  }
})
