<template>
  <section class="page-section home-ota-search-section">
    <div class="home-ota-banner-copy">
      <h1>Web du lịch hàng đầu Việt Nam</h1>
      <p>Tìm kiếm nhanh tại đây</p>
    </div>

    <div class="home-service-tabs" role="tablist" aria-label="Danh mục dịch vụ">
      <button
        v-for="tab in serviceTabs"
        :key="tab.id"
        type="button"
        :class="['home-service-tab', { active: activeService === tab.id }]"
        @click="activeService = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeService === 'flight'" class="home-ota-searchbar home-ota-searchbar--flight">
      <FlightSearchPanel
        :airports="flightStore.airports"
        :cabin-options="flightStore.cabinOptions"
        :from-airport="homeFlightFromAirport"
        :to-airport="homeFlightToAirport"
        :depart-date="homeFlightDepartDate"
        :cabin-class="homeFlightCabinClass"
        :passengers="homeFlightPassengers"
        :total-passengers="homeFlightTotalPassengers"
        :min-date="todayISO"
        :search-error-message="homeFlightSearchError"
        @update:from-airport="setHomeFlightField('fromAirport', $event)"
        @update:to-airport="setHomeFlightField('toAirport', $event)"
        @update:depart-date="setHomeFlightField('departDate', $event)"
        @update:cabin-class="setHomeFlightField('cabinClass', $event)"
        @swap="handleHomeFlightSwap"
        @search="handleHomeFlightSearch"
        @adjust-passenger="handleHomeFlightPassengerAdjust"
      />
    </div>

    <div v-else class="home-ota-searchbar">
      <template v-for="(field, index) in activeSearchFields" :key="`${field.type}-${field.key || index}`">
        <label
          v-if="['text', 'date', 'number'].includes(field.type)"
          :class="['ota-search-field', { 'ota-search-field--meta': field.type === 'number' }]"
        >
          <span :class="['ota-search-icon', `ota-search-icon--${field.icon || 'location'}`]" aria-hidden="true"></span>
          <input
            v-if="field.type === 'text'"
            :value="form[field.key] || ''"
            type="text"
            :placeholder="field.placeholder || 'Nhập thông tin tìm kiếm'"
            @input="updateFieldValue(field.key, $event.target.value)"
          />
          <input
            v-else-if="field.type === 'date'"
            :value="form[field.key] || ''"
            :min="todayISO"
            type="date"
            @input="updateFieldValue(field.key, $event.target.value)"
          />
          <input
            v-else
            :value="form[field.key]"
            type="number"
            :min="field.min || 1"
            :max="field.max || 50"
            :placeholder="field.placeholder || 'Số lượng'"
            @input="updateFieldValue(field.key, Number($event.target.value))"
          />
        </label>

        <label v-else-if="field.type === 'date-range'" class="ota-search-field ota-search-field--range">
          <span :class="['ota-search-icon', `ota-search-icon--${field.icon || 'calendar'}`]" aria-hidden="true"></span>
          <input
            :value="form[field.startKey] || ''"
            :min="todayISO"
            type="date"
            @input="updateFieldValue(field.startKey, $event.target.value)"
          />
          <span class="ota-search-divider">-</span>
          <input
            :value="form[field.endKey] || ''"
            :min="form[field.startKey] || todayISO"
            type="date"
            @input="updateFieldValue(field.endKey, $event.target.value)"
          />
        </label>

        <div v-else-if="field.type === 'guest-room'" class="ota-search-field ota-search-field--meta ota-search-field--selector">
          <span :class="['ota-search-icon', `ota-search-icon--${field.icon || 'users'}`]" aria-hidden="true"></span>
          <GuestRoomSelector v-if="activeService === 'hotel'" v-model="guestRoomSelection" />
          <TicketGuestSelector v-else-if="activeService === 'ticket'" v-model="ticketGuestSelection" />
          <TourTravelerSelector v-else-if="activeService === 'tour'" v-model="travelerSelection" />
        </div>
      </template>

      <router-link :to="searchTarget" class="primary-button ota-search-cta">{{ searchButtonLabel }}</router-link>
    </div>
  </section>

  <section class="page-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Ưu đãi nổi bật</p>
        <h2>Đừng bỏ lỡ các ưu đãi hấp dẫn cho chuyến đi của bạn.</h2>
      </div>
      <router-link to="/dich-vu" class="secondary-button">Xem tất cả</router-link>
    </div>

    <div class="home-feature-groups">
      <section class="home-feature-group">
        <h3>Nhiều lựa chọn khách sạn</h3>
        <div class="travel-grid home-feature-grid">
          <TravelCard
            v-for="service in latestHotels"
            :key="`hotel-${service.id}`"
            :service="service"
            :is-wishlisted="isWishlisted(service.id)"
            @toggle-wishlist="handleToggleWishlist"
          />
        </div>
      </section>

      <section class="home-feature-group">
        <h3>Tour du lịch hấp dẫn</h3>
        <div class="travel-grid home-feature-grid">
          <TravelCard
            v-for="service in latestTours"
            :key="`tour-${service.id}`"
            :service="service"
            :is-wishlisted="isWishlisted(service.id)"
            @toggle-wishlist="handleToggleWishlist"
          />
        </div>
      </section>

      <section class="home-feature-group">
        <h3>Các hoạt động du lịch đa dạng</h3>
        <div class="travel-grid home-feature-grid">
          <TravelCard
            v-for="service in latestTickets"
            :key="`ticket-${service.id}`"
            :service="service"
            :is-wishlisted="isWishlisted(service.id)"
            @toggle-wishlist="handleToggleWishlist"
          />
        </div>
      </section>
    </div>
  </section>

  <section id="diem-dieu-tro-noi-bat" class="page-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Điểm đến nổi bật</p>
        <h2>Khám phá các địa điểm du lịch hàng đầu tại Việt Nam.</h2>
      </div>
      <router-link to="/dich-vu" class="secondary-button">Khám phá thêm</router-link>
    </div>

    <div class="hero-card home-hero__featured">
      <ul class="home-destination-list">
        <li v-for="destination in featuredDestinations" :key="destination.id">
          <div>
            <strong>{{ destination.name }}</strong>
            <span>{{ destination.province }}</span>
          </div>
          <router-link :to="{ name: 'travel-list', query: { province: destination.province } }">Khám phá</router-link>
        </li>
      </ul>
    </div>
  </section>

  <section id="uu-dai-hot" class="page-section home-promo-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Ưu đãi hot</p>
        <h2>Mã khuyến mãi nổi bật cho chuyến đi trong nước.</h2>
      </div>
      <router-link to="/dich-vu" class="secondary-button">Khám phá dịch vụ</router-link>
    </div>

    <div class="promo-grid home-promo-grid">
      <article v-for="promotion in activePromotions" :key="promotion.id" class="promo-card home-promo-card">
        <p class="eyebrow eyebrow--blue">{{ promotion.code }}</p>
        <h3>{{ promotion.description }}</h3>
        <p class="muted">Hiệu lực từ {{ promotion.startDate }} đến {{ promotion.endDate }}</p>
        <p class="home-promo-note">Áp dụng cho booking nội địa theo điều kiện chương trình.</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GuestRoomSelector from '@/components/travel/GuestRoomSelector.vue'
import TicketGuestSelector from '@/components/travel/TicketGuestSelector.vue'
import TourTravelerSelector from '@/components/travel/TourTravelerSelector.vue'
import { useHotelGuestRoomStore } from '@/stores/hotelGuestRoom/useHotelGuestRoomStore'
import { useCategorySearchSchemaStore } from '@/stores/categorySearchSchema/useCategorySearchSchemaStore'
import TravelCard from '@/components/travel/TravelCard.vue'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { useWishlistStore } from '@/stores/wishlist/useWishlistStore'
import { useFlightStore } from '@/stores/flight/useFlightStore'
import FlightSearchPanel from '@/components/travel/FlightSearchPanel.vue'
import { useRouter } from 'vue-router'
import { buildFlightSearchQuery } from '@/utils/flightSearchRoute'

const DEFAULT_GUEST_QUERY_KEYS = {
  guests: 'guests',
  adults: 'adults',
  children: 'children',
  rooms: 'rooms',
  childrenAges: 'childrenAges'
}

const route = useRoute()
const router = useRouter()
const serviceStore = useServiceStore()
const wishlistStore = useWishlistStore()
const flightStore = useFlightStore()
const guestRoomStore = useHotelGuestRoomStore()
const categorySearchSchemaStore = useCategorySearchSchemaStore()

const activeService = ref('')

const todayISO = (() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})()

const categories = computed(() => {
  return Array.isArray(serviceStore.categories)
    ? serviceStore.categories.filter((category) => category?.status !== 'inactive')
    : []
})

const matchedCategoryByPath = computed(() => {
  return categories.value.find((category) => category.searchPath === route.path || category.homePath === route.path) || null
})

const routeCategoryId = computed(() => {
  return String(route.query.category || matchedCategoryByPath.value?.id || categories.value[0]?.id || '')
})

const currentCategoryId = computed(() => {
  if (activeService.value) return String(activeService.value)
  return routeCategoryId.value
})

const activeCategory = computed(() => {
  return categories.value.find((category) => String(category.id) === currentCategoryId.value)
    || matchedCategoryByPath.value
    || categories.value[0]
    || null
})

const activeSearchConfig = computed(() => activeCategory.value?.searchConfig || null)
const activeSearchFields = computed(() => {
  return Array.isArray(activeSearchConfig.value?.fields) ? activeSearchConfig.value.fields : []
})

const createDefaultFormState = (searchConfig = null) => {
  const defaults = searchConfig?.defaults && typeof searchConfig.defaults === 'object'
    ? { ...searchConfig.defaults }
    : {}
  const fields = Array.isArray(searchConfig?.fields) ? searchConfig.fields : []

  fields.forEach((field) => {
    if (field.type === 'guest-room') return

    if (field.type === 'date-range') {
      const startKey = field.startKey || 'startDate'
      const endKey = field.endKey || 'endDate'
      defaults[startKey] = defaults[startKey] || ''
      defaults[endKey] = defaults[endKey] || ''
      return
    }

    const key = field.key
    if (!key) return

    if (field.type === 'number') {
      const minimum = Number(field.min || 1)
      const parsed = Number(defaults[key] || field.defaultValue || minimum)
      defaults[key] = Math.max(minimum, Number.isFinite(parsed) ? parsed : minimum)
      return
    }

    defaults[key] = defaults[key] || ''
  })

  return defaults
}

watch([activeSearchConfig, currentCategoryId], () => {
  const categoryId = currentCategoryId.value
  if (!categoryId) return

  categorySearchSchemaStore.ensureCategoryFormState(
    categoryId,
    createDefaultFormState(activeSearchConfig.value)
  )
}, { immediate: true })

watch([categories, activeSearchConfig], () => {
  categorySearchSchemaStore.syncCategoryFormState(
    categories.value,
    (category) => createDefaultFormState(category.searchConfig || null)
  )
}, { immediate: true })

const form = computed(() => {
  return categorySearchSchemaStore.getCurrentFormState({
    storeByCategory: true,
    categoryId: currentCategoryId.value
  })
})

const updateFieldValue = (key, value) => {
  if (!key) return
  categorySearchSchemaStore.setFieldValue({
    storeByCategory: true,
    categoryId: currentCategoryId.value,
    key,
    value
  })
}

const guestRoomSelection = computed({
  get: () => guestRoomStore.selection,
  set: (value) => guestRoomStore.setSelection(value)
})

const searchButtonLabel = computed(() => {
  return activeSearchConfig.value?.submitLabel || 'Tìm dịch vụ'
})

const baseSearchTarget = computed(() => {
  const query = new URLSearchParams()
  if (currentCategoryId.value) {
    query.set('category', currentCategoryId.value)
  }

  activeSearchFields.value.forEach((field) => {
    if (field.type === 'guest-room') {
      const guestRoomQuery = guestRoomStore.getQueryPayload()
      const queryKeys = { ...DEFAULT_GUEST_QUERY_KEYS, ...(field.queryKeys || {}) }

      query.set(queryKeys.guests, guestRoomQuery.guests)
      query.set(queryKeys.adults, guestRoomQuery.adults)
      query.set(queryKeys.children, guestRoomQuery.children)
      query.set(queryKeys.rooms, guestRoomQuery.rooms)

      if (guestRoomQuery.childrenAges) {
        query.set(queryKeys.childrenAges, guestRoomQuery.childrenAges)
      }
      return
    }

    if (field.type === 'date-range') {
      const startKey = field.startKey || 'startDate'
      const endKey = field.endKey || 'endDate'
      const startValue = form.value[startKey]
      const endValue = form.value[endKey]

      if (startValue) query.set(field.startQueryKey || startKey, startValue)
      if (endValue) query.set(field.endQueryKey || endKey, endValue)
      return
    }

    if (!field.key) return

    if (field.type === 'number') {
      const min = Number(field.min || 1)
      const raw = Number(form.value[field.key] || field.defaultValue || min)
      const normalized = Math.max(min, Number.isFinite(raw) ? raw : min)
      query.set(field.queryKey || field.key, String(normalized))
      return
    }

    const fieldValue = form.value[field.key]
    if (fieldValue) {
      query.set(field.queryKey || field.key, String(fieldValue))
    }
  })

  return `/dich-vu?${query.toString()}`
})

const ticketGuestSelection = ref({
  tickets: 2,
  children: 0,
  childrenAges: []
})

const homeFlightPassengers = ref({
  adults: 1,
  children: 0,
  infants: 0
})

const homeFlightSearchError = ref('')

const travelerSelection = ref({
  adults: 2,
  children: 0,
  childrenAges: []
})

const serviceTabs = computed(() => {
  return categories.value.map((category) => ({
    id: category.id,
    label: category.name
  }))
})

const ensureActiveService = () => {
  const tabs = serviceTabs.value
  if (!tabs.length) {
    activeService.value = ''
    return
  }

  const hasCurrent = tabs.some((tab) => tab.id === activeService.value)
  if (!hasCurrent) {
    activeService.value = tabs[0].id
  }
}

watch(serviceTabs, () => {
  ensureActiveService()
}, { immediate: true })

const homeFlightTotalPassengers = computed(() => {
  const adults = Math.max(1, Number(homeFlightPassengers.value.adults || 1) || 1)
  const children = Math.max(0, Number(homeFlightPassengers.value.children || 0) || 0)
  const infants = Math.max(0, Number(homeFlightPassengers.value.infants || 0) || 0)
  return adults + children + infants
})

const homeFlightFromAirport = computed(() => String(form.value.fromAirport || 'HAN').trim().toUpperCase())
const homeFlightToAirport = computed(() => String(form.value.toAirport || 'SGN').trim().toUpperCase())
const homeFlightDepartDate = computed(() => String(form.value.departDate || todayISO).trim())
const homeFlightCabinClass = computed(() => String(form.value.cabinClass || 'economy').trim())

const setHomeFlightField = (key, value) => {
  homeFlightSearchError.value = ''
  updateFieldValue(key, value)
}

const handleHomeFlightSwap = () => {
  const currentFrom = homeFlightFromAirport.value
  const currentTo = homeFlightToAirport.value
  setHomeFlightField('fromAirport', currentTo)
  setHomeFlightField('toAirport', currentFrom)
}

const handleHomeFlightPassengerAdjust = ({ key, delta } = {}) => {
  if (!key || !delta) return

  const next = {
    ...homeFlightPassengers.value
  }

  const floor = key === 'adults' ? 1 : 0
  const current = Number(next[key] || 0)
  const candidate = Math.max(floor, current + Number(delta || 0))
  next[key] = candidate

  const total = Math.max(1, Number(next.adults || 1)) + Math.max(0, Number(next.children || 0)) + Math.max(0, Number(next.infants || 0))
  if (total > 9) return

  if (key === 'adults' && Number(next.infants || 0) > Number(next.adults || 1)) {
    next.infants = Number(next.adults || 1)
  }

  if (key === 'infants' && Number(next.infants || 0) > Number(next.adults || 1)) {
    return
  }

  homeFlightSearchError.value = ''
  homeFlightPassengers.value = {
    adults: Math.max(1, Number(next.adults || 1) || 1),
    children: Math.max(0, Number(next.children || 0) || 0),
    infants: Math.max(0, Number(next.infants || 0) || 0)
  }
}

const handleHomeFlightSearch = () => {
  const fromAirport = homeFlightFromAirport.value
  const toAirport = homeFlightToAirport.value
  const departDate = homeFlightDepartDate.value

  if (!fromAirport || !toAirport) {
    homeFlightSearchError.value = 'Vui lòng chọn điểm đi và điểm đến.'
    return
  }

  if (fromAirport === toAirport) {
    homeFlightSearchError.value = 'Điểm đi và điểm đến không được trùng nhau.'
    return
  }

  if (!departDate || departDate < todayISO) {
    homeFlightSearchError.value = 'Ngày bay phải từ hôm nay trở đi.'
    return
  }

  const adults = Math.max(1, Number(homeFlightPassengers.value.adults || 1) || 1)
  const children = Math.max(0, Number(homeFlightPassengers.value.children || 0) || 0)
  const infants = Math.max(0, Number(homeFlightPassengers.value.infants || 0) || 0)

  if (infants > adults) {
    homeFlightSearchError.value = 'Số em bé không được vượt số người lớn.'
    return
  }

  homeFlightSearchError.value = ''
  router.push({
    name: 'flight-results',
    query: buildFlightSearchQuery({
      fromAirport,
      toAirport,
      departDate,
      adults,
      children,
      infants,
      cabinClass: homeFlightCabinClass.value || 'economy'
    })
  })
}

watch(
  () => [activeService.value, currentCategoryId.value],
  () => {
    if (activeService.value !== 'flight') return

    if (!form.value.fromAirport) updateFieldValue('fromAirport', 'HAN')
    if (!form.value.toAirport) updateFieldValue('toAirport', 'SGN')
    if (!form.value.departDate) updateFieldValue('departDate', todayISO)
    if (!form.value.cabinClass) updateFieldValue('cabinClass', 'economy')

    const storedAdults = Math.max(1, Number(form.value.passengers || homeFlightPassengers.value.adults || 1) || 1)
    if (storedAdults !== Number(homeFlightPassengers.value.adults || 1)) {
      homeFlightPassengers.value = {
        adults: storedAdults,
        children: Math.max(0, Number(homeFlightPassengers.value.children || 0) || 0),
        infants: Math.max(0, Number(homeFlightPassengers.value.infants || 0) || 0)
      }
    }
  },
  { immediate: true }
)

watch(
  homeFlightTotalPassengers,
  (nextTotal) => {
    if (activeService.value !== 'flight') return
    updateFieldValue('passengers', String(nextTotal))
  },
  { immediate: true }
)

const searchTarget = computed(() => {
  if (activeService.value === 'hotel') {
    return baseSearchTarget.value
  }

  const basePath = '/dich-vu'
  const query = new URLSearchParams()
  
  query.set('category', String(activeService.value))

  if (activeService.value === 'ticket') {
    if (form.value.destination) query.set('destination', form.value.destination)
    if (form.value.useDate) query.set('useDate', form.value.useDate)

    const tickets = Math.max(1, Number(ticketGuestSelection.value.tickets || 1) || 1)
    const children = Math.max(0, Number(ticketGuestSelection.value.children || 0) || 0)
    const childrenAges = Array.isArray(ticketGuestSelection.value.childrenAges)
      ? ticketGuestSelection.value.childrenAges
          .slice(0, children)
          .map((age) => Math.min(17, Math.max(1, Number(age) || 8)))
      : []

    query.set('ticketQuantity', String(tickets))
    query.set('adults', String(tickets))
    query.set('children', String(children))
    query.set('quantity', String(tickets + children))
    if (childrenAges.length) {
      query.set('childrenAges', childrenAges.join(','))
    }
  } else if (activeService.value === 'flight') {
    const normalizedFromAirport = homeFlightFromAirport.value
    const normalizedToAirport = homeFlightToAirport.value
    const normalizedDepartDate = homeFlightDepartDate.value
    const normalizedCabinClass = homeFlightCabinClass.value
    const adults = Math.max(1, Number(homeFlightPassengers.value.adults || 1) || 1)
    const children = Math.max(0, Number(homeFlightPassengers.value.children || 0) || 0)
    const infants = Math.max(0, Number(homeFlightPassengers.value.infants || 0) || 0)

    if (normalizedFromAirport) query.set('fromAirport', normalizedFromAirport)
    if (normalizedToAirport) query.set('toAirport', normalizedToAirport)
    if (normalizedDepartDate) query.set('departDate', normalizedDepartDate)
    query.set('adults', String(adults))
    query.set('children', String(children))
    query.set('infants', String(infants))
    query.set('cabinClass', normalizedCabinClass || 'economy')

    return `/ve-may-bay?${query.toString()}`
  } else if (activeService.value === 'tour') {
    if (form.value.destination) query.set('destination', form.value.destination)
    if (form.value.startDate) query.set('startDate', form.value.startDate)
    if (form.value.endDate) query.set('endDate', form.value.endDate)

    const adults = Math.max(1, Number(travelerSelection.value.adults || 1) || 1)
    const children = Math.max(0, Number(travelerSelection.value.children || 0) || 0)
    const childrenAges = Array.isArray(travelerSelection.value.childrenAges)
      ? travelerSelection.value.childrenAges
          .slice(0, children)
          .map((age) => Math.min(17, Math.max(1, Number(age) || 8)))
      : []

    query.set('travelers', String(adults + children))
    query.set('adults', String(adults))
    query.set('children', String(children))
    query.set('quantity', String(adults + children))
    if (childrenAges.length) {
      query.set('childrenAges', childrenAges.join(','))
    }
  }

  return `${basePath}?${query.toString()}`
})

const activeServices = computed(() => {
  const source = Array.isArray(serviceStore.services) ? serviceStore.services : []
  return source.filter((service) => Number(service?.availableSlots || 0) > 0)
})

const getSortableId = (service) => {
  const rawId = String(service?.id ?? '').trim()
  const numericId = Number(rawId)
  if (Number.isFinite(numericId)) return numericId

  const digitOnly = Number(rawId.replace(/\D/g, ''))
  return Number.isFinite(digitOnly) ? digitOnly : 0
}

const getLatestByCategory = (categoryId) => {
  return activeServices.value
    .filter((service) => String(service?.categoryId) === categoryId && Number(service?.discountPercent || 0) > 0)
    .sort((left, right) => getSortableId(right) - getSortableId(left))
    .slice(0, 4)
}

const latestHotels = computed(() => getLatestByCategory('hotel'))
const latestTours = computed(() => getLatestByCategory('tour'))
const latestTickets = computed(() => getLatestByCategory('ticket'))
const activePromotions = computed(() => (Array.isArray(serviceStore.activePromotions) ? serviceStore.activePromotions : []).slice(0, 3))
const featuredDestinations = computed(() => (Array.isArray(serviceStore.destinations) ? serviceStore.destinations : []).slice(0, 6))

const handleToggleWishlist = (serviceId) => {
  wishlistStore.toggleWishlist(serviceId)
}

const isWishlisted = (serviceId) => {
  const wishlist = Array.isArray(wishlistStore.wishlist) ? wishlistStore.wishlist : []
  const numericServiceId = Number(serviceId)

  if (!Number.isNaN(numericServiceId)) {
    return wishlist.some((id) => Number(id) === numericServiceId)
  }

  return wishlist.some((id) => String(id) === String(serviceId))
}

</script>

<style scoped>
.home-ota-searchbar--flight {
  display: block;
  grid-template-columns: 1fr;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}

.home-ota-searchbar--flight :deep(.flight-search-card) {
  margin-top: 0;
}

.ota-search-field--selector {
  grid-template-columns: auto minmax(0, 1fr);
  padding-right: 8px;
}

.ota-search-field--selector :deep(.selector__trigger),
.ota-search-field--selector :deep(.guest-room-selector__trigger) {
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 0;
  font-weight: 700;
  color: #1d2d45;
}

.ota-search-field--selector :deep(.selector__popup),
.ota-search-field--selector :deep(.guest-room-selector__popup) {
  left: 0;
  top: calc(100% + 10px);
}

.home-feature-groups {
  display: grid;
  gap: 24px;
}

.home-feature-group h3 {
  margin: 0 0 12px;
  font-size: 1.2rem;
  color: #1b2c4a;
}

.home-feature-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
}

/* Can deu noi dung card de cac the khong bi lech hang */
.home-feature-grid :deep(.travel-card) {
  height: 100%;
}

.home-feature-grid :deep(.travel-card h3) {
  min-height: 2.8em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-feature-grid :deep(.travel-card .muted) {
  min-height: 2.6em;
}

.home-feature-grid :deep(.travel-card__price-current) {
  flex-wrap: wrap;
  row-gap: 2px;
}

@media (max-width: 1400px) {
  .home-feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .home-feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .home-feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .home-feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>