import { reactive } from 'vue'
import { defineStore } from 'pinia'
import {
  bookingsApi,
  categoriesApi,
  commentsApi,
  destinationsApi,
  promotionsApi,
  servicesApi
} from '@/services/api'
import {
  AUTH_CHANGED_EVENT,
  GUEST_SCOPE,
  STORAGE_KEYS,
  getActiveUserId,
  getScopedKey,
  normalizeCartItem,
  normalizeServicesFromStorage,
  persistStorage,
  readStorage
} from '@/stores/travelShared'

const ensureArray = (value) => (Array.isArray(value) ? value : [])

export const useTravelContextStore = defineStore('travelContext', () => {
  const state = reactive({
    activeUserId: GUEST_SCOPE,
    categories: ensureArray(readStorage(STORAGE_KEYS.categories, [])),
    destinations: ensureArray(readStorage(STORAGE_KEYS.destinations, [])),
    services: normalizeServicesFromStorage(ensureArray(readStorage(STORAGE_KEYS.services, []))),
    wishlist: [],
    cart: [],
    comments: ensureArray(readStorage(STORAGE_KEYS.comments, [])),
    bookings: [],
    allBookings: ensureArray(readStorage(STORAGE_KEYS.bookings, [])),
    promotions: ensureArray(readStorage(STORAGE_KEYS.promotions, [])),
    appliedPromotion: null
  })

  let bootstrapPromise = null
  let authEventBound = false

  const persistCollections = () => {
    persistStorage(STORAGE_KEYS.categories, state.categories)
    persistStorage(STORAGE_KEYS.destinations, state.destinations)
    persistStorage(STORAGE_KEYS.services, state.services)
    persistStorage(STORAGE_KEYS.comments, state.comments)
    persistStorage(STORAGE_KEYS.promotions, state.promotions)
  }

  const persistServices = () => {
    persistStorage(STORAGE_KEYS.services, state.services)
  }

  const persistPromotions = () => {
    persistStorage(STORAGE_KEYS.promotions, state.promotions)
  }

  const persistAllBookings = () => {
    persistStorage(STORAGE_KEYS.bookings, state.allBookings)
  }

  const persistScoped = (baseKey, value) => {
    persistStorage(getScopedKey(baseKey, state.activeUserId), value)
  }

  const loadUserScopedState = (userId) => {
    const scope = userId || GUEST_SCOPE
    state.activeUserId = scope
    state.wishlist = ensureArray(readStorage(getScopedKey(STORAGE_KEYS.wishlist, scope), []))
    const rawCart = ensureArray(readStorage(getScopedKey(STORAGE_KEYS.cart, scope), []))
    state.cart = rawCart.map((item) => normalizeCartItem(item, state.services))
    state.bookings = ensureArray(readStorage(getScopedKey(STORAGE_KEYS.bookings, scope), []))
    state.appliedPromotion = readStorage(getScopedKey(STORAGE_KEYS.appliedPromotion, scope), null)

    persistStorage(getScopedKey(STORAGE_KEYS.cart, scope), state.cart)
  }

  const syncScopeFromSession = () => {
    if (typeof window === 'undefined') return
    const nextUserId = getActiveUserId()
    if (nextUserId !== state.activeUserId) {
      loadUserScopedState(nextUserId)
    }
  }

  const bindAuthSync = () => {
    if (typeof window === 'undefined' || authEventBound) return

    window.addEventListener(AUTH_CHANGED_EVENT, (event) => {
      const userId = event.detail?.id ? String(event.detail.id) : GUEST_SCOPE
      loadUserScopedState(userId)
    })

    authEventBound = true
  }

  const hydrateCollectionsFromApi = async () => {
    try {
      const [categories, destinations, services, comments, promotions, bookings] = await Promise.all([
        categoriesApi.list(),
        destinationsApi.list(),
        servicesApi.list(),
        commentsApi.list(),
        promotionsApi.list(),
        bookingsApi.list()
      ])

      if (Array.isArray(categories)) state.categories = categories
      if (Array.isArray(destinations)) state.destinations = destinations
      if (Array.isArray(services)) {
        state.services = normalizeServicesFromStorage(services)
      }
      if (Array.isArray(comments)) state.comments = comments
      if (Array.isArray(promotions)) state.promotions = promotions
      if (Array.isArray(bookings)) state.allBookings = bookings

      state.cart = state.cart.map((item) => normalizeCartItem(item, state.services))
      persistStorage(getScopedKey(STORAGE_KEYS.cart, state.activeUserId), state.cart)
      persistCollections()
      persistAllBookings()
    } catch (error) {
      // Keep cached local data if API is not reachable.
    }
  }

  const bootstrapState = () => {
    if (bootstrapPromise) return bootstrapPromise

    bootstrapPromise = (async () => {
      syncScopeFromSession()
      bindAuthSync()
      await hydrateCollectionsFromApi()
    })()

    return bootstrapPromise
  }

  bootstrapState()

  return {
    state,
    bootstrapState,
    persistCollections,
    persistServices,
    persistPromotions,
    persistAllBookings,
    persistScoped,
    loadUserScopedState,
    syncScopeFromSession,
    bindAuthSync
  }
})

export default useTravelContextStore
