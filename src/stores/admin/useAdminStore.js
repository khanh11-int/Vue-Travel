import { defineStore } from 'pinia'
import { bookingsApi, categoriesApi, commentsApi, promotionsApi, servicesApi, usersApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { fireAndForget } from '@/utils/travelBooking'
import { getStoredAuthUsers, saveStoredAuthUsers } from '@/utils/travelStorage'

/**
 * Chuyển giá trị bất kỳ về số hữu hạn, fallback khi dữ liệu nhập không hợp lệ.
 * @param {*} value - Giá trị cần ép kiểu.
 * @param {number} fallback - Giá trị mặc định khi ép kiểu thất bại.
 * @returns {number} Số đã chuẩn hóa.
 */
const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

const toPositiveNumber = (value, fallback = 0) => Math.max(0, toNumber(value, fallback))

const positiveOrFallback = (value, fallback = 0) => {
  const numericValue = toNumber(value, fallback)
  return numericValue > 0 ? numericValue : fallback
}

const normalizeDiscountPercent = (value, fallback = 0) => {
  const numericValue = toNumber(value, fallback)
  return Math.max(0, Math.min(100, Math.round(numericValue)))
}

const deriveDiscountPercent = (price, salePrice) => {
  const originalPrice = Math.max(0, toNumber(price, 0))
  const discountedPrice = Math.max(0, toNumber(salePrice, 0))

  if (!originalPrice || !discountedPrice || discountedPrice >= originalPrice) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)))
}

const calculateSalePrice = (price, discountPercent) => {
  const originalPrice = Math.max(0, toNumber(price, 0))
  const percent = normalizeDiscountPercent(discountPercent, 0)
  return Math.max(0, Math.round(originalPrice * (1 - percent / 100)))
}

const ensureArray = (value) => (Array.isArray(value) ? value : [])

const normalizeUserRecord = (user = {}, fallbackRole = 'customer') => ({
  ...user,
  id: user?.id ?? String(Date.now()),
  email: String(user?.email || '').trim().toLowerCase(),
  fullName: String(user?.fullName || '').trim(),
  phone: String(user?.phone || '').trim(),
  address: String(user?.address || '').trim(),
  role: user?.role || fallbackRole,
  password: String(user?.password || '')
})

const mergeUsers = (...collections) => {
  const mergedByKey = new Map()

  collections.flat().forEach((user) => {
    if (!user) return
    const normalized = normalizeUserRecord(user)
    const dedupeKey = String(normalized.id || normalized.email || '')
    if (!dedupeKey) return
    mergedByKey.set(dedupeKey, normalized)
  })

  return Array.from(mergedByKey.values())
}

const normalizeText = (value, fallback = '') => String(value ?? fallback).trim()
const FLEXIBLE_TOUR_SENTINEL_SLOTS = Number.MAX_SAFE_INTEGER
const sumSlots = (items = [], key = 'availableSlots') =>
  ensureArray(items).reduce((sum, item) => sum + Math.max(0, Number(item?.[key] || 0) || 0), 0)

const buildDefaultHotelRoomTypes = (serviceInput = {}) => {
  const basePrice = Math.max(0, toNumber(serviceInput.price || serviceInput.salePrice || 0, 0))
  const standardSurcharge = Math.max(300000, Math.round(basePrice * 0.3))
  const deluxeSurcharge = Math.max(350000, Math.round(basePrice * 0.35))
  const familySurcharge = Math.max(450000, Math.round(basePrice * 0.42))

  return [
    {
      value: 'standard',
      label: 'Phòng tiêu chuẩn',
      priceMultiplier: 1,
      childSurcharge: standardSurcharge,
      availableSlots: 10
    },
    {
      value: 'deluxe',
      label: 'Phòng deluxe',
      priceMultiplier: 1.15,
      childSurcharge: deluxeSurcharge,
      availableSlots: 10
    },
    {
      value: 'family',
      label: 'Phòng gia đình',
      priceMultiplier: 1.3,
      childSurcharge: familySurcharge,
      availableSlots: 10
    }
  ]
}

const buildDefaultTourChildPolicy = () => ({
  freeUnderAge: 5,
  childRate: 0.75,
  adultAgeThreshold: 10
})

const buildDefaultTourPricingTiers = (serviceInput = {}) => {
  const basePrice = Math.max(0, toNumber(serviceInput.price || serviceInput.salePrice || 0, 0))
  const childRate = buildDefaultTourChildPolicy().childRate
  const discountedPrice = calculateSalePrice(basePrice, normalizeDiscountPercent(serviceInput.discountPercent, 0))

  return {
    fixed: {
      label: 'Lịch cố định (ưu đãi)',
      adultPrice: discountedPrice,
      childPrice: Math.round(discountedPrice * childRate),
      note: 'Giá ưu đãi áp dụng theo lịch cố định'
    },
    flexible: {
      label: 'Lịch linh hoạt',
      adultPrice: basePrice,
      childPrice: Math.round(basePrice * childRate),
      note: 'Giá gốc không ưu đãi'
    }
  }
}

const buildDefaultTicketChildPolicy = (serviceInput = {}) => {
  const basePrice = Math.max(0, toNumber(serviceInput.price || serviceInput.salePrice || 0, 0))
  return {
    freeUnderAge: 8,
    adultAgeThreshold: 15,
    surchargeAgeMin: 8,
    surchargeAgeMax: 14,
    surcharge: Math.max(90000, Math.round(basePrice * 0.3))
  }
}

const buildDefaultTicketPackages = (serviceInput = {}) => {
  const price = Math.max(0, toNumber(serviceInput.price || serviceInput.salePrice || 0, 0))
  const discountPercent = normalizeDiscountPercent(serviceInput.discountPercent, 0)
  const salePrice = calculateSalePrice(price, discountPercent)
  const childSurcharge = buildDefaultTicketChildPolicy(serviceInput).surcharge

  return [
    {
      id: 'entry',
      name: 'Gói vào cổng',
      salePrice: Math.round(salePrice * 0.9),
      price: Math.round(price * 0.9),
      childSurcharge: Math.round(childSurcharge * 0.9),
      availableSlots: 25,
      features: ['Vé vào cổng', 'Không gồm khu trò chơi mở rộng']
    },
    {
      id: 'fun',
      name: 'Gói vui chơi',
      salePrice,
      price,
      childSurcharge,
      availableSlots: 25,
      features: ['Vé vào cổng', 'Bao gồm khu trò chơi chính']
    },
    {
      id: 'allin',
      name: 'Gói trọn gói',
      salePrice: Math.round(salePrice * 1.1),
      price: Math.round(price * 1.1),
      childSurcharge: Math.round(childSurcharge * 1.15),
      availableSlots: 25,
      features: ['Vé vào cổng', 'Khu trải nghiệm mở rộng', 'Ưu tiên check-in']
    }
  ]
}

const normalizeRoomTypes = (value, serviceInput = {}) => {
  const fallback = buildDefaultHotelRoomTypes(serviceInput)
  const source = Array.isArray(value) ? value : []
  const normalized = source.map((roomType, index) => ({
    value: normalizeText(roomType?.value || roomType?.id || `room-type-${index + 1}`, `room-type-${index + 1}`),
    label: normalizeText(roomType?.label || roomType?.name || `Loại phòng ${index + 1}`, `Loại phòng ${index + 1}`),
    priceMultiplier: Math.max(0.8, Number(roomType?.priceMultiplier || 1) || 1),
    childSurcharge: Math.max(0, toPositiveNumber(roomType?.childSurcharge, 0)),
    availableSlots: Math.max(0, toPositiveNumber(roomType?.availableSlots, 0))
  }))

  if (!normalized.length) return fallback

  return normalized.map((roomType, index) => ({
    ...roomType,
    childSurcharge: roomType.childSurcharge > 0 ? roomType.childSurcharge : fallback[index % fallback.length].childSurcharge
  }))
}

const normalizeTourPricingTiers = (value, serviceInput = {}) => {
  const fallback = buildDefaultTourPricingTiers(serviceInput)
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const fixed = source.fixed && typeof source.fixed === 'object' ? source.fixed : null
  const flexible = source.flexible && typeof source.flexible === 'object' ? source.flexible : null

  return {
    fixed: {
      label: normalizeText(fixed?.label || fallback.fixed.label, fallback.fixed.label),
      adultPrice: positiveOrFallback(fixed?.adultPrice, fallback.fixed.adultPrice),
      childPrice: positiveOrFallback(fixed?.childPrice, fallback.fixed.childPrice),
      note: normalizeText(fixed?.note || fallback.fixed.note, fallback.fixed.note)
    },
    flexible: {
      label: normalizeText(flexible?.label || fallback.flexible.label, fallback.flexible.label),
      adultPrice: positiveOrFallback(flexible?.adultPrice, fallback.flexible.adultPrice),
      childPrice: positiveOrFallback(flexible?.childPrice, fallback.flexible.childPrice),
      note: normalizeText(flexible?.note || fallback.flexible.note, fallback.flexible.note)
    }
  }
}

const normalizeTourChildPolicy = (value) => {
  const fallback = buildDefaultTourChildPolicy()
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}

  return {
    freeUnderAge: toNumber(source.freeUnderAge, fallback.freeUnderAge),
    childRate: Math.max(0, Math.min(1, Number(source.childRate ?? fallback.childRate) || fallback.childRate)),
    adultAgeThreshold: toNumber(source.adultAgeThreshold, fallback.adultAgeThreshold)
  }
}

const normalizeTicketChildPolicy = (value, serviceInput = {}) => {
  const fallback = buildDefaultTicketChildPolicy(serviceInput)
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}

  return {
    freeUnderAge: toNumber(source.freeUnderAge, fallback.freeUnderAge),
    adultAgeThreshold: toNumber(source.adultAgeThreshold, fallback.adultAgeThreshold),
    surchargeAgeMin: toNumber(source.surchargeAgeMin, fallback.surchargeAgeMin),
    surchargeAgeMax: toNumber(source.surchargeAgeMax, fallback.surchargeAgeMax),
    surcharge: positiveOrFallback(source.surcharge, fallback.surcharge)
  }
}

const normalizeTicketPackages = (value, serviceInput = {}) => {
  const fallback = buildDefaultTicketPackages(serviceInput)
  const source = Array.isArray(value) ? value : []
  const normalized = source
    .map((pkg, index) => ({
      id: normalizeText(pkg?.id || `pkg-${index + 1}`, `pkg-${index + 1}`),
      name: normalizeText(pkg?.name || `Gói ${index + 1}`, `Gói ${index + 1}`),
      salePrice: positiveOrFallback(pkg?.salePrice, 0),
      price: positiveOrFallback(pkg?.price, 0),
      childSurcharge: positiveOrFallback(pkg?.childSurcharge, 0),
      availableSlots: Math.max(0, toPositiveNumber(pkg?.availableSlots, 0)),
      features: ensureArray(pkg?.features).filter(Boolean)
    }))
    .filter((pkg) => pkg.salePrice > 0 || pkg.price > 0)

  if (!normalized.length) return fallback

  return normalized.map((pkg, index) => ({
    ...pkg,
    salePrice: pkg.salePrice > 0 ? pkg.salePrice : fallback[index % fallback.length].salePrice,
    price: pkg.price > 0 ? pkg.price : fallback[index % fallback.length].price,
    childSurcharge: pkg.childSurcharge > 0 ? pkg.childSurcharge : fallback[index % fallback.length].childSurcharge,
    availableSlots: Math.max(0, toPositiveNumber(pkg.availableSlots, fallback[index % fallback.length].availableSlots || 0)),
    features: pkg.features.length ? pkg.features : fallback[index % fallback.length].features
  }))
}

const normalizeDepartures = (value) => {
  const source = Array.isArray(value) ? value : []
  return source
    .map((departure, index) => ({
      departureId: normalizeText(departure?.departureId || `DEP-${index + 1}`, `DEP-${index + 1}`),
      startDate: normalizeText(departure?.startDate || ''),
      endDate: normalizeText(departure?.endDate || departure?.startDate || ''),
      durationDays: toNumber(departure?.durationDays, 0),
      durationNights: toNumber(departure?.durationNights, 0),
      remainingSlots: toPositiveNumber(departure?.remainingSlots, 0),
      priceOverride: toPositiveNumber(departure?.priceOverride, 0)
    }))
    .filter((departure) => departure.startDate && departure.endDate)
}

const parseJsonLike = (value, fallback) => {
  if (value == null || value === '') return fallback
  if (typeof value === 'object') return value

  try {
    return JSON.parse(String(value))
  } catch (error) {
    return fallback
  }
}

const normalizeServiceModelPayload = (serviceInput = {}) => {
  const categoryId = normalizeText(serviceInput.categoryId, 'hotel')
  const legacyPrice = Math.max(0, toNumber(serviceInput.price || serviceInput.salePrice || 0, 0))
  const legacySalePrice = Math.max(0, toNumber(serviceInput.salePrice, 0))
  const discountPercent = normalizeDiscountPercent(
    serviceInput.discountPercent,
    deriveDiscountPercent(legacyPrice, legacySalePrice)
  )
  const nextService = {
    ...serviceInput,
    categoryId,
    name: normalizeText(serviceInput.name),
    slug: normalizeText(serviceInput.slug),
    destination: normalizeText(serviceInput.destination),
    province: normalizeText(serviceInput.province),
    status: serviceInput.status || 'active',
    description: normalizeText(serviceInput.description || serviceInput.detailedDescription),
    image: normalizeText(serviceInput.image),
    imageAssetPath: normalizeText(serviceInput.imageAssetPath),
    gallery: ensureArray(serviceInput.gallery).filter(Boolean),
    amenities: ensureArray(serviceInput.amenities).filter(Boolean),
    itinerary: ensureArray(serviceInput.itinerary).filter(Boolean),
    departures: ensureArray(serviceInput.departures).filter(Boolean),
    rating: toNumber(serviceInput.rating, 4.5),
    price: legacyPrice,
    discountPercent,
    salePrice: calculateSalePrice(legacyPrice, discountPercent),
    availableSlots: toPositiveNumber(serviceInput.availableSlots, 0),
    featured: Boolean(serviceInput.featured),
    createdAt: serviceInput.createdAt || new Date().toISOString()
  }

  if (!nextService.gallery.length && nextService.image) {
    nextService.gallery = [nextService.image]
  }

  if (categoryId === 'hotel') {
    const roomTypes = parseJsonLike(serviceInput.roomTypes, null)
    nextService.roomTypes = normalizeRoomTypes(roomTypes, nextService)
    nextService.availableSlots = sumSlots(nextService.roomTypes, 'availableSlots')
  }

  if (categoryId === 'tour') {
    const pricingTiers = parseJsonLike(serviceInput.pricingTiers, null)
    const childPolicy = parseJsonLike(serviceInput.tourChildPolicy, null)
    const departures = parseJsonLike(serviceInput.departures, null)

    nextService.scheduleType = ['fixed', 'flexible', 'hybrid'].includes(String(serviceInput.scheduleType || '').toLowerCase())
      ? String(serviceInput.scheduleType).toLowerCase()
      : 'hybrid'
    nextService.flexibleWindow = {
      startDate: normalizeText(serviceInput.flexibleWindow?.startDate || serviceInput.flexibleStartDate || ''),
      endDate: normalizeText(serviceInput.flexibleWindow?.endDate || serviceInput.flexibleEndDate || '')
    }
    nextService.tourChildPolicy = normalizeTourChildPolicy(childPolicy)
    nextService.pricingTiers = normalizeTourPricingTiers(pricingTiers, nextService)
    nextService.departures = normalizeDepartures(departures)
    const fixedDepartureSlots = sumSlots(nextService.departures, 'remainingSlots')
    nextService.availableSlots = nextService.scheduleType === 'fixed'
      ? fixedDepartureSlots
      : FLEXIBLE_TOUR_SENTINEL_SLOTS
  }

  if (categoryId === 'ticket') {
    const ticketChildPolicy = parseJsonLike(serviceInput.ticketChildPolicy, null)
    const ticketPackages = parseJsonLike(serviceInput.ticketPackages, null)

    nextService.ticketServiceType = normalizeText(serviceInput.ticketServiceType, 'Vé tham quan')
    nextService.ticketChildPolicy = normalizeTicketChildPolicy(ticketChildPolicy, nextService)
    nextService.childSurcharge = nextService.ticketChildPolicy.surcharge
    nextService.ticketPackages = normalizeTicketPackages(ticketPackages, nextService)
    nextService.availableSlots = sumSlots(nextService.ticketPackages, 'availableSlots')
  }

  return nextService
}

export const useAdminStore = defineStore('travelAdmin', {
  /**
   * Store admin gom thao tác CRUD/analytics cho khu vực quản trị.
   * @returns {Object} State quản trị.
   */
  state: () => ({
    users: [],
    dashboard: {
      totalServices: 0,
      totalBookings: 0,
      monthlyRevenue: 0,
      pendingBookings: 0,
      lowStockServices: [],
      revenueSeries: [],
      categoryDistribution: [],
      bookingStatusDistribution: []
    },
    dashboardLoading: false,
    dashboardError: null
  }),

  actions: {
    /**
     * Tải danh sách khách hàng từ API và cache vào store.
     * @returns {Promise<Array<Object>>} Danh sách user.
     */
    async fetchUsers() {
      const [apiUsers, storedUsers] = await Promise.all([
        usersApi.getAll(),
        Promise.resolve(getStoredAuthUsers([]))
      ])

      const nextUsers = mergeUsers(apiUsers, storedUsers)
      this.users = nextUsers
      saveStoredAuthUsers(nextUsers)
      return this.users
    },

    /**
     * Tạo mới hoặc cập nhật user theo payload admin.
     * @param {Object} userInput - Dữ liệu khách hàng.
     * @returns {Promise<Object>} User sau khi lưu.
     */
    async saveUser(userInput) {
      const payload = normalizeUserRecord(userInput)
      const storedUsers = getStoredAuthUsers([])
      const currentUsers = Array.isArray(this.users) ? this.users : []

      if (payload.id) {
        const updated = await usersApi.update(payload.id, payload)
        this.users = this.users.map((user) => (String(user.id) === String(payload.id) ? updated : user))
        saveStoredAuthUsers(mergeUsers(storedUsers, currentUsers, [updated]))
        return updated
      }

      const created = await usersApi.create({
        ...payload,
        id: String(Date.now())
      })
      this.users = [created, ...this.users]
      saveStoredAuthUsers(mergeUsers(storedUsers, currentUsers, [created]))
      return created
    },

    /**
     * Xóa user theo id.
     * @param {string|number} userId - Id user.
     * @returns {Promise<void>}
     */
    async deleteUser(userId) {
      await usersApi.remove(userId)
      this.users = this.users.filter((user) => String(user.id) !== String(userId))
      saveStoredAuthUsers(this.users)
    },

    /**
     * Tạo mới hoặc cập nhật category và đồng bộ ServiceStore.
     * @param {Object} categoryInput - Dữ liệu danh mục.
     * @returns {Promise<Object>} Category sau khi lưu.
     */
    async saveCategory(categoryInput) {
      const serviceStore = useServiceStore()
      const categories = Array.isArray(serviceStore.categories) ? serviceStore.categories : []
      const payload = {
        ...categoryInput,
        id: String(categoryInput.id || '').trim(),
        name: String(categoryInput.name || '').trim(),
        description: String(categoryInput.description || '').trim(),
        status: categoryInput.status || 'active'
      }

      if (payload.id && categories.some((category) => String(category.id) === payload.id)) {
        const updated = await categoriesApi.update(payload.id, payload)
        serviceStore.setCategories(categories.map((category) => (String(category.id) === payload.id ? updated : category)))
        return updated
      }

      const created = await categoriesApi.create(payload)
      serviceStore.setCategories([created, ...categories])
      return created
    },

    /**
     * Xóa category nếu không còn service liên kết.
     * @param {string|number} categoryId - Id category.
     * @returns {Promise<void>}
     */
    async deleteCategory(categoryId) {
      const serviceStore = useServiceStore()
      const categories = Array.isArray(serviceStore.categories) ? serviceStore.categories : []
      const services = Array.isArray(serviceStore.services) ? serviceStore.services : []
      const hasDependency = services.some((service) => String(service.categoryId) === String(categoryId))

      if (hasDependency) {
        throw new Error('Không thể xóa danh mục đang có dịch vụ liên kết.')
      }

      await categoriesApi.remove(categoryId)
      serviceStore.setCategories(categories.filter((category) => String(category.id) !== String(categoryId)))
    },

    /**
     * Tải số liệu dashboard từ API thật và tính toán cho biểu đồ.
     * @returns {Promise<Object|null>} Snapshot dashboard hoặc null khi lỗi.
     */
    async fetchDashboardSnapshot() {
      this.dashboardLoading = true
      this.dashboardError = null

      try {
        const [services, bookings, categories, users] = await Promise.all([
          servicesApi.getAll(),
          bookingsApi.getAll(),
          categoriesApi.getAll(),
          usersApi.getAll()
        ])

        const safeServices = Array.isArray(services) ? services : []
        const safeBookings = Array.isArray(bookings) ? bookings : []
        const safeCategories = Array.isArray(categories) ? categories : []
        const safeUsers = Array.isArray(users) ? users : []
        const now = new Date()

        const monthlyRevenue = safeBookings
          .filter((booking) => {
            const bookingDate = new Date(booking.createdAt)
            return bookingDate.getFullYear() === now.getFullYear()
              && bookingDate.getMonth() === now.getMonth()
          })
          .reduce((sum, booking) => sum + Number(booking.total || 0), 0)

        const revenueSeries = Array.from({ length: 7 }, (_, index) => {
          const target = new Date(now)
          target.setDate(now.getDate() - (6 - index))
          const amount = safeBookings
            .filter((booking) => {
              const bookingDate = new Date(booking.createdAt)
              return bookingDate.toDateString() === target.toDateString()
            })
            .reduce((sum, booking) => sum + Number(booking.total || 0), 0)

          return {
            label: `${target.getDate()}/${target.getMonth() + 1}`,
            value: amount
          }
        })

        const categoryDistribution = safeCategories.map((category) => ({
          categoryId: category.id,
          label: category.name,
          value: safeServices.filter((service) => String(service.categoryId) === String(category.id)).length
        }))

        const statusMap = safeBookings.reduce((accumulator, booking) => {
          const key = booking.status || 'unknown'
          accumulator[key] = (accumulator[key] || 0) + 1
          return accumulator
        }, {})

        const bookingStatusDistribution = Object.entries(statusMap).map(([key, value]) => ({
          label: key,
          value
        }))

        this.users = safeUsers
        this.dashboard = {
          totalServices: safeServices.length,
          totalBookings: safeBookings.length,
          monthlyRevenue,
          pendingBookings: safeBookings.filter((booking) => booking.status === 'pending').length,
          lowStockServices: safeServices.filter((service) => Number(service.availableSlots || 0) <= 5),
          revenueSeries,
          categoryDistribution,
          bookingStatusDistribution
        }

        return this.dashboard
      } catch (error) {
        this.dashboardError = error?.message || 'Không thể tải dashboard admin.'
        return null
      } finally {
        this.dashboardLoading = false
      }
    },

    /**
     * Tạo mới hoặc cập nhật dịch vụ và đồng bộ lên API theo chế độ nền.
     * @param {Object} serviceInput - Dữ liệu dịch vụ từ form admin.
     * @returns {void}
     */
    async saveService(serviceInput) {
      const serviceStore = useServiceStore()
      const services = Array.isArray(serviceStore.services) ? serviceStore.services : []
      const payload = normalizeServiceModelPayload(serviceInput)

      if (payload.id) {
        const updated = await servicesApi.update(payload.id, payload)
        const nextServices = services.map((service) =>
          String(service.id) === String(payload.id) ? { ...service, ...updated } : service
        )
        serviceStore.setServices(nextServices)
        return updated
      } else {
        const newServicePayload = {
          ...payload,
          id: String(Date.now()),
          createdAt: new Date().toISOString()
        }
        const created = await servicesApi.create(newServicePayload)
        serviceStore.setServices([created, ...services])
        return created
      }
    },

    /**
     * Đảo trạng thái active/inactive của dịch vụ và lưu lại.
     * @param {number|string} serviceId - Id dịch vụ cần đổi trạng thái.
     * @returns {void}
     */
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

    /**
     * Xóa dịch vụ khỏi store và đồng bộ xóa lên API.
     * @param {number|string} serviceId - Id dịch vụ cần xóa.
     * @returns {void}
     */
    deleteService(serviceId) {
      const serviceStore = useServiceStore()
      const services = Array.isArray(serviceStore.services) ? serviceStore.services : []
      const nextServices = services.filter((service) => String(service.id) !== String(serviceId))
      serviceStore.setServices(nextServices)
      fireAndForget(() => servicesApi.remove(serviceId))
    },

    /**
     * Tạo mới hoặc cập nhật chương trình khuyến mãi theo mã code chuẩn hóa.
     * @param {Object} promotionInput - Dữ liệu khuyến mãi từ form admin.
     * @returns {void}
     */
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

    /**
     * Đảo trạng thái active/inactive của khuyến mãi.
     * @param {number|string} promotionId - Id khuyến mãi.
     * @returns {void}
     */
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

    /**
     * Ẩn/hiện bình luận bằng cách toggle cờ visible.
     * @param {number|string} commentId - Id bình luận.
     * @returns {void}
     */
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

    /**
     * Xóa bình luận khỏi store và gửi yêu cầu xóa lên API.
     * @param {number|string} commentId - Id bình luận cần xóa.
     * @returns {void}
     */
    deleteComment(commentId) {
      const serviceStore = useServiceStore()
      const comments = Array.isArray(serviceStore.comments) ? serviceStore.comments : []
      const nextComments = comments.filter((comment) => comment.id !== commentId)
      serviceStore.setComments(nextComments)
      fireAndForget(() => commentsApi.remove(commentId))
    },

    /**
     * Thêm bình luận mới, tự gán tên người dùng hiện tại nếu chưa truyền vào.
     * @param {Object} payload - Thông tin bình luận.
     * @param {number|string} payload.serviceId - Id dịch vụ.
     * @param {string} payload.userName - Tên hiển thị người bình luận.
     * @param {number|string} payload.rating - Điểm đánh giá.
     * @param {string} payload.content - Nội dung bình luận.
     * @returns {void}
     */
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
