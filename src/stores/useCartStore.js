import { defineStore } from 'pinia'
import { promotionsApi } from '@/services/api'
import { useAuthStore } from '@/stores/useAuthStore'
import { useServiceStore } from '@/stores/useServiceStore'
import { STORAGE_KEYS, getScopedKey, persistStorage, readStorage, GUEST_SCOPE, removeFromStorage } from '@/utils/travelStorage'
import { buildBookingMeta, extractDateRangeFromBookingMeta, getBookingType, normalizeCartItem } from '@/utils/travelNormalize'
import { getCartIdentity, buildBookingSummary, resolveItemMaxSlots } from '@/utils/travelCart'
import { serviceRequiresEndDate } from '@/utils/bookingRules'

/**
 * Ép dữ liệu đầu vào về mảng để tránh lỗi khi đọc state/storage.
 * @param {*} value - Giá trị đầu vào.
 * @returns {Array} Mảng hợp lệ.
 */
const ensureArray = (value) => (Array.isArray(value) ? value : [])

/**
 * So sánh service id theo dạng chuỗi để tránh sai khác kiểu dữ liệu.
 * @param {number|string} left - Giá trị bên trái.
 * @param {number|string} right - Giá trị bên phải.
 * @returns {boolean} True nếu cùng id.
 */
const isSameServiceId = (left, right) => String(left) === String(right)

/**
 * Lấy user id đang đăng nhập, fallback guest khi chưa có session.
 * @param {Object} authStore - Auth store instance.
 * @returns {string} User id theo scope hiện tại.
 */
const resolveUserId = (authStore) => (authStore.currentUser?.id ? String(authStore.currentUser.id) : GUEST_SCOPE)

export const useCartStore = defineStore('cart', {
  /**
   * Khởi tạo cart state theo user scope hiện tại từ storage.
   * @returns {Object} Cart state ban đầu.
   */
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
    /**
     * Chuẩn hóa item trong giỏ và bổ sung dữ liệu hiển thị (service, summary, lineTotal).
     * @param {Object} state - Cart state hiện tại.
     * @returns {Array<Object>} Danh sách item đã enrich cho UI.
     */
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
          lineTotal: normalizedItem.bookingType === 'hotel' && Number(normalizedItem.bookingMeta?.totalPrice || 0) > 0
            ? Number(normalizedItem.bookingMeta.totalPrice)
            : (Number(normalizedItem.bookingMeta?.unitPrice || 0) || Number(service?.salePrice || 0) || 0) * normalizedItem.quantity
        }
      })
    },

    /**
     * Tính tổng tiền hàng trước giảm giá/phí dịch vụ.
     * @returns {number} Tổng lineTotal của cart.
     */
    cartTotal() {
      return this.enrichedCartItems.reduce((total, item) => total + item.lineTotal, 0)
    },

    /**
     * Tính tiền giảm giá theo loại khuyến mãi đang áp dụng.
     * @param {Object} state - Cart state hiện tại.
     * @returns {number} Số tiền giảm.
     */
    discountAmount(state) {
      if (!state.appliedPromotion) return 0
      const promotion = state.appliedPromotion
      if (promotion.type === 'percentage' || promotion.type === 'percent') {
        return this.cartTotal * (promotion.value / 100)
      }
      return promotion.value || 0
    },

    /**
     * Tính tổng cuối sau khi trừ khuyến mãi.
     * @returns {number} Tổng thanh toán cuối (không âm).
     */
    finalTotal() {
      return Math.max(0, this.cartTotal - this.discountAmount)
    }
  },

  actions: {
    /**
     * Đồng bộ scope công khai để view có thể gọi khi chuyển tài khoản.
     * @returns {void}
     */
    syncUserScope() {
      this._syncUserId()
    },

    /**
     * Đồng bộ user scope của cart khi trạng thái đăng nhập thay đổi.
     * @returns {void}
     */
    _syncUserId() {
      const authStore = useAuthStore()
      const userId = resolveUserId(authStore)
      if (userId !== this._currentUserId) {
        this._currentUserId = userId
        this._loadCartForUser()
      }
    },

    /**
     * Nạp cart và khuyến mãi theo scoped key của user hiện tại.
     * @returns {void}
     */
    _loadCartForUser() {
      const scopedKey = getScopedKey(STORAGE_KEYS.cart, this._currentUserId)
      this.cartItems = ensureArray(readStorage(scopedKey, []))

      const promotionKey = getScopedKey(STORAGE_KEYS.appliedPromotion, this._currentUserId)
      this.appliedPromotion = readStorage(promotionKey, null)
    },

    /**
     * Persist danh sách cart hiện tại theo user scope.
     * @returns {void}
     */
    _saveCart() {
      const scopedKey = getScopedKey(STORAGE_KEYS.cart, this._currentUserId)
      persistStorage(scopedKey, this.cartItems)
    },

    /**
     * Persist/xóa mã khuyến mãi theo user scope.
     * @returns {void}
     */
    _savePromotion() {
      const promotionKey = getScopedKey(STORAGE_KEYS.appliedPromotion, this._currentUserId)
      if (this.appliedPromotion) {
        persistStorage(promotionKey, this.appliedPromotion)
      } else {
        removeFromStorage(promotionKey)
      }
    },

    /**
     * Thêm item vào giỏ với chuẩn hóa bookingMeta và giới hạn theo slot còn lại.
     * @param {Object} payload - Dữ liệu đặt chỗ từ UI/detail.
     * @returns {void}
     */
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

    /**
     * Cập nhật số lượng item theo index, xóa item nếu số lượng về 0.
     * @param {number} cartIndex - Vị trí item trong cart.
     * @param {number|string} newQuantity - Số lượng mới.
     * @returns {void}
     */
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

    /**
     * Xóa item khỏi giỏ (hỗ trợ cả mode theo index và mode theo identity cũ).
     * @param {number|string} serviceIdOrIndex - Index hoặc service id.
     * @param {string} startDate - Ngày bắt đầu identity mode.
     * @param {string} endDate - Ngày kết thúc identity mode.
     * @param {string} bookingType - Loại booking identity mode.
     * @param {Object|null} bookingMeta - Meta identity mode.
     * @returns {void}
     */
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

    /**
     * Xóa toàn bộ giỏ hàng của user hiện tại.
     * @returns {void}
     */
    clearCart() {
      this._syncUserId()
      this.cartItems = []
      this._saveCart()
    },

    /**
     * Áp mã khuyến mãi: nạp danh sách mã khi cần, kiểm tra điều kiện và lưu vào state.
     * @param {string} code - Mã khuyến mãi từ người dùng.
     * @param {number} subtotal - Tạm tính đơn hàng để check điều kiện mã.
     * @returns {Promise<Object>} Kết quả áp mã với success/message/promotion.
     */
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

    /**
     * Gỡ mã khuyến mãi hiện tại khỏi cart state.
     * @returns {void}
     */
    clearAppliedPromotion() {
      this._syncUserId()
      this.appliedPromotion = null
      this._savePromotion()
    },

    /**
     * Tính số tiền giảm theo mã đang áp dụng, dùng cho checkout summary.
     * @param {number} subtotal - Tạm tính đơn hàng.
     * @returns {number} Số tiền giảm cuối cùng.
     */
    calculatePromotionDiscount(subtotal = this.cartTotal) {
      if (!this.appliedPromotion) return 0
      const { type, value } = this.appliedPromotion
      if (type === 'percentage' || type === 'percent') {
        return Math.round((subtotal * value) / 100)
      }
      return Math.min(subtotal, value || 0)
    },

    /**
     * Xóa lỗi hiện tại của cart store.
     * @returns {void}
     */
    clearError() {
      this.error = null
    }
  }
})
