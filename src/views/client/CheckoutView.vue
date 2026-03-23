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
            <input v-model="form.email" type="email" placeholder="email@vtravel.vn" />
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

      <div v-for="item in checkoutItems" :key="item.identityKey || `${item.serviceId}-${item.startDate}-${item.endDate}`" class="mini-booking-item">
        <strong>{{ item.service?.name }}</strong>
        <p class="muted">{{ item.bookingSummary || formatDateRangeVN(item.startDate, item.endDate) }}</p>
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
import { computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBookingStore } from '@/stores/useBookingStore'
import { useCartStore } from '@/stores/useCartStore'
import { useServiceStore } from '@/stores/useServiceStore'
import { isDateSelectionInvalid } from '@/utils/bookingRules'
import { formatCurrencyVND, formatDateRangeVN } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const bookingStore = useBookingStore()
const cartStore = useCartStore()
const serviceStore = useServiceStore()
const destinations = computed(() => serviceStore.destinations)

const cartItems = computed(() => cartStore.enrichedCartItems)
const isDirectCheckout = computed(() => route.query.mode === 'direct')
const directRequestedServiceId = computed(() => {
  if (route.query.serviceId === undefined || route.query.serviceId === null) return ''
  return String(route.query.serviceId)
})

const directCheckoutItem = computed(() => {
  if (!isDirectCheckout.value) return null

  const service = serviceStore.services.find((entry) => String(entry.id) === directRequestedServiceId.value)
  if (!service) return null
  const serviceId = service.id

  const bookingType = service.categoryId
  const quantity = bookingType === 'ticket'
    ? Math.max(1, Math.min(Number(route.query.ticketQuantity || route.query.quantity) || 1, service.availableSlots || 1))
    : Math.max(1, Math.min(Number(route.query.travelers || route.query.guests || route.query.quantity) || 1, service.availableSlots || 1))

  const startDate = bookingType === 'hotel'
    ? String(route.query.checkInDate || route.query.startDate || '')
    : bookingType === 'ticket'
      ? String(route.query.useDate || route.query.startDate || '')
      : bookingType === 'tour'
        ? String(route.query.departureDate || route.query.startDate || '')
        : String(route.query.applyDate || route.query.startDate || '')
  const endDate = bookingType === 'hotel'
    ? String(route.query.checkOutDate || route.query.endDate || '')
    : ''

  const bookingMeta = bookingType === 'hotel'
    ? {
      checkInDate: startDate,
      checkOutDate: endDate,
      guests: quantity,
      rooms: Math.max(1, Number(route.query.rooms || 1) || 1),
      durationLabel: String(route.query.durationLabel || ''),
      unitPrice: Number(route.query.unitPrice || service.salePrice || 0)
    }
    : bookingType === 'ticket'
      ? {
        useDate: startDate,
        ticketQuantity: quantity,
        durationLabel: String(route.query.durationLabel || ''),
        unitPrice: Number(route.query.unitPrice || service.salePrice || 0)
      }
      : bookingType === 'tour'
        ? {
          departureDate: startDate,
          departureId: String(route.query.departureId || ''),
          travelers: quantity,
          durationLabel: String(route.query.durationLabel || ''),
          unitPrice: Number(route.query.unitPrice || service.salePrice || 0)
        }
        : {
          applyDate: startDate,
          packageId: String(route.query.packageId || ''),
          departureId: String(route.query.departureId || ''),
          travelers: quantity,
          durationLabel: String(route.query.durationLabel || ''),
          unitPrice: Number(route.query.unitPrice || service.salePrice || 0)
        }

  const durationSuffix = bookingMeta.durationLabel ? ` · ${bookingMeta.durationLabel}` : ''

  const bookingSummary = bookingType === 'hotel'
    ? `${bookingMeta.checkInDate || 'Chưa chọn ngày'} - ${bookingMeta.checkOutDate || 'Chưa chọn ngày'}${durationSuffix} · ${bookingMeta.guests} khách · ${bookingMeta.rooms} phòng`
    : bookingType === 'ticket'
      ? `${bookingMeta.useDate || 'Chưa chọn ngày'}${durationSuffix} · ${bookingMeta.ticketQuantity} vé`
      : bookingType === 'tour'
        ? `Khởi hành ${bookingMeta.departureDate || 'Chưa chọn ngày'}${durationSuffix} · ${bookingMeta.travelers} người`
        : `Áp dụng ${bookingMeta.applyDate || 'Chưa chọn ngày'}${durationSuffix} · ${bookingMeta.travelers} người`

  return {
    serviceId,
    bookingType,
    bookingMeta,
    service,
    quantity,
    startDate,
    endDate,
    travelDate: startDate,
    bookingSummary,
    identityKey: `direct-${serviceId}-${startDate}-${endDate}-${quantity}`,
    lineTotal: (Number(bookingMeta.unitPrice || 0) || Number(service.salePrice || 0) || 0) * quantity
  }
})
const checkoutItems = computed(() => {
  if (isDirectCheckout.value) {
    return directCheckoutItem.value ? [directCheckoutItem.value] : []
  }
  return cartItems.value
})
const subtotal = computed(() =>
  checkoutItems.value.reduce((acc, item) => acc + (item.lineTotal || 0), 0)
)
const discount = computed(() => isDirectCheckout.value ? 0 : cartStore.calculatePromotionDiscount(subtotal.value))
const serviceFee = computed(() => (subtotal.value > 0 ? 50000 : 0))
const total = computed(() => Math.max(0, subtotal.value - discount.value + serviceFee.value))
const getSlotValidationError = (item) => {
  const bookingType = item.bookingType || item.service?.categoryId || ''
  const bookingMeta = item.bookingMeta || {}

  if (bookingType === 'tour') {
    const departureId = bookingMeta.departureId
    if (!departureId) return 'Tour chưa chọn lịch khởi hành hợp lệ.'
    const departure = (item.service?.departures || []).find((entry) => entry.departureId === departureId)
    if (!departure) return 'Lịch khởi hành tour không còn khả dụng.'
    const remaining = Number(departure.remainingSlots || 0)
    if (remaining < item.quantity) {
      return `Lịch tour chỉ còn ${remaining} chỗ, không đủ cho ${item.quantity} khách.`
    }
  }

  if (bookingType === 'combo' && item.service?.isFixedSchedule !== false) {
    const packageId = bookingMeta.packageId
    if (!packageId) return 'Combo chưa chọn gói áp dụng hợp lệ.'
    const pkg = (item.service?.packages || []).find((entry) => entry.packageId === packageId)
    if (!pkg) return 'Gói combo đã hết hoặc không còn hiệu lực.'
    const remaining = Number(pkg.remainingSlots || 0)
    if (remaining < item.quantity) {
      return `Gói combo chỉ còn ${remaining} suất, không đủ cho ${item.quantity} khách.`
    }
  }

  return ''
}

const slotValidationMessage = computed(() =>
  checkoutItems.value.map((item) => getSlotValidationError(item)).find(Boolean) || ''
)
const hasInvalidCartItems = computed(() =>
  checkoutItems.value.some((item) => {
    return isDateSelectionInvalid({
      startDate: item.startDate,
      endDate: item.endDate,
      service: item.service
    })
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
  if (isDirectCheckout.value && !directCheckoutItem.value) {
    errors.fullName = ''
    errors.email = ''
    errors.phone = ''
    errors.city = ''
    errors.cart = 'Không tìm thấy dịch vụ đặt ngay. Vui lòng quay lại trang chi tiết và thử lại.'
    return false
  }

  errors.fullName = form.fullName ? '' : 'Vui lòng nhập họ tên.'
  errors.email = /.+@.+\..+/.test(form.email) ? '' : 'Email không hợp lệ.'
  errors.phone = /^0\d{9,10}$/.test(form.phone) ? '' : 'Số điện thoại phải bắt đầu bằng 0 và có 10-11 số.'
  errors.city = form.city ? '' : 'Vui lòng chọn tỉnh/thành.'
  errors.cart = hasInvalidCartItems.value
    ? 'Giỏ hàng còn dịch vụ thiếu ngày hợp lệ. Vui lòng quay lại giỏ để chỉnh sửa.'
    : slotValidationMessage.value

  return !errors.fullName && !errors.email && !errors.phone && !errors.city && !errors.cart
}

const handleCheckout = () => {
  if (!checkoutItems.value.length) {
    errors.cart = isDirectCheckout.value
      ? 'Không tìm thấy dịch vụ đặt ngay. Vui lòng quay lại trang chi tiết và thử lại.'
      : 'Giỏ hàng đang trống.'
    return
  }
  if (!validate()) return

  const booking = bookingStore.createBooking({
    customer: { ...form },
    items: checkoutItems.value,
    subtotal: subtotal.value,
    discount: discount.value,
    serviceFee: serviceFee.value,
    total: total.value,
    promotion: isDirectCheckout.value ? null : cartStore.appliedPromotion,
    clearCartAfterBooking: !isDirectCheckout.value,
    clearPromotionAfterBooking: !isDirectCheckout.value
  })

  if (!isDirectCheckout.value) {
    cartStore.clearAppliedPromotion()
    cartStore.clearCart()
  }

  router.push({ name: 'booking-success', query: { code: booking.code } })
}

onMounted(() => {
  if (authStore.currentUser) {
    const user = authStore.currentUser
    form.fullName = user.fullName || ''
    form.email = user.email || ''
    form.phone = user.phone || ''
    form.address = user.address || ''
  }
})
</script>