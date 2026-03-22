import { computed, reactive, readonly } from 'vue'
import { comments as seedComments, promotions as seedPromotions, services as seedServices } from '@/data/mockData'

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
const requiresEndDate = (service) => service?.categoryId !== 'ticket'

const normalizeCartItem = (item, services) => {
  const service = services.find((entry) => entry.id === item.serviceId)
  const normalizedStartDate = item.startDate || item.travelDate || ''
  const normalizedEndDate = requiresEndDate(service) ? (item.endDate || '') : ''

  return {
    serviceId: item.serviceId,
    quantity: Math.max(1, Number(item.quantity) || 1),
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

  // Persist normalized shape for older cart records (travelDate-only records).
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
      const service = state.services.find((entry) => entry.id === item.serviceId)
      const normalizedStartDate = item.startDate || item.travelDate || ''
      const normalizedEndDate = item.endDate || ''

      return {
        ...item,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        travelDate: normalizedStartDate,
        service,
        lineTotal: (service?.salePrice || 0) * item.quantity
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

  const addToCart = ({ serviceId, quantity = 1, travelDate = '', startDate = '', endDate = '' }) => {
    syncScopeFromSession()
    const service = state.services.find((entry) => entry.id === serviceId)
    if (!service || service.availableSlots <= 0) return

    const normalizedStartDate = startDate || travelDate || ''
    const normalizedEndDate = endDate || ''
    const normalizedQuantity = Math.max(1, Math.min(Number(quantity) || 1, service.availableSlots))
    const existing = state.cart.find((item) =>
      item.serviceId === serviceId
      && (item.startDate || item.travelDate || '') === normalizedStartDate
      && (item.endDate || '') === normalizedEndDate
    )
    if (existing) {
      existing.quantity = Math.min(existing.quantity + normalizedQuantity, service.availableSlots)
    } else {
      state.cart.push({
        serviceId,
        quantity: normalizedQuantity,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        travelDate: normalizedStartDate
      })
    }

    persistScoped(STORAGE_KEYS.cart, state.cart)
  }

  const updateCartQuantity = (serviceId, startDate, quantity, endDate = '') => {
    syncScopeFromSession()
    const service = state.services.find((entry) => entry.id === serviceId)
    const maxSlots = service?.availableSlots || 0
    const normalizedQuantity = Number(quantity)
    const normalizedStartDate = startDate || ''
    const normalizedEndDate = endDate || ''

    if (normalizedQuantity <= 0) {
      state.cart = state.cart.filter((item) => !(
        item.serviceId === serviceId
        && (item.startDate || item.travelDate || '') === normalizedStartDate
        && (item.endDate || '') === normalizedEndDate
      ))
    } else {
      state.cart = state.cart.map((item) =>
        item.serviceId === serviceId
        && (item.startDate || item.travelDate || '') === normalizedStartDate
        && (item.endDate || '') === normalizedEndDate
          ? { ...item, quantity: Math.min(normalizedQuantity, Math.max(maxSlots, 1)) }
          : item
      )
    }
    persistScoped(STORAGE_KEYS.cart, state.cart)
  }

  const removeCartItem = (serviceId, startDate, endDate = '') => {
    syncScopeFromSession()
    const normalizedStartDate = startDate || ''
    const normalizedEndDate = endDate || ''
    state.cart = state.cart.filter((item) => !(
      item.serviceId === serviceId
      && (item.startDate || item.travelDate || '') === normalizedStartDate
      && (item.endDate || '') === normalizedEndDate
    ))
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
      const item = items.find((entry) => entry.serviceId === service.id)
      if (!item) return service
      return {
        ...service,
        availableSlots: Math.max(0, service.availableSlots - item.quantity)
      }
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
        const item = existing.items.find((entry) => entry.serviceId === service.id)
        if (!item) return service
        return {
          ...service,
          availableSlots: service.availableSlots + item.quantity
        }
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
