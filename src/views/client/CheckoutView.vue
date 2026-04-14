<template>
  <section class="page-section checkout-page">
    <div class="checkout-main">
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Xác nhận đặt chỗ</p>
          <h1>Hoàn tất thông tin khách hàng và chuyến đi</h1>
        </div>
      </div>

      <form class="checkout-form" @submit.prevent="handleCheckout">
        <div class="checkout-intro-panel">
          <div>
            <p class="eyebrow eyebrow--blue">Thanh toán an toàn</p>
            <h2>Điền thông tin một lần, xác nhận ngay.</h2>
          </div>
          <p class="muted">Điền đầy đủ thông tin để chúng tôi có thể liên hệ xác nhận booking và hỗ trợ bạn tốt nhất. Bạn có thể chọn thanh toán khi xác nhận booking hoặc chuyển khoản qua VietQR để tiết kiệm thời gian.</p>
        </div>

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

        <div class="field-group">
          <label>Phương thức thanh toán</label>
          <div class="payment-methods">
            <label class="payment-option" :class="{ active: form.paymentMethod === 'cash' }">
              <input v-model="form.paymentMethod" type="radio" value="cash" />
              <span>
                <strong>Thanh toán khi xác nhận booking</strong>
              </span>
            </label>
            <label class="payment-option" :class="{ active: form.paymentMethod === 'bank-transfer' }">
              <input v-model="form.paymentMethod" type="radio" value="bank-transfer" />
              <span>
                <strong>Chuyển khoản VietQR</strong>
              </span>
            </label>
          </div>
        </div>

        <div class="field-group">
          <label>Mã khuyến mãi</label>
          <p class="muted" style="font-size: 0.9rem; margin-bottom: 14px; margin-top: -8px;">Chọn hoặc nhập mã khuyến mãi để tiết kiệm</p>
          
          <div v-if="availablePromotions.length" class="promotions-list">
            <div
              v-for="promo in availablePromotions"
              :key="promo.code"
              class="promotion-card"
              :class="{ active: appliedPromotion?.code === promo.code }"
              @click="selectPromotion(promo)"
            >
              <div class="promo-badge">
                <span v-if="promo.type === 'percentage' || promo.type === 'percent'">-{{ promo.value }}%</span>
                <span v-else>{{ formatCurrencyVND(promo.value) }}</span>
              </div>
              <div class="promo-info">
                <p class="promo-code">{{ promo.code }}</p>
                <p class="promo-desc">{{ promo.description }}</p>
              </div>
            </div>
          </div>

          <div v-if="appliedPromotion" class="applied-promo-tag">
            ✓ Đã chọn: <strong>{{ appliedPromotion.code }}</strong>
            <button type="button" @click="clearPromotion" class="clear-promo-btn">Xóa</button>
          </div>

          <div class="custom-voucher-row">
            <input
              v-model="customVoucherCode"
              type="text"
              placeholder="Hoặc nhập mã khác..."
              @keyup.enter="handleApplyCustomVoucher"
            />
            <button class="secondary-button" type="button" @click="handleApplyCustomVoucher">Áp dụng</button>
          </div>
          <small v-if="voucherFeedback" :class="voucherSuccess ? 'success-text' : 'error-text'">{{ voucherFeedback }}</small>
        </div>      </form>
    </div>

    <aside class="summary-card checkout-summary-card sticky-card">
      <div class="checkout-summary-header">
        <p class="eyebrow">Đơn hàng của bạn</p>
        <h2>Kiểm tra trước khi xác nhận</h2>
      </div>

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

    <div v-if="paymentOverlayVisible" class="checkout-modal-backdrop" @click.self="closePaymentOverlay">
      <div class="checkout-modal-card" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
        <template v-if="showPaymentQr">
          <p class="eyebrow eyebrow--blue">Thanh toán VietQR</p>
          <h2 id="payment-modal-title">Quét mã để thanh toán</h2>
          <p class="muted">Mã QR đã được điền sẵn số tiền và nội dung chuyển khoản.</p>

          <div class="checkout-qr-meta">
            <div>
              <span>Ngân hàng</span>
              <strong>{{ bankTransfer.bankName }}</strong>
            </div>
            <div>
              <span>Số tài khoản</span>
              <strong>{{ bankTransfer.accountNumber }}</strong>
            </div>
            <div>
              <span>Chủ tài khoản</span>
              <strong>{{ bankTransfer.accountName }}</strong>
            </div>
            <div>
              <span>Số tiền</span>
              <strong>{{ formatCurrencyVND(total) }}</strong>
            </div>
          </div>

          <div class="checkout-qr-image">
            <img :src="vietQrImage" alt="VietQR thanh toán" />
          </div>

          <div class="checkout-transfer-note">
            <span>Nội dung chuyển khoản</span>
            <strong>{{ bankTransfer.transferContent }}</strong>
          </div>

          <div class="checkout-modal-actions">
            <button class="secondary-button" type="button" @click="copyPaymentField(bankTransfer.accountNumber)">Copy STK</button>
            <button class="secondary-button" type="button" @click="copyPaymentField(bankTransfer.transferContent)">Copy nội dung CK</button>
          </div>

          <small v-if="paymentFeedback" class="success-text">{{ paymentFeedback }}</small>

          <small class="muted">Sau khoảng 30 giây hệ thống sẽ tự chuyển sang hóa đơn.</small>
        </template>

        <template v-else>
          <p class="eyebrow">Hóa đơn</p>
          <h2>Đang tạo hóa đơn cho bạn...</h2>
          <p class="muted">Vui lòng chờ trong giây lát.</p>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useBookingStore } from '@/stores/booking/useBookingStore'
import { useCheckoutStore } from '@/stores/checkout/useCheckoutStore'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { isDateSelectionInvalid } from '@/utils/bookingRules'
import { resolveItemMaxSlots } from '@/utils/travelCart'
import { formatCurrencyVND, formatDateRangeVN } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const bookingStore = useBookingStore()
const checkoutStore = useCheckoutStore()
const serviceStore = useServiceStore()
const destinations = computed(() => serviceStore.destinations)

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
  const requestedQuantity = bookingType === 'ticket'
    ? Math.max(1, Number(route.query.totalGuests || route.query.quantity || route.query.ticketQuantity) || 1)
    : Math.max(1, Number(route.query.totalGuests || route.query.travelers || route.query.guests || route.query.quantity) || 1)

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
      guests: requestedQuantity,
      adults: Math.max(1, Number(route.query.adults || Math.max(1, requestedQuantity - Number(route.query.children || 0))) || 1),
      children: Math.max(0, Number(route.query.children || 0) || 0),
      childrenAges: String(route.query.childrenAges || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => Math.min(17, Math.max(0, Number(item) || 8))),
      rooms: Math.max(1, Number(route.query.rooms || 1) || 1),
      roomType: String(route.query.roomType || ''),
      roomTypeLabel: String(route.query.roomTypeLabel || ''),
      nights: Math.max(1, Number(route.query.nights || 1) || 1),
      chargeableAdults: Math.max(1, Number(route.query.chargeableAdults || route.query.adults || 1) || 1),
      childrenUnderFour: Math.max(0, Number(route.query.childrenUnderFour || 0) || 0),
      children4To14: Math.max(0, Number(route.query.children4To14 || 0) || 0),
      childSurchargeMin: Math.max(500000, Number(route.query.childSurchargeMin || 500000) || 500000),
      childSurchargeMax: Math.min(1000000, Math.max(500000, Number(route.query.childSurchargeMax || 700000) || 700000)),
      totalPrice: Math.max(0, Number(route.query.totalPrice || 0) || 0),
      durationLabel: String(route.query.durationLabel || ''),
      unitPrice: Number(route.query.unitPrice || service.salePrice || 0)
    }
    : bookingType === 'ticket'
      ? {
        useDate: startDate,
        adults: Math.max(1, Number(route.query.adults || route.query.ticketQuantity || requestedQuantity) || 1),
        children: Math.max(0, Number(route.query.children || 0) || 0),
        childrenAges: String(route.query.childrenAges || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => Math.min(17, Math.max(1, Number(item) || 8))),
        totalGuests: Math.max(1, Number(route.query.totalGuests || requestedQuantity) || 1),
        ticketQuantity: Math.max(1, Number(route.query.ticketQuantity || route.query.chargeableAdults || requestedQuantity) || 1),
        freeChildren: Math.max(0, Number(route.query.freeChildren || 0) || 0),
        childSurchargeCount: Math.max(0, Number(route.query.childSurchargeCount || 0) || 0),
        childSurchargeUnit: Math.max(0, Number(route.query.childSurchargeUnit || 0) || 0),
        childSurchargeTotal: Math.max(0, Number(route.query.childSurchargeTotal || 0) || 0),
        totalPrice: Math.max(0, Number(route.query.totalPrice || 0) || 0),
        durationLabel: String(route.query.durationLabel || ''),
        unitPrice: Number(route.query.unitPrice || service.salePrice || 0)
      }
      : bookingType === 'tour'
        ? {
          departureDate: startDate,
          departureId: String(route.query.departureId || ''),
          endDate: String(route.query.endDate || ''),
          scheduleMode: String(route.query.scheduleMode || 'fixed'),
          adults: Math.max(1, Number(route.query.adults || requestedQuantity) || 1),
          children: Math.max(0, Number(route.query.children || 0) || 0),
          childrenAges: String(route.query.childrenAges || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => Math.min(17, Math.max(1, Number(item) || 8))),
          totalGuests: Math.max(1, Number(route.query.totalGuests || requestedQuantity) || 1),
          travelers: Math.max(1, Number(route.query.totalGuests || route.query.travelers || requestedQuantity) || 1),
          freeChildren: Math.max(0, Number(route.query.freeChildren || 0) || 0),
          childDiscountRate: Math.max(0, Math.min(1, Number(route.query.childDiscountRate || 0.75) || 0.75)),
          childChargedAsAdultCount: Math.max(0, Number(route.query.childChargedAsAdultCount || 0) || 0),
          totalPrice: Math.max(0, Number(route.query.totalPrice || 0) || 0),
          durationLabel: String(route.query.durationLabel || ''),
          unitPrice: Number(route.query.unitPrice || service.salePrice || 0)
        }
        : {
          applyDate: startDate,
          packageId: String(route.query.packageId || ''),
          departureId: String(route.query.departureId || ''),
          travelers: requestedQuantity,
          durationLabel: String(route.query.durationLabel || ''),
          unitPrice: Number(route.query.unitPrice || service.salePrice || 0)
        }

  const effectiveMaxSlots = resolveItemMaxSlots(service, {
    serviceId,
    bookingType,
    bookingMeta
  })
  const quantity = Math.max(1, Math.min(requestedQuantity, Math.max(1, Number(effectiveMaxSlots || 1))))

  if (bookingType === 'hotel') {
    bookingMeta.guests = quantity
  }
  if (bookingType === 'ticket') {
    bookingMeta.totalGuests = quantity
    bookingMeta.ticketQuantity = Math.min(bookingMeta.ticketQuantity || quantity, quantity)
  }
  if (bookingType === 'tour') {
    bookingMeta.totalGuests = quantity
    bookingMeta.travelers = quantity
  }

  const durationSuffix = bookingMeta.durationLabel ? ` · ${bookingMeta.durationLabel}` : ''

  const bookingSummary = bookingType === 'hotel'
    ? `${bookingMeta.checkInDate || 'Chưa chọn ngày'} - ${bookingMeta.checkOutDate || 'Chưa chọn ngày'}${durationSuffix} · ${bookingMeta.adults} người lớn · ${bookingMeta.children} trẻ em · ${bookingMeta.rooms} phòng${bookingMeta.roomTypeLabel ? ` · ${bookingMeta.roomTypeLabel}` : bookingMeta.roomType ? ` · ${bookingMeta.roomType}` : ''}`
    : bookingType === 'ticket'
      ? `${bookingMeta.useDate || 'Chưa chọn ngày'}${durationSuffix} · ${bookingMeta.adults || 1} người lớn · ${bookingMeta.children || 0} trẻ em · ${bookingMeta.ticketQuantity || 1} vé tính phí`
      : bookingType === 'tour'
        ? `${bookingMeta.scheduleMode === 'flexible' ? 'Linh hoạt' : 'Khởi hành'} ${bookingMeta.departureDate || 'Chưa chọn ngày'}${bookingMeta.scheduleMode === 'flexible' ? ` - ${bookingMeta.endDate || 'Chưa chọn ngày'}` : ''}${durationSuffix} · ${bookingMeta.adults || 1} người lớn · ${bookingMeta.children || 0} trẻ em`
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
    lineTotal: Number(bookingMeta.totalPrice || 0) > 0
      ? Number(bookingMeta.totalPrice)
      : (Number(bookingMeta.unitPrice || 0) || Number(service.salePrice || 0) || 0) * quantity
  }
})
const checkoutItems = computed(() => {
  return directCheckoutItem.value ? [directCheckoutItem.value] : []
})
const subtotal = computed(() =>
  checkoutItems.value.reduce((acc, item) => acc + (item.lineTotal || 0), 0)
)
const discount = computed(() => checkoutStore.calculatePromotionDiscount(subtotal.value))
const serviceFee = computed(() => (subtotal.value > 0 ? 50000 : 0))
const total = computed(() => Math.max(0, subtotal.value - discount.value + serviceFee.value))
const getSlotValidationError = (item) => {
  const bookingType = item.bookingType || item.service?.categoryId || ''
  const bookingMeta = item.bookingMeta || {}

  if (bookingType !== 'tour') {
    const maxSlots = resolveItemMaxSlots(item.service, item)
    if (Number(maxSlots || 0) < item.quantity) {
      return `Dịch vụ chỉ còn ${Math.max(0, Number(maxSlots || 0))} chỗ, không đủ cho ${item.quantity} khách.`
    }
    return ''
  }

  if (bookingType === 'tour') {
    const scheduleMode = String(bookingMeta.scheduleMode || 'fixed')
    if (scheduleMode === 'flexible') {
      if (!bookingMeta.departureDate || !bookingMeta.endDate) {
        return 'Tour linh hoạt cần có ngày bắt đầu và ngày kết thúc.'
      }
      if (new Date(bookingMeta.endDate) < new Date(bookingMeta.departureDate)) {
        return 'Khoảng ngày tour linh hoạt không hợp lệ.'
      }
      if (item.service?.flexibleWindow?.startDate && bookingMeta.departureDate < item.service.flexibleWindow.startDate) {
        return `Tour linh hoạt chỉ nhận từ ${item.service.flexibleWindow.startDate}.`
      }
      if (item.service?.flexibleWindow?.endDate && bookingMeta.endDate > item.service.flexibleWindow.endDate) {
        return `Tour linh hoạt chỉ nhận đến ${item.service.flexibleWindow.endDate}.`
      }
      return ''
    }

    const departureId = bookingMeta.departureId
    if (!departureId) return 'Tour chưa chọn lịch khởi hành hợp lệ.'
    const departure = (item.service?.departures || []).find((entry) => entry.departureId === departureId)
    if (!departure) return 'Lịch khởi hành tour không còn khả dụng.'
    const remaining = Number(departure.remainingSlots || 0)
    if (remaining < item.quantity) {
      return `Lịch tour chỉ còn ${remaining} chỗ, không đủ cho ${item.quantity} khách.`
    }
  }

  return ''
}

const slotValidationMessage = computed(() =>
  checkoutItems.value.map((item) => getSlotValidationError(item)).find(Boolean) || ''
)
const hasInvalidCheckoutItems = computed(() =>
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
  note: '',
  paymentMethod: 'cash'
})

const errors = reactive({
  fullName: '',
  email: '',
  phone: '',
  city: '',
  cart: ''
})

// Voucher/promotion state
const availablePromotions = ref([])
const appliedPromotion = computed(() => checkoutStore.appliedPromotion)
const customVoucherCode = ref('')
const voucherFeedback = ref('')
const voucherSuccess = ref(false)
const paymentFeedback = ref('')
const paymentOverlayVisible = ref(false)
const showPaymentQr = ref(false)
const activeBooking = ref(null)
const paymentTimerIds = {
  qr: null,
  invoice: null
}

const PAYMENT_QR_DELAY_MS = 2000
const CASH_INVOICE_DELAY_MS = 2000
const PAYMENT_INVOICE_DELAY_MS = 30000

const bankTransfer = computed(() => {
  const bookingCode = String(activeBooking.value?.code || 'VV-PENDING').trim().toUpperCase()
  const amount = Math.round(Number(total.value || 0))

  return {
    bankName: 'MB Bank',
    bankCode: 'MB',
    accountNumber: '0817367121',
    accountName: 'Nguyên Quốc Khánh',
    transferContent: `VTRAVEL ${bookingCode} ${amount}`
  }
})

const vietQrImage = computed(() => {
  const amount = Math.round(Number(total.value || 0))
  const query = new URLSearchParams({
    amount: String(amount),
    addInfo: bankTransfer.value.transferContent,
    accountName: bankTransfer.value.accountName
  })

  return `https://img.vietqr.io/image/${bankTransfer.value.bankCode}-${bankTransfer.value.accountNumber}-compact2.png?${query.toString()}`
})

const clearPaymentTimers = () => {
  if (paymentTimerIds.qr) {
    window.clearTimeout(paymentTimerIds.qr)
    paymentTimerIds.qr = null
  }

  if (paymentTimerIds.invoice) {
    window.clearTimeout(paymentTimerIds.invoice)
    paymentTimerIds.invoice = null
  }
}

const closePaymentOverlay = () => {
  clearPaymentTimers()
  paymentOverlayVisible.value = false
  showPaymentQr.value = false
  activeBooking.value = null
}

const startPaymentFlow = (booking) => {
  clearPaymentTimers()
  activeBooking.value = booking

  if (form.paymentMethod !== 'bank-transfer') {
    paymentTimerIds.invoice = window.setTimeout(() => {
      router.push({ name: 'booking-success', query: { code: booking.code } })
    }, CASH_INVOICE_DELAY_MS)
    return
  }

  paymentOverlayVisible.value = true
  showPaymentQr.value = false

  paymentTimerIds.qr = window.setTimeout(() => {
    if (!paymentOverlayVisible.value) return
    showPaymentQr.value = form.paymentMethod === 'bank-transfer'
  }, PAYMENT_QR_DELAY_MS)

  paymentTimerIds.invoice = window.setTimeout(() => {
    if (!paymentOverlayVisible.value) return
    closePaymentOverlay()
    router.push({ name: 'booking-success', query: { code: booking.code } })
  }, PAYMENT_INVOICE_DELAY_MS)
}

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
  errors.cart = hasInvalidCheckoutItems.value
    ? 'Thông tin dịch vụ chưa đủ ngày hợp lệ. Vui lòng quay lại trang chi tiết để chỉnh sửa.'
    : slotValidationMessage.value

  return !errors.fullName && !errors.email && !errors.phone && !errors.city && !errors.cart
}

const handleCheckout = () => {
  if (!checkoutItems.value.length) {
    errors.cart = 'Không tìm thấy dịch vụ đặt ngay. Vui lòng quay lại trang chi tiết và thử lại.'
    return
  }
  if (!validate()) return

  const promotionValidation = checkoutStore.validateAppliedPromotion(subtotal.value)
  if (!promotionValidation.valid) {
    errors.cart = promotionValidation.message
    return
  }

  const booking = bookingStore.createBooking({
    customer: {
      ...form,
      paymentMethod: form.paymentMethod,
      paymentMethodLabel: form.paymentMethod === 'bank-transfer' ? 'Chuyển khoản VietQR' : 'Thanh toán khi xác nhận booking'
    },
    items: checkoutItems.value,
    subtotal: subtotal.value,
    discount: discount.value,
    serviceFee: serviceFee.value,
    total: total.value,
    promotion: appliedPromotion.value
  })

  checkoutStore.clearAppliedPromotion()

  startPaymentFlow(booking)
}

const copyPaymentField = async (value) => {
  try {
    await navigator.clipboard.writeText(String(value || ''))
    paymentFeedback.value = 'Đã sao chép thông tin thanh toán.'
    window.setTimeout(() => {
      paymentFeedback.value = ''
    }, 2000)
  } catch (error) {
    paymentFeedback.value = 'Không thể sao chép tự động, vui lòng sao chép thủ công.'
  }
}

const loadAvailablePromotions = async () => {
  try {
    const promotions = await checkoutStore.loadAvailablePromotions()
    const now = Date.now()
    const active = Array.isArray(promotions)
      ? promotions.filter((promotion) => {
        const startTime = promotion.startDate ? new Date(`${promotion.startDate}T00:00:00.000`).getTime() : null
        const endTime = promotion.endDate ? new Date(`${promotion.endDate}T23:59:59.999`).getTime() : null
        const isActiveByDate = (!startTime || now >= startTime) && (!endTime || now <= endTime)
        return promotion.status === 'active' && isActiveByDate
      })
      : []

    availablePromotions.value = active
      .sort((a, b) => {
        const aDiscount = a.type === 'percentage' || a.type === 'percent' ? a.value : a.value / 100000
        const bDiscount = b.type === 'percentage' || b.type === 'percent' ? b.value : b.value / 100000
        return bDiscount - aDiscount
      })
      .slice(0, 5)
  } catch (error) {
    console.error('Failed to load promotions:', error)
  }
}

const selectPromotion = async (promo) => {
  const result = await checkoutStore.applyPromotionCode(promo.code, subtotal.value)
  voucherSuccess.value = Boolean(result.success)
  voucherFeedback.value = result.success
    ? `Áp dụng thành công mã ${promo.code}`
    : (result.message || 'Không thể áp dụng mã khuyến mãi.')
  customVoucherCode.value = ''
}

const clearPromotion = () => {
  checkoutStore.clearAppliedPromotion()
  customVoucherCode.value = ''
  voucherFeedback.value = ''
  voucherSuccess.value = false
}

const handleApplyCustomVoucher = async () => {
  voucherFeedback.value = ''
  
  if (!customVoucherCode.value.trim()) {
    checkoutStore.clearAppliedPromotion()
    return
  }

  const result = await checkoutStore.applyPromotionCode(customVoucherCode.value, subtotal.value)
  if (result.success) {
    customVoucherCode.value = ''
    voucherFeedback.value = `Áp dụng thành công mã ${result.promotion?.code || ''}`
    voucherSuccess.value = true
    return
  }

  voucherSuccess.value = false
  voucherFeedback.value = result.message || 'Lỗi khi áp dụng mã khuyến mãi'
}

onMounted(() => {
  if (authStore.currentUser) {
    const user = authStore.currentUser
    form.fullName = user.fullName || ''
    form.email = user.email || ''
    form.phone = user.phone || ''
    form.address = user.address || ''
  }

  loadAvailablePromotions()
})

onBeforeUnmount(() => {
  clearPaymentTimers()
})
</script>

<style scoped>
.checkout-page {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 410px);
  gap: 28px;
  align-items: start;
}

.checkout-main {
  display: grid;
  gap: 18px;
}

.checkout-form {
  display: grid;
  gap: 18px;
  padding: 24px;
  border-radius: 28px;
  border: 1px solid rgba(10, 109, 217, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 248, 253, 0.96) 100%),
    radial-gradient(circle at top right, rgba(10, 109, 217, 0.08), transparent 34%);
  box-shadow: 0 18px 40px rgba(20, 45, 84, 0.08);
}

.checkout-intro-panel {
  display: grid;
  gap: 6px;
  padding: 18px 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(10, 109, 217, 0.08), rgba(255, 122, 26, 0.08));
  border: 1px solid rgba(10, 109, 217, 0.12);
}

.checkout-intro-panel h2,
.checkout-summary-header h2 {
  margin: 0;
  font-size: 1.18rem;
  line-height: 1.3;
}

.checkout-summary-card {
  padding: 22px;
  border-radius: 28px;
  border: 1px solid rgba(24, 45, 75, 0.08);
  background: linear-gradient(180deg, #ffffff 0%, #f7faff 100%);
  box-shadow: 0 18px 40px rgba(20, 45, 84, 0.08);
}

.checkout-summary-header {
  display: grid;
  gap: 4px;
  margin-bottom: 6px;
}

.checkout-summary-card .mini-booking-item {
  display: grid;
  gap: 4px;
  padding: 14px 0;
}

.checkout-summary-card .mini-booking-item strong {
  font-size: 0.98rem;
}

.checkout-summary-card .mini-booking-item span {
  color: var(--primary);
  font-weight: 700;
}

.checkout-summary-card .summary-row {
  padding: 12px 0;
}

.checkout-summary-card .summary-row--total {
  padding-top: 14px;
  margin-top: 4px;
  border-top: 1px solid rgba(24, 45, 75, 0.1);
}

.checkout-summary-card .primary-button {
  min-height: 52px;
  border-radius: 16px;
  box-shadow: 0 12px 24px rgba(10, 109, 217, 0.18);
}

.field-group {
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(24, 45, 75, 0.08);
  background: rgba(255, 255, 255, 0.9);
}

.form-grid {
  gap: 16px;
  margin-bottom: 0;
}

.field-group input,
.field-group select,
.checkout-form input,
.checkout-form select,
.checkout-form textarea {
  border-radius: 14px;
  border: 1px solid rgba(24, 45, 75, 0.14);
}

.payment-methods {
  display: grid;
  gap: 10px;
}

.payment-option {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(24, 45, 75, 0.12);
  border-radius: 14px;
  background: linear-gradient(180deg, #fff 0%, #f8fbff 100%);
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.payment-option.active {
  border-color: rgba(10, 109, 217, 0.45);
  box-shadow: 0 10px 22px rgba(10, 109, 217, 0.08);
}

.payment-option:hover {
  border-color: rgba(10, 109, 217, 0.35);
  box-shadow: 0 8px 18px rgba(10, 109, 217, 0.08);
  transform: translateY(-1px);
}

.payment-option input:checked + span {
  color: var(--primary);
}

.payment-option input[type='radio'] {
  width: 18px;
  height: 18px;
  margin: 0;
  padding: 0;
  flex: 0 0 auto;
  accent-color: #0a66c2;
  border: none;
  box-shadow: none;
}

.payment-option span {
  display: inline-block;
  line-height: 1.35;
}

.bank-transfer-box {
  margin-top: 12px;
  border: 1px solid rgba(10, 109, 217, 0.16);
  border-radius: 18px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(10, 109, 217, 0.06), rgba(255, 255, 255, 1));
}

.bank-transfer-box p {
  margin: 0 0 6px;
}

.payment-copy-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.payment-copy-actions .secondary-button,
.custom-voucher-row .secondary-button {
  min-height: 44px;
  border-radius: 12px;
}

.checkout-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(7, 17, 36, 0.58);
  backdrop-filter: blur(8px);
}

.checkout-modal-card {
  width: min(520px, 100%);
  display: grid;
  gap: 16px;
  padding: 24px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 249, 255, 0.98) 100%);
  box-shadow: 0 30px 70px rgba(7, 17, 36, 0.28);
}

.checkout-modal-card h2 {
  margin: 0;
}

.checkout-qr-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.checkout-qr-meta div,
.checkout-transfer-note {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(24, 45, 75, 0.1);
  background: rgba(255, 255, 255, 0.92);
}

.checkout-qr-meta span,
.checkout-transfer-note span {
  display: block;
  margin-bottom: 4px;
  font-size: 0.85rem;
  color: var(--muted);
}

.checkout-qr-meta strong,
.checkout-transfer-note strong {
  display: block;
  font-size: 1rem;
  line-height: 1.35;
}

.checkout-qr-image {
  display: grid;
  place-items: center;
  padding: 18px;
  border-radius: 24px;
  background: radial-gradient(circle at top, rgba(10, 109, 217, 0.1), rgba(255, 255, 255, 0.98) 60%);
  border: 1px solid rgba(10, 109, 217, 0.12);
}

.checkout-qr-image img {
  width: min(100%, 260px);
  aspect-ratio: 1;
  border-radius: 20px;
  background: #fff;
  padding: 10px;
  object-fit: contain;
  box-shadow: 0 10px 24px rgba(24, 45, 75, 0.12);
}

.checkout-modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.promotions-list {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.promotion-card {
  border-radius: 16px;
}

.promo-badge {
  border-radius: 12px;
  font-size: 0.88rem;
}

.custom-voucher-row {
  border-radius: 16px;
  background: rgba(10, 109, 217, 0.04);
}

.mini-booking-item {
  display: grid;
  gap: 5px;
}

.mini-booking-item strong {
  font-size: 0.98rem;
}

.mini-booking-item span {
  color: var(--primary);
  font-weight: 700;
}

.summary-row {
  align-items: baseline;
}

.summary-row span {
  color: var(--muted);
}

@media (max-width: 1180px) {
  .checkout-page {
    grid-template-columns: 1fr;
  }

  .checkout-summary-card {
    position: static;
    top: auto;
  }
}

@media (max-width: 720px) {
  .checkout-form,
  .checkout-summary-card {
    padding: 18px;
    border-radius: 22px;
  }

  .field-group {
    padding: 14px;
  }

  .promotions-list {
    grid-template-columns: 1fr;
  }

  .checkout-summary-card .primary-button {
    min-height: 48px;
  }

  .checkout-modal-card {
    padding: 18px;
    border-radius: 22px;
  }

  .checkout-qr-meta {
    grid-template-columns: 1fr;
  }

  .checkout-modal-actions {
    flex-direction: column;
  }
}
</style>