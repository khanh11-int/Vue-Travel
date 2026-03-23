import { defineStore } from 'pinia'
import { commentsApi, promotionsApi, servicesApi } from '@/services/api'
import { getTravelContextStore as useTravelContextStore } from '@/stores/getTravelContextStore'
import { STORAGE_KEYS, fireAndForget, persistStorage } from '@/stores/travelShared'

export const useAdminStore = defineStore('travelAdmin', {
  state: () => ({}),

  actions: {
    saveService(serviceInput) {
      const contextStore = useTravelContextStore()
      const payload = {
        ...serviceInput,
        salePrice: Number(serviceInput.salePrice || 0),
        price: Number(serviceInput.price || 0),
        availableSlots: Number(serviceInput.availableSlots || 0),
        rating: Number(serviceInput.rating || 4.5)
      }

      if (payload.id) {
        contextStore.state.services = contextStore.state.services.map((service) =>
          service.id === payload.id ? { ...service, ...payload } : service
        )
        fireAndForget(() => servicesApi.update(payload.id, payload))
      } else {
        const newService = {
          ...payload,
          id: Date.now(),
          createdAt: new Date().toISOString()
        }
        contextStore.state.services = [newService, ...contextStore.state.services]
        fireAndForget(() => servicesApi.create(newService))
      }

      contextStore.persistServices()
    },

    toggleServiceStatus(serviceId) {
      const contextStore = useTravelContextStore()
      let updatedService = null

      contextStore.state.services = contextStore.state.services.map((service) => {
        if (service.id !== serviceId) return service
        updatedService = { ...service, status: service.status === 'active' ? 'inactive' : 'active' }
        return updatedService
      })

      contextStore.persistServices()

      if (updatedService) {
        fireAndForget(() => servicesApi.update(serviceId, updatedService))
      }
    },

    savePromotion(promotionInput) {
      const contextStore = useTravelContextStore()
      const payload = {
        ...promotionInput,
        code: promotionInput.code.trim().toUpperCase(),
        value: Number(promotionInput.value || 0)
      }

      if (payload.id) {
        contextStore.state.promotions = contextStore.state.promotions.map((promotion) =>
          promotion.id === payload.id ? { ...promotion, ...payload } : promotion
        )
        fireAndForget(() => promotionsApi.update(payload.id, payload))
      } else {
        const newPromotion = { ...payload, id: Date.now() }
        contextStore.state.promotions = [newPromotion, ...contextStore.state.promotions]
        fireAndForget(() => promotionsApi.create(newPromotion))
      }

      contextStore.persistPromotions()
    },

    togglePromotionStatus(promotionId) {
      const contextStore = useTravelContextStore()
      let updatedPromotion = null

      contextStore.state.promotions = contextStore.state.promotions.map((promotion) => {
        if (promotion.id !== promotionId) return promotion
        updatedPromotion = { ...promotion, status: promotion.status === 'active' ? 'inactive' : 'active' }
        return updatedPromotion
      })

      contextStore.persistPromotions()

      if (updatedPromotion) {
        fireAndForget(() => promotionsApi.update(promotionId, updatedPromotion))
      }
    },

    toggleCommentVisibility(commentId) {
      const contextStore = useTravelContextStore()
      let updatedComment = null

      contextStore.state.comments = contextStore.state.comments.map((comment) => {
        if (comment.id !== commentId) return comment
        updatedComment = { ...comment, visible: comment.visible === false }
        return updatedComment
      })

      persistStorage(STORAGE_KEYS.comments, contextStore.state.comments)

      if (updatedComment) {
        fireAndForget(() => commentsApi.update(commentId, updatedComment))
      }
    },

    deleteComment(commentId) {
      const contextStore = useTravelContextStore()
      contextStore.state.comments = contextStore.state.comments.filter((comment) => comment.id !== commentId)
      persistStorage(STORAGE_KEYS.comments, contextStore.state.comments)
      fireAndForget(() => commentsApi.remove(commentId))
    },

    addComment({ serviceId, userName, rating, content }) {
      const contextStore = useTravelContextStore()
      const newComment = {
        id: Date.now(),
        serviceId,
        userName,
        rating,
        content,
        createdAt: new Date().toISOString(),
        visible: true
      }

      contextStore.state.comments = [newComment, ...contextStore.state.comments]
      persistStorage(STORAGE_KEYS.comments, contextStore.state.comments)
      fireAndForget(() => commentsApi.create(newComment))
    }
  }
})
