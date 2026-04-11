<template>
  <section class="page-section flight-checkout-page">
    <div class="section-heading compact">
      <div>
        <p class="eyebrow">Bước 3/3</p>
        <h1>Xác nhận thông tin và thanh toán</h1>
      </div>
    </div>

    <div class="flight-checkout-layout" v-if="flightStore.selectedFare && flightStore.selectedFlight">
      <section class="flight-checkout-main panel-card">
        <article class="checkout-block">
          <h3>Thông tin chuyến bay</h3>
          <p>
            {{ flightStore.selectedFlight.airlineName }} {{ flightStore.selectedFlight.flightNumber }} ·
            {{ flightStore.selectedFlight.fromAirport }} - {{ flightStore.selectedFlight.toAirport }}
          </p>
          <p class="muted">
            {{ flightStore.selectedFlight.flightDate }} · {{ flightStore.selectedFlight.departureTime }} - {{ flightStore.selectedFlight.arrivalTime }}
          </p>
        </article>

        <article class="checkout-block">
          <h3>Thông tin liên hệ</h3>
          <p><strong>{{ flightStore.contactForm.fullName }}</strong></p>
          <p class="muted">{{ flightStore.contactForm.email }} · {{ flightStore.contactForm.phone }}</p>
        </article>

        <article class="checkout-block">
          <h3>Phương thức thanh toán</h3>
          <div class="payment-methods">
            <label class="payment-option" :class="{ active: paymentMethod === 'cash' }">
              <input v-model="paymentMethod" type="radio" value="cash" />
              <span>
                <strong>Tiền mặt</strong>
                <small>Đặt vé -> 2s -> hóa đơn</small>
              </span>
            </label>

            <label class="payment-option" :class="{ active: paymentMethod === 'vietqr' }">
              <input v-model="paymentMethod" type="radio" value="vietqr" />
              <span>
                <strong>VietQR</strong>
                <small>Đặt vé -> 2s xử lý -> 30s QR -> hóa đơn</small>
              </span>
            </label>
          </div>
        </article>

        <small v-if="flightStore.error" class="error-text">{{ flightStore.error }}</small>

        <div class="checkout-actions">
          <button class="secondary-button" type="button" @click="goBackContact">Quay lại thông tin hành khách</button>
          <button class="primary-button" type="button" :disabled="flightStore.loading || placingOrder" @click="handlePlaceOrder">
            {{ placingOrder ? 'Đang đặt vé...' : 'Đặt vé' }}
          </button>
        </div>
      </section>

      <aside class="summary-card sticky-card">
        <p class="eyebrow">Tổng kết đơn hàng</p>
        <h3>{{ flightStore.selectedFare.label }}</h3>

        <div class="summary-row">
          <span>Giá vé ({{ flightStore.totalPassengers }} khách)</span>
          <strong>{{ formatCurrency(flightStore.baseFareTotal) }}</strong>
        </div>
        <div class="summary-row">
          <span>Hành lý ký gửi</span>
          <strong>{{ formatCurrency(flightStore.baggageTotal) }}</strong>
        </div>
        <div class="summary-row summary-row--total">
          <span>Tổng thanh toán</span>
          <strong>{{ formatCurrency(flightStore.totalAmount) }}</strong>
        </div>
      </aside>
    </div>

    <div v-if="showOverlay" class="checkout-modal-backdrop">
      <div class="checkout-modal-card" role="dialog" aria-modal="true">
        <template v-if="overlayStage === 'processing'">
          <p class="eyebrow">Đang xử lý</p>
          <h2>Hệ thống đang tạo đơn đặt vé...</h2>
          <p class="muted">Vui lòng chờ trong giây lát.</p>
        </template>

        <template v-else-if="overlayStage === 'qr'">
          <p class="eyebrow eyebrow--blue">Thanh toán VietQR</p>
          <h2>Quét mã để thanh toán</h2>
          <p class="muted">Hệ thống sẽ tự động xuất hóa đơn sau {{ qrCountdown }} giây.</p>

          <div class="qr-meta">
            <span>Số tiền</span>
            <strong>{{ formatCurrency(flightStore.totalAmount) }}</strong>
          </div>

          <div class="qr-image">
            <img :src="vietQrImage" alt="VietQR thanh toán" />
          </div>

          <div class="qr-meta">
            <span>Nội dung chuyển khoản</span>
            <strong>{{ transferContent }}</strong>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFlightStore } from '@/stores/flight/useFlightStore'
import { buildFlightSearchQuery } from '@/utils/flightSearchRoute'

const router = useRouter()
const flightStore = useFlightStore()

const paymentMethod = ref(flightStore.paymentMethod || 'cash')
const placingOrder = ref(false)
const showOverlay = ref(false)
const overlayStage = ref('processing')
const qrCountdown = ref(30)

let countdownTimer = null

watch(paymentMethod, (method) => {
  flightStore.setPaymentMethod(method)
})

const transferContent = computed(() => {
  const flightNumber = String(flightStore.selectedFlight?.flightNumber || 'FLIGHT')
  return `${flightNumber}-${Date.now().toString().slice(-6)}`
})

const vietQrImage = computed(() => {
  const amount = Math.max(0, Number(flightStore.totalAmount || 0) || 0)
  const content = encodeURIComponent(transferContent.value)
  return `https://img.vietqr.io/image/970422-0123456789-compact2.png?amount=${amount}&addInfo=${content}&accountName=VTRAVEL`
})

const waitMs = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms)
})

const runQrCountdown = () => {
  return new Promise((resolve) => {
    qrCountdown.value = 30
    countdownTimer = window.setInterval(() => {
      qrCountdown.value -= 1
      if (qrCountdown.value <= 0) {
        window.clearInterval(countdownTimer)
        countdownTimer = null
        resolve()
      }
    }, 1000)
  })
}

const handlePlaceOrder = async () => {
  if (!flightStore.validateBookingForm()) {
    router.push({ name: 'flight-contact' })
    return
  }

  placingOrder.value = true
  showOverlay.value = true
  overlayStage.value = 'processing'

  await waitMs(2000)

  if (paymentMethod.value === 'vietqr') {
    overlayStage.value = 'qr'
    await runQrCountdown()
  }

  const createdBooking = await flightStore.confirmBooking(paymentMethod.value)
  placingOrder.value = false
  showOverlay.value = false

  if (!createdBooking?.bookingCode) return

  router.replace({
    name: 'flight-invoice',
    query: { bookingCode: createdBooking.bookingCode }
  })
}

const goBackContact = () => {
  router.push({ name: 'flight-contact' })
}

const formatCurrency = (value) => {
  const amount = Math.max(0, Number(value || 0) || 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount)
}

onMounted(() => {
  if (!flightStore.selectedFare || !flightStore.selectedFlight) {
    router.replace({ name: 'flight-results', query: buildFlightSearchQuery(flightStore.searchParams) })
  }
})

onBeforeUnmount(() => {
  if (countdownTimer) {
    window.clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.flight-checkout-page {
  margin-bottom: 34px;
}

.flight-checkout-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
  gap: 14px;
}

.flight-checkout-main {
  display: grid;
  gap: 12px;
}

.checkout-block {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: #fff;
}

.checkout-block h3 {
  margin: 0 0 8px;
}

.checkout-block p {
  margin: 0;
}

.payment-methods {
  display: grid;
  gap: 10px;
}

.payment-option {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.payment-option input {
  margin: 0;
}

.payment-option span {
  display: grid;
  gap: 3px;
}

.payment-option small {
  color: var(--muted);
}

.payment-option.active {
  border-color: var(--primary);
  background: rgba(10, 109, 217, 0.08);
}

.checkout-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.summary-row--total {
  padding-top: 10px;
  border-top: 1px solid var(--border);
  font-size: 1.05rem;
}

.checkout-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(9, 20, 42, 0.42);
  display: grid;
  place-items: center;
  z-index: 90;
  padding: 16px;
}

.checkout-modal-card {
  width: min(460px, 100%);
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--border);
  padding: 16px;
}

.checkout-modal-card h2 {
  margin: 4px 0 8px;
}

.qr-image {
  margin-top: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  display: grid;
  place-items: center;
}

.qr-image img {
  width: min(280px, 100%);
  height: auto;
}

.qr-meta {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

@media (max-width: 980px) {
  .flight-checkout-layout {
    grid-template-columns: 1fr;
  }

  .checkout-actions {
    flex-direction: column;
  }
}
</style>
