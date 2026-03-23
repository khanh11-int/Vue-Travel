import { defineStore } from 'pinia'
import { STORAGE_KEYS, getScopedKey, GUEST_SCOPE, persistStorage, readStorage } from '@/utils/travelStorage'
import { useAuthStore } from '@/stores/useAuthStore'

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    wishlist: [],
    _currentUserId: GUEST_SCOPE
  }),

  getters: {
    wishlistCount(state) {
      return Array.isArray(state.wishlist) ? state.wishlist.length : 0
    },

    isInWishlist(state) {
      return (serviceId) => {
        const wishlist = Array.isArray(state.wishlist) ? state.wishlist : []
        return wishlist.includes(serviceId)
      }
    }
  },

  actions: {
    _syncUserId() {
      const authStore = useAuthStore()
      const userId = authStore.currentUser?.id ? String(authStore.currentUser.id) : GUEST_SCOPE
      if (userId !== this._currentUserId) {
        this._currentUserId = userId
        this._loadWishlist()
      }
    },

    _loadWishlist() {
      const scopedKey = getScopedKey(STORAGE_KEYS.wishlist, this._currentUserId)
      this.wishlist = ensureArray(readStorage(scopedKey, []))
    },

    _saveWishlist() {
      const scopedKey = getScopedKey(STORAGE_KEYS.wishlist, this._currentUserId)
      persistStorage(scopedKey, this.wishlist)
    },

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

    addToWishlist(serviceId) {
      this._syncUserId()

      const normalizedId = Number(serviceId) || serviceId
      if (!this.wishlist.includes(normalizedId)) {
        this.wishlist.push(normalizedId)
        this._saveWishlist()
      }
    },

    removeFromWishlist(serviceId) {
      this._syncUserId()

      const normalizedId = Number(serviceId) || serviceId
      const index = this.wishlist.findIndex((id) => Number(id) === Number(normalizedId))

      if (index !== -1) {
        this.wishlist.splice(index, 1)
        this._saveWishlist()
      }
    },

    clearWishlist() {
      this._syncUserId()
      this.wishlist = []
      this._saveWishlist()
    }
  }
})

const ensureArray = (value) => (Array.isArray(value) ? value : [])
