import { computed, reactive, readonly } from 'vue'

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

const state = reactive({
  currentUser: null,
  users: defaultUsers
})

const bootstrapState = () => {
  if (typeof window === 'undefined') return
  state.users = readStorage(STORAGE_KEYS.users, defaultUsers)

  const savedSession = readStorage(STORAGE_KEYS.session, null)
  if (savedSession?.user?.id) {
    const matchedUser = state.users.find((entry) => entry.id === savedSession.user.id)
    state.currentUser = toPublicUser(matchedUser || savedSession.user)
    return
  }

  // Backward compatibility with old key.
  state.currentUser = readStorage(STORAGE_KEYS.user, null)
}

bootstrapState()

export const useAuthStore = () => {
  const isLoggedIn = computed(() => Boolean(state.currentUser))
  const isAdmin = computed(() => state.currentUser?.role === 'admin')

  const syncUser = (user) => {
    const publicUser = toPublicUser(user)
    state.currentUser = publicUser
    persistStorage(STORAGE_KEYS.user, publicUser)
    persistStorage(STORAGE_KEYS.session, {
      user: publicUser,
      loginAt: new Date().toISOString()
    })

    window.dispatchEvent(new CustomEvent('vietvoyage:auth-changed', { detail: publicUser }))
  }

  const login = ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email)
    const user = state.users.find((entry) => entry.email.toLowerCase() === normalizedEmail)

    if (!user || user.password !== password) {
      return {
        success: false,
        message: 'Email hoặc mật khẩu chưa đúng.'
      }
    }

    syncUser(user)

    return {
      success: true,
      user: toPublicUser(user),
      message: user.role === 'admin' ? 'Đăng nhập admin thành công.' : 'Đăng nhập thành công.'
    }
  }

  const register = ({ fullName, email, password, phone = '', address = '' }) => {
    const normalizedEmail = normalizeEmail(email)
    const normalizedPhone = normalizePhone(phone)

    if (!normalizedEmail.endsWith('@gmail.com')) {
      return {
        success: false,
        message: 'Email đăng ký phải có đuôi @gmail.com.'
      }
    }

    const exists = state.users.some((entry) => entry.email.toLowerCase() === normalizedEmail)

    if (exists) {
      return {
        success: false,
        message: 'Email này đã tồn tại, vui lòng dùng email khác.'
      }
    }

    const phoneExists = state.users.some((entry) => normalizePhone(entry.phone) === normalizedPhone)
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

    state.users = [newUser, ...state.users]
    persistStorage(STORAGE_KEYS.users, state.users)
    syncUser(newUser)

    return {
      success: true,
      user: toPublicUser(newUser),
      message: 'Đăng ký thành công và đã đăng nhập.'
    }
  }

  const logout = () => {
    state.currentUser = null
    window.localStorage.removeItem(STORAGE_KEYS.user)
    window.localStorage.removeItem(STORAGE_KEYS.session)
    window.dispatchEvent(new CustomEvent('vietvoyage:auth-changed', { detail: null }))
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