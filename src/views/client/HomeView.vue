<template>
  <section class="page-section home-ota-search-section">
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

    <div class="home-ota-searchbar">
      <template v-if="activeService === 'hotel'">
        <label class="ota-search-field">
          <span class="ota-search-icon ota-search-icon--location" aria-hidden="true"></span>
          <input v-model="hotelForm.destination" type="text" placeholder="Điểm đến hoặc tên khách sạn" />
        </label>

        <label class="ota-search-field ota-search-field--range">
          <span class="ota-search-icon ota-search-icon--calendar" aria-hidden="true"></span>
          <input v-model="hotelForm.checkInDate" :min="todayISO" type="date" />
          <span class="ota-search-divider">-</span>
          <input v-model="hotelForm.checkOutDate" :min="hotelForm.checkInDate || todayISO" type="date" />
        </label>

        <label class="ota-search-field ota-search-field--meta">
          <span class="ota-search-icon ota-search-icon--users" aria-hidden="true"></span>
          <input v-model.number="hotelForm.guests" type="number" min="1" max="20" placeholder="Khách" />
          <span class="ota-search-divider">|</span>
          <input v-model.number="hotelForm.rooms" type="number" min="1" max="10" placeholder="Phòng" />
        </label>
      </template>

      <template v-else-if="activeService === 'ticket'">
        <label class="ota-search-field">
          <span class="ota-search-icon ota-search-icon--ticket" aria-hidden="true"></span>
          <input v-model="ticketForm.destination" type="text" placeholder="Địa điểm hoặc tên khu vui chơi" />
        </label>

        <label class="ota-search-field">
          <span class="ota-search-icon ota-search-icon--calendar" aria-hidden="true"></span>
          <input v-model="ticketForm.useDate" :min="todayISO" type="date" />
        </label>

        <label class="ota-search-field ota-search-field--meta">
          <span class="ota-search-icon ota-search-icon--ticket" aria-hidden="true"></span>
          <input v-model.number="ticketForm.ticketQuantity" type="number" min="1" max="30" placeholder="Số vé" />
        </label>
      </template>

      <template v-else-if="activeService === 'tour'">
        <label class="ota-search-field">
          <span class="ota-search-icon ota-search-icon--location" aria-hidden="true"></span>
          <input v-model="tourForm.destination" type="text" placeholder="Điểm đến tour" />
        </label>

        <label class="ota-search-field">
          <span class="ota-search-icon ota-search-icon--calendar" aria-hidden="true"></span>
          <input v-model="tourForm.departureDate" :min="todayISO" type="date" />
        </label>

        <label class="ota-search-field ota-search-field--meta">
          <span class="ota-search-icon ota-search-icon--user" aria-hidden="true"></span>
          <input v-model.number="tourForm.travelers" type="number" min="1" max="20" placeholder="Số người" />
        </label>
      </template>

      <template v-else>
        <label class="ota-search-field">
          <span class="ota-search-icon ota-search-icon--location" aria-hidden="true"></span>
          <input v-model="comboForm.destination" type="text" placeholder="Điểm đến combo" />
        </label>

        <label class="ota-search-field">
          <span class="ota-search-icon ota-search-icon--calendar" aria-hidden="true"></span>
          <input v-model="comboForm.applyDate" :min="todayISO" type="date" />
        </label>

        <label class="ota-search-field ota-search-field--meta">
          <span class="ota-search-icon ota-search-icon--users" aria-hidden="true"></span>
          <input v-model.number="comboForm.travelers" type="number" min="1" max="20" placeholder="Số người" />
        </label>
      </template>

      <router-link :to="searchTarget" class="primary-button ota-search-cta">{{ searchButtonLabel }}</router-link>
    </div>
  </section>

  <section class="page-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Dịch vụ tiêu biểu</p>
        <h2>Đề xuất phù hợp cho khách du lịch nội địa Việt Nam.</h2>
      </div>
      <router-link to="/dich-vu" class="secondary-button">Xem tất cả</router-link>
    </div>

    <div class="travel-grid">
      <TravelCard
        v-for="service in featuredServices"
        :key="service.id"
        :service="service"
        :is-wishlisted="contextStore.state.wishlist.includes(service.id)"
        @toggle-wishlist="catalogStore.toggleWishlist"
        @book-now="handleBookNow"
      />
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
      <router-link to="/gio-hang" class="secondary-button">Xem giỏ hàng</router-link>
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import TravelCard from '@/components/travel/TravelCard.vue'
import { useCatalogStore } from '@/stores/useCatalogStore'
import { useTravelContextStore } from '@/stores/useTravelContextStore'
import { getDetailRouteLocation } from '@/utils/serviceRouting'

const router = useRouter()
const catalogStore = useCatalogStore()
const contextStore = useTravelContextStore()
const todayISO = (() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})()

const activeService = ref('hotel')

const serviceTabs = [
  { id: 'hotel', label: 'Khách sạn' },
  { id: 'ticket', label: 'Vé tham quan' },
  { id: 'tour', label: 'Tour' },
  { id: 'combo', label: 'Combo' }
]

const hotelForm = ref({
  destination: '',
  checkInDate: '',
  checkOutDate: '',
  guests: 2,
  rooms: 1
})

const ticketForm = ref({
  destination: '',
  useDate: '',
  ticketQuantity: 2
})

const tourForm = ref({
  destination: '',
  departureDate: '',
  travelers: 2
})

const comboForm = ref({
  destination: '',
  applyDate: '',
  travelers: 2
})

const featuredServices = computed(() => (Array.isArray(catalogStore.featuredServices) ? catalogStore.featuredServices : []))
const activePromotions = computed(() => (Array.isArray(catalogStore.activePromotions) ? catalogStore.activePromotions : []).slice(0, 3))
const featuredDestinations = computed(() => (Array.isArray(contextStore.state.destinations) ? contextStore.state.destinations : []).slice(0, 6))

const searchButtonLabel = computed(() => {
  if (activeService.value === 'hotel') return 'Tìm khách sạn'
  if (activeService.value === 'ticket') return 'Tìm vé'
  if (activeService.value === 'tour') return 'Tìm tour'
  return 'Tìm combo'
})

const searchTarget = computed(() => {
  const query = new URLSearchParams()
  query.set('category', activeService.value)

  if (activeService.value === 'hotel') {
    if (hotelForm.value.destination) query.set('destination', hotelForm.value.destination)
    if (hotelForm.value.checkInDate) query.set('checkInDate', hotelForm.value.checkInDate)
    if (hotelForm.value.checkOutDate) query.set('checkOutDate', hotelForm.value.checkOutDate)
    query.set('guests', String(Math.max(1, Number(hotelForm.value.guests) || 1)))
    query.set('rooms', String(Math.max(1, Number(hotelForm.value.rooms) || 1)))
  } else if (activeService.value === 'ticket') {
    if (ticketForm.value.destination) query.set('destination', ticketForm.value.destination)
    if (ticketForm.value.useDate) query.set('useDate', ticketForm.value.useDate)
    query.set('ticketQuantity', String(Math.max(1, Number(ticketForm.value.ticketQuantity) || 1)))
  } else if (activeService.value === 'tour') {
    if (tourForm.value.destination) query.set('destination', tourForm.value.destination)
    if (tourForm.value.departureDate) query.set('departureDate', tourForm.value.departureDate)
    query.set('travelers', String(Math.max(1, Number(tourForm.value.travelers) || 1)))
  } else {
    if (comboForm.value.destination) query.set('destination', comboForm.value.destination)
    if (comboForm.value.applyDate) query.set('applyDate', comboForm.value.applyDate)
    query.set('travelers', String(Math.max(1, Number(comboForm.value.travelers) || 1)))
  }

  return `/dich-vu?${query.toString()}`
})

const pushToDetail = (service, query = {}) => {
  router.push(getDetailRouteLocation(service, query))
}

const handleBookNow = (service) => {
  pushToDetail(service)
}
</script>