import { defineStore } from 'pinia'
import { promotionsApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { STORAGE_KEYS, getScopedKey, persistStorage, readStorage, GUEST_SCOPE, removeFromStorage } from '@/utils/travelStorage'

const PROMOTION_MIN_SUBTOTAL_BY_CODE = Object.freeze({
  PHUQUOC500K: 5000000
})

const resolveUserId = (authStore) => (authStore.currentUser?.id ? String(authStore.currentUser.id) : GUEST_SCOPE)

const parsePromotionDate = (value, boundary) => {
  if (!value) return null
  const normalizedValue = boundary === 'end' ? `${value}T23:59:59.999` : `${value}T00:00:00.000`
  const time = new Date(normalizedValue).getTime()
  return Number.isNaN(time) ? null : time
}

const resolvePromotionMinSubtotal = (promotion = {}) => {
  const explicitMinSubtotal = Math.max(0, Number(promotion.minSubtotal || 0) || 0)
  if (explicitMinSubtotal > 0) return explicitMinSubtotal

  const code = String(promotion.code || '').trim().toUpperCase()
  return PROMOTION_MIN_SUBTOTAL_BY_CODE[code] || 0
}

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

export const useCheckoutStore = defineStore('checkout', {
  state: () => {
    const authStore = useAuthStore()
    const currentUserId = resolveUserId(authStore)

    return {
      appliedPromotion: readStorage(getScopedKey(STORAGE_KEYS.appliedPromotion, currentUserId), null),
      loading: false,
      error: null,
      _currentUserId: currentUserId
    }
  },

  actions: {
    syncUserScope() {
      this._syncUserId()
    },

    _syncUserId() {
      const authStore = useAuthStore()
      const userId = resolveUserId(authStore)
      if (userId !== this._currentUserId) {
        this._currentUserId = userId
        this._loadPromotionForUser()
      }
    },

    _loadPromotionForUser() {
      const promotionKey = getScopedKey(STORAGE_KEYS.appliedPromotion, this._currentUserId)
      this.appliedPromotion = readStorage(promotionKey, null)
    },

    _savePromotion() {
      const promotionKey = getScopedKey(STORAGE_KEYS.appliedPromotion, this._currentUserId)
      if (this.appliedPromotion) {
        persistStorage(promotionKey, this.appliedPromotion)
      } else {
        removeFromStorage(promotionKey)
      }
    },

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

    clearAppliedPromotion() {
      this._syncUserId()
      this.appliedPromotion = null
      this._savePromotion()
    },

    calculatePromotionDiscount(subtotal = 0) {
      if (!this.appliedPromotion) return 0
      const validation = validatePromotionEligibility(this.appliedPromotion, subtotal)
      if (!validation.valid) return 0

      const { type, value } = this.appliedPromotion
      if (type === 'percentage' || type === 'percent') {
        return Math.round((subtotal * value) / 100)
      }
      return Math.min(subtotal, value || 0)
    },

    validateAppliedPromotion(subtotal = 0) {
      if (!this.appliedPromotion) return { valid: true, message: '' }
      return validatePromotionEligibility(this.appliedPromotion, subtotal)
    },

    clearError() {
      this.error = null
    }
  }
})
