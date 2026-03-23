import { defineStore } from 'pinia'
import { promotionsApi } from '@/services/api'
import { useAuthStore } from '@/stores/useAuthStore'
import { useServiceStore } from '@/stores/useServiceStore'
import { STORAGE_KEYS, getScopedKey, persistStorage, readStorage, GUEST_SCOPE, removeFromStorage } from '@/utils/travelStorage'
import { buildBookingMeta, extractDateRangeFromBookingMeta, getBookingType, normalizeCartItem } from '@/utils/travelNormalize'
import { getCartIdentity, buildBookingSummary, resolveItemMaxSlots } from '@/utils/travelCart'
import { serviceRequiresEndDate } from '@/utils/bookingRules'

const ensureArray = (value) => (Array.isArray(value) ? value : [])

const isSameServiceId = (left, right) => String(left) === String(right)

const resolveUserId = (authStore) => (authStore.currentUser?.id ? String(authStore.currentUser.id) : GUEST_SCOPE)

export const useCartStore = defineStore('cart', {
  state: () => {
    const authStore = useAuthStore()
    const currentUserId = resolveUserId(authStore)

    return {
      cartItems: ensureArray(readStorage(getScopedKey(STORAGE_KEYS.cart, currentUserId), [])),
      appliedPromotion: readStorage(getScopedKey(STORAGE_KEYS.appliedPromotion, currentUserId), null),
      loading: false,
      error: null,
      _currentUserId: currentUserId
    }
  },

  getters: {
    enrichedCartItems(state) {
      const cartItems = Array.isArray(state.cartItems) ? state.cartItems : []
      const serviceStore = useServiceStore()
      const services = Array.isArray(serviceStore.services) ? serviceStore.services : []

      return cartItems.map((item) => {
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
      return this.enrichedCartItems.reduce((total, item) => total + item.lineTotal, 0)
    },

    discountAmount(state) {
      if (!state.appliedPromotion) return 0
      const promotion = state.appliedPromotion
      if (promotion.type === 'percentage' || promotion.type === 'percent') {
        return this.cartTotal * (promotion.value / 100)
      }
      return promotion.value || 0
    },

    finalTotal() {
      return Math.max(0, this.cartTotal - this.discountAmount)
    }
  },

  actions: {
    _syncUserId() {
      const authStore = useAuthStore()
      const userId = resolveUserId(authStore)
      if (userId !== this._currentUserId) {
        this._currentUserId = userId
        this._loadCartForUser()
      }
    },

    _loadCartForUser() {
      const scopedKey = getScopedKey(STORAGE_KEYS.cart, this._currentUserId)
      this.cartItems = ensureArray(readStorage(scopedKey, []))

      const promotionKey = getScopedKey(STORAGE_KEYS.appliedPromotion, this._currentUserId)
      this.appliedPromotion = readStorage(promotionKey, null)
    },

    _saveCart() {
      const scopedKey = getScopedKey(STORAGE_KEYS.cart, this._currentUserId)
      persistStorage(scopedKey, this.cartItems)
    },

    _savePromotion() {
      const promotionKey = getScopedKey(STORAGE_KEYS.appliedPromotion, this._currentUserId)
      if (this.appliedPromotion) {
        persistStorage(promotionKey, this.appliedPromotion)
      } else {
        removeFromStorage(promotionKey)
      }
    },

    addToCart({
      serviceId,
      quantity = 1,
      travelDate = '',
      startDate = '',
      endDate = '',
      bookingType = '',
      bookingMeta = null,
      service = null
    }) {
      this._syncUserId()

      const serviceStore = useServiceStore()
      const services = Array.isArray(serviceStore.services) ? serviceStore.services : []
      const targetService = service || services.find((entry) => isSameServiceId(entry.id, serviceId))

      if (!targetService || targetService.availableSlots <= 0) {
        this.error = 'Dịch vụ không có sẵn'
        return
      }

      const resolvedBookingType = bookingType || getBookingType(targetService)
      const rawStartDate = startDate || travelDate || ''
      const rawEndDate = serviceRequiresEndDate(targetService) ? (endDate || '') : ''
      const requestedQuantity = Math.max(1, Number(quantity) || 1)

      const normalizedMeta = buildBookingMeta({
        bookingType: resolvedBookingType,
        startDate: rawStartDate,
        endDate: rawEndDate,
        quantity: requestedQuantity,
        bookingMeta: bookingMeta || {}
      })

      const normalizedDates = extractDateRangeFromBookingMeta(resolvedBookingType, normalizedMeta)

      const maxSlots = resolveItemMaxSlots(targetService, {
        serviceId: targetService.id,
        bookingType: resolvedBookingType,
        bookingMeta: normalizedMeta
      })

      const normalizedQuantity = Math.max(1, Math.min(requestedQuantity, Math.max(maxSlots, 1)))

      const candidate = {
        serviceId: targetService.id,
        bookingType: resolvedBookingType,
        quantity: normalizedQuantity,
        startDate: normalizedDates.startDate || rawStartDate,
        endDate: serviceRequiresEndDate(targetService) ? (normalizedDates.endDate || rawEndDate) : '',
        travelDate: normalizedDates.startDate || rawStartDate,
        bookingMeta: buildBookingMeta({
          bookingType: resolvedBookingType,
          startDate: normalizedDates.startDate || rawStartDate,
          endDate: normalizedDates.endDate || rawEndDate,
          quantity: normalizedQuantity,
          bookingMeta: normalizedMeta
        })
      }

      const candidateIdentity = getCartIdentity(candidate)
      const existingIndex = this.cartItems.findIndex((item) => getCartIdentity(item) === candidateIdentity)

      if (existingIndex !== -1) {
        this.cartItems[existingIndex].quantity += normalizedQuantity
      } else {
        this.cartItems.push(candidate)
      }

      this._saveCart()
      this.error = null
    },

    updateCartQuantity(cartIndex, newQuantity) {
      this._syncUserId()

      if (cartIndex < 0 || cartIndex >= this.cartItems.length) return

      const item = this.cartItems[cartIndex]
      const safeQuantity = Math.max(0, Number(newQuantity) || 0)

      if (safeQuantity === 0) {
        this.removeCartItem(cartIndex)
      } else {
        item.quantity = safeQuantity
        this._saveCart()
      }
    },

    removeCartItem(serviceIdOrIndex, startDate = '', endDate = '', bookingType = '', bookingMeta = null) {
      this._syncUserId()

      // Backward compatible: support both index and identity-based removal.
      if (typeof serviceIdOrIndex === 'number' && startDate === '' && endDate === '' && bookingType === '' && bookingMeta === null) {
        if (serviceIdOrIndex < 0 || serviceIdOrIndex >= this.cartItems.length) return
        this.cartItems.splice(serviceIdOrIndex, 1)
        this._saveCart()
        return
      }

      const serviceStore = useServiceStore()
      const services = Array.isArray(serviceStore.services) ? serviceStore.services : []
      const targetService = services.find((entry) => isSameServiceId(entry.id, serviceIdOrIndex))
      const targetBookingType = bookingType || getBookingType(targetService)
      const targetMeta = buildBookingMeta({
        bookingType: targetBookingType,
        startDate: startDate || '',
        endDate: endDate || '',
        quantity: 1,
        bookingMeta: bookingMeta || {}
      })
      const targetDates = extractDateRangeFromBookingMeta(targetBookingType, targetMeta)
      const targetIdentity = getCartIdentity({
        serviceId: serviceIdOrIndex,
        bookingType: targetBookingType,
        bookingMeta: targetMeta,
        startDate: targetDates.startDate || startDate || '',
        endDate: targetDates.endDate || endDate || ''
      })

      this.cartItems = this.cartItems.filter((item) => {
        const normalizedItem = normalizeCartItem(item, services)
        return !(isSameServiceId(normalizedItem.serviceId, serviceIdOrIndex) && getCartIdentity(normalizedItem) === targetIdentity)
      })

      this._saveCart()
    },

    clearCart() {
      this._syncUserId()
      this.cartItems = []
      this._saveCart()
    },

    async applyPromotionCode(code, subtotal = 0) {
      this._syncUserId()

      if (!code || code.trim() === '') {
        this.clearAppliedPromotion()
        return {
          success: false,
          message: 'Vui lòng nhập mã khuyến mãi.'
        }
      }

      this.loading = true
      this.error = null

      try {
        const serviceStore = useServiceStore()
        let promotions = Array.isArray(serviceStore.promotions) ? serviceStore.promotions : []

        if (!promotions.length) {
          promotions = await promotionsApi.getAll()
          if (Array.isArray(promotions)) {
            serviceStore.promotions = promotions
          }
        }

        const found = Array.isArray(promotions)
          ? promotions.find((p) => p.code.toUpperCase() === code.toUpperCase() && p.status === 'active')
          : null

        if (!found) {
          this.error = 'Mã khuyến mãi không hợp lệ'
          return { success: false, message: this.error }
        }

        if (found.code === 'PHUQUOC500K' && subtotal < 5000000) {
          this.error = 'Mã PHUQUOC500K chỉ áp dụng cho đơn từ 5.000.000 VND.'
          return { success: false, message: this.error }
        }

        this.appliedPromotion = found
        this._savePromotion()
        return { success: true, promotion: found }
      } catch (error) {
        this.error = error?.message || 'Lỗi áp dụng mã khuyến mãi'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    clearAppliedPromotion() {
      this._syncUserId()
      this.appliedPromotion = null
      this._savePromotion()
    },

    calculatePromotionDiscount(subtotal = this.cartTotal) {
      if (!this.appliedPromotion) return 0
      const { type, value } = this.appliedPromotion
      if (type === 'percentage' || type === 'percent') {
        return Math.round((subtotal * value) / 100)
      }
      return Math.min(subtotal, value || 0)
    },

    clearError() {
      this.error = null
    }
  }
})
