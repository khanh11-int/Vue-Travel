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
import { computed, reactive, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { promotionsApi } from '@/services/api'
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
    ? Math.max(1, Math.min(Number(route.query.totalGuests || route.query.quantity || route.query.ticketQuantity) || 1, service.availableSlots || 1))
    : Math.max(1, Math.min(Number(route.query.totalGuests || route.query.travelers || route.query.guests || route.query.quantity) || 1, service.availableSlots || 1))

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
      adults: Math.max(1, Number(route.query.adults || Math.max(1, quantity - Number(route.query.children || 0))) || 1),
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
        adults: Math.max(1, Number(route.query.adults || route.query.ticketQuantity || quantity) || 1),
        children: Math.max(0, Number(route.query.children || 0) || 0),
        childrenAges: String(route.query.childrenAges || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => Math.min(17, Math.max(1, Number(item) || 8))),
        totalGuests: Math.max(1, Number(route.query.totalGuests || quantity) || 1),
        ticketQuantity: Math.max(1, Number(route.query.ticketQuantity || route.query.chargeableAdults || quantity) || 1),
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
          adults: Math.max(1, Number(route.query.adults || quantity) || 1),
          children: Math.max(0, Number(route.query.children || 0) || 0),
          childrenAges: String(route.query.childrenAges || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => Math.min(17, Math.max(1, Number(item) || 8))),
          totalGuests: Math.max(1, Number(route.query.totalGuests || quantity) || 1),
          travelers: Math.max(1, Number(route.query.totalGuests || route.query.travelers || quantity) || 1),
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
          travelers: quantity,
          durationLabel: String(route.query.durationLabel || ''),
          unitPrice: Number(route.query.unitPrice || service.salePrice || 0)
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
  if (isDirectCheckout.value) {
    return directCheckoutItem.value ? [directCheckoutItem.value] : []
  }
  return cartItems.value
})
const subtotal = computed(() =>
  checkoutItems.value.reduce((acc, item) => acc + (item.lineTotal || 0), 0)
)
const discount = computed(() => {
  if (!appliedPromotion.value) return 0
  const { type, value } = appliedPromotion.value
  if (type === 'percentage' || type === 'percent') {
    return Math.round((subtotal.value * value) / 100)
  }
  return Math.min(subtotal.value, value || 0)
})
const serviceFee = computed(() => (subtotal.value > 0 ? 50000 : 0))
const total = computed(() => Math.max(0, subtotal.value - discount.value + serviceFee.value))
const getSlotValidationError = (item) => {
  const bookingType = item.bookingType || item.service?.categoryId || ''
  const bookingMeta = item.bookingMeta || {}

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

// Voucher/promotion state
const availablePromotions = ref([])
const appliedPromotion = ref(null)
const customVoucherCode = ref('')
const voucherFeedback = ref('')
const voucherSuccess = ref(false)

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
    promotion: appliedPromotion.value,
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
  
  loadAvailablePromotions()
})

const loadAvailablePromotions = async () => {
  try {
    let promotions = Array.isArray(serviceStore.promotions) ? serviceStore.promotions : []
    
    if (!promotions.length) {
      promotions = await promotionsApi.getAll()
      if (Array.isArray(promotions)) {
        serviceStore.promotions = promotions
      }
    }
    
    // Lọc các promotion active và sắp xếp theo discount cao nhất, lấy top 5
    const active = Array.isArray(promotions)
      ? promotions.filter((p) => p.status === 'active')
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

const selectPromotion = (promo) => {
  appliedPromotion.value = promo
  customVoucherCode.value = ''
  voucherFeedback.value = ''
}

const clearPromotion = () => {
  appliedPromotion.value = null
  customVoucherCode.value = ''
  voucherFeedback.value = ''
}

const handleApplyCustomVoucher = async () => {
  voucherFeedback.value = ''
  
  if (!customVoucherCode.value.trim()) {
    appliedPromotion.value = null
    return
  }
  
  try {
    let promotions = Array.isArray(serviceStore.promotions) ? serviceStore.promotions : []
    
    if (!promotions.length) {
      promotions = await promotionsApi.getAll()
      if (Array.isArray(promotions)) {
        serviceStore.promotions = promotions
      }
    }
    
    const found = Array.isArray(promotions)
      ? promotions.find((p) => p.code.toUpperCase() === customVoucherCode.value.toUpperCase() && p.status === 'active')
      : null
    
    if (!found) {
      voucherSuccess.value = false
      voucherFeedback.value = 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.'
      appliedPromotion.value = null
      return
    }
    
    // Check điều kiện mã (ví dụ: giảm tối thiểu)
    if (found.code === 'PHUQUOC500K' && subtotal.value < 5000000) {
      voucherSuccess.value = false
      voucherFeedback.value = 'Mã PHUQUOC500K chỉ áp dụng cho đơn từ 5.000.000 VND.'
      appliedPromotion.value = null
      return
    }
    
    appliedPromotion.value = found
    customVoucherCode.value = ''
    voucherSuccess.value = true
    voucherFeedback.value = `Áp dụng thành công mã ${found.code}`
  } catch (error) {
    voucherSuccess.value = false
    voucherFeedback.value = 'Lỗi khi áp dụng mã khuyến mãi'
  }
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
</script>