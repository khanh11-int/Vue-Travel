<template>
  <section class="page-section flight-contact-page">
    <section v-if="flightStore.selectedFare && flightStore.selectedFlight" class="booking-form-section">
      <div class="section-headline">
        <p class="eyebrow">Bước 2/3</p>
        <h1>Thông tin liên hệ và hành khách</h1>
        <p class="muted">
          {{ flightStore.selectedFlight.airlineName }} {{ flightStore.selectedFlight.flightNumber }} ·
          {{ flightStore.selectedFlight.fromAirport }} - {{ flightStore.selectedFlight.toAirport }} ·
          {{ flightStore.selectedFare.label }}
        </p>
      </div>

      <div class="form-card">
        <div class="contact-grid">
          <label>
            Họ và tên liên hệ
            <input
              type="text"
              :value="flightStore.contactForm.fullName"
              @input="updateContact('fullName', $event.target.value)"
              placeholder="Nguyen Van A"
            />
            <small v-if="flightStore.validationErrors.fullName" class="error-text">{{ flightStore.validationErrors.fullName }}</small>
          </label>

          <label>
            Email liên hệ
            <input
              type="email"
              :value="flightStore.contactForm.email"
              @input="updateContact('email', $event.target.value)"
              placeholder="email@example.com"
            />
            <small v-if="flightStore.validationErrors.email" class="error-text">{{ flightStore.validationErrors.email }}</small>
          </label>

          <label>
            Số điện thoại
            <input
              type="text"
              :value="flightStore.contactForm.phone"
              @input="updateContact('phone', $event.target.value)"
              placeholder="09xx xxx xxx"
            />
            <small v-if="flightStore.validationErrors.phone" class="error-text">{{ flightStore.validationErrors.phone }}</small>
          </label>
        </div>

        <div class="passenger-form-grid">
          <article v-for="(passenger, index) in flightStore.passengerForms" :key="`passenger-${index}`" class="passenger-card">
            <h4>
              Hành khách {{ index + 1 }}
              <span>
                {{
                  passenger.type === 'adult'
                    ? 'Người lớn'
                    : passenger.type === 'child'
                      ? 'Trẻ em'
                      : 'Em bé'
                }}
              </span>
            </h4>

            <label>
              Họ tên
              <input
                type="text"
                :value="passenger.fullName"
                @input="updatePassenger(index, 'fullName', $event.target.value)"
              />
              <small v-if="flightStore.validationErrors[`passenger-${index}`]" class="error-text">
                {{ flightStore.validationErrors[`passenger-${index}`] }}
              </small>
            </label>

            <div class="passenger-mini-grid">
              <label>
                Giới tính
                <select :value="passenger.gender" @change="updatePassenger(index, 'gender', $event.target.value)">
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </label>

              <label>
                Ngày sinh
                <input type="date" :value="passenger.dob" @input="updatePassenger(index, 'dob', $event.target.value)" />
              </label>
            </div>

            <label>
              CCCD/Hộ chiếu
              <input
                type="text"
                :value="passenger.passportOrId"
                @input="updatePassenger(index, 'passportOrId', $event.target.value)"
              />
            </label>
          </article>
        </div>

        <section class="baggage-card">
          <h3>Nhu yếu phẩm chuyến bay</h3>
          <article v-for="(passenger, index) in flightStore.passengerForms" :key="`baggage-${index}`" class="baggage-passenger-row">
            <header>
              <div>
                <strong>
                  Hành khách {{ index + 1 }}
                  <small>
                    {{
                      passenger.type === 'adult'
                        ? 'Người lớn'
                        : passenger.type === 'child'
                          ? 'Trẻ em'
                          : 'Em bé'
                    }}
                  </small>
                </strong>
                <p>Hành lý xách tay {{ handCarryKg }}kg · Tổng hành lý ký gửi {{ passenger.checkedBaggageKg || 0 }} kg</p>
              </div>
            </header>

            <div class="baggage-option-grid">
              <button
                v-for="option in baggageOptionsForPassenger(passenger)"
                :key="`bag-${index}-${option.kg}`"
                type="button"
                :class="['baggage-pill', { active: Number(passenger.checkedBaggageKg || 0) === option.kg }]"
                @click="updatePassengerBaggage(index, option.kg)"
              >
                <span>{{ option.label }}</span>
                <strong>{{ option.price === 0 ? 'MIỄN PHÍ' : formatCurrency(option.price) }}</strong>
              </button>
            </div>
          </article>
        </section>

        <div class="booking-summary">
          <div>
            <span>Giá vé ({{ totalPassengers }} khách)</span>
            <strong>{{ formatCurrency(flightStore.baseFareTotal) }}</strong>
          </div>
          <div>
            <span>Hành lý ký gửi</span>
            <strong>{{ formatCurrency(flightStore.baggageTotal) }}</strong>
          </div>
          <div class="booking-summary__total">
            <span>Tổng thanh toán</span>
            <strong>{{ formatCurrency(flightStore.totalAmount) }}</strong>
          </div>
        </div>

        <small v-if="flightStore.validationErrors.selectedFare" class="error-text">{{ flightStore.validationErrors.selectedFare }}</small>
        <small v-if="flightStore.error" class="error-text">{{ flightStore.error }}</small>

        <div class="action-row">
          <button class="secondary-button" type="button" @click="goBackToResults">Quay lại kết quả</button>
          <button class="primary-button" type="button" :disabled="flightStore.loading" @click="handleProceedCheckout">
            Xác nhận thông tin và chọn phương thức thanh toán
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFlightStore } from '@/stores/flight/useFlightStore'
import { buildFlightSearchQuery } from '@/utils/flightSearchRoute'

const router = useRouter()
const flightStore = useFlightStore()

const totalPassengers = computed(() => flightStore.totalPassengers)

const handCarryKg = computed(() => {
  const baggageText = String(flightStore.selectedFare?.baggage || '')
  const matched = baggageText.match(/(\d+)\s*kg\s*(?:xach|xách)\s*tay/i)
  return matched ? Number(matched[1]) : 7
})

const updateContact = (field, value) => {
  flightStore.updateContactForm({
    [field]: value
  })
}

const updatePassenger = (index, field, value) => {
  flightStore.updatePassenger(index, {
    [field]: value
  })
}

const updatePassengerBaggage = (index, kg) => {
  flightStore.updatePassengerBaggage(index, kg)
}

const baggageOptionsForPassenger = (passenger) => {
  if (passenger?.type === 'infant') {
    return flightStore.baggageOptions.filter((item) => Number(item.kg) === 0)
  }
  return flightStore.baggageOptions
}

const handleProceedCheckout = () => {
  if (!flightStore.validateBookingForm()) return

  router.push({ name: 'flight-checkout' })
}

const goBackToResults = () => {
  router.push({
    name: 'flight-results',
    query: buildFlightSearchQuery(flightStore.searchParams)
  })
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
</script>

<style scoped>
.flight-contact-page {
  margin-bottom: 32px;
}

.booking-form-section {
  margin-top: 8px;
}

.section-headline h1 {
  margin: 4px 0;
}

.form-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 14px;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.contact-grid label,
.passenger-card label {
  display: grid;
  gap: 6px;
  font-size: 0.88rem;
  color: #22324d;
}

.contact-grid input,
.passenger-mini-grid input,
.passenger-mini-grid select,
.passenger-card input {
  width: 100%;
  min-height: 40px;
  border: 1px solid #d4e0f0;
  border-radius: 8px;
  padding: 0 10px;
}

.passenger-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
}

.passenger-card {
  border: 1px solid #dce8f7;
  border-radius: 12px;
  padding: 10px;
}

.passenger-card h4 {
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.passenger-card h4 span {
  font-size: 0.78rem;
  color: #657892;
}

.passenger-mini-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.baggage-card {
  border-radius: 14px;
  border: 1px solid #b7e5dd;
  background: linear-gradient(180deg, #d7f2f8 0%, #eaf7f4 100%);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.baggage-card h3 {
  margin: 0;
  color: #123e57;
}

.baggage-passenger-row {
  border-radius: 12px;
  border: 1px solid #d6e7f2;
  background: #fff;
  padding: 10px;
  display: grid;
  gap: 10px;
}

.baggage-passenger-row strong {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.baggage-passenger-row strong small {
  color: #65809d;
  font-weight: 600;
}

.baggage-passenger-row p {
  margin: 4px 0 0;
  color: #4f6382;
  font-size: 0.9rem;
}

.baggage-option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
}

.baggage-pill {
  min-height: 46px;
  border-radius: 999px;
  border: 1px solid #c5d6ea;
  background: #fff;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 2px;
  cursor: pointer;
}

.baggage-pill span {
  font-size: 0.86rem;
  color: #3d567a;
}

.baggage-pill strong {
  font-size: 0.82rem;
  color: #5f6f84;
}

.baggage-pill.active {
  border-color: var(--primary);
  background: rgba(10, 109, 217, 0.08);
}

.baggage-pill.active strong {
  color: var(--primary);
}

.booking-summary {
  border: 1px dashed var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  display: grid;
  gap: 8px;
}

.booking-summary > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.booking-summary__total {
  padding-top: 8px;
  border-top: 1px solid var(--border);
  font-size: 1.04rem;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 1024px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .passenger-mini-grid {
    grid-template-columns: 1fr;
  }

  .action-row {
    flex-direction: column;
  }
}
</style>
