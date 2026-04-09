import { defineStore } from 'pinia'
import { categoriesApi, commentsApi, destinationsApi, promotionsApi, servicesApi } from '@/services/api'
import { STORAGE_KEYS, readStorage, saveToStorage } from '@/utils/travelStorage'
import { normalizeServicesFromStorage } from '@/utils/travelNormalize'

/**
 * Đảm bảo dữ liệu đầu vào luôn là mảng để tránh lỗi khi bind state/getter.
 * @param {*} value - Giá trị bất kỳ.
 * @returns {Array} Mảng hợp lệ.
 */
const ensureArray = (value) => (Array.isArray(value) ? value : [])
const toSafeSlots = (value) => Math.max(0, Number(value || 0) || 0)

const distributeMissingSlots = (items, totalSlots, key) => {
  const normalizedItems = ensureArray(items)
  const missingIndexes = []
  let knownSlots = 0

  normalizedItems.forEach((item, index) => {
    if (item?.[key] == null) {
      missingIndexes.push(index)
      return
    }
    knownSlots += toSafeSlots(item[key])
  })

  if (!missingIndexes.length) {
    return normalizedItems.map((item) => ({ ...item, [key]: toSafeSlots(item?.[key]) }))
  }

  const targetTotal = Math.max(knownSlots, toSafeSlots(totalSlots))
  const remainingSlots = Math.max(0, targetTotal - knownSlots)
  const baseSlots = Math.floor(remainingSlots / missingIndexes.length)
  let remainderSlots = remainingSlots % missingIndexes.length

  return normalizedItems.map((item, index) => {
    if (!missingIndexes.includes(index)) {
      return { ...item, [key]: toSafeSlots(item?.[key]) }
    }

    const bonus = remainderSlots > 0 ? 1 : 0
    remainderSlots = Math.max(0, remainderSlots - bonus)
    return {
      ...item,
      [key]: baseSlots + bonus
    }
  })
}

const normalizeServiceSlots = (service) => {
  if (!service || typeof service !== 'object') return service

  if (service.categoryId === 'hotel') {
    const roomTypes = ensureArray(service.roomTypes)
    if (!roomTypes.length) return { ...service, availableSlots: toSafeSlots(service.availableSlots) }

    const normalizedRoomTypes = distributeMissingSlots(roomTypes, service.availableSlots, 'availableSlots')
    const totalSlots = normalizedRoomTypes.reduce((sum, roomType) => sum + toSafeSlots(roomType.availableSlots), 0)

    return {
      ...service,
      roomTypes: normalizedRoomTypes,
      availableSlots: totalSlots
    }
  }

  if (service.categoryId === 'ticket') {
    const ticketPackages = ensureArray(service.ticketPackages)
    if (!ticketPackages.length) return { ...service, availableSlots: toSafeSlots(service.availableSlots) }

    const normalizedTicketPackages = distributeMissingSlots(ticketPackages, service.availableSlots, 'availableSlots')
    const totalSlots = normalizedTicketPackages.reduce((sum, ticketPackage) => sum + toSafeSlots(ticketPackage.availableSlots), 0)

    return {
      ...service,
      ticketPackages: normalizedTicketPackages,
      availableSlots: totalSlots
    }
  }

  if (service.categoryId === 'tour') {
    const scheduleType = String(service.scheduleType || 'hybrid').toLowerCase()
    if (scheduleType === 'fixed') {
      const departures = ensureArray(service.departures)
      const totalSlots = departures.reduce((sum, departure) => sum + toSafeSlots(departure?.remainingSlots), 0)
      return {
        ...service,
        availableSlots: totalSlots
      }
    }

    return {
      ...service,
      availableSlots: Number.MAX_SAFE_INTEGER
    }
  }

  return {
    ...service,
    availableSlots: toSafeSlots(service.availableSlots)
  }
}

const sanitizeCategories = (categories) => ensureArray(categories)

const sanitizeServices = (services) =>
  normalizeServicesFromStorage(ensureArray(services))
    .map((service) => normalizeServiceSlots(service))
    .filter((service, index, list) => {
      const normalizedId = String(service?.id ?? '')
      const normalizedSlug = String(service?.slug ?? '')

      return index === list.findIndex((entry) => {
        const entryId = String(entry?.id ?? '')
        const entrySlug = String(entry?.slug ?? '')
        if (normalizedId && entryId) return entryId === normalizedId
        if (normalizedSlug && entrySlug) return entrySlug === normalizedSlug
        return false
      })
    })

const getCachedCollection = (key) => ensureArray(readStorage(key, []))

export const useServiceStore = defineStore('services', {
  /**
   * Khởi tạo state dịch vụ từ storage để có dữ liệu cache khi mở app.
   * @returns {Object} Service state mặc định.
   */
  state: () => ({
    services: sanitizeServices(getCachedCollection(STORAGE_KEYS.services)),
    categories: sanitizeCategories(getCachedCollection(STORAGE_KEYS.categories)),
    destinations: getCachedCollection(STORAGE_KEYS.destinations),
    comments: getCachedCollection(STORAGE_KEYS.comments),
    promotions: getCachedCollection(STORAGE_KEYS.promotions),
    serviceDetail: null,
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Lọc danh sách dịch vụ nổi bật để render ở trang chủ.
     * @param {Object} state - Service state hiện tại.
     * @returns {Array<Object>} Danh sách dịch vụ featured.
     */
    featuredServices(state) {
      const services = Array.isArray(state.services) ? state.services : []
      return services.filter((service, index, list) => {
        if (!service.featured) return false

        const normalizedId = String(service?.id ?? '')
        const normalizedSlug = String(service?.slug ?? '')

        return index === list.findIndex((entry) => {
          if (!entry.featured) return false

          const entryId = String(entry?.id ?? '')
          const entrySlug = String(entry?.slug ?? '')
          if (normalizedId && entryId) return entryId === normalizedId
          if (normalizedSlug && entrySlug) return entrySlug === normalizedSlug
          return false
        })
      })
    },

    /**
     * Lọc các khuyến mãi còn hiệu lực theo trạng thái active.
     * @param {Object} state - Service state hiện tại.
     * @returns {Array<Object>} Danh sách khuyến mãi active.
     */
    activePromotions(state) {
      const promotions = Array.isArray(state.promotions) ? state.promotions : []
      return promotions.filter((promotion) => promotion.status === 'active')
    }
  },

  actions: {
    /**
     * Cập nhật danh sách dịch vụ và persist xuống storage.
     * @param {Array<Object>} services - Danh sách dịch vụ mới.
     * @returns {void}
     */
    setServices(services) {
      this.services = sanitizeServices(services)
      saveToStorage(STORAGE_KEYS.services, this.services)
    },

    /**
     * Cập nhật danh mục dịch vụ và persist xuống storage.
     * @param {Array<Object>} categories - Danh sách category.
     * @returns {void}
     */
    setCategories(categories) {
      this.categories = sanitizeCategories(categories)
      saveToStorage(STORAGE_KEYS.categories, this.categories)
    },

    /**
     * Cập nhật điểm đến và persist xuống storage.
     * @param {Array<Object>} destinations - Danh sách điểm đến.
     * @returns {void}
     */
    setDestinations(destinations) {
      this.destinations = ensureArray(destinations)
      saveToStorage(STORAGE_KEYS.destinations, this.destinations)
    },

    /**
     * Cập nhật bình luận và persist xuống storage.
     * @param {Array<Object>} comments - Danh sách bình luận.
     * @returns {void}
     */
    setComments(comments) {
      this.comments = ensureArray(comments)
      saveToStorage(STORAGE_KEYS.comments, this.comments)
    },

    /**
     * Cập nhật khuyến mãi và persist xuống storage.
     * @param {Array<Object>} promotions - Danh sách khuyến mãi.
     * @returns {void}
     */
    setPromotions(promotions) {
      this.promotions = ensureArray(promotions)
      saveToStorage(STORAGE_KEYS.promotions, this.promotions)
    },

    /**
     * Nạp đồng thời toàn bộ collection chính từ API để bootstrap dữ liệu app.
     * Side effect: ghi dữ liệu vào state + localStorage và cập nhật loading/error.
     * @returns {Promise<void>}
     */
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
        if (Array.isArray(services)) {
          // API data must come first to avoid stale local cache overriding fresh slot fields.
          this.setServices([...services, ...(Array.isArray(this.services) ? this.services : [])])
        }
        if (Array.isArray(comments)) this.setComments(comments)
        if (Array.isArray(promotions)) this.setPromotions(promotions)
      } catch (error) {
        this.error = error?.message || 'Lỗi tải dữ liệu dịch vụ'
        console.error('Error bootstrapping services:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Tải lại danh sách dịch vụ từ API.
     * @returns {Promise<void>}
     */
    async fetchServices() {
      this.loading = true
      this.error = null
      try {
        const data = await servicesApi.getAll()
        if (Array.isArray(data)) {
          this.setServices([...data, ...(Array.isArray(this.services) ? this.services : [])])
        }
      } catch (error) {
        this.error = error?.message || 'Lỗi tải danh sách dịch vụ'
      } finally {
        this.loading = false
      }
    },

    /**
     * Tải chi tiết dịch vụ theo id và gán vào serviceDetail.
     * @param {number|string} id - Id dịch vụ cần lấy.
     * @returns {Promise<void>}
     */
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

    /**
     * Tải danh mục từ API rồi đồng bộ về state.
     * @returns {Promise<void>}
     */
    async fetchCategories() {
      try {
        const data = await categoriesApi.getAll()
        if (Array.isArray(data)) this.setCategories(data)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    },

    /**
     * Tải danh sách điểm đến từ API rồi đồng bộ về state.
     * @returns {Promise<void>}
     */
    async fetchDestinations() {
      try {
        const data = await destinationsApi.getAll()
        if (Array.isArray(data)) this.setDestinations(data)
      } catch (error) {
        console.error('Error fetching destinations:', error)
      }
    },

    /**
     * Tải danh sách bình luận từ API rồi đồng bộ về state.
     * @returns {Promise<void>}
     */
    async fetchComments() {
      try {
        const data = await commentsApi.getAll()
        if (Array.isArray(data)) this.setComments(data)
      } catch (error) {
        console.error('Error fetching comments:', error)
      }
    },

    /**
     * Tải danh sách khuyến mãi từ API rồi đồng bộ về state.
     * @returns {Promise<void>}
     */
    async fetchPromotions() {
      try {
        const data = await promotionsApi.getAll()
        if (Array.isArray(data)) this.setPromotions(data)
      } catch (error) {
        console.error('Error fetching promotions:', error)
      }
    },

    /**
     * Tìm dịch vụ theo slug để dùng cho trang chi tiết.
     * @param {string} slug - Slug dịch vụ.
     * @returns {Object|undefined} Service tìm thấy.
     */
    getServiceBySlug(slug) {
      const services = Array.isArray(this.services) ? this.services : []
      return services.find((service) => service.slug === slug)
    },

    /**
     * Trả danh sách bình luận hiển thị cho một dịch vụ, đã lọc visible và sắp xếp mới nhất.
     * @param {number|string} serviceId - Id dịch vụ.
     * @returns {Array<Object>} Danh sách bình luận hợp lệ.
     */
    getCommentsByService(serviceId) {
      const comments = Array.isArray(this.comments) ? this.comments : []
      const normalizedServiceId = String(serviceId ?? '')
      return comments
        .filter((comment) => comment.visible !== false)
        .filter((comment) => String(comment.serviceId ?? '') === normalizedServiceId)
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    },

    /**
     * Xóa dữ liệu chi tiết dịch vụ đang giữ trong state.
     * @returns {void}
     */
    clearServiceDetail() {
      this.serviceDetail = null
    },

    /**
     * Xóa trạng thái lỗi hiện tại của service store.
     * @returns {void}
     */
    clearError() {
      this.error = null
    }
  }
})
