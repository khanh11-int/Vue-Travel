export const STORAGE_KEYS = {
  wishlist: 'vtravel_wishlist',
  cart: 'vtravel_cart',
  comments: 'vtravel_comments',
  bookings: 'vtravel_bookings',
  services: 'vtravel_services',
  promotions: 'vtravel_promotions',
  categories: 'vtravel_categories',
  destinations: 'vtravel_destinations',
  appliedPromotion: 'vtravel_applied_promotion'
}

export const AUTH_STORAGE_KEYS = {
  session: 'vtravel_session',
  users: 'vtravel_users',
  user: 'vtravel_user'
}

export const AUTH_CHANGED_EVENT = 'vtravel:auth-changed'
export const GUEST_SCOPE = 'guest'

export const loadFromStorage = (key, fallback) => {
  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : fallback
  } catch (error) {
    return fallback
  }
}

export const saveToStorage = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const removeFromStorage = (key) => {
  window.localStorage.removeItem(key)
}

// Backward-compatible aliases.
export const readStorage = loadFromStorage
export const persistStorage = saveToStorage

export const getActiveUserId = () => {
  const session = loadFromStorage(AUTH_STORAGE_KEYS.session, null)
  if (session?.user?.id) return String(session.user.id)

  const legacyUser = loadFromStorage(AUTH_STORAGE_KEYS.user, null)
  if (legacyUser?.id) return String(legacyUser.id)

  return GUEST_SCOPE
}

export const getScopedKey = (baseKey, userId) => `${baseKey}_${userId || GUEST_SCOPE}`

export const getStoredAuthUsers = (fallbackUsers = []) => {
  const users = loadFromStorage(AUTH_STORAGE_KEYS.users, fallbackUsers)
  return Array.isArray(users) ? users : fallbackUsers
}

export const saveStoredAuthUsers = (users) => {
  saveToStorage(AUTH_STORAGE_KEYS.users, Array.isArray(users) ? users : [])
}

export const getStoredAuthSession = () => loadFromStorage(AUTH_STORAGE_KEYS.session, null)

export const saveStoredAuthSession = (sessionValue) => {
  saveToStorage(AUTH_STORAGE_KEYS.session, sessionValue)
}

export const clearStoredAuthSession = () => {
  removeFromStorage(AUTH_STORAGE_KEYS.session)
}

export const getLegacyAuthUser = () => loadFromStorage(AUTH_STORAGE_KEYS.user, null)
