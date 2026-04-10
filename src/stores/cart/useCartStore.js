import { defineStore } from 'pinia'
import { promotionsApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { STORAGE_KEYS, getScopedKey, persistStorage, readStorage, GUEST_SCOPE, removeFromStorage } from '@/utils/travelStorage'
import { normalizeCartItem } from '@/utils/travelNormalize'
import { buildBookingSummary } from '@/utils/travelCart'

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

const PROMOTION_MIN_SUBTOTAL_BY_CODE = Object.freeze({
  PHUQUOC500K: 5000000
})

/**
 * Lấy user id đang đăng nhập, fallback guest khi chưa có session.
 * @param {Object} authStore - Auth store instance.
 * @returns {string} User id theo scope hiện tại.
 */
const resolveUserId = (authStore) => (authStore.currentUser?.id ? String(authStore.currentUser.id) : GUEST_SCOPE)

/**
 * Chuyen doi date string ve timestamp de kiem tra hieu luc promotion.
 * @param {string} value - Ngay dang yyyy-mm-dd.
 * @param {'start'|'end'} boundary - Moc dau/ngay cuoi.
 * @returns {number|null} Timestamp theo boundary hoac null khi khong hop le.
 */
const parsePromotionDate = (value, boundary) => {
  if (!value) return null
  const normalizedValue = boundary === 'end' ? `${value}T23:59:59.999` : `${value}T00:00:00.000`
  const time = new Date(normalizedValue).getTime()
  return Number.isNaN(time) ? null : time
}

/**
 * Suy ra nguong toi thieu cua promotion tu field minSubtotal hoac rule theo code.
 * @param {Object} promotion - Promotion can kiem tra.
 * @returns {number} Nguong toi thieu.
 */
const resolvePromotionMinSubtotal = (promotion = {}) => {
  const explicitMinSubtotal = Math.max(0, Number(promotion.minSubtotal || 0) || 0)
  if (explicitMinSubtotal > 0) return explicitMinSubtotal

  const code = String(promotion.code || '').trim().toUpperCase()
  return PROMOTION_MIN_SUBTOTAL_BY_CODE[code] || 0
}

/**
 * Validate promotion theo status, ngay hieu luc va min subtotal.
 * @param {Object} promotion - Promotion can validate.
 * @param {number} subtotal - Gia tri tam tinh don hang.
 * @param {Date} [referenceDate=new Date()] - Thoi diem doi chieu.
 * @returns {{valid: boolean, message: string}} Ket qua validate.
 */
const validatePromotionEligibility = (promotion, subtotal = 0, referenceDate = new Date()) => {
  if (!promotion) {
    return { valid: false, message: 'Mã khuyến mãi không hợp lệ' }
  }

  if (promotion.status !== 'active') {
    return { valid: false, message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.' }
  }

  const referenceTime = referenceDate instanceof Date ? referenceDate.getTime() : new Date(referenceDate).getTime()
  const startTime = parsePromotionDate(promotion.startDate, 'start')
  const endTime = parsePromotionDate(promotion.endDate, 'end')

  if (startTime && referenceTime < startTime) {
    return { valid: false, message: 'Mã khuyến mãi chưa đến thời gian áp dụng.' }
  }

  if (endTime && referenceTime > endTime) {
    return { valid: false, message: 'Mã khuyến mãi đã hết hạn.' }
  }

  const minSubtotal = resolvePromotionMinSubtotal(promotion)
  if (minSubtotal > 0 && Number(subtotal || 0) < minSubtotal) {
    return {
      valid: false,
      message: `Mã ${promotion.code} chỉ áp dụng cho đơn từ ${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(minSubtotal)} VND.`
    }
  }

  return { valid: true, message: '' }
}

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
          identityKey: `${normalizedItem.bookingType || 'hotel'}-${normalizedItem.serviceId}-${normalizedStartDate}-${normalizedEndDate}-${normalizedItem.quantity}`,
          bookingSummary: buildBookingSummary(normalizedItem),
          lineTotal: Number(normalizedItem.bookingMeta?.totalPrice || 0) > 0
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
     * Dam bao danh sach promotions co san trong store de dung lai o checkout/cart.
     * @returns {Promise<Array<Object>>} Danh sach promotions hien tai.
     */
    async loadAvailablePromotions() {
      this._syncUserId()

      let promotions = Array.isArray(useServiceStore().promotions) ? useServiceStore().promotions : []
      if (!promotions.length) {
        promotions = await promotionsApi.getAll()
        if (Array.isArray(promotions)) {
          useServiceStore().setPromotions(promotions)
        }
      }

      return Array.isArray(promotions) ? promotions : []
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
        const promotions = await this.loadAvailablePromotions()

        const found = Array.isArray(promotions)
          ? promotions.find((p) => String(p.code || '').toUpperCase() === code.toUpperCase())
          : null

        if (!found) {
          this.error = 'Mã khuyến mãi không hợp lệ'
          return { success: false, message: this.error }
        }

        const validation = validatePromotionEligibility(found, subtotal)
        if (!validation.valid) {
          this.error = validation.message
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
      const validation = validatePromotionEligibility(this.appliedPromotion, subtotal)
      if (!validation.valid) return 0

      const { type, value } = this.appliedPromotion
      if (type === 'percentage' || type === 'percent') {
        return Math.round((subtotal * value) / 100)
      }
      return Math.min(subtotal, value || 0)
    },

    /**
     * Validate lai promotion dang ap dung tai thoi diem checkout.
     * @param {number} subtotal - Tam tinh don hang.
     * @returns {{valid: boolean, message: string}} Ket qua validate.
     */
    validateAppliedPromotion(subtotal = this.cartTotal) {
      if (!this.appliedPromotion) return { valid: true, message: '' }
      return validatePromotionEligibility(this.appliedPromotion, subtotal)
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
