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

const state = reactive({
  services: seedServices,
  wishlist: [],
  cart: [],
  comments: [],
  bookings: [],
  promotions: seedPromotions,
  appliedPromotion: null
})

const bootstrapState = () => {
  if (typeof window === 'undefined') return
  state.services = readStorage(STORAGE_KEYS.services, seedServices)
  state.wishlist = readStorage(STORAGE_KEYS.wishlist, [])
  state.cart = readStorage(STORAGE_KEYS.cart, [])
  state.comments = readStorage(STORAGE_KEYS.comments, seedComments)
  state.bookings = readStorage(STORAGE_KEYS.bookings, [])
  state.promotions = readStorage(STORAGE_KEYS.promotions, seedPromotions)
  state.appliedPromotion = readStorage(STORAGE_KEYS.appliedPromotion, null)
}

bootstrapState()
const persistServices = () => {
  persistStorage(STORAGE_KEYS.services, state.services)
}

const persistPromotions = () => {
  persistStorage(STORAGE_KEYS.promotions, state.promotions)
}

const BOOKING_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Hủy'
}

export const useTravelStore = () => {
  const featuredServices = computed(() => state.services.filter((service) => service.featured))

  const wishlistItems = computed(() =>
    state.wishlist
      .map((id) => state.services.find((service) => service.id === id))
      .filter(Boolean)
  )

  const cartItems = computed(() =>
    state.cart.map((item) => {
      const service = state.services.find((entry) => entry.id === item.serviceId)
      return {
        ...item,
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
    const exists = state.wishlist.includes(serviceId)
    state.wishlist = exists
      ? state.wishlist.filter((id) => id !== serviceId)
      : [...state.wishlist, serviceId]
    persistStorage(STORAGE_KEYS.wishlist, state.wishlist)
  }

  const addToCart = ({ serviceId, quantity = 1, travelDate = '' }) => {
    const existing = state.cart.find((item) => item.serviceId === serviceId && item.travelDate === travelDate)
    if (existing) {
      existing.quantity += quantity
    } else {
      state.cart.push({ serviceId, quantity, travelDate })
    }
    persistStorage(STORAGE_KEYS.cart, state.cart)
  }

  const updateCartQuantity = (serviceId, travelDate, quantity) => {
    const normalizedQuantity = Number(quantity)
    if (normalizedQuantity <= 0) {
      state.cart = state.cart.filter((item) => !(item.serviceId === serviceId && item.travelDate === travelDate))
    } else {
      state.cart = state.cart.map((item) =>
        item.serviceId === serviceId && item.travelDate === travelDate
          ? { ...item, quantity: normalizedQuantity }
          : item
      )
    }
    persistStorage(STORAGE_KEYS.cart, state.cart)
  }

  const removeCartItem = (serviceId, travelDate) => {
    state.cart = state.cart.filter((item) => !(item.serviceId === serviceId && item.travelDate === travelDate))
    persistStorage(STORAGE_KEYS.cart, state.cart)
  }

  const clearCart = () => {
    state.cart = []
    persistStorage(STORAGE_KEYS.cart, state.cart)
  }

  const createBooking = ({ customer, items, subtotal, serviceFee, total }) => {
    const booking = {
      id: Date.now(),
      code: `VV${Date.now().toString().slice(-6)}`,
      customer,
      items,
      subtotal,
      serviceFee,
      total,
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
    persistStorage(STORAGE_KEYS.bookings, state.bookings)
    clearAppliedPromotion()
    clearCart()
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
    persistStorage(STORAGE_KEYS.bookings, state.bookings)
  }

  const applyPromotionCode = (code, subtotal) => {
    const normalizedCode = code.trim().toUpperCase()
    const promotion = state.promotions.find((entry) => entry.code === normalizedCode && entry.status === 'active')

    if (!promotion) {
      state.appliedPromotion = null
      persistStorage(STORAGE_KEYS.appliedPromotion, state.appliedPromotion)
      return { success: false, message: 'Mã khuyến mãi không hợp lệ hoặc đã ngưng áp dụng.' }
    }

    if (promotion.code === 'PHUQUOC500K' && subtotal < 5000000) {
      return { success: false, message: 'Mã PHUQUOC500K chỉ áp dụng cho đơn từ 5.000.000đ.' }
    }

    state.appliedPromotion = promotion
    persistStorage(STORAGE_KEYS.appliedPromotion, state.appliedPromotion)
    return { success: true, promotion }
  }

  const clearAppliedPromotion = () => {
    state.appliedPromotion = null
    persistStorage(STORAGE_KEYS.appliedPromotion, state.appliedPromotion)
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