<template>
  <section class="page-section">
    <div class="section-heading compact">
      <div>
        <p class="eyebrow">Lịch sử đặt chỗ</p>
        <h1>Theo dõi tất cả booking mock đã xác nhận</h1>
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
              <li v-for="item in booking.items" :key="`${booking.id}-${item.serviceId}-${item.travelDate}`">
                <strong>{{ item.service?.name }}</strong>
                <span>{{ formatDateVN(item.travelDate) }} · {{ item.quantity }} khách · {{ formatCurrencyVND(item.lineTotal) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </div>
    <div v-else class="empty-state">
      <h2>Chưa có booking mock nào</h2>
      <p>Sau khi hoàn tất checkout, booking của bạn sẽ hiển thị tại đây.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useTravelStore } from '@/stores/useTravelStore'
import { formatCurrencyVND, formatDateVN } from '@/utils/formatters'

const store = useTravelStore()
const bookings = computed(() => store.bookingHistory.value)
const expandedBookingId = ref(null)

const toggleExpandedBooking = (bookingId) => {
  expandedBookingId.value = expandedBookingId.value === bookingId ? null : bookingId
}
</script>