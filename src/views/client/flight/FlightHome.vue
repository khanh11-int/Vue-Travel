<template>
  <section class="page-section flight-home">
    <div class="flight-hero">
      <img
        class="flight-hero__image"
        src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80"
        alt="Vé máy bay nội địa Việt Nam"
      />
      <div class="flight-hero__overlay"></div>
      <div class="flight-hero__content">
        <p class="flight-hero__eyebrow">Vé máy bay nội địa Việt Nam</p>
        <h1>Tìm chuyến bay nhanh, giá tốt </h1>
        <p>Đặt vé dễ dàng, thanh toán linh hoạt và tận hưởng chuyến đi của bạn.</p>
      </div>
    </div>

    <UnifiedSearchPanel
      layout="inline"
      :category="'flight'"
      :model-value="searchModel"
      :min-date="todayISO"
      :flight-airports="airportOptions"
      :flight-cabin-options="cabinOptions"
      :flight-loading="flightStore.loading"
      :flight-error-message="searchErrorMessage"
      @update:model-value="searchModel = $event"
      @submit="handleSearch"
    />

    <section class="flight-showcase hero-card">
      <header class="flight-showcase__header">
        <h2>Khuyến mãi đặc biệt cho các điểm đến phổ biến</h2>
      </header>

      <div class="flight-chip-list" role="tablist" aria-label="Diem den pho bien">
        <button
          v-for="tab in dealTabs"
          :key="tab.code"
          type="button"
          :class="['flight-chip', { active: activeDealTab === tab.code }]"
          @click="activeDealTab = tab.code"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="flight-deal-row">
        <article v-for="deal in visibleDeals" :key="deal.id" class="flight-deal-card">
          <div class="flight-deal-card__media">
            <img :src="deal.image" :alt="deal.routeLabel" loading="lazy" />
          </div>
          <div class="flight-deal-card__body">
            <h3>{{ deal.routeLabel }}</h3>
            <p class="muted">{{ deal.dateLabel }}</p>
            <div class="flight-deal-card__price">
              <small>{{ formatCurrencyVND(deal.oldPrice) }}</small>
              <strong>{{ formatCurrencyVND(deal.price) }}</strong>
            </div>
            <button class="flight-deal-card__cta" type="button" @click="goDeal(deal)">Chọn ngay</button>
          </div>
        </article>
      </div>
    </section>

    <section class="flight-coupon promo-card">
      <header class="flight-coupon__header">
        <h2>Nhập mã giảm giá khi đặt vé để được ưu đãi thêm</h2>
      </header>

      <div class="flight-coupon__row">
        <article v-for="coupon in flightCoupons" :key="coupon.code" class="coupon-item">
          <div>
            <h3>{{ coupon.title }}</h3>
            <p>{{ coupon.description }}</p>
          </div>
          <div class="coupon-item__foot">
            <strong>{{ coupon.code }}</strong>
            <button type="button" @click="copyCoupon(coupon.code)">
              {{ copiedCouponCode === coupon.code ? 'Da copy' : 'Copy' }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UnifiedSearchPanel from '@/components/travel/UnifiedSearchPanel.vue'
import { useFlightStore } from '@/stores/flight/useFlightStore'
import { buildFlightSearchQuery } from '@/utils/flightSearchRoute'
import { flightsApi } from '@/services/api'
import { formatCurrencyVND, formatDateVN } from '@/utils/formatters'
import { buildSearchQueryByCategory, createSearchModelByCategory, getTodayISO } from '@/utils/searchQueryBuilder'

const route = useRoute()
const router = useRouter()
const flightStore = useFlightStore()
const allFlights = ref([])
const activeDealTab = ref('')
const copiedCouponCode = ref('')
const searchErrorMessage = ref('')

const flightCoupons = Object.freeze([
  {
    code: 'TVLKBANMOI',
    title: 'Giam den 75.000 cho lan dat ve may bay dau tien',
    description: 'Ap dung cho nguoi dung moi, don toi thieu 900.000 VND.'
  },
  {
    code: 'TVLNEW10',
    title: 'Giam toi da 250.000 cho don dat chuyen bay khu hoi',
    description: 'Ap dung khi dat 2 chieu va thanh toan online.'
  },
  {
    code: 'FLYSMART10',
    title: 'Giam 10% cho chang bay sang som',
    description: 'Khung gio cat canh truoc 09:00, so luong co han.'
  }
])

const AIRPORT_CITY = Object.freeze({
  HAN: 'Ha Noi',
  SGN: 'TP HCM',
  DAD: 'Da Nang',
  HUI: 'Hue',
  PQC: 'Phu Quoc',
  CXR: 'Nha Trang',
  UIH: 'Quy Nhon',
  TBB: 'Phu Yen',
  HPH: 'Hai Phong',
  VCA: 'Can Tho'
})

const DEAL_IMAGE = Object.freeze({
  HAN: 'https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=900&q=80',
  SGN: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80',
  DAD: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=900&q=80',
  HUI: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=900&q=80',
  PQC: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  CXR: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80',
  default: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80'
})

const availableAirportCodes = computed(() => {
  const codes = new Set()
  ;(Array.isArray(allFlights.value) ? allFlights.value : []).forEach((flight) => {
    const fromCode = String(flight?.fromAirport || '').toUpperCase()
    const toCode = String(flight?.toAirport || '').toUpperCase()
    if (fromCode) codes.add(fromCode)
    if (toCode) codes.add(toCode)
  })
  return codes
})

const airportOptions = computed(() => {
  const airports = Array.isArray(flightStore.airports) ? flightStore.airports : []
  if (!allFlights.value.length) return airports
  return airports.filter((airport) => availableAirportCodes.value.has(String(airport?.code || '').toUpperCase()))
})
const cabinOptions = computed(() => flightStore.cabinOptions)
const todayISO = getTodayISO()
const searchModel = ref(createSearchModelByCategory({
  categoryId: 'flight',
  searchConfig: null,
  routeQuery: route.query,
  todayISO
}))

const passengers = computed(() => {
  const source = searchModel.value?.passengers || {}
  return {
    adults: Math.max(1, Number(source.adults || 1) || 1),
    children: Math.max(0, Number(source.children || 0) || 0),
    infants: Math.max(0, Number(source.infants || 0) || 0)
  }
})

const cabinClass = computed(() => String(searchModel.value?.cabinClass || 'economy').trim() || 'economy')

const dealTabs = computed(() => {
  const airportMap = new Map((airportOptions.value || []).map((airport) => [airport.code, airport.name || airport.code]))
  const destinationCodes = new Set()

  ;(Array.isArray(allFlights.value) ? allFlights.value : []).forEach((flight) => {
    const code = String(flight?.toAirport || '').toUpperCase()
    if (code) destinationCodes.add(code)
  })

  const tabs = Array.from(destinationCodes)
    .sort((left, right) => {
      const leftLabel = airportMap.get(left) || AIRPORT_CITY[left] || left
      const rightLabel = airportMap.get(right) || AIRPORT_CITY[right] || right
      return leftLabel.localeCompare(rightLabel, 'vi')
    })
    .map((code) => ({
      code,
      label: airportMap.get(code) || AIRPORT_CITY[code] || code
    }))

  return [{ code: 'ALL', label: 'Tất cả' }, ...tabs]
})

const dealCards = computed(() => {
  return (Array.isArray(allFlights.value) ? allFlights.value : [])
    .map((flight) => {
      const economyFare = Number(flight?.cabinFares?.economy?.price || 0) || 0
      const price = economyFare > 0 ? economyFare : Number(flight?.basePrice || 0) || 0
      const oldPrice = Math.round(price * 1.18)
      const fromCode = String(flight?.fromAirport || '').toUpperCase()
      const toCode = String(flight?.toAirport || '').toUpperCase()
      const fromLabel = AIRPORT_CITY[fromCode] || fromCode
      const toLabel = AIRPORT_CITY[toCode] || toCode

      return {
        id: String(flight?.id || `${fromCode}-${toCode}-${flight?.flightDate || ''}`),
        fromAirport: fromCode,
        toAirport: toCode,
        departDate: String(flight?.flightDate || todayISO),
        routeLabel: `${fromLabel} - ${toLabel}`,
        dateLabel: formatDateVN(flight?.flightDate || todayISO),
        price,
        oldPrice,
        image: DEAL_IMAGE[toCode] || DEAL_IMAGE.default
      }
    })
    .filter((item) => item.fromAirport && item.toAirport && item.price > 0)
    .sort((left, right) => left.price - right.price)
    .slice(0, 16)
})

const visibleDeals = computed(() => {
  const all = dealCards.value
  if (!all.length) return []

  const selected = activeDealTab.value
  const filtered = !selected || selected === 'ALL'
    ? all
    : all.filter((item) => item.toAirport === selected)

  if (!filtered.length) {
    return all.slice(0, 5)
  }

  return filtered.slice(0, 5)
})

const handleSearch = () => {
  const { path, query, errors } = buildSearchQueryByCategory({
    category: 'flight',
    modelValue: searchModel.value
  })

  if (errors?.length) {
    searchErrorMessage.value = errors[0]
    return
  }

  searchErrorMessage.value = ''
  router.push({ path, query })
}

const goDeal = (deal) => {
  router.push({
    name: 'flight-results',
    query: buildFlightSearchQuery({
      fromAirport: deal.fromAirport,
      toAirport: deal.toAirport,
      departDate: deal.departDate,
      cabinClass: cabinClass.value,
      adults: passengers.value.adults,
      children: passengers.value.children,
      infants: passengers.value.infants
    })
  })
}

const copyCoupon = async (code) => {
  try {
    await navigator?.clipboard?.writeText(code)
    copiedCouponCode.value = code
    window.setTimeout(() => {
      if (copiedCouponCode.value === code) {
        copiedCouponCode.value = ''
      }
    }, 1400)
  } catch {
    copiedCouponCode.value = code
  }
}

const loadFlightDeals = async () => {
  try {
    const response = await flightsApi.getAll()
    allFlights.value = Array.isArray(response) ? response : []
  } catch {
    allFlights.value = []
  }
}

watch(
  dealTabs,
  (tabs) => {
    if (!tabs.length) {
      activeDealTab.value = ''
      return
    }

    const hasCurrent = tabs.some((item) => item.code === activeDealTab.value)
    if (!hasCurrent) {
      activeDealTab.value = tabs[0].code
    }
  },
  { immediate: true }
)

onMounted(() => {
  searchModel.value = createSearchModelByCategory({
    categoryId: 'flight',
    searchConfig: null,
    routeQuery: route.query,
    todayISO
  })
  loadFlightDeals()
})
</script>

<style scoped>
.flight-home {
  margin-bottom: 32px;
  display: grid;
  gap: 24px;
}

.flight-hero {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  height: 150px;
  min-height: 150px;
  max-height: 150px;
  box-shadow: 0 24px 45px rgba(9, 26, 58, 0.2);
}

.flight-hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.flight-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(7, 29, 64, 0.82), rgba(13, 89, 176, 0.26));
}

.flight-hero__content {
  position: absolute;
  z-index: 2;
  left: 28px;
  right: 28px;
  bottom: 12px;
  color: #fff;
  max-width: 740px;
}

.flight-hero__eyebrow {
  margin: 0 0 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.flight-hero__content h1 {
  margin: 0;
  font-size: clamp(1.3rem, 2.3vw, 2rem);
}

.flight-hero__content p {
  margin: 8px 0 0;
  font-size: 0.92rem;
  opacity: 0.92;
}

.flight-showcase,
.flight-coupon {
  padding: 18px;
  border-radius: 20px;
  box-shadow: var(--shadow);
}

@media (max-width: 1024px) {
  .flight-hero {
    height: 118px;
    min-height: 118px;
    max-height: 118px;
  }

  .flight-hero__content {
    bottom: 10px;
  }
}

@media (max-width: 768px) {
  .flight-hero {
    height: 96px;
    min-height: 96px;
    max-height: 96px;
    border-radius: 16px;
  }

  .flight-hero__content {
    left: 16px;
    right: 16px;
    bottom: 8px;
  }
}

.flight-showcase__header h2,
.flight-coupon__header h2 {
  margin: 0;
  color: var(--primary-dark);
  font-size: clamp(1.4rem, 2.2vw, 2rem);
  line-height: 1.2;
}

.flight-chip-list {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.flight-chip {
  border: 1px solid transparent;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(10, 109, 217, 0.1);
  color: #31547f;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.flight-chip.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.flight-deal-row {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.flight-deal-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  display: grid;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.flight-deal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(23, 32, 51, 0.1);
}

.flight-deal-card__media {
  position: relative;
  height: 120px;
}

.flight-deal-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.flight-deal-card__body {
  padding: 12px;
  display: grid;
  gap: 6px;
}

.flight-deal-card__body h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.02rem;
}

.flight-deal-card__body p {
  margin: 0;
  font-size: 0.86rem;
}

.flight-deal-card__price {
  display: grid;
  gap: 2px;
}

.flight-deal-card__price small {
  color: var(--muted);
  text-decoration: line-through;
  font-size: 0.8rem;
}

.flight-deal-card__price strong {
  color: var(--accent);
  font-size: 1.14rem;
}

.flight-deal-card__cta {
  margin-top: 4px;
  min-height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #f7faff;
  color: var(--primary-dark);
  font-weight: 700;
  cursor: pointer;
}

.flight-deal-card__cta:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.flight-coupon {
  display: grid;
  gap: 12px;
}

.flight-coupon__row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.coupon-item {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  padding: 14px;
  display: grid;
  gap: 10px;
}

.coupon-item h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text);
}

.coupon-item p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.coupon-item__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px dashed var(--border);
  padding-top: 10px;
}

.coupon-item__foot strong {
  color: var(--primary-dark);
  font-size: 0.88rem;
}

.coupon-item__foot button {
  border: 1px solid transparent;
  border-radius: 999px;
  min-height: 32px;
  padding: 0 14px;
  background: rgba(10, 109, 217, 0.12);
  color: var(--primary);
  font-weight: 700;
  cursor: pointer;
}

.coupon-item__foot button:hover {
  border-color: rgba(10, 109, 217, 0.3);
}

@media (max-width: 1320px) {
  .flight-deal-row {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .flight-deal-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .flight-coupon__row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .flight-hero {
    border-radius: 16px;
    min-height: 240px;
  }

  .flight-hero__content {
    left: 16px;
    right: 16px;
  }

  .flight-showcase,
  .flight-coupon {
    padding: 14px;
  }

  .flight-deal-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .flight-deal-row {
    grid-template-columns: 1fr;
  }
}
</style>
