import { defineStore } from 'pinia'
import { commentsApi, promotionsApi, servicesApi } from '@/services/api'
import { useAuthStore } from '@/stores/useAuthStore'
import { useServiceStore } from '@/stores/useServiceStore'
import { fireAndForget } from '@/utils/travelBooking'

const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

export const useAdminStore = defineStore('travelAdmin', {
  state: () => ({}),

  actions: {
    saveService(serviceInput) {
      const serviceStore = useServiceStore()
      const services = Array.isArray(serviceStore.services) ? serviceStore.services : []
      const payload = {
        ...serviceInput,
        salePrice: toNumber(serviceInput.salePrice, 0),
        price: toNumber(serviceInput.price, 0),
        availableSlots: toNumber(serviceInput.availableSlots, 0),
        rating: toNumber(serviceInput.rating, 4.5)
      }

      if (payload.id) {
        const nextServices = services.map((service) =>
          service.id === payload.id ? { ...service, ...payload } : service
        )
        serviceStore.setServices(nextServices)
        fireAndForget(() => servicesApi.update(payload.id, payload))
      } else {
        const newService = {
          ...payload,
          id: Date.now(),
          createdAt: new Date().toISOString()
        }
        serviceStore.setServices([newService, ...services])
        fireAndForget(() => servicesApi.create(newService))
      }
    },

    toggleServiceStatus(serviceId) {
      const serviceStore = useServiceStore()
      const services = Array.isArray(serviceStore.services) ? serviceStore.services : []
      let updatedService = null

      const nextServices = services.map((service) => {
        if (service.id !== serviceId) return service
        updatedService = { ...service, status: service.status === 'active' ? 'inactive' : 'active' }
        return updatedService
      })

      serviceStore.setServices(nextServices)

      if (updatedService) {
        fireAndForget(() => servicesApi.update(serviceId, updatedService))
      }
    },

    savePromotion(promotionInput) {
      const serviceStore = useServiceStore()
      const promotions = Array.isArray(serviceStore.promotions) ? serviceStore.promotions : []
      const payload = {
        ...promotionInput,
        code: promotionInput.code.trim().toUpperCase(),
        value: toNumber(promotionInput.value, 0)
      }

      if (payload.id) {
        const nextPromotions = promotions.map((promotion) =>
          promotion.id === payload.id ? { ...promotion, ...payload } : promotion
        )
        serviceStore.setPromotions(nextPromotions)
        fireAndForget(() => promotionsApi.update(payload.id, payload))
      } else {
        const newPromotion = { ...payload, id: Date.now() }
        serviceStore.setPromotions([newPromotion, ...promotions])
        fireAndForget(() => promotionsApi.create(newPromotion))
      }
    },

    togglePromotionStatus(promotionId) {
      const serviceStore = useServiceStore()
      const promotions = Array.isArray(serviceStore.promotions) ? serviceStore.promotions : []
      let updatedPromotion = null

      const nextPromotions = promotions.map((promotion) => {
        if (promotion.id !== promotionId) return promotion
        updatedPromotion = { ...promotion, status: promotion.status === 'active' ? 'inactive' : 'active' }
        return updatedPromotion
      })

      serviceStore.setPromotions(nextPromotions)

      if (updatedPromotion) {
        fireAndForget(() => promotionsApi.update(promotionId, updatedPromotion))
      }
    },

    toggleCommentVisibility(commentId) {
      const serviceStore = useServiceStore()
      const comments = Array.isArray(serviceStore.comments) ? serviceStore.comments : []
      let updatedComment = null

      const nextComments = comments.map((comment) => {
        if (comment.id !== commentId) return comment
        updatedComment = { ...comment, visible: comment.visible === false }
        return updatedComment
      })

      serviceStore.setComments(nextComments)

      if (updatedComment) {
        fireAndForget(() => commentsApi.update(commentId, updatedComment))
      }
    },

    deleteComment(commentId) {
      const serviceStore = useServiceStore()
      const comments = Array.isArray(serviceStore.comments) ? serviceStore.comments : []
      const nextComments = comments.filter((comment) => comment.id !== commentId)
      serviceStore.setComments(nextComments)
      fireAndForget(() => commentsApi.remove(commentId))
    },

    addComment({ serviceId, userName, rating, content }) {
      const serviceStore = useServiceStore()
      const comments = Array.isArray(serviceStore.comments) ? serviceStore.comments : []
      const authStore = useAuthStore()
      const currentUser = authStore.currentUser || null
      const newComment = {
        id: Date.now(),
        serviceId,
        userName: userName || currentUser?.fullName || 'Khách hàng',
        rating: toNumber(rating, 5),
        content,
        createdAt: new Date().toISOString(),
        visible: true
      }

      serviceStore.setComments([newComment, ...comments])
      fireAndForget(() => commentsApi.create(newComment))
    }
  }
})
