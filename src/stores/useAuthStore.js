import { defineStore } from 'pinia'
import { seedUsersIfEmpty, usersApi } from '@/services/api'

const STORAGE_KEYS = {
  session: 'vietvoyage_session',
  users: 'vietvoyage_users',
  user: 'vietvoyage_user'
}

const defaultUsers = [
  {
    id: 1,
    fullName: 'Admin Việt Voyage',
    email: 'admin@vietvoyage.vn',
    password: '123456',
    role: 'admin',
    phone: '0912345678',
    address: 'Quận 1, TP.HCM'
  },
  {
    id: 2,
    fullName: 'Khách du lịch Việt',
    email: 'user@vietvoyage.vn',
    password: '123456',
    role: 'customer',
    phone: '0987654321',
    address: 'Cầu Giấy, Hà Nội'
  }
]

const normalizeEmail = (email = '') => email.trim().toLowerCase()
const normalizePhone = (phone = '') => phone.replace(/\D/g, '')

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

const fireAndForget = (promiseFactory) => {
  Promise.resolve()
    .then(() => promiseFactory())
    .catch(() => {})
}

const ensureUsersArray = (value) => (Array.isArray(value) ? value : [...defaultUsers])

const resolveInitialUsers = () => ensureUsersArray(readStorage(STORAGE_KEYS.users, defaultUsers))

const resolveInitialCurrentUser = (users) => {
  const safeUsers = ensureUsersArray(users)
  const savedSession = readStorage(STORAGE_KEYS.session, null)

  if (savedSession?.user?.id) {
    const matchedUser = safeUsers.find((entry) => entry.id === savedSession.user.id)
    return toPublicUser(matchedUser || savedSession.user)
  }

  // Backward compatibility with old key.
  return readStorage(STORAGE_KEYS.user, null)
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const users = resolveInitialUsers()
    return {
      state: {
        currentUser: resolveInitialCurrentUser(users),
        users
      },
      _bootstrapPromise: null
    }
  },

  getters: {
    isLoggedIn(state) {
      return Boolean(state.state.currentUser)
    },

    isAdmin(state) {
      return state.state.currentUser?.role === 'admin'
    }
  },

  actions: {
    persistUsers() {
      persistStorage(STORAGE_KEYS.users, this.state.users)
    },

    async bootstrapState() {
      if (this._bootstrapPromise) return this._bootstrapPromise

      this._bootstrapPromise = (async () => {
        try {
          const apiUsers = await seedUsersIfEmpty(defaultUsers)
          if (Array.isArray(apiUsers) && apiUsers.length > 0) {
            this.state.users = ensureUsersArray(apiUsers)
            this.persistUsers()
          }
        } catch (error) {
          this.state.users = ensureUsersArray(this.state.users)
          this.persistUsers()
        }

        if (this.state.currentUser?.id) {
          const matchedUser = this.state.users.find((entry) => entry.id === this.state.currentUser.id)
          if (matchedUser) {
            this.state.currentUser = toPublicUser(matchedUser)
            persistStorage(STORAGE_KEYS.user, this.state.currentUser)
            persistStorage(STORAGE_KEYS.session, {
              user: this.state.currentUser,
              loginAt: new Date().toISOString()
            })
          }
        }
      })()

      return this._bootstrapPromise
    },

    syncUser(user) {
      const publicUser = toPublicUser(user)
      this.state.currentUser = publicUser
      persistStorage(STORAGE_KEYS.user, publicUser)
      persistStorage(STORAGE_KEYS.session, {
        user: publicUser,
        loginAt: new Date().toISOString()
      })

      window.dispatchEvent(new CustomEvent('vietvoyage:auth-changed', { detail: publicUser }))
    },

    login({ email, password }) {
      this.state.users = ensureUsersArray(this.state.users)
      const normalizedEmail = normalizeEmail(email)
      const user = this.state.users.find((entry) => entry.email.toLowerCase() === normalizedEmail)

      if (!user || user.password !== password) {
        return {
          success: false,
          message: 'Email hoặc mật khẩu chưa đúng.'
        }
      }

      this.syncUser(user)

      return {
        success: true,
        user: toPublicUser(user),
        message: user.role === 'admin' ? 'Đăng nhập admin thành công.' : 'Đăng nhập thành công.'
      }
    },

    register({ fullName, email, password, phone = '', address = '' }) {
      this.state.users = ensureUsersArray(this.state.users)
      const normalizedEmail = normalizeEmail(email)
      const normalizedPhone = normalizePhone(phone)

      if (!normalizedEmail.endsWith('@gmail.com')) {
        return {
          success: false,
          message: 'Email đăng ký phải có đuôi @gmail.com.'
        }
      }

      const exists = this.state.users.some((entry) => entry.email.toLowerCase() === normalizedEmail)

      if (exists) {
        return {
          success: false,
          message: 'Email này đã tồn tại, vui lòng dùng email khác.'
        }
      }

      const phoneExists = this.state.users.some((entry) => normalizePhone(entry.phone) === normalizedPhone)
      if (phoneExists) {
        return {
          success: false,
          message: 'Số điện thoại này đã tồn tại, vui lòng dùng số khác.'
        }
      }

      const newUser = {
        id: Date.now(),
        fullName,
        email: normalizedEmail,
        password,
        role: 'customer',
        phone: normalizedPhone,
        address
      }

      this.state.users = [newUser, ...this.state.users]
      this.persistUsers()
      fireAndForget(() => usersApi.create(newUser))
      this.syncUser(newUser)

      return {
        success: true,
        user: toPublicUser(newUser),
        message: 'Đăng ký thành công và đã đăng nhập.'
      }
    },

    logout() {
      this.state.currentUser = null
      window.localStorage.removeItem(STORAGE_KEYS.user)
      window.localStorage.removeItem(STORAGE_KEYS.session)
      window.dispatchEvent(new CustomEvent('vietvoyage:auth-changed', { detail: null }))
    }
  }
})