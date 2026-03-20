import { computed, reactive, readonly } from 'vue'
import { comments as seedComments, services } from '@/data/mockData'

const STORAGE_KEYS = {
  wishlist: 'vietvoyage_wishlist',
  cart: 'vietvoyage_cart',
  comments: 'vietvoyage_comments',
  bookings: 'vietvoyage_bookings'
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
  services,
  wishlist: [],
  cart: [],
  comments: [],
  bookings: []
})

const bootstrapState = () => {
  if (typeof window === 'undefined') return
  state.wishlist = readStorage(STORAGE_KEYS.wishlist, [])
  state.cart = readStorage(STORAGE_KEYS.cart, [])
  state.comments = readStorage(STORAGE_KEYS.comments, seedComments)
  state.bookings = readStorage(STORAGE_KEYS.bookings, [])
}

bootstrapState()

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

  const getServiceBySlug = (slug) => state.services.find((service) => service.slug === slug)

  const getCommentsByService = (serviceId) =>
    state.comments
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
      createdAt: new Date().toISOString()
    }

    state.bookings = [booking, ...state.bookings]
    persistStorage(STORAGE_KEYS.bookings, state.bookings)
    clearCart()
    return booking
  }

  const addComment = ({ serviceId, userName, rating, content }) => {
    const newComment = {
      id: Date.now(),
      serviceId,
      userName,
      rating,
      content,
      createdAt: new Date().toISOString()
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
    getServiceBySlug,
    getCommentsByService,
    toggleWishlist,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    clearCart,
    createBooking,
    addComment
  }
}
