<template>
  <section class="page-section cart-layout">
    <div>
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Giỏ đặt chỗ</p>
          <h1>{{ cartItems.length }} dịch vụ đang chờ xác nhận</h1>
        </div>
        <router-link class="secondary-button" to="/dich-vu">Tiếp tục khám phá</router-link>
      </div>

      <div v-if="cartItems.length" class="cart-list">
        <article v-for="item in cartItems" :key="item.identityKey" class="cart-item-card">
          <img :src="item.service?.image" :alt="item.service?.name" class="cart-item-image" />

          <div class="cart-item-main">
            <div class="cart-item-head">
              <div>
                <p class="eyebrow eyebrow--blue">{{ getCategoryLabel(item.service?.categoryId) }}</p>
                <h3>{{ item.service?.name }}</h3>
                <p class="muted">
                  {{ item.service?.destination }}, {{ item.service?.province }} · {{ item.bookingSummary || formatDateRangeVN(item.startDate, item.endDate) }}
                </p>
                <router-link
                  v-if="isItemDateInvalid(item) && item.service?.slug"
                  class="ghost-button cart-fix-date-button"
                  :to="getDetailRoute(item.service, getEditQuery(item))"
                >
                  Sửa ngày
                </router-link>
              </div>
              <button class="icon-button" type="button" @click="store.removeCartItem(item.serviceId, item.startDate, item.endDate, item.bookingType, item.bookingMeta)">
                ✕
              </button>
            </div>

            <div class="cart-item-footer">
              <div class="quantity-box compact">
                <button type="button" @click="store.updateCartQuantity(item.serviceId, item.startDate, item.quantity - 1, item.endDate, item.bookingType, item.bookingMeta)">-</button>
                <span>{{ item.quantity }}</span>
                <button type="button" @click="store.updateCartQuantity(item.serviceId, item.startDate, item.quantity + 1, item.endDate, item.bookingType, item.bookingMeta)">+</button>
              </div>

              <div class="price-stack">
                <small>Thành tiền</small>
                <strong>{{ formatCurrencyVND(item.lineTotal) }}</strong>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <h2>Giỏ đặt chỗ của bạn đang trống</h2>
        <p>Hãy chọn một khách sạn, tour hoặc vé tham quan nội địa Việt Nam để tiếp tục.</p>
      </div>
    </div>

    <aside class="summary-card sticky-card">
      <p class="eyebrow">Tóm tắt booking</p>
      <div class="field-group">
        <label>Mã khuyến mãi</label>
        <div class="voucher-row">
          <input v-model="promotionCode" type="text" placeholder="Ví dụ: VIETVOYAGE10" />
          <button class="secondary-button" type="button" @click="handleApplyPromotion">Áp dụng</button>
        </div>
        <small v-if="promotionFeedback" :class="promotionSuccess ? 'success-text' : 'error-text'">{{ promotionFeedback }}</small>
      </div>
      <div class="summary-row">
        <span>Tạm tính</span>
        <strong>{{ formatCurrencyVND(subtotal) }}</strong>
      </div>
      <div class="summary-row">
        <span>Giảm giá</span>
        <strong>-{{ formatCurrencyVND(discount) }}</strong>
      </div>
      <div class="summary-row">
        <span>Phí dịch vụ</span>
        <strong>{{ formatCurrencyVND(serviceFee) }}</strong>
      </div>
      <div class="summary-row summary-row--total">
        <span>Tổng cộng</span>
        <strong>{{ formatCurrencyVND(total) }}</strong>
      </div>

      <small v-if="hasInvalidCartItems" class="error-text">
        Có dịch vụ chưa chọn đủ ngày hợp lệ. Vui lòng chỉnh lại trước khi thanh toán.
      </small>

      <button v-if="cartItems.length" class="primary-button full-width" type="button" :disabled="hasInvalidCartItems" @click="handleProceedCheckout">
        Tiếp tục thanh toán
      </button>
      <router-link v-else class="secondary-button full-width" to="/dich-vu">
        Quay lại danh sách
      </router-link>
    </aside>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { categories } from '@/data/mockData'
import { useTravelStore } from '@/stores/useTravelStore'
import { isDateSelectionInvalid } from '@/utils/bookingRules'
import { formatCurrencyVND, formatDateRangeVN } from '@/utils/formatters'
import { getDetailRouteLocation } from '@/utils/serviceRouting'

const router = useRouter()
const store = useTravelStore()
const promotionCode = ref(store.state.appliedPromotion?.code || '')
const promotionFeedback = ref('')
const promotionSuccess = ref(false)

const cartItems = computed(() => store.cartItems.value)
const subtotal = computed(() => store.cartTotal.value)
const discount = computed(() => store.calculatePromotionDiscount(subtotal.value))
const serviceFee = computed(() => (subtotal.value > 0 ? 50000 : 0))
const total = computed(() => Math.max(0, subtotal.value - discount.value + serviceFee.value))
const hasInvalidCartItems = computed(() =>
  cartItems.value.some((item) => isItemDateInvalid(item))
)

const isItemDateInvalid = (item) => {
  return isDateSelectionInvalid({
    startDate: item.startDate,
    endDate: item.endDate,
    service: item.service
  })
}

const getEditQuery = (item) => {
  if (item.bookingType === 'hotel') {
    return {
      checkInDate: item.bookingMeta?.checkInDate || item.startDate || undefined,
      checkOutDate: item.bookingMeta?.checkOutDate || item.endDate || undefined,
      guests: item.bookingMeta?.guests || item.quantity || 1,
      rooms: item.bookingMeta?.rooms || 1
    }
  }

  if (item.bookingType === 'ticket') {
    return {
      useDate: item.bookingMeta?.useDate || item.startDate || undefined,
      ticketQuantity: item.bookingMeta?.ticketQuantity || item.quantity || 1
    }
  }

  if (item.bookingType === 'tour') {
    return {
      departureDate: item.bookingMeta?.departureDate || item.startDate || undefined,
      travelers: item.bookingMeta?.travelers || item.quantity || 1
    }
  }

  return {
    applyDate: item.bookingMeta?.applyDate || item.startDate || undefined,
    travelers: item.bookingMeta?.travelers || item.quantity || 1
  }
}

const getDetailRoute = (service, query = {}) => getDetailRouteLocation(service, query)

const getCategoryLabel = (categoryId) =>
  categories.find((category) => category.id === categoryId)?.name || 'Dịch vụ'

const handleApplyPromotion = () => {
  const result = store.applyPromotionCode(promotionCode.value, subtotal.value)
  promotionSuccess.value = result.success
  promotionFeedback.value = result.success
    ? `Áp dụng thành công mã ${result.promotion.code}.`
    : result.message
}

const handleProceedCheckout = () => {
  if (hasInvalidCartItems.value) return
  router.push('/thanh-toan')
}
</script>