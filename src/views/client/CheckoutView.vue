<template>
  <section class="page-section cart-layout">
    <div>
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Xác nhận đặt chỗ</p>
          <h1>Hoàn tất thông tin khách hàng và chuyến đi</h1>
        </div>
      </div>

      <form class="checkout-form" @submit.prevent="handleCheckout">
        <div class="form-grid">
          <div class="field-group">
            <label>Họ và tên</label>
            <input v-model="form.fullName" type="text" placeholder="Nguyễn Văn A" />
            <small v-if="errors.fullName" class="error-text">{{ errors.fullName }}</small>
          </div>

          <div class="field-group">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="email@vietvoyage.vn" />
            <small v-if="errors.email" class="error-text">{{ errors.email }}</small>
          </div>

          <div class="field-group">
            <label>Số điện thoại</label>
            <input v-model="form.phone" type="text" placeholder="09xx xxx xxx" />
            <small v-if="errors.phone" class="error-text">{{ errors.phone }}</small>
          </div>

          <div class="field-group">
            <label>Tỉnh / Thành phố</label>
            <select v-model="form.city">
              <option value="">Chọn tỉnh / thành</option>
              <option v-for="destination in destinations" :key="destination.id" :value="destination.province">
                {{ destination.province }}
              </option>
            </select>
            <small v-if="errors.city" class="error-text">{{ errors.city }}</small>
          </div>
        </div>

        <div class="field-group">
          <label>Địa chỉ</label>
          <input v-model="form.address" type="text" placeholder="Số nhà, đường, quận/huyện" />
        </div>

        <div class="field-group">
          <label>Ghi chú</label>
          <textarea v-model="form.note" rows="4" placeholder="Ví dụ: ưu tiên phòng tầng cao, hỗ trợ trẻ em..." />
        </div>
      </form>
    </div>

    <aside class="summary-card sticky-card">
      <p class="eyebrow">Đơn hàng của bạn</p>

      <div v-for="item in checkoutItems" :key="`${item.serviceId}-${item.startDate}-${item.endDate}`" class="mini-booking-item">
        <strong>{{ item.service?.name }}</strong>
        <p class="muted">{{ formatDateRangeVN(item.startDate, item.endDate) }} · {{ item.quantity }} khách</p>
        <span>{{ formatCurrencyVND(item.lineTotal) }}</span>
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
        <span>Tổng thanh toán</span>
        <strong>{{ formatCurrencyVND(total) }}</strong>
      </div>

      <button class="primary-button full-width" type="button" :disabled="!checkoutItems.length" @click="handleCheckout">
        Xác nhận đặt chỗ
      </button>
      <small v-if="errors.cart" class="error-text">{{ errors.cart }}</small>
    </aside>
  </section>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { destinations } from '@/data/mockData'
import { useTravelStore } from '@/stores/useTravelStore'
import { formatCurrencyVND, formatDateRangeVN } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const store = useTravelStore()

const cartItems = computed(() => store.cartItems.value)
const isDirectCheckout = computed(() => route.query.mode === 'direct')
const directCheckoutItem = computed(() => {
  if (!isDirectCheckout.value) return null

  const serviceId = Number(route.query.serviceId)
  const service = store.state.services.find((entry) => entry.id === serviceId)
  if (!service) return null

  const quantity = Math.max(1, Math.min(Number(route.query.quantity) || 1, service.availableSlots || 1))
  const startDate = String(route.query.startDate || '')
  const endDate = service.categoryId === 'ticket' ? '' : String(route.query.endDate || '')

  return {
    serviceId,
    service,
    quantity,
    startDate,
    endDate,
    lineTotal: (service.salePrice || 0) * quantity
  }
})
const checkoutItems = computed(() => directCheckoutItem.value ? [directCheckoutItem.value] : cartItems.value)
const subtotal = computed(() =>
  checkoutItems.value.reduce((acc, item) => acc + (item.lineTotal || 0), 0)
)
const discount = computed(() => isDirectCheckout.value ? 0 : store.calculatePromotionDiscount(subtotal.value))
const serviceFee = computed(() => (subtotal.value > 0 ? 50000 : 0))
const total = computed(() => Math.max(0, subtotal.value - discount.value + serviceFee.value))
const hasInvalidCartItems = computed(() =>
  checkoutItems.value.some((item) => {
    const needsEndDate = item.service?.categoryId !== 'ticket'
    if (!item.startDate) return true
    if (needsEndDate && !item.endDate) return true
    if (item.endDate && item.startDate && new Date(item.endDate) < new Date(item.startDate)) return true
    return false
  })
)

const form = reactive({
  fullName: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  note: ''
})

const errors = reactive({
  fullName: '',
  email: '',
  phone: '',
  city: '',
  cart: ''
})

const validate = () => {
  errors.fullName = form.fullName ? '' : 'Vui lòng nhập họ tên.'
  errors.email = /.+@.+\..+/.test(form.email) ? '' : 'Email không hợp lệ.'
  errors.phone = /^0\d{9,10}$/.test(form.phone) ? '' : 'Số điện thoại phải bắt đầu bằng 0 và có 10-11 số.'
  errors.city = form.city ? '' : 'Vui lòng chọn tỉnh/thành.'
  errors.cart = hasInvalidCartItems.value
    ? 'Giỏ hàng còn dịch vụ thiếu ngày đi/ngày về hợp lệ. Vui lòng quay lại giỏ để chỉnh sửa.'
    : ''

  return !errors.fullName && !errors.email && !errors.phone && !errors.city && !errors.cart
}

const handleCheckout = () => {
  if (!checkoutItems.value.length) return
  if (!validate()) return

  const booking = store.createBooking({
    customer: { ...form },
    items: checkoutItems.value,
    subtotal: subtotal.value,
    discount: discount.value,
    serviceFee: serviceFee.value,
    total: total.value,
    promotion: isDirectCheckout.value ? null : store.state.appliedPromotion,
    clearCartAfterBooking: !isDirectCheckout.value,
    clearPromotionAfterBooking: !isDirectCheckout.value
  })

  router.push({ name: 'booking-success', query: { code: booking.code } })
}
</script>