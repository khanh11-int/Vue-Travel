<template>
  <section class="page-section">
    <div class="section-heading compact">
      <div>
        <p class="eyebrow">Lịch sử đặt chỗ</p>
        <h1>{{ isLoggedIn ? 'Theo dõi tất cả booking của bạn' : 'Tra cứu booking nhanh' }}</h1>
      </div>
    </div>

    <div v-if="!isLoggedIn" class="panel-card" style="margin-bottom: 18px;">
      <div class="form-grid" style="margin-bottom: 10px;">
        <div class="field-group">
          <label>Mã đặt chỗ</label>
          <input
            v-model="lookupForm.code"
            type="text"
            placeholder="Ví dụ: VV318939"
            @keyup.enter="handleLookupBookings"
          />
        </div>
        <div class="field-group">
          <label>Số điện thoại</label>
          <input
            v-model="lookupForm.phone"
            type="text"
            placeholder="Ví dụ: 0987654321"
            @keyup.enter="handleLookupBookings"
          />
        </div>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
        <button class="primary-button" type="button" @click="handleLookupBookings">Tra cứu đặt chỗ</button>
        <p class="muted" style="margin: 0;">
          Nhập mã đặt chỗ hoặc số điện thoại để xem trạng thái booking.
        </p>
      </div>
      <small v-if="lookupError" class="error-text" style="margin-top: 8px; display: inline-block;">{{ lookupError }}</small>
    </div>

    <div v-if="bookingsToRender.length" class="history-table">
      <div class="history-row history-row--head history-row--booking">
        <span>Mã booking</span>
        <span>Dịch vụ</span>
        <span>Ngày tạo</span>
        <span>Trạng thái</span>
        <span>Tổng tiền</span>
        <span>Chi tiết</span>
      </div>
      <template v-for="booking in bookingsToRender" :key="booking.id">
        <div class="history-row history-row--booking history-row--booking-detail">
          <strong>{{ booking.code }}</strong>
          <span>{{ booking.items[0]?.service?.name }}</span>
          <span>{{ formatDateVN(booking.createdAt) }}</span>
          <span class="status-chip">{{ booking.statusLabel }}</span>
          <strong>{{ formatCurrencyVND(booking.total) }}</strong>
          <button class="ghost-button" type="button" @click="toggleExpandedBooking(booking.id)">
            {{ expandedBookingId === booking.id ? 'Thu gọn' : 'Xem chi tiết' }}
          </button>
        </div>
        <div v-if="expandedBookingId === booking.id" class="booking-detail-panel">
          <div>
            <h3>Thông tin khách hàng</h3>
            <p><strong>{{ booking.customer.fullName }}</strong></p>
            <p class="muted">{{ getCustomerEmailDisplay(booking) }} · {{ getCustomerPhoneDisplay(booking) }}</p>
            <p class="muted">{{ booking.customer.city }} · {{ booking.customer.address }}</p>
          </div>
          <div>
            <h3>Dịch vụ trong đơn</h3>
            <ul class="booking-detail-list">
              <li v-for="item in booking.items" :key="`${booking.id}-${item.serviceId}-${item.bookingType || item.service?.categoryId || ''}-${item.startDate || item.travelDate || ''}-${item.endDate || ''}`">
                <strong>{{ item.service?.name }}</strong>
                <span>{{ getBookingSummary(item) }} · {{ formatCurrencyVND(getBookingLineTotal(item)) }}</span>
              </li>
            </ul>
            <div class="booking-detail-actions">
              <button
                v-if="canCurrentUserCancelBooking(booking)"
                class="secondary-button"
                type="button"
                @click="handleCancelBooking(booking)"
              >
                Hủy booking
              </button>
              <p v-else class="muted">
                Đơn này chỉ có thể hủy trong 3 ngày kể từ ngày đặt hoặc khi đang chờ xác nhận.
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div v-else class="empty-state">
      <h2>{{ isLoggedIn ? 'Chưa có booking nào' : 'Chưa có kết quả tra cứu' }}</h2>
      <p>{{ emptyStateMessage }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBookingStore } from '@/stores/useBookingStore'
import { canUserCancelBooking } from '@/utils/bookingRules'
import { formatCurrencyVND, formatDateVN, formatDateRangeVN } from '@/utils/formatters'

const store = useBookingStore()
const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isLoggedIn)
const bookings = computed(() => store.bookingHistory)
const expandedBookingId = ref(null)
const hasSearched = ref(false)
const lookupError = ref('')
const guestLookupResults = ref([])
const lookupForm = reactive({
  code: '',
  phone: ''
})

const normalizeCode = (value) => String(value || '').trim().toUpperCase()
const normalizePhone = (value) => String(value || '').replace(/\D/g, '')

const bookingsToRender = computed(() => {
  return isLoggedIn.value ? bookings.value : guestLookupResults.value
})

const shouldMaskCustomerInfo = computed(() => {
  if (isLoggedIn.value) return false
  return Boolean(normalizePhone(lookupForm.phone))
})

const emptyStateMessage = computed(() => {
  if (isLoggedIn.value) {
    return 'Sau khi hoàn tất checkout, booking của bạn sẽ hiển thị tại đây.'
  }

  if (!hasSearched.value) {
    return 'Nhập số điện thoại hoặc mã đặt chỗ để tra cứu tình trạng booking.'
  }

  return 'Không tìm thấy booking phù hợp. Vui lòng kiểm tra lại mã đặt chỗ hoặc số điện thoại.'
})

onMounted(() => {
  store.syncUserScope()
  if (isLoggedIn.value) {
    store.fetchMyBookings()
  }
})

watch(
  () => authStore.currentUser?.id || null,
  () => {
    store.syncUserScope()
    expandedBookingId.value = null
    hasSearched.value = false
    guestLookupResults.value = []

    if (isLoggedIn.value) {
      store.fetchMyBookings()
    }
  }
)

const handleLookupBookings = async () => {
  const normalizedCode = normalizeCode(lookupForm.code)
  const normalizedPhone = normalizePhone(lookupForm.phone)

  hasSearched.value = false
  lookupError.value = ''

  if (!normalizedCode && !normalizedPhone) {
    lookupError.value = 'Vui lòng nhập số điện thoại hoặc mã đặt chỗ để tra cứu.'
    return
  }

  guestLookupResults.value = await store.lookupGuestBookings({
    code: normalizedCode,
    phone: normalizedPhone
  })
  hasSearched.value = true
  expandedBookingId.value = null
}

const maskEmail = (email) => {
  const normalizedEmail = String(email || '').trim()
  if (!normalizedEmail || !normalizedEmail.includes('@')) return '***'

  const [localPart, domainPart] = normalizedEmail.split('@')
  const safeLocalPart = localPart.length <= 2
    ? `${localPart.slice(0, 1)}*`
    : `${localPart.slice(0, 2)}***`

  const [domainName, ...domainSuffixParts] = String(domainPart || '').split('.')
  const domainSuffix = domainSuffixParts.length ? `.${domainSuffixParts.join('.')}` : ''
  const safeDomainName = domainName
    ? `${domainName.slice(0, 1)}***`
    : '***'

  return `${safeLocalPart}@${safeDomainName}${domainSuffix}`
}

const maskPhone = (phone) => {
  const digits = normalizePhone(phone)
  if (!digits) return '***'
  if (digits.length <= 5) return `${digits.slice(0, 1)}***${digits.slice(-1)}`
  return `${digits.slice(0, 3)}****${digits.slice(-2)}`
}

const getCustomerEmailDisplay = (booking) => {
  const email = booking?.customer?.email || ''
  return shouldMaskCustomerInfo.value ? maskEmail(email) : email
}

const getCustomerPhoneDisplay = (booking) => {
  const phone = booking?.customer?.phone || ''
  return shouldMaskCustomerInfo.value ? maskPhone(phone) : phone
}

const toggleExpandedBooking = (bookingId) => {
  expandedBookingId.value = expandedBookingId.value === bookingId ? null : bookingId
}

const handleCancelBooking = (booking) => {
  if (!canCurrentUserCancelBooking(booking)) return

  const isConfirmed = window.confirm('Bạn có chắc muốn hủy booking này không?')
  if (!isConfirmed) return

  store.cancelBooking(booking.id)
}

const canCurrentUserCancelBooking = (booking) => canUserCancelBooking(booking, authStore.currentUser)

const getBookingLineTotal = (item) => {
  const quantity = Math.max(1, Number(item?.quantity || 1) || 1)
  const snapshotTotal = Number(item?.bookingMeta?.totalPrice || 0)
  if (snapshotTotal > 0) return snapshotTotal

  const snapshotUnitPrice = Number(item?.bookingMeta?.unitPrice || 0)
  if (snapshotUnitPrice > 0) return snapshotUnitPrice * quantity

  return (Number(item?.service?.salePrice || 0) || 0) * quantity
}

const getBookingSummary = (item) => {
  const bookingType = item.bookingType || item.service?.categoryId || 'hotel'
  const bookingMeta = item.bookingMeta || {}
  const startDate = item.startDate || item.travelDate || ''
  const endDate = item.endDate || ''
  const durationSuffix = bookingMeta.durationLabel ? ` · ${bookingMeta.durationLabel}` : ''

  if (bookingType === 'hotel') {
    const guests = bookingMeta.guests || item.quantity || 1
    const rooms = bookingMeta.rooms || 1
    return `${formatDateRangeVN(bookingMeta.checkInDate || startDate, bookingMeta.checkOutDate || endDate)}${durationSuffix} · ${guests} khách · ${rooms} phòng`
  }

  if (bookingType === 'ticket') {
    const adults = bookingMeta.adults || 1
    const children = bookingMeta.children || 0
    const ticketQuantity = bookingMeta.ticketQuantity || item.quantity || 1
    return `${formatDateVN(bookingMeta.useDate || startDate)}${durationSuffix} · ${adults} người lớn · ${children} trẻ em · ${ticketQuantity} vé tính phí`
  }

  if (bookingType === 'tour') {
    const adults = bookingMeta.adults || 1
    const children = bookingMeta.children || 0
    if (bookingMeta.scheduleMode === 'flexible') {
      return `Linh hoạt ${formatDateRangeVN(bookingMeta.departureDate || startDate, bookingMeta.endDate || endDate)}${durationSuffix} · ${adults} người lớn · ${children} trẻ em`
    }
    return `Khởi hành ${formatDateVN(bookingMeta.departureDate || startDate)}${durationSuffix} · ${adults} người lớn · ${children} trẻ em`
  }

  const travelers = bookingMeta.travelers || item.quantity || 1
  return `Áp dụng ${formatDateVN(bookingMeta.applyDate || startDate)}${durationSuffix} · ${travelers} người`
}
</script>