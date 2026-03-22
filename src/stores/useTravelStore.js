import { computed, reactive, readonly } from 'vue'
import { comments as seedComments, promotions as seedPromotions, services as seedServices } from '@/data/mockData'
import { serviceRequiresEndDate } from '@/utils/bookingRules'

const STORAGE_KEYS = {
  wishlist: 'vietvoyage_wishlist',
  cart: 'vietvoyage_cart',
  comments: 'vietvoyage_comments',
  bookings: 'vietvoyage_bookings',
  services: 'vietvoyage_services',
  promotions: 'vietvoyage_promotions',
  appliedPromotion: 'vietvoyage_applied_promotion'
}

const SESSION_KEY = 'vietvoyage_session'
const LEGACY_USER_KEY = 'vietvoyage_user'
const AUTH_CHANGED_EVENT = 'vietvoyage:auth-changed'
const GUEST_SCOPE = 'guest'

const readStorage = (key, fallback) => {
  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : fallback
  } catch (error) {
    return fallback
  }
}

const persistStorage = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

const getActiveUserId = () => {
  const session = readStorage(SESSION_KEY, null)
  if (session?.user?.id) return String(session.user.id)

  const legacyUser = readStorage(LEGACY_USER_KEY, null)
  if (legacyUser?.id) return String(legacyUser.id)

  return GUEST_SCOPE
}

const getScopedKey = (baseKey, userId) => `${baseKey}_${userId || GUEST_SCOPE}`

const getBookingType = (service, item = null) => {
  if (item?.bookingType) return item.bookingType
  return service?.categoryId || 'hotel'
}

const buildBookingMeta = ({ bookingType, startDate = '', endDate = '', quantity = 1, bookingMeta = {} }) => {
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

const extractDateRangeFromBookingMeta = (bookingType, bookingMeta) => {
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

const extractQuantityFromBookingMeta = (bookingType, bookingMeta) => {
  if (bookingType === 'hotel') return Math.max(1, Number(bookingMeta.guests || 1) || 1)
  if (bookingType === 'ticket') return Math.max(1, Number(bookingMeta.ticketQuantity || 1) || 1)
  return Math.max(1, Number(bookingMeta.travelers || 1) || 1)
}

const getCartIdentity = (item) => {
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

const resolveItemMaxSlots = (service, item) => {
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

const applyServiceSlotDelta = (service, item, delta) => {
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

const buildBookingSummary = (item) => {
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

const normalizeCartItem = (item, services) => {
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

const state = reactive({
  activeUserId: GUEST_SCOPE,
  services: seedServices,
  wishlist: [],
  cart: [],
  comments: [],
  bookings: [],
  promotions: seedPromotions,
  appliedPromotion: null
})

const loadUserScopedState = (userId) => {
  const scope = userId || GUEST_SCOPE
  state.activeUserId = scope
  state.wishlist = readStorage(getScopedKey(STORAGE_KEYS.wishlist, scope), [])
  const rawCart = readStorage(getScopedKey(STORAGE_KEYS.cart, scope), [])
  state.cart = rawCart.map((item) => normalizeCartItem(item, state.services))
  state.bookings = readStorage(getScopedKey(STORAGE_KEYS.bookings, scope), [])
  state.appliedPromotion = readStorage(getScopedKey(STORAGE_KEYS.appliedPromotion, scope), null)

  persistStorage(getScopedKey(STORAGE_KEYS.cart, scope), state.cart)
}

const bootstrapState = () => {
  if (typeof window === 'undefined') return
  state.services = readStorage(STORAGE_KEYS.services, seedServices)
  state.comments = readStorage(STORAGE_KEYS.comments, seedComments)
  state.promotions = readStorage(STORAGE_KEYS.promotions, seedPromotions)
  loadUserScopedState(getActiveUserId())
}

bootstrapState()

const persistServices = () => {
  persistStorage(STORAGE_KEYS.services, state.services)
}

const persistPromotions = () => {
  persistStorage(STORAGE_KEYS.promotions, state.promotions)
}

const persistScoped = (baseKey, value) => {
  persistStorage(getScopedKey(baseKey, state.activeUserId), value)
}

const syncScopeFromSession = () => {
  if (typeof window === 'undefined') return
  const nextUserId = getActiveUserId()
  if (nextUserId !== state.activeUserId) {
    loadUserScopedState(nextUserId)
  }
}

let authEventBound = false
const bindAuthSync = () => {
  if (typeof window === 'undefined' || authEventBound) return

  window.addEventListener(AUTH_CHANGED_EVENT, (event) => {
    const userId = event.detail?.id ? String(event.detail.id) : GUEST_SCOPE
    loadUserScopedState(userId)
  })

  authEventBound = true
}

const BOOKING_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Hủy'
}

export const useTravelStore = () => {
  syncScopeFromSession()
  bindAuthSync()

  const featuredServices = computed(() => state.services.filter((service) => service.featured))

  const wishlistItems = computed(() =>
    state.wishlist
      .map((id) => state.services.find((service) => service.id === id))
      .filter(Boolean)
  )

  const cartItems = computed(() =>
    state.cart.map((item) => {
      const normalizedItem = normalizeCartItem(item, state.services)
      const service = state.services.find((entry) => entry.id === normalizedItem.serviceId)
      const normalizedStartDate = normalizedItem.startDate || normalizedItem.travelDate || ''
      const normalizedEndDate = normalizedItem.endDate || ''

      return {
        ...normalizedItem,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        travelDate: normalizedStartDate,
        service,
        identityKey: getCartIdentity(normalizedItem),
        bookingSummary: buildBookingSummary(normalizedItem),
        lineTotal: (Number(normalizedItem.bookingMeta?.unitPrice || 0) || Number(service?.salePrice || 0) || 0) * normalizedItem.quantity
      }
    })
  )

  const cartTotal = computed(() =>
    cartItems.value.reduce((total, item) => total + item.lineTotal, 0)
  )

  const bookingHistory = computed(() =>
    [...state.bookings].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
  )

  const activePromotions = computed(() =>
    state.promotions.filter((promotion) => promotion.status === 'active')
  )

  const visibleComments = computed(() =>
    state.comments.filter((comment) => comment.visible !== false)
  )

  const getServiceBySlug = (slug) => state.services.find((service) => service.slug === slug)

  const getCommentsByService = (serviceId) =>
    visibleComments.value
      .filter((comment) => comment.serviceId === serviceId)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))

  const toggleWishlist = (serviceId) => {
    syncScopeFromSession()
    const exists = state.wishlist.includes(serviceId)
    state.wishlist = exists
      ? state.wishlist.filter((id) => id !== serviceId)
      : [...state.wishlist, serviceId]
    persistScoped(STORAGE_KEYS.wishlist, state.wishlist)
  }

  const addToCart = ({
    serviceId,
    quantity = 1,
    travelDate = '',
    startDate = '',
    endDate = '',
    bookingType = '',
    bookingMeta = null
  }) => {
    syncScopeFromSession()
    const service = state.services.find((entry) => entry.id === serviceId)
    if (!service || service.availableSlots <= 0) return

    const resolvedBookingType = bookingType || getBookingType(service)
    const rawStartDate = startDate || travelDate || ''
    const rawEndDate = serviceRequiresEndDate(service) ? (endDate || '') : ''
    const tentativeQuantity = Math.max(1, Number(quantity) || 1)
    const normalizedMeta = buildBookingMeta({
      bookingType: resolvedBookingType,
      startDate: rawStartDate,
      endDate: rawEndDate,
      quantity: tentativeQuantity,
      bookingMeta: bookingMeta || {}
    })
    const normalizedDates = extractDateRangeFromBookingMeta(resolvedBookingType, normalizedMeta)
    const maxSlots = resolveItemMaxSlots(service, {
      bookingType: resolvedBookingType,
      bookingMeta: normalizedMeta
    })
    const normalizedQuantity = Math.max(1, Math.min(tentativeQuantity, Math.max(maxSlots, 1)))
    const candidate = {
      serviceId,
      bookingType: resolvedBookingType,
      bookingMeta: buildBookingMeta({
        bookingType: resolvedBookingType,
        startDate: normalizedDates.startDate || rawStartDate,
        endDate: normalizedDates.endDate || rawEndDate,
        quantity: normalizedQuantity,
        bookingMeta: normalizedMeta
      }),
      quantity: normalizedQuantity,
      startDate: normalizedDates.startDate || rawStartDate,
      endDate: serviceRequiresEndDate(service) ? (normalizedDates.endDate || rawEndDate) : '',
      travelDate: normalizedDates.startDate || rawStartDate
    }
    const candidateIdentity = getCartIdentity(candidate)

    const existing = state.cart.find((item) => {
      const normalizedItem = normalizeCartItem(item, state.services)
      return normalizedItem.serviceId === serviceId && getCartIdentity(normalizedItem) === candidateIdentity
    })

    if (existing) {
      const existingNormalized = normalizeCartItem(existing, state.services)
      const scopedMaxSlots = resolveItemMaxSlots(service, existingNormalized)
      const mergedQuantity = Math.min((Number(existing.quantity) || 1) + normalizedQuantity, Math.max(scopedMaxSlots, 1))
      const mergedMeta = buildBookingMeta({
        bookingType: existingNormalized.bookingType,
        startDate: existingNormalized.startDate,
        endDate: existingNormalized.endDate,
        quantity: mergedQuantity,
        bookingMeta: existingNormalized.bookingMeta
      })

      existing.bookingType = existingNormalized.bookingType
      existing.bookingMeta = mergedMeta
      existing.quantity = mergedQuantity
      existing.startDate = existingNormalized.startDate
      existing.endDate = existingNormalized.endDate
      existing.travelDate = existingNormalized.startDate
    } else {
      state.cart.push(candidate)
    }

    persistScoped(STORAGE_KEYS.cart, state.cart)
  }

  const updateCartQuantity = (
    serviceId,
    startDate,
    quantity,
    endDate = '',
    bookingType = '',
    bookingMeta = null
  ) => {
    syncScopeFromSession()
    const service = state.services.find((entry) => entry.id === serviceId)
    const normalizedQuantity = Number(quantity)
    const targetBookingType = bookingType || getBookingType(service)
    const targetMeta = buildBookingMeta({
      bookingType: targetBookingType,
      startDate: startDate || '',
      endDate: endDate || '',
      quantity: normalizedQuantity > 0 ? normalizedQuantity : 1,
      bookingMeta: bookingMeta || {}
    })
    const targetDates = extractDateRangeFromBookingMeta(targetBookingType, targetMeta)
    const targetIdentity = getCartIdentity({
      serviceId,
      bookingType: targetBookingType,
      bookingMeta: targetMeta,
      startDate: targetDates.startDate || startDate || '',
      endDate: targetDates.endDate || endDate || ''
    })

    const isTargetItem = (item) => {
      const normalizedItem = normalizeCartItem(item, state.services)
      return normalizedItem.serviceId === serviceId && getCartIdentity(normalizedItem) === targetIdentity
    }

    if (normalizedQuantity <= 0) {
      state.cart = state.cart.filter((item) => !isTargetItem(item))
    } else {
      state.cart = state.cart.map((item) =>
        isTargetItem(item)
          ? (() => {
            const normalizedItem = normalizeCartItem(item, state.services)
            const maxSlots = resolveItemMaxSlots(service, normalizedItem)
            const cappedQuantity = Math.min(normalizedQuantity, Math.max(maxSlots, 1))
            const nextMeta = buildBookingMeta({
              bookingType: normalizedItem.bookingType,
              startDate: normalizedItem.startDate,
              endDate: normalizedItem.endDate,
              quantity: cappedQuantity,
              bookingMeta: normalizedItem.bookingMeta
            })

            return {
              ...item,
              bookingType: normalizedItem.bookingType,
              bookingMeta: nextMeta,
              quantity: cappedQuantity,
              startDate: normalizedItem.startDate,
              endDate: normalizedItem.endDate,
              travelDate: normalizedItem.startDate
            }
          })()
          : item
      )
    }

    persistScoped(STORAGE_KEYS.cart, state.cart)
  }

  const removeCartItem = (
    serviceId,
    startDate,
    endDate = '',
    bookingType = '',
    bookingMeta = null
  ) => {
    syncScopeFromSession()
    const service = state.services.find((entry) => entry.id === serviceId)
    const targetBookingType = bookingType || getBookingType(service)
    const targetMeta = buildBookingMeta({
      bookingType: targetBookingType,
      startDate: startDate || '',
      endDate: endDate || '',
      quantity: 1,
      bookingMeta: bookingMeta || {}
    })
    const targetDates = extractDateRangeFromBookingMeta(targetBookingType, targetMeta)
    const targetIdentity = getCartIdentity({
      serviceId,
      bookingType: targetBookingType,
      bookingMeta: targetMeta,
      startDate: targetDates.startDate || startDate || '',
      endDate: targetDates.endDate || endDate || ''
    })

    state.cart = state.cart.filter((item) => {
      const normalizedItem = normalizeCartItem(item, state.services)
      return !(normalizedItem.serviceId === serviceId && getCartIdentity(normalizedItem) === targetIdentity)
    })

    persistScoped(STORAGE_KEYS.cart, state.cart)
  }

  const clearCart = () => {
    syncScopeFromSession()
    state.cart = []
    persistScoped(STORAGE_KEYS.cart, state.cart)
  }

  const createBooking = ({
    customer,
    items,
    subtotal,
    serviceFee,
    total,
    discount = 0,
    promotion = null,
    clearCartAfterBooking = true,
    clearPromotionAfterBooking = true
  }) => {
    syncScopeFromSession()

    const booking = {
      id: Date.now(),
      code: `VV${Date.now().toString().slice(-6)}`,
      customer,
      items,
      subtotal,
      discount,
      serviceFee,
      total,
      promotion,
      status: 'pending',
      statusLabel: 'Chờ xác nhận',
      createdAt: new Date().toISOString(),
      visible: true
    }

    state.services = state.services.map((service) => {
      const relatedItems = items.filter((entry) => entry.serviceId === service.id)
      if (!relatedItems.length) return service

      return relatedItems.reduce((currentService, item) =>
        applyServiceSlotDelta(currentService, item, -Math.max(0, Number(item.quantity || 0))),
      service)
    })

    state.bookings = [booking, ...state.bookings]
    persistServices()
    persistScoped(STORAGE_KEYS.bookings, state.bookings)

    if (clearPromotionAfterBooking) {
      clearAppliedPromotion()
    }

    if (clearCartAfterBooking) {
      clearCart()
    }

    return booking
  }

  const saveService = (serviceInput) => {
    const payload = {
      ...serviceInput,
      salePrice: Number(serviceInput.salePrice || 0),
      price: Number(serviceInput.price || 0),
      availableSlots: Number(serviceInput.availableSlots || 0),
      rating: Number(serviceInput.rating || 4.5)
    }

    if (payload.id) {
      state.services = state.services.map((service) => service.id === payload.id ? { ...service, ...payload } : service)
    } else {
      state.services = [{
        ...payload,
        id: Date.now(),
        createdAt: new Date().toISOString()
      }, ...state.services]
    }

    persistServices()
  }

  const toggleServiceStatus = (serviceId) => {
    state.services = state.services.map((service) =>
      service.id === serviceId
        ? { ...service, status: service.status === 'active' ? 'inactive' : 'active' }
        : service
    )
    persistServices()
  }

  const updateBookingStatus = (bookingId, status) => {
    syncScopeFromSession()
    const existing = state.bookings.find((booking) => booking.id === bookingId)
    if (!existing || existing.status === 'completed' || existing.status === status) return

    const shouldRestoreSlots = status === 'cancelled' && existing.status !== 'cancelled'

    if (shouldRestoreSlots) {
      state.services = state.services.map((service) => {
        const relatedItems = existing.items.filter((entry) => entry.serviceId === service.id)
        if (!relatedItems.length) return service

        return relatedItems.reduce((currentService, item) =>
          applyServiceSlotDelta(currentService, item, Math.max(0, Number(item.quantity || 0))),
        service)
      })
      persistServices()
    }

    state.bookings = state.bookings.map((booking) =>
      booking.id === bookingId
        ? { ...booking, status, statusLabel: BOOKING_STATUS_LABELS[status] || booking.statusLabel }
        : booking
    )
    persistScoped(STORAGE_KEYS.bookings, state.bookings)
  }

  const applyPromotionCode = (code, subtotal) => {
    syncScopeFromSession()
    const normalizedCode = code.trim().toUpperCase()
    const promotion = state.promotions.find((entry) => entry.code === normalizedCode && entry.status === 'active')

    if (!promotion) {
      state.appliedPromotion = null
      persistScoped(STORAGE_KEYS.appliedPromotion, state.appliedPromotion)
      return { success: false, message: 'Mã khuyến mãi không hợp lệ hoặc đã ngưng áp dụng.' }
    }

    if (promotion.code === 'PHUQUOC500K' && subtotal < 5000000) {
      return { success: false, message: 'Mã PHUQUOC500K chỉ áp dụng cho đơn từ 5.000.000đ.' }
    }

    state.appliedPromotion = promotion
    persistScoped(STORAGE_KEYS.appliedPromotion, state.appliedPromotion)
    return { success: true, promotion }
  }

  const clearAppliedPromotion = () => {
    syncScopeFromSession()
    state.appliedPromotion = null
    persistScoped(STORAGE_KEYS.appliedPromotion, state.appliedPromotion)
  }

  const calculatePromotionDiscount = (subtotal) => {
    if (!state.appliedPromotion) return 0
    if (state.appliedPromotion.type === 'percent') {
      return Math.round((subtotal * state.appliedPromotion.value) / 100)
    }
    return Math.min(subtotal, state.appliedPromotion.value)
  }

  const savePromotion = (promotionInput) => {
    const payload = {
      ...promotionInput,
      code: promotionInput.code.trim().toUpperCase(),
      value: Number(promotionInput.value || 0)
    }

    if (payload.id) {
      state.promotions = state.promotions.map((promotion) => promotion.id === payload.id ? { ...promotion, ...payload } : promotion)
    } else {
      state.promotions = [{ ...payload, id: Date.now() }, ...state.promotions]
    }

    persistPromotions()
  }

  const togglePromotionStatus = (promotionId) => {
    state.promotions = state.promotions.map((promotion) =>
      promotion.id === promotionId
        ? { ...promotion, status: promotion.status === 'active' ? 'inactive' : 'active' }
        : promotion
    )
    persistPromotions()
  }

  const toggleCommentVisibility = (commentId) => {
    state.comments = state.comments.map((comment) =>
      comment.id === commentId
        ? { ...comment, visible: comment.visible === false }
        : comment
    )
    persistStorage(STORAGE_KEYS.comments, state.comments)
  }

  const deleteComment = (commentId) => {
    state.comments = state.comments.filter((comment) => comment.id !== commentId)
    persistStorage(STORAGE_KEYS.comments, state.comments)
  }

  const addComment = ({ serviceId, userName, rating, content }) => {
    const newComment = {
      id: Date.now(),
      serviceId,
      userName,
      rating,
      content,
      createdAt: new Date().toISOString(),
      visible: true
    }
    state.comments = [newComment, ...state.comments]
    persistStorage(STORAGE_KEYS.comments, state.comments)
  }

  return {
    state: readonly(state),
    featuredServices,
    wishlistItems,
    cartItems,
    cartTotal,
    bookingHistory,
    activePromotions,
    getServiceBySlug,
    getCommentsByService,
    toggleWishlist,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    clearCart,
    createBooking,
    saveService,
    toggleServiceStatus,
    updateBookingStatus,
    applyPromotionCode,
    clearAppliedPromotion,
    calculatePromotionDiscount,
    savePromotion,
    togglePromotionStatus,
    toggleCommentVisibility,
    deleteComment,
    addComment
  }
}
