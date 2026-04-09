<template>
  <section class="page-section success-state">
    <div class="success-card summary-card success-invoice-card">
      <template v-if="isReadyToShow">
        <div class="success-icon">✓</div>
        <p class="eyebrow">Thanh toán thành công</p>
        <h1>Hóa đơn booking của bạn</h1>
        <p class="lead">
          Mã booking: <strong>{{ bookingCode }}</strong>
        </p>

        <div class="success-invoice-meta">
          <span>Ngày tạo: <strong>{{ formatDateVN(booking?.createdAt || '') }}</strong></span>
          <span>
            Trạng thái:
            <strong>{{ booking?.statusLabel || 'Đang xử lý' }}</strong>
          </span>
        </div>

        <div class="success-invoice-block">
          <h3>Thông tin khách hàng</h3>
          <p><strong>{{ booking?.customer?.fullName || 'Khách hàng Vtravel' }}</strong></p>
          <p class="muted">{{ booking?.customer?.email || 'Chưa có email' }} · {{ booking?.customer?.phone || 'Chưa có số điện thoại' }}</p>
          <p class="muted">{{ booking?.customer?.city || 'Chưa cập nhật thành phố' }} · {{ booking?.customer?.address || 'Chưa cập nhật địa chỉ' }}</p>
        </div>

        <div class="success-invoice-block">
          <h3>Chi tiết dịch vụ</h3>
          <div v-for="item in bookingItems" :key="item.identityKey || `${item.serviceId}-${item.startDate}-${item.endDate}`" class="mini-booking-item">
            <strong>{{ item.service?.name || 'Dịch vụ du lịch' }}</strong>
            <p class="muted">{{ getBookingSummary(item) }}</p>
            <span>{{ formatCurrencyVND(item.lineTotal || 0) }}</span>
          </div>
        </div>

        <div class="success-invoice-block">
          <h3>Thanh toán</h3>
          <div class="summary-row">
            <span>Phương thức</span>
            <strong>{{ booking?.customer?.paymentMethodLabel || 'Thanh toán khi xác nhận booking' }}</strong>
          </div>
          <div class="summary-row">
            <span>Tạm tính</span>
            <strong>{{ formatCurrencyVND(booking?.subtotal || 0) }}</strong>
          </div>
          <div class="summary-row">
            <span>Giảm giá</span>
            <strong>-{{ formatCurrencyVND(booking?.discount || 0) }}</strong>
          </div>
          <div class="summary-row">
            <span>Phí dịch vụ</span>
            <strong>{{ formatCurrencyVND(booking?.serviceFee || 0) }}</strong>
          </div>
          <div class="summary-row summary-row--total">
            <span>Tổng thanh toán</span>
            <strong>{{ formatCurrencyVND(booking?.total || 0) }}</strong>
          </div>
        </div>

        <div class="success-actions">
          <router-link class="primary-button" to="/lich-su-dat-cho">Xem lịch sử booking</router-link>
          <router-link class="secondary-button" to="/">Quay về trang chủ</router-link>
        </div>
      </template>

      <div v-else class="success-loading-state">
        <p class="eyebrow">Thanh toán thành công</p>
        <h2>Đang tạo hóa đơn của bạn...</h2>
        <p class="muted">Vui lòng chờ trong giây lát.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useBookingStore } from '@/stores/booking/useBookingStore'
import { formatCurrencyVND, formatDateRangeVN, formatDateVN } from '@/utils/formatters'

const route = useRoute()
const bookingStore = useBookingStore()
const bookingCode = computed(() => route.query.code || 'VV-UNKNOWN')
const isReadyToShow = ref(false)

let displayTimer = null

onMounted(() => {
  bookingStore.syncUserScope()
  displayTimer = window.setTimeout(() => {
    isReadyToShow.value = true
  }, 2000)
})

onBeforeUnmount(() => {
  if (displayTimer) {
    window.clearTimeout(displayTimer)
  }
})

const booking = computed(() => {
  const normalizedCode = String(bookingCode.value || '').trim().toUpperCase()
  return bookingStore.adminBookingHistory.find((entry) => String(entry.code || '').trim().toUpperCase() === normalizedCode) || null
})

const bookingItems = computed(() => (Array.isArray(booking.value?.items) ? booking.value.items : []))

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

<style scoped>
.success-invoice-card {
  width: min(760px, 100%);
  text-align: left;
}

.success-invoice-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 8px 0 10px;
  color: var(--muted);
}

.success-invoice-block {
  margin-top: 16px;
}

.success-invoice-block h3 {
  margin: 0 0 10px;
}

.success-loading-state {
  text-align: center;
  padding: 30px 10px;
}

@media (max-width: 640px) {
  .success-invoice-meta {
    flex-direction: column;
    gap: 6px;
  }
}
</style>