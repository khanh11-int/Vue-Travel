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

/**
 * Đọc JSON từ localStorage với fallback an toàn khi key thiếu hoặc parse lỗi.
 * @param {string} key - Khóa localStorage.
 * @param {*} fallback - Giá trị trả về khi không đọc được dữ liệu.
 * @returns {*} Dữ liệu đã parse hoặc fallback.
 */
export const loadFromStorage = (key, fallback) => {
  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : fallback
  } catch (error) {
    return fallback
  }
}

/**
 * Lưu dữ liệu bất kỳ vào localStorage theo định dạng JSON.
 * @param {string} key - Khóa localStorage.
 * @param {*} value - Giá trị cần lưu.
 * @returns {void}
 */
export const saveToStorage = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

/**
 * Xóa dữ liệu theo key khỏi localStorage.
 * @param {string} key - Khóa localStorage cần xóa.
 * @returns {void}
 */
export const removeFromStorage = (key) => {
  window.localStorage.removeItem(key)
}

// Backward-compatible aliases.
export const readStorage = loadFromStorage
export const persistStorage = saveToStorage

/**
 * Lấy user id đang hoạt động từ session hiện tại hoặc key user cũ để tương thích ngược.
 * @returns {string} User id hiện tại hoặc guest.
 */
export const getActiveUserId = () => {
  const session = loadFromStorage(AUTH_STORAGE_KEYS.session, null)
  if (session?.user?.id) return String(session.user.id)

  return GUEST_SCOPE
}

/**
 * Tạo key theo scope user để tách dữ liệu guest/user đăng nhập.
 * @param {string} baseKey - Key gốc theo domain dữ liệu.
 * @param {string} userId - User id hiện tại.
 * @returns {string} Scoped key.
 */
export const getScopedKey = (baseKey, userId) => `${baseKey}_${userId || GUEST_SCOPE}`

/**
 * Đọc danh sách user auth từ storage và đảm bảo trả về mảng hợp lệ.
 * @param {Array<Object>} fallbackUsers - Giá trị mặc định khi storage trống/lỗi.
 * @returns {Array<Object>} Danh sách user.
 */
export const getStoredAuthUsers = (fallbackUsers = []) => {
  const users = loadFromStorage(AUTH_STORAGE_KEYS.users, fallbackUsers)
  return Array.isArray(users) ? users : fallbackUsers
}

/**
 * Ghi danh sách user auth vào storage sau khi chuẩn hóa kiểu mảng.
 * @param {Array<Object>} users - Danh sách user cần lưu.
 * @returns {void}
 */
export const saveStoredAuthUsers = (users) => {
  saveToStorage(AUTH_STORAGE_KEYS.users, Array.isArray(users) ? users : [])
}

/**
 * Đọc session đăng nhập hiện tại từ storage.
 * @returns {Object|null} Session hiện tại hoặc null.
 */
export const getStoredAuthSession = () => loadFromStorage(AUTH_STORAGE_KEYS.session, null)

/**
 * Lưu session đăng nhập hiện tại vào storage.
 * @param {Object} sessionValue - Dữ liệu session cần lưu.
 * @returns {void}
 */
export const saveStoredAuthSession = (sessionValue) => {
  saveToStorage(AUTH_STORAGE_KEYS.session, sessionValue)
}

/**
 * Xóa session đăng nhập hiện tại khỏi storage khi logout.
 * @returns {void}
 */
export const clearStoredAuthSession = () => {
  removeFromStorage(AUTH_STORAGE_KEYS.session)
  removeFromStorage(AUTH_STORAGE_KEYS.user)
}

/**
 * Đọc dữ liệu user từ key legacy để hỗ trợ migration dữ liệu cũ.
 * @returns {Object|null} User legacy hoặc null.
 */
export const getLegacyAuthUser = () => loadFromStorage(AUTH_STORAGE_KEYS.user, null)
