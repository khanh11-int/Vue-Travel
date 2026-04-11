<template>
  <section class="page-section flight-invoice-page">
    <article v-if="booking" class="invoice-card">
      <p class="eyebrow">Hóa đơn vé máy bay</p>
      <h1>Đặt vé thành công - {{ booking.bookingCode }}</h1>
      <p class="muted">Cảm ơn bạn đã đặt vé tại VTravel.</p>

      <div class="invoice-grid">
        <section>
          <h3>Thông tin chuyến bay</h3>
          <p><strong>{{ booking.airlineName }} {{ booking.flightNumber }}</strong></p>
          <p>{{ booking.fromAirport }} - {{ booking.toAirport }}</p>
          <p>{{ booking.flightDate }} · {{ booking.departureTime }} - {{ booking.arrivalTime }}</p>
          <p>Hạng ghế: {{ booking.cabinLabel }}</p>
        </section>

        <section>
          <h3>Thông tin liên hệ</h3>
          <p><strong>{{ booking.contact?.fullName }}</strong></p>
          <p>{{ booking.contact?.email }}</p>
          <p>{{ booking.contact?.phone }}</p>
          <p>Thanh toán: {{ paymentMethodLabel }}</p>
        </section>
      </div>

      <div class="invoice-price">
        <div>
          <span>Giá vé</span>
          <strong>{{ formatCurrency(booking.priceSummary?.baseFareTotal || booking.unitPrice * (booking.passengerCounts?.total || 1)) }}</strong>
        </div>
        <div>
          <span>Hành lý ký gửi</span>
          <strong>{{ formatCurrency(booking.priceSummary?.baggageTotal || 0) }}</strong>
        </div>
        <div class="invoice-price__total">
          <span>Tổng thanh toán</span>
          <strong>{{ formatCurrency(booking.priceSummary?.totalPrice || booking.totalPrice || 0) }}</strong>
        </div>
      </div>

      <div class="invoice-actions">
        <button class="secondary-button" type="button" @click="goHistory">Lịch sử đặt chỗ</button>
        <button class="primary-button" type="button" @click="goHome">Về trang chủ</button>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlightStore } from '@/stores/flight/useFlightStore'

const route = useRoute()
const router = useRouter()
const flightStore = useFlightStore()

const booking = computed(() => flightStore.bookingResult)

const paymentMethodLabel = computed(() => {
  const method = String(booking.value?.paymentMethod || '').toLowerCase()
  return method === 'vietqr' ? 'VietQR' : 'Tiền mặt'
})

const formatCurrency = (value) => {
  const amount = Math.max(0, Number(value || 0) || 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount)
}

const goHome = () => {
  flightStore.resetSelection()
  router.push({ name: 'flight-home' })
}

const goHistory = () => {
  router.push({ name: 'booking-history' })
}

onMounted(async () => {
  const bookingCode = String(route.query.bookingCode || '')

  if (!booking.value && bookingCode) {
    await flightStore.loadBookingByCode(bookingCode)
  }

  if (!flightStore.bookingResult) {
    router.replace({ name: 'flight-home' })
  }
})
</script>

<style scoped>
.flight-invoice-page {
  margin-bottom: 32px;
}

.invoice-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 18px;
  box-shadow: var(--shadow);
}

.invoice-card h1 {
  margin: 4px 0;
}

.invoice-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.invoice-grid section {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
}

.invoice-grid h3 {
  margin: 0 0 8px;
}

.invoice-grid p {
  margin: 0 0 4px;
}

.invoice-price {
  margin-top: 12px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  padding: 10px;
  display: grid;
  gap: 8px;
}

.invoice-price > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.invoice-price__total {
  border-top: 1px solid var(--border);
  padding-top: 8px;
  font-size: 1.05rem;
}

.invoice-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 840px) {
  .invoice-grid {
    grid-template-columns: 1fr;
  }

  .invoice-actions {
    flex-direction: column;
  }
}
</style>
