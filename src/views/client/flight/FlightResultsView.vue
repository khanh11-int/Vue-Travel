<template>
  <section class="page-section flight-results-page">
    <div class="flight-results-head">
      <div>
        <p class="eyebrow">Kết quả chuyến bay</p>
        <h1>Chuyến bay phù hợp cho hành trình {{ fromAirport }} - {{ toAirport }}</h1>
        <p class="muted">{{ flightStore.processedFlights.length }} chuyến phù hợp theo ngày bay và hạng vé đã chọn.</p>
      </div>

      <div class="flight-results-actions">
        <button class="secondary-button" type="button" @click="goBackToSearch">Sửa tìm kiếm</button>
        <div class="flight-results-meta">
          <span>{{ departDate }}</span>
          <span>{{ totalPassengers }} khách</span>
          <span>{{ cabinLabel }}</span>
        </div>
      </div>
    </div>

    <p v-if="searchErrorMessage" class="error-text flight-results-error">{{ searchErrorMessage }}</p>

    <div class="flight-results-layout">
      <aside class="flight-filter-card">
        <h3>Bộ lọc</h3>

        <div class="filter-block">
          <p>Hãng bay</p>
          <label v-for="item in airlineOptions" :key="item.code" class="check-line">
            <input
              :value="item.code"
              type="checkbox"
              v-model="filterState.airlines"
              @change="applyFilters"
            />
            <span>{{ item.name }}</span>
          </label>
        </div>

        <div class="filter-block">
          <p>Khung giờ</p>
          <label v-for="item in timeWindows" :key="item.value" class="check-line">
            <input
              :value="item.value"
              type="checkbox"
              v-model="filterState.timeWindows"
              @change="applyFilters"
            />
            <span>{{ item.label }}</span>
          </label>
        </div>

        <div class="filter-block">
          <p>Khoảng giá (VND)</p>
          <div class="price-grid">
            <input type="number" min="0" v-model.number="filterState.priceRange[0]" @blur="applyFilters" />
            <input type="number" min="0" v-model.number="filterState.priceRange[1]" @blur="applyFilters" />
          </div>
        </div>
      </aside>

      <div class="flight-list-column">
        <div class="flight-sort-row">
          <label>
            Sắp xếp
            <select v-model="sortBy" @change="handleSortChange">
              <option value="price-lowest">Giá thấp nhất</option>
              <option value="depart-earliest">Cất cánh sớm nhất</option>
              <option value="duration-shortest">Thời gian bay ngắn nhất</option>
            </select>
          </label>
        </div>

        <article v-for="flight in processedFlights" :key="flight.id" class="flight-card">
          <div class="flight-card__left">
            <div class="flight-badge">{{ flight.airlineName }}</div>
            <strong>{{ flight.flightNumber }}</strong>
            <p class="muted">{{ flight.aircraft }}</p>
          </div>

          <div class="flight-card__timeline">
            <div>
              <strong>{{ flight.departureTime }}</strong>
              <p>{{ flight.fromAirport }}</p>
            </div>
            <div class="timeline-line">
              <span>{{ `${flight.stopCount || 0} điểm dừng` }}</span>
              <small>{{ formatDuration(flight.durationMinutes) }}</small>
            </div>
            <div>
              <strong>{{ flight.arrivalTime }}</strong>
              <p>{{ flight.toAirport }}</p>
            </div>
          </div>

          <div class="flight-card__right">
            <p class="fare-label">{{ flight.effectiveCabinLabel }}</p>
            <strong class="fare-price">{{ formatCurrency(flight.effectiveFare) }}</strong>
            <small class="muted">Còn {{ flight.effectiveSeatLeft }} chỗ</small>
            <button class="primary-button" type="button" @click="openFareModal(flight)">Chọn hạng vé</button>
          </div>
        </article>

        <div v-if="!processedFlights.length" class="empty-state-card">
          <h3>Không có chuyến bay phù hợp</h3>
          <p>Hãy thử đổi ngày bay, bỏ bớt bộ lọc hoặc thay đổi chặng bay.</p>
        </div>
      </div>
    </div>

    <div v-if="fareModalFlight" class="modal-backdrop" @click.self="closeFareModal">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="fare-modal-title">
        <h3 id="fare-modal-title">Chọn hạng vé - {{ fareModalFlight.flightNumber }}</h3>
        <p class="muted">{{ fareModalFlight.airlineName }} · {{ fareModalFlight.fromAirport }} - {{ fareModalFlight.toAirport }}</p>

        <div class="fare-grid">
          <article v-for="fare in fareOptions" :key="fare.cabinClass" class="fare-item">
            <h4>{{ fare.label }}</h4>
            <p class="fare-price">{{ formatCurrency(fare.price) }}</p>
            <p class="muted">Hành lý: {{ fare.baggage || 'Theo quy định hãng bay' }}</p>
            <p class="muted">{{ fare.refundPolicy || 'Áp dụng điều kiện vé tiêu chuẩn' }}</p>
            <p class="muted">Còn {{ fare.seatLeft }} chỗ</p>
            <button
              class="primary-button"
              type="button"
              :disabled="fare.seatLeft < totalPassengers"
              @click="handleSelectFare(fare)"
            >
              {{ fare.seatLeft < totalPassengers ? 'Không đủ chỗ' : 'Chọn vé' }}
            </button>
          </article>
        </div>

        <button class="secondary-button" type="button" @click="closeFareModal">Đóng</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlightStore } from '@/stores/flight/useFlightStore'

const route = useRoute()
const router = useRouter()
const flightStore = useFlightStore()

const fareModalFlight = ref(null)

const timeWindows = computed(() => flightStore.timeWindows)
const airlineOptions = computed(() => flightStore.airlineOptions)
const processedFlights = computed(() => flightStore.processedFlights)
const totalPassengers = computed(() => flightStore.totalPassengers)
const sortBy = computed({
  get: () => flightStore.sortBy,
  set: (value) => flightStore.setSortBy(value)
})

const cabinLabel = computed(() => {
  const matched = flightStore.cabinOptions.find((item) => item.value === flightStore.searchParams.cabinClass)
  return matched?.label || flightStore.searchParams.cabinClass || 'Phổ thông'
})

const fromAirport = computed(() => flightStore.searchParams.fromAirport)
const toAirport = computed(() => flightStore.searchParams.toAirport)
const departDate = computed(() => flightStore.searchParams.departDate)
const searchErrorMessage = computed(() => {
  return (
    flightStore.validationErrors.route
    || flightStore.validationErrors.fromAirport
    || flightStore.validationErrors.toAirport
    || flightStore.validationErrors.departDate
    || flightStore.validationErrors.passengers
    || flightStore.error
  )
})

const filterState = reactive({
  airlines: [],
  timeWindows: [],
  priceRange: [0, 10000000]
})

const fareOptions = computed(() => {
  if (!fareModalFlight.value) return []
  const fares = fareModalFlight.value?.cabinFares || {}

  return Object.entries(fares).map(([cabin, fare]) => ({
    cabinClass: cabin,
    label: fare?.label || cabin,
    price: Math.max(0, Number(fare?.price || 0) || 0),
    baggage: String(fare?.baggage || ''),
    refundPolicy: String(fare?.refundPolicy || ''),
    seatLeft: Math.max(0, Number(fare?.seatLeft || 0) || 0)
  }))
})

watch(
  () => flightStore.filters,
  () => {
    const [minPrice, maxPrice] = flightStore.filters.priceRange
    filterState.airlines = [...flightStore.filters.airlines]
    filterState.timeWindows = [...flightStore.filters.timeWindows]
    filterState.priceRange = [minPrice, maxPrice]
  },
  { immediate: true, deep: true }
)

const applyFilters = () => {
  flightStore.setFilters(filterState)
}

const handleSortChange = () => {
  flightStore.setSortBy(sortBy.value)
}

const loadResults = async (query = {}) => {
  await flightStore.hydrateFromQuery(query)
  await flightStore.searchFlights()
}

const openFareModal = (flight) => {
  fareModalFlight.value = flight
}

const closeFareModal = () => {
  fareModalFlight.value = null
}

const handleSelectFare = (fare) => {
  if (!fareModalFlight.value) return
  flightStore.selectFare(fareModalFlight.value.id, fare)
  closeFareModal()
  router.push({ name: 'flight-contact' })
}

const goBackToSearch = () => {
  router.push({ name: 'flight-home', query: flightStore.searchParams })
}

const formatCurrency = (value) => {
  const amount = Math.max(0, Number(value || 0) || 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDuration = (minutes) => {
  const total = Math.max(0, Number(minutes || 0) || 0)
  const hour = Math.floor(total / 60)
  const remainMinute = total % 60
  return `${hour}h ${remainMinute}m`
}

watch(
  () => route.query,
  (query) => {
    loadResults(query)
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
.flight-results-page {
  margin-bottom: 32px;
}

.flight-results-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.flight-results-head h1 {
  margin: 4px 0 8px;
}

.flight-results-actions {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.flight-results-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  color: #4a5d7a;
  font-size: 0.92rem;
}

.flight-results-meta span {
  padding: 6px 10px;
  border-radius: 999px;
  background: #edf4ff;
  border: 1px solid #d6e2f4;
}

.flight-results-error {
  margin-top: 12px;
}

.flight-results-layout {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 14px;
}

.flight-filter-card,
.empty-state-card {
  background: #fff;
  border: 1px solid #dbe5f4;
  border-radius: 14px;
  padding: 14px;
}

.flight-filter-card h3 {
  margin-top: 0;
}

.filter-block {
  margin-top: 12px;
  border-top: 1px dashed #d8e5f7;
  padding-top: 12px;
}

.filter-block p {
  margin: 0 0 8px;
  font-weight: 700;
}

.check-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.price-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.price-grid input,
.flight-sort-row select {
  width: 100%;
  min-height: 40px;
  border: 1px solid #d4e0f0;
  border-radius: 8px;
  padding: 0 10px;
}

.flight-list-column {
  display: grid;
  gap: 10px;
}

.flight-sort-row {
  display: flex;
  justify-content: flex-end;
}

.flight-sort-row label {
  display: grid;
  gap: 6px;
  font-size: 0.9rem;
}

.flight-card {
  background: #fff;
  border: 1px solid #dbe5f4;
  border-radius: 14px;
  padding: 14px;
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr) 220px;
  gap: 12px;
  align-items: center;
}

.flight-badge {
  display: inline-block;
  background: #ebf3ff;
  color: #0d56a7;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  margin-bottom: 8px;
}

.flight-card__timeline {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) 80px;
  align-items: center;
  gap: 8px;
}

.timeline-line {
  text-align: center;
  border-top: 2px dashed #cedcf2;
  padding-top: 8px;
}

.timeline-line span {
  display: block;
  font-size: 0.86rem;
  color: #2b3f5f;
}

.timeline-line small {
  color: #677894;
}

.flight-card__right {
  display: grid;
  justify-items: end;
  gap: 4px;
}

.fare-label {
  margin: 0;
  color: #0a64c7;
  font-weight: 700;
}

.fare-price {
  font-size: 1.2rem;
  color: #0f274a;
}

.empty-state-card {
  text-align: center;
}

.fare-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0 18px;
}

.fare-item {
  display: grid;
  align-content: start;
  gap: 10px;
  border: 1px solid #dce8f7;
  border-radius: 18px;
  padding: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 14px 30px rgba(17, 46, 90, 0.08);
  min-height: 252px;
}

.fare-item h4 {
  margin: 0;
  font-size: 0.98rem;
  color: #17314f;
  letter-spacing: 0.01em;
}

.fare-item .fare-price {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.1;
  color: #0f274a;
}

.fare-item .muted {
  margin: 0;
  color: #5f718d;
  line-height: 1.45;
  font-size: 0.92rem;
}

.fare-item button {
  width: 100%;
  margin-top: auto;
  min-height: 44px;
  border-radius: 999px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 22, 44, 0.45);
  display: grid;
  place-items: center;
  padding: 24px;
  z-index: 60;
}

.modal-card {
  width: min(1180px, 100%);
  max-height: 90vh;
  overflow: auto;
  background: #fff;
  border-radius: 22px;
  border: 1px solid #dbe5f4;
  box-shadow: 0 28px 55px rgba(9, 26, 58, 0.24);
  padding: 24px;
}

@media (max-width: 1100px) {
  .flight-results-layout {
    grid-template-columns: 1fr;
  }

  .flight-results-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .flight-results-actions {
    justify-items: start;
  }

  .fare-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .flight-card {
    grid-template-columns: 1fr;
  }

  .flight-card__right {
    justify-items: start;
  }

  .flight-card__timeline {
    grid-template-columns: 70px minmax(0, 1fr) 70px;
  }

  .fare-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .modal-backdrop {
    padding: 12px;
  }

  .modal-card {
    border-radius: 16px;
    padding: 16px;
  }

  .fare-item {
    min-height: 0;
    padding: 16px;
  }

  .modal-card {
    padding: 18px;
  }

  .fare-item button {
    width: 100%;
  }
}
</style>