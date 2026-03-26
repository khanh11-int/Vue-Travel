import { defineStore } from 'pinia'
import { STORAGE_KEYS, getScopedKey, GUEST_SCOPE, persistStorage, readStorage } from '@/utils/travelStorage'
import { useAuthStore } from '@/stores/useAuthStore'

export const useWishlistStore = defineStore('wishlist', {
  /**
   * Khởi tạo state wishlist theo scope người dùng hiện tại.
   * @returns {Object} Wishlist state mặc định.
   */
  state: () => ({
    wishlist: [],
    _currentUserId: GUEST_SCOPE
  }),

  getters: {
    /**
     * Trả về tổng số item wishlist để hiển thị badge nhanh.
     * @param {Object} state - Wishlist state hiện tại.
     * @returns {number} Tổng item wishlist.
     */
    wishlistCount(state) {
      return Array.isArray(state.wishlist) ? state.wishlist.length : 0
    },

    /**
     * Sinh hàm kiểm tra service đã tồn tại trong wishlist chưa.
     * @param {Object} state - Wishlist state hiện tại.
     * @returns {Function} Hàm nhận serviceId và trả về boolean.
     */
    isInWishlist(state) {
      return (serviceId) => {
        const wishlist = Array.isArray(state.wishlist) ? state.wishlist : []
        const numericServiceId = Number(serviceId)
        if (!Number.isNaN(numericServiceId)) {
          return wishlist.some((id) => Number(id) === numericServiceId)
        }

        return wishlist.some((id) => String(id) === String(serviceId))
      }
    }
  },

  actions: {
    /**
     * Đồng bộ scope công khai để view có thể gọi khi chuyển tài khoản.
     * @returns {void}
     */
    syncUserScope() {
      this._syncUserId()
    },

    /**
     * Đồng bộ user scope hiện tại và nạp lại wishlist khi người dùng thay đổi.
     * @returns {void}
     */
    _syncUserId() {
      const authStore = useAuthStore()
      const userId = authStore.currentUser?.id ? String(authStore.currentUser.id) : GUEST_SCOPE
      if (userId !== this._currentUserId) {
        this._currentUserId = userId
        this._loadWishlist()
      }
    },

    /**
     * Nạp wishlist theo user scope hiện tại từ localStorage.
     * @returns {void}
     */
    _loadWishlist() {
      const scopedKey = getScopedKey(STORAGE_KEYS.wishlist, this._currentUserId)
      this.wishlist = ensureArray(readStorage(scopedKey, []))
    },

    /**
     * Lưu wishlist hiện tại theo đúng scoped key.
     * @returns {void}
     */
    _saveWishlist() {
      const scopedKey = getScopedKey(STORAGE_KEYS.wishlist, this._currentUserId)
      persistStorage(scopedKey, this.wishlist)
    },

    /**
     * Bật/tắt service trong wishlist (toggle theo id).
     * @param {number|string} serviceId - Id service cần cập nhật.
     * @returns {void}
     */
    toggleWishlist(serviceId) {
      this._syncUserId()

      const normalizedId = Number(serviceId) || serviceId
      const index = this.wishlist.findIndex((id) => Number(id) === Number(normalizedId))

      if (index !== -1) {
        this.wishlist.splice(index, 1)
      } else {
        this.wishlist.push(normalizedId)
      }

      this._saveWishlist()
    },

    /**
     * Thêm service vào wishlist nếu chưa tồn tại.
     * @param {number|string} serviceId - Id service cần thêm.
     * @returns {void}
     */
    addToWishlist(serviceId) {
      this._syncUserId()

      const normalizedId = Number(serviceId) || serviceId
      if (!this.wishlist.includes(normalizedId)) {
        this.wishlist.push(normalizedId)
        this._saveWishlist()
      }
    },

    /**
     * Xóa service khỏi wishlist khi tìm thấy id tương ứng.
     * @param {number|string} serviceId - Id service cần xóa.
     * @returns {void}
     */
    removeFromWishlist(serviceId) {
      this._syncUserId()

      const normalizedId = Number(serviceId) || serviceId
      const index = this.wishlist.findIndex((id) => Number(id) === Number(normalizedId))

      if (index !== -1) {
        this.wishlist.splice(index, 1)
        this._saveWishlist()
      }
    },

    /**
     * Xóa toàn bộ wishlist của user scope hiện tại.
     * @returns {void}
     */
    clearWishlist() {
      this._syncUserId()
      this.wishlist = []
      this._saveWishlist()
    }
  }
})

/**
 * Ép giá trị đầu vào về mảng hợp lệ để tránh lỗi khi đọc storage.
 * @param {*} value - Giá trị bất kỳ.
 * @returns {Array} Mảng hợp lệ.
 */
const ensureArray = (value) => (Array.isArray(value) ? value : [])
