import { defineStore } from 'pinia'
import { getTravelContextStore as useTravelContextStore } from '@/stores/getTravelContextStore'
import {
  STORAGE_KEYS,
  buildBookingMeta,
  buildBookingSummary,
  extractDateRangeFromBookingMeta,
  getBookingType,
  getCartIdentity,
  normalizeCartItem,
  resolveItemMaxSlots
} from '@/stores/travelShared'
import { serviceRequiresEndDate } from '@/utils/bookingRules'

const isSameServiceId = (left, right) => String(left) === String(right)

export const useTravelCartStore = defineStore('travelCart', {
  state: () => ({}),

  getters: {
    cartItems() {
      const contextStore = useTravelContextStore()
      const cart = Array.isArray(contextStore.state.cart) ? contextStore.state.cart : []
      const services = Array.isArray(contextStore.state.services) ? contextStore.state.services : []

      return cart.map((item) => {
        const normalizedItem = normalizeCartItem(item, services)
        const service = services.find((entry) => isSameServiceId(entry.id, normalizedItem.serviceId))
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
    },

    cartTotal() {
      return this.cartItems.reduce((total, item) => total + item.lineTotal, 0)
    }
  },

  actions: {
    addToCart({
      serviceId,
      quantity = 1,
      travelDate = '',
      startDate = '',
      endDate = '',
      bookingType = '',
      bookingMeta = null
    }) {
      const contextStore = useTravelContextStore()
      contextStore.syncScopeFromSession()

      const services = Array.isArray(contextStore.state.services) ? contextStore.state.services : []
      const service = services.find((entry) => isSameServiceId(entry.id, serviceId))
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

      const cart = Array.isArray(contextStore.state.cart) ? contextStore.state.cart : []
      const existing = cart.find((item) => {
        const normalizedItem = normalizeCartItem(item, services)
        return isSameServiceId(normalizedItem.serviceId, serviceId) && getCartIdentity(normalizedItem) === candidateIdentity
      })

      if (existing) {
        const existingNormalized = normalizeCartItem(existing, services)
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
        contextStore.state.cart = [...cart, candidate]
      }

      contextStore.persistScoped(STORAGE_KEYS.cart, contextStore.state.cart)
    },

    updateCartQuantity(serviceId, startDate, quantity, endDate = '', bookingType = '', bookingMeta = null) {
      const contextStore = useTravelContextStore()
      contextStore.syncScopeFromSession()

      const services = Array.isArray(contextStore.state.services) ? contextStore.state.services : []
      const service = services.find((entry) => isSameServiceId(entry.id, serviceId))
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
        const normalizedItem = normalizeCartItem(item, services)
        return isSameServiceId(normalizedItem.serviceId, serviceId) && getCartIdentity(normalizedItem) === targetIdentity
      }

      const cart = Array.isArray(contextStore.state.cart) ? contextStore.state.cart : []

      if (normalizedQuantity <= 0) {
        contextStore.state.cart = cart.filter((item) => !isTargetItem(item))
      } else {
        contextStore.state.cart = cart.map((item) =>
          isTargetItem(item)
            ? (() => {
              const normalizedItem = normalizeCartItem(item, services)
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

      contextStore.persistScoped(STORAGE_KEYS.cart, contextStore.state.cart)
    },

    removeCartItem(serviceId, startDate, endDate = '', bookingType = '', bookingMeta = null) {
      const contextStore = useTravelContextStore()
      contextStore.syncScopeFromSession()

      const services = Array.isArray(contextStore.state.services) ? contextStore.state.services : []
      const service = services.find((entry) => isSameServiceId(entry.id, serviceId))
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

      const cart = Array.isArray(contextStore.state.cart) ? contextStore.state.cart : []
      contextStore.state.cart = cart.filter((item) => {
        const normalizedItem = normalizeCartItem(item, services)
        return !(isSameServiceId(normalizedItem.serviceId, serviceId) && getCartIdentity(normalizedItem) === targetIdentity)
      })

      contextStore.persistScoped(STORAGE_KEYS.cart, contextStore.state.cart)
    },

    replaceCartItem({ originalItem, nextItem }) {
      if (!nextItem) return

      const hasOriginalIdentity = originalItem && originalItem.serviceId !== undefined && originalItem.serviceId !== null

      if (hasOriginalIdentity) {
        this.removeCartItem(
          originalItem.serviceId,
          originalItem.startDate || '',
          originalItem.endDate || '',
          originalItem.bookingType || '',
          originalItem.bookingMeta || null
        )
      }

      this.addToCart(nextItem)
    },

    clearCart() {
      const contextStore = useTravelContextStore()
      contextStore.syncScopeFromSession()
      contextStore.state.cart = []
      contextStore.persistScoped(STORAGE_KEYS.cart, contextStore.state.cart)
    },

    applyPromotionCode(code, subtotal) {
      const contextStore = useTravelContextStore()
      contextStore.syncScopeFromSession()

      const promotions = Array.isArray(contextStore.state.promotions) ? contextStore.state.promotions : []
      const normalizedCode = code.trim().toUpperCase()
      const promotion = promotions.find((entry) => entry.code === normalizedCode && entry.status === 'active')

      if (!promotion) {
        contextStore.state.appliedPromotion = null
        contextStore.persistScoped(STORAGE_KEYS.appliedPromotion, contextStore.state.appliedPromotion)
        return { success: false, message: 'Mã khuyến mãi không hợp lệ hoặc đã ngưng áp dụng.' }
      }

      if (promotion.code === 'PHUQUOC500K' && subtotal < 5000000) {
        return { success: false, message: 'Mã PHUQUOC500K chỉ áp dụng cho đơn từ 5.000.000đ.' }
      }

      contextStore.state.appliedPromotion = promotion
      contextStore.persistScoped(STORAGE_KEYS.appliedPromotion, contextStore.state.appliedPromotion)
      return { success: true, promotion }
    },

    clearAppliedPromotion() {
      const contextStore = useTravelContextStore()
      contextStore.syncScopeFromSession()
      contextStore.state.appliedPromotion = null
      contextStore.persistScoped(STORAGE_KEYS.appliedPromotion, contextStore.state.appliedPromotion)
    },

    calculatePromotionDiscount(subtotal) {
      const contextStore = useTravelContextStore()
      if (!contextStore.state.appliedPromotion) return 0
      if (contextStore.state.appliedPromotion.type === 'percent') {
        return Math.round((subtotal * contextStore.state.appliedPromotion.value) / 100)
      }
      return Math.min(subtotal, contextStore.state.appliedPromotion.value)
    }
  }
})
