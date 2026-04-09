<template>
  <section class="page-section">
    <div class="section-heading compact">
      <div>
        <p class="eyebrow">Chi tiết đặt chỗ</p>
        <h1>Đơn #{{ booking?.code || bookingId }}</h1>
      </div>
      <router-link class="ghost-button" to="/lich-su-dat-cho">Quay lại lịch sử</router-link>
    </div>

    <div v-if="loading" class="panel-card">
      <p class="muted">Đang tải chi tiết đơn hàng...</p>
    </div>

    <div v-else-if="!booking" class="empty-state">
      <h2>Không tìm thấy đơn hàng</h2>
      <p>Đơn hàng có thể đã bị xóa hoặc mã không còn hợp lệ.</p>
    </div>

    <div v-else class="panel-card booking-detail-page">
      <div class="booking-header-grid">
        <div>
          <p class="muted small-text">Ngày tạo</p>
          <strong>{{ formatDateVN(booking.createdAt) }}</strong>
        </div>
        <div>
          <p class="muted small-text">Trạng thái</p>
          <span class="status-chip">{{ booking.statusLabel }}</span>
        </div>
        <div>
          <p class="muted small-text">Tổng thanh toán</p>
          <strong>{{ formatCurrencyVND(booking.total || 0) }}</strong>
        </div>
      </div>

      <div class="booking-content-grid">
        <div>
          <h3>Thông tin khách hàng</h3>
          <p><strong>{{ booking.customer?.fullName || 'Khách hàng Vtravel' }}</strong></p>
          <p class="muted">{{ booking.customer?.email || 'Chưa có email' }} · {{ booking.customer?.phone || 'Chưa có số điện thoại' }}</p>
          <p class="muted">{{ booking.customer?.city || 'Chưa có thành phố' }} · {{ booking.customer?.address || 'Chưa có địa chỉ' }}</p>
        </div>

        <div>
          <h3>Dịch vụ trong đơn</h3>
          <ul class="booking-item-list">
            <li
              v-for="item in bookingItems"
              :key="`${booking.id}-${item.serviceId}-${item.bookingType || item.service?.categoryId || ''}-${item.startDate || item.travelDate || ''}-${item.endDate || ''}`"
              class="booking-item-card"
            >
              <strong>{{ item.service?.name || 'Dịch vụ du lịch' }}</strong>
              <p class="muted">{{ getBookingSummary(item) }}</p>
              <span>{{ formatCurrencyVND(getBookingLineTotal(item)) }}</span>
            </li>
          </ul>

          <div class="booking-payment-block">
            <h3>Thanh toán</h3>
            <div class="summary-row">
              <span>Phương thức</span>
              <strong>{{ booking.customer?.paymentMethodLabel || 'Thanh toán khi xác nhận booking' }}</strong>
            </div>
            <div class="summary-row">
              <span>Tạm tính</span>
              <strong>{{ formatCurrencyVND(booking.subtotal || 0) }}</strong>
            </div>
            <div class="summary-row">
              <span>Giảm giá</span>
              <strong>-{{ formatCurrencyVND(booking.discount || 0) }}</strong>
            </div>
            <div class="summary-row">
              <span>Phí dịch vụ</span>
              <strong>{{ formatCurrencyVND(booking.serviceFee || 0) }}</strong>
            </div>
          </div>

          <div class="booking-action-block">
            <button
              v-if="canCurrentUserCancelBooking"
              class="secondary-button"
              type="button"
              @click="openCancelModal"
            >
              Hủy booking
            </button>
            <p v-else class="muted">Đơn này không thể hủy ở thời điểm hiện tại.</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCancelModal" class="admin-confirm-overlay" @click.self="closeCancelModal">
      <div class="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-booking-title">
        <p class="eyebrow">Xác nhận hủy booking</p>
        <h3 id="cancel-booking-title">Bạn chắc chắn muốn hủy đơn #{{ booking?.code }}?</h3>
        <p class="muted">Vui lòng nhập lý do hủy để hệ thống ghi nhận lịch sử đơn hàng.</p>

        <div class="booking-cancel-reason-group">
          <label for="cancel-reason">Lý do hủy booking</label>
          <textarea
            id="cancel-reason"
            v-model="cancelReason"
            rows="3"
            placeholder="Ví dụ: Đổi lịch trình, không còn nhu cầu đi..."
          />
          <small v-if="cancelReasonError" class="error-text">{{ cancelReasonError }}</small>
        </div>

        <div class="admin-confirm-actions">
          <button class="secondary-button" type="button" @click="closeCancelModal">Đóng</button>
          <button class="primary-button" type="button" @click="confirmCancelBooking">Xác nhận hủy</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { bookingDetailsApi, bookingsApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useBookingStore } from '@/stores/booking/useBookingStore'
import { canUserCancelBooking } from '@/utils/bookingRules'
import { formatCurrencyVND, formatDateRangeVN, formatDateVN } from '@/utils/formatters'

const route = useRoute()
const authStore = useAuthStore()
const bookingStore = useBookingStore()

const bookingId = computed(() => String(route.params.id || '').trim())
const loading = ref(false)
const apiBooking = ref(null)
const showCancelModal = ref(false)
const cancelReason = ref('')
const cancelReasonError = ref('')

const enrichBookingFromApi = (bookingHeader, details) => {
  const safeDetails = Array.isArray(details) ? details : []
  const items = safeDetails
    .slice()
    .sort((left, right) => Number(left.lineIndex || 0) - Number(right.lineIndex || 0))
    .map((detail) => ({ ...detail }))

  return {
    ...(bookingHeader || {}),
    itemCount: Number(bookingHeader?.itemCount || items.length || 0),
    items
  }
}

const booking = computed(() => {
  const id = bookingId.value
  if (!id) return null

  const fromStore = bookingStore.adminBookingHistory.find((entry) => String(entry.id) === id)
    || bookingStore.guestLookupResults.find((entry) => String(entry.id) === id)

  return fromStore || apiBooking.value
})

const bookingItems = computed(() => (Array.isArray(booking.value?.items) ? booking.value.items : []))

const canCurrentUserCancelBooking = computed(() => canUserCancelBooking(booking.value, authStore.currentUser))

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

const loadBookingDetail = async () => {
  if (!bookingId.value) return

  loading.value = true
  try {
    if (authStore.isLoggedIn) {
      await bookingStore.fetchMyBookings()
    }

    const alreadyLoaded = bookingStore.adminBookingHistory.find((entry) => String(entry.id) === bookingId.value)
      || bookingStore.guestLookupResults.find((entry) => String(entry.id) === bookingId.value)

    if (alreadyLoaded) {
      apiBooking.value = null
      return
    }

    const [bookingHeader, details] = await Promise.all([
      bookingsApi.getById(bookingId.value),
      bookingDetailsApi.getAll({ bookingId: bookingId.value })
    ])

    if (!bookingHeader) {
      apiBooking.value = null
      return
    }

    apiBooking.value = enrichBookingFromApi(bookingHeader, details)
  } catch (error) {
    apiBooking.value = null
  } finally {
    loading.value = false
  }
}

const openCancelModal = () => {
  if (!booking.value || !canCurrentUserCancelBooking.value) return
  cancelReason.value = ''
  cancelReasonError.value = ''
  showCancelModal.value = true
}

const closeCancelModal = () => {
  showCancelModal.value = false
  cancelReasonError.value = ''
}

const confirmCancelBooking = () => {
  if (!booking.value || !canCurrentUserCancelBooking.value) return

  const normalizedReason = String(cancelReason.value || '').trim()
  if (!normalizedReason) {
    cancelReasonError.value = 'Vui lòng nhập lý do hủy booking.'
    return
  }

  bookingStore.cancelBooking(booking.value.id, { reason: normalizedReason })
  closeCancelModal()
  loadBookingDetail()
}

onMounted(() => {
  loadBookingDetail()
})
</script>

<style scoped>
.booking-detail-page {
  display: grid;
  gap: 18px;
}

.booking-header-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(24, 45, 75, 0.12);
  border-radius: 12px;
}

.booking-content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.booking-item-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.booking-item-card {
  border: 1px solid rgba(24, 45, 75, 0.1);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 6px;
}

.booking-item-card p {
  margin: 0;
}

.booking-payment-block {
  margin-top: 14px;
}

.booking-action-block {
  margin-top: 14px;
}

.booking-cancel-reason-group {
  display: grid;
  gap: 8px;
}

.booking-cancel-reason-group textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  resize: vertical;
  font: inherit;
  color: var(--text-primary);
  background: #fff;
}

@media (max-width: 900px) {
  .booking-content-grid {
    grid-template-columns: 1fr;
  }

  .booking-header-grid {
    grid-template-columns: 1fr;
  }
}
</style>
