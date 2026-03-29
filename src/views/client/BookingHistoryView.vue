<template>
  <section class="page-section">
    <div class="section-heading compact">
      <div>
        <p class="eyebrow">Lịch sử đặt chỗ</p>
        <h1>Theo dõi tất cả booking đã xác nhận</h1>
      </div>
    </div>

    <div v-if="bookings.length" class="history-table">
      <div class="history-row history-row--head history-row--booking">
        <span>Mã booking</span>
        <span>Dịch vụ</span>
        <span>Ngày tạo</span>
        <span>Trạng thái</span>
        <span>Tổng tiền</span>
        <span>Chi tiết</span>
      </div>
      <template v-for="booking in bookings" :key="booking.id">
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
            <p class="muted">{{ booking.customer.email }} · {{ booking.customer.phone }}</p>
            <p class="muted">{{ booking.customer.city }} · {{ booking.customer.address }}</p>
          </div>
          <div>
            <h3>Dịch vụ trong đơn</h3>
            <ul class="booking-detail-list">
              <li v-for="item in booking.items" :key="`${booking.id}-${item.serviceId}-${item.bookingType || item.service?.categoryId || ''}-${item.startDate || item.travelDate || ''}-${item.endDate || ''}`">
                <strong>{{ item.service?.name }}</strong>
                <span>{{ getBookingSummary(item) }} · {{ formatCurrencyVND(item.lineTotal) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </div>
    <div v-else class="empty-state">
      <h2>Chưa có booking nào</h2>
      <p>Sau khi hoàn tất checkout, booking của bạn sẽ hiển thị tại đây.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBookingStore } from '@/stores/useBookingStore'
import { formatCurrencyVND, formatDateVN, formatDateRangeVN } from '@/utils/formatters'

const store = useBookingStore()
const authStore = useAuthStore()
const bookings = computed(() => store.bookingHistory)
const expandedBookingId = ref(null)

onMounted(() => {
  store.syncUserScope()
})

watch(
  () => authStore.currentUser?.id || null,
  () => {
    store.syncUserScope()
    expandedBookingId.value = null
  }
)

const toggleExpandedBooking = (bookingId) => {
  expandedBookingId.value = expandedBookingId.value === bookingId ? null : bookingId
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