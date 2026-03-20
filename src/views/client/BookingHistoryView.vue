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
      </div>
      <div v-for="booking in bookings" :key="booking.id" class="history-row history-row--booking">
        <strong>{{ booking.code }}</strong>
        <span>{{ booking.items[0]?.service?.name }}</span>
        <span>{{ formatDateVN(booking.createdAt) }}</span>
        <span class="status-chip">{{ booking.statusLabel }}</span>
        <strong>{{ formatCurrencyVND(booking.total) }}</strong>
      </div>
    </div>
    <div v-else class="empty-state">
      <h2>Chưa có booking mock nào</h2>
      <p>Sau khi hoàn tất checkout, booking của bạn sẽ hiển thị tại đây.</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useTravelStore } from '@/stores/useTravelStore'
import { formatCurrencyVND, formatDateVN } from '@/utils/formatters'

const store = useTravelStore()
const bookings = computed(() => store.bookingHistory.value)
</script>
