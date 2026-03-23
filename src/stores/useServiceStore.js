import { defineStore } from 'pinia'
import { categoriesApi, commentsApi, destinationsApi, promotionsApi, servicesApi } from '@/services/api'
import { STORAGE_KEYS, readStorage, saveToStorage } from '@/utils/travelStorage'
import { normalizeServicesFromStorage } from '@/utils/travelNormalize'

const ensureArray = (value) => (Array.isArray(value) ? value : [])

export const useServiceStore = defineStore('services', {
  state: () => ({
    services: normalizeServicesFromStorage(ensureArray(readStorage(STORAGE_KEYS.services, []))),
    categories: ensureArray(readStorage(STORAGE_KEYS.categories, [])),
    destinations: ensureArray(readStorage(STORAGE_KEYS.destinations, [])),
    comments: ensureArray(readStorage(STORAGE_KEYS.comments, [])),
    promotions: ensureArray(readStorage(STORAGE_KEYS.promotions, [])),
    serviceDetail: null,
    loading: false,
    error: null
  }),

  getters: {
    featuredServices(state) {
      const services = Array.isArray(state.services) ? state.services : []
      return services.filter((service) => service.featured)
    },

    activePromotions(state) {
      const promotions = Array.isArray(state.promotions) ? state.promotions : []
      return promotions.filter((promotion) => promotion.status === 'active')
    }
  },

  actions: {
    setServices(services) {
      this.services = normalizeServicesFromStorage(ensureArray(services))
      saveToStorage(STORAGE_KEYS.services, this.services)
    },

    setCategories(categories) {
      this.categories = ensureArray(categories)
      saveToStorage(STORAGE_KEYS.categories, this.categories)
    },

    setDestinations(destinations) {
      this.destinations = ensureArray(destinations)
      saveToStorage(STORAGE_KEYS.destinations, this.destinations)
    },

    setComments(comments) {
      this.comments = ensureArray(comments)
      saveToStorage(STORAGE_KEYS.comments, this.comments)
    },

    setPromotions(promotions) {
      this.promotions = ensureArray(promotions)
      saveToStorage(STORAGE_KEYS.promotions, this.promotions)
    },

    async bootstrapServices() {
      this.loading = true
      this.error = null
      try {
        const [categories, destinations, services, comments, promotions] = await Promise.all([
          categoriesApi.getAll(),
          destinationsApi.getAll(),
          servicesApi.getAll(),
          commentsApi.getAll(),
          promotionsApi.getAll()
        ])

        if (Array.isArray(categories)) this.setCategories(categories)
        if (Array.isArray(destinations)) this.setDestinations(destinations)
        if (Array.isArray(services)) this.setServices(services)
        if (Array.isArray(comments)) this.setComments(comments)
        if (Array.isArray(promotions)) this.setPromotions(promotions)
      } catch (error) {
        this.error = error?.message || 'Lỗi tải dữ liệu dịch vụ'
        console.error('Error bootstrapping services:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchServices() {
      this.loading = true
      this.error = null
      try {
        const data = await servicesApi.getAll()
        if (Array.isArray(data)) {
          this.setServices(data)
        }
      } catch (error) {
        this.error = error?.message || 'Lỗi tải danh sách dịch vụ'
      } finally {
        this.loading = false
      }
    },

    async fetchServiceById(id) {
      this.loading = true
      this.error = null
      try {
        const data = await servicesApi.getById(id)
        this.serviceDetail = data || null
      } catch (error) {
        this.serviceDetail = null
        this.error = error?.message || 'Lỗi tải chi tiết dịch vụ'
      } finally {
        this.loading = false
      }
    },

    async fetchCategories() {
      try {
        const data = await categoriesApi.getAll()
        if (Array.isArray(data)) this.setCategories(data)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    },

    async fetchDestinations() {
      try {
        const data = await destinationsApi.getAll()
        if (Array.isArray(data)) this.setDestinations(data)
      } catch (error) {
        console.error('Error fetching destinations:', error)
      }
    },

    async fetchComments() {
      try {
        const data = await commentsApi.getAll()
        if (Array.isArray(data)) this.setComments(data)
      } catch (error) {
        console.error('Error fetching comments:', error)
      }
    },

    async fetchPromotions() {
      try {
        const data = await promotionsApi.getAll()
        if (Array.isArray(data)) this.setPromotions(data)
      } catch (error) {
        console.error('Error fetching promotions:', error)
      }
    },

    getServiceBySlug(slug) {
      const services = Array.isArray(this.services) ? this.services : []
      return services.find((service) => service.slug === slug)
    },

    getCommentsByService(serviceId) {
      const comments = Array.isArray(this.comments) ? this.comments : []
      return comments
        .filter((comment) => comment.visible !== false)
        .filter((comment) => comment.serviceId === serviceId)
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    },

    clearServiceDetail() {
      this.serviceDetail = null
    },

    clearError() {
      this.error = null
    }
  }
})
