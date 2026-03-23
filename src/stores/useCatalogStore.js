import { defineStore } from 'pinia'
import { getTravelContextStore as useTravelContextStore } from '@/stores/getTravelContextStore'
import { STORAGE_KEYS } from '@/stores/travelShared'

export const useCatalogStore = defineStore('travelCatalog', {
  state: () => ({}),

  getters: {
    featuredServices() {
      const contextStore = useTravelContextStore()
      const services = Array.isArray(contextStore.state.services) ? contextStore.state.services : []
      return services.filter((service) => service.featured)
    },

    wishlistItems() {
      const contextStore = useTravelContextStore()
      const wishlist = Array.isArray(contextStore.state.wishlist) ? contextStore.state.wishlist : []
      const services = Array.isArray(contextStore.state.services) ? contextStore.state.services : []

      return wishlist
        .map((id) => services.find((service) => service.id === id))
        .filter(Boolean)
    },

    activePromotions() {
      const contextStore = useTravelContextStore()
      const promotions = Array.isArray(contextStore.state.promotions) ? contextStore.state.promotions : []
      return promotions.filter((promotion) => promotion.status === 'active')
    }
  },

  actions: {
    getServiceBySlug(slug) {
      const contextStore = useTravelContextStore()
      const services = Array.isArray(contextStore.state.services) ? contextStore.state.services : []
      return services.find((service) => service.slug === slug)
    },

    getCommentsByService(serviceId) {
      const contextStore = useTravelContextStore()
      const comments = Array.isArray(contextStore.state.comments) ? contextStore.state.comments : []

      return comments
        .filter((comment) => comment.visible !== false)
        .filter((comment) => comment.serviceId === serviceId)
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    },

    toggleWishlist(serviceId) {
      const contextStore = useTravelContextStore()
      contextStore.syncScopeFromSession()

      const wishlist = Array.isArray(contextStore.state.wishlist) ? contextStore.state.wishlist : []
      const exists = wishlist.includes(serviceId)
      contextStore.state.wishlist = exists
        ? wishlist.filter((id) => id !== serviceId)
        : [...wishlist, serviceId]

      contextStore.persistScoped(STORAGE_KEYS.wishlist, contextStore.state.wishlist)
    }
  }
})
