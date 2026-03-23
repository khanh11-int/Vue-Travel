import { serviceRequiresEndDate } from '@/utils/bookingRules'

export const STORAGE_KEYS = {
  wishlist: 'vietvoyage_wishlist',
  cart: 'vietvoyage_cart',
  comments: 'vietvoyage_comments',
  bookings: 'vietvoyage_bookings',
  services: 'vietvoyage_services',
  promotions: 'vietvoyage_promotions',
  categories: 'vietvoyage_categories',
  destinations: 'vietvoyage_destinations',
  appliedPromotion: 'vietvoyage_applied_promotion'
}

const SESSION_KEY = 'vietvoyage_session'
const LEGACY_USER_KEY = 'vietvoyage_user'
export const AUTH_CHANGED_EVENT = 'vietvoyage:auth-changed'
export const GUEST_SCOPE = 'guest'

export const readStorage = (key, fallback) => {
  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : fallback
  } catch (error) {
    return fallback
  }
}

export const persistStorage = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const getActiveUserId = () => {
  const session = readStorage(SESSION_KEY, null)
  if (session?.user?.id) return String(session.user.id)

  const legacyUser = readStorage(LEGACY_USER_KEY, null)
  if (legacyUser?.id) return String(legacyUser.id)

  return GUEST_SCOPE
}

export const getScopedKey = (baseKey, userId) => `${baseKey}_${userId || GUEST_SCOPE}`

export const getBookingType = (service, item = null) => {
  if (item?.bookingType) return item.bookingType
  return service?.categoryId || 'hotel'
}

export const buildBookingMeta = ({ bookingType, startDate = '', endDate = '', quantity = 1, bookingMeta = {} }) => {
  const normalizedQuantity = Math.max(1, Number(quantity) || 1)

  if (bookingType === 'hotel') {
    return {
      checkInDate: bookingMeta.checkInDate || startDate || '',
      checkOutDate: bookingMeta.checkOutDate || endDate || '',
      guests: Math.max(1, Number(bookingMeta.guests ?? normalizedQuantity) || 1),
      rooms: Math.max(1, Number(bookingMeta.rooms ?? 1) || 1),
      durationLabel: bookingMeta.durationLabel || '',
      unitPrice: Number(bookingMeta.unitPrice || 0) || 0
    }
  }

  if (bookingType === 'ticket') {
    return {
      useDate: bookingMeta.useDate || startDate || '',
      ticketQuantity: Math.max(1, Number(bookingMeta.ticketQuantity ?? normalizedQuantity) || 1),
      durationLabel: bookingMeta.durationLabel || '',
      unitPrice: Number(bookingMeta.unitPrice || 0) || 0
    }
  }

  if (bookingType === 'tour') {
    return {
      departureId: bookingMeta.departureId || '',
      departureDate: bookingMeta.departureDate || startDate || '',
      travelers: Math.max(1, Number(bookingMeta.travelers ?? normalizedQuantity) || 1),
      durationLabel: bookingMeta.durationLabel || '',
      unitPrice: Number(bookingMeta.unitPrice || 0) || 0
    }
  }

  return {
    packageId: bookingMeta.packageId || '',
    departureId: bookingMeta.departureId || '',
    applyDate: bookingMeta.applyDate || startDate || '',
    travelers: Math.max(1, Number(bookingMeta.travelers ?? normalizedQuantity) || 1),
    durationLabel: bookingMeta.durationLabel || '',
    unitPrice: Number(bookingMeta.unitPrice || 0) || 0
  }
}

export const extractDateRangeFromBookingMeta = (bookingType, bookingMeta) => {
  if (bookingType === 'hotel') {
    return {
      startDate: bookingMeta.checkInDate || '',
      endDate: bookingMeta.checkOutDate || ''
    }
  }

  if (bookingType === 'ticket') {
    return {
      startDate: bookingMeta.useDate || '',
      endDate: ''
    }
  }

  if (bookingType === 'tour') {
    return {
      startDate: bookingMeta.departureDate || '',
      endDate: ''
    }
  }

  return {
    startDate: bookingMeta.applyDate || '',
    endDate: ''
  }
}

export const extractQuantityFromBookingMeta = (bookingType, bookingMeta) => {
  if (bookingType === 'hotel') return Math.max(1, Number(bookingMeta.guests || 1) || 1)
  if (bookingType === 'ticket') return Math.max(1, Number(bookingMeta.ticketQuantity || 1) || 1)
  return Math.max(1, Number(bookingMeta.travelers || 1) || 1)
}

export const getCartIdentity = (item) => {
  const bookingType = item.bookingType || 'hotel'
  const startDate = item.startDate || item.travelDate || ''
  const endDate = item.endDate || ''
  const bookingMeta = item.bookingMeta || {}

  if (bookingType === 'hotel') {
    const rooms = Math.max(1, Number(bookingMeta.rooms || 1) || 1)
    return `${bookingType}|${item.serviceId}|${startDate}|${endDate}|rooms:${rooms}`
  }

  if (bookingType === 'tour') {
    return `${bookingType}|${item.serviceId}|${startDate}|dep:${bookingMeta.departureId || ''}`
  }

  if (bookingType === 'combo') {
    return `${bookingType}|${item.serviceId}|${startDate}|pkg:${bookingMeta.packageId || ''}|dep:${bookingMeta.departureId || ''}`
  }

  return `${bookingType}|${item.serviceId}|${startDate}`
}

export const resolveItemMaxSlots = (service, item) => {
  if (!service || !item) return 0

  const bookingType = item.bookingType || service.categoryId || 'hotel'
  const bookingMeta = item.bookingMeta || {}

  if (bookingType === 'tour') {
    const departureId = bookingMeta.departureId
    if (!departureId) return Number(service.availableSlots || 0)
    const departure = (service.departures || []).find((entry) => entry.departureId === departureId)
    return Number(departure?.remainingSlots || 0)
  }

  if (bookingType === 'combo' && service.isFixedSchedule !== false) {
    const packageId = bookingMeta.packageId
    if (!packageId) return Number(service.availableSlots || 0)
    const selectedPackage = (service.packages || []).find((entry) => entry.packageId === packageId)
    return Number(selectedPackage?.remainingSlots || 0)
  }

  return Number(service.availableSlots || 0)
}

export const applyServiceSlotDelta = (service, item, delta) => {
  if (!item || item.serviceId !== service.id) return service

  const bookingType = item.bookingType || service.categoryId || 'hotel'
  const bookingMeta = item.bookingMeta || {}
  const nextService = {
    ...service,
    availableSlots: Math.max(0, Number(service.availableSlots || 0) + delta)
  }

  if (bookingType === 'tour' && bookingMeta.departureId) {
    nextService.departures = (service.departures || []).map((departure) =>
      departure.departureId === bookingMeta.departureId
        ? { ...departure, remainingSlots: Math.max(0, Number(departure.remainingSlots || 0) + delta) }
        : departure
    )
  }

  if (bookingType === 'combo' && service.isFixedSchedule !== false && bookingMeta.packageId) {
    nextService.packages = (service.packages || []).map((pkg) =>
      pkg.packageId === bookingMeta.packageId
        ? { ...pkg, remainingSlots: Math.max(0, Number(pkg.remainingSlots || 0) + delta) }
        : pkg
    )
  }

  return nextService
}

export const buildBookingSummary = (item) => {
  const bookingType = item.bookingType || 'hotel'
  const meta = item.bookingMeta || {}
  const durationSuffix = meta.durationLabel ? ` · ${meta.durationLabel}` : ''

  if (bookingType === 'hotel') {
    return `${meta.checkInDate || item.startDate || 'Chưa chọn ngày'} - ${meta.checkOutDate || item.endDate || 'Chưa chọn ngày'}${durationSuffix} · ${meta.guests || item.quantity} khách · ${meta.rooms || 1} phòng`
  }

  if (bookingType === 'ticket') {
    return `${meta.useDate || item.startDate || 'Chưa chọn ngày'}${durationSuffix} · ${meta.ticketQuantity || item.quantity} vé`
  }

  if (bookingType === 'tour') {
    return `Khởi hành ${meta.departureDate || item.startDate || 'Chưa chọn ngày'}${durationSuffix} · ${meta.travelers || item.quantity} người`
  }

  return `Áp dụng ${meta.applyDate || item.startDate || 'Chưa chọn ngày'}${durationSuffix} · ${meta.travelers || item.quantity} người`
}

export const normalizeServicesFromStorage = (services = []) => {
  if (!Array.isArray(services)) return []

  return services.map((service) => {
    const nextService = { ...service }

    if (nextService.categoryId === 'tour' && !Array.isArray(nextService.departures)) {
      nextService.departures = []
    }

    if (nextService.categoryId === 'combo') {
      if (!Array.isArray(nextService.packages)) {
        nextService.packages = []
      }
      if (typeof nextService.isFixedSchedule !== 'boolean') {
        nextService.isFixedSchedule = nextService.packages.length > 0
      }
    }

    return nextService
  })
}

export const normalizeCartItem = (item, services) => {
  const service = services.find((entry) => entry.id === item.serviceId)
  const bookingType = getBookingType(service, item)
  const fallbackStartDate = item.startDate || item.travelDate || ''
  const fallbackEndDate = serviceRequiresEndDate(service) ? (item.endDate || '') : ''
  const inferredQuantity = Math.max(1, Number(item.quantity) || 1)

  const normalizedMeta = buildBookingMeta({
    bookingType,
    startDate: fallbackStartDate,
    endDate: fallbackEndDate,
    quantity: inferredQuantity,
    bookingMeta: item.bookingMeta || {}
  })
  const derivedDates = extractDateRangeFromBookingMeta(bookingType, normalizedMeta)
  const normalizedQuantity = extractQuantityFromBookingMeta(bookingType, normalizedMeta)
  const normalizedStartDate = derivedDates.startDate || fallbackStartDate
  const normalizedEndDate = serviceRequiresEndDate(service) ? (derivedDates.endDate || fallbackEndDate) : ''

  return {
    serviceId: item.serviceId,
    bookingType,
    bookingMeta: normalizedMeta,
    quantity: normalizedQuantity,
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    travelDate: normalizedStartDate
  }
}

export const BOOKING_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Hủy'
}

export const fireAndForget = (promiseFactory) => {
  Promise.resolve()
    .then(() => promiseFactory())
    .catch(() => {})
}
