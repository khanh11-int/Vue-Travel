<template>
  <div class="hotel-home">
    <section class="hotel-home__hero page-section">
      <div class="hotel-home__hero-banner">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80"
          alt="Khách sạn nội địa"
          class="hotel-home__hero-image"
        />
        <div class="hotel-home__hero-overlay"></div>
        <div class="hotel-home__hero-content">
          <h1>Khám phá các khách sạn hàng đầu Việt Nam</h1>
          <p>Từ Hà Nội tới TP.HCM, tìm kiếm nơi lưu trú phù hợp cho kỳ nghỉ của bạn.</p>
        </div>
      </div>

      <div class="hotel-home__search-wrap">
        <div class="search-panel service-search-panel home-search-tabs">
          <div class="service-search-panel__row">
            <div class="home-search-panel">
              <div class="home-search-panel__destination">
                <label>Điểm đến</label>
                <input v-model="searchForm.destination" type="text" placeholder="Ví dụ: Đà Nẵng" />
              </div>
              <div class="home-search-panel__date">
                <label>Ngày nhận phòng</label>
                <input v-model="searchForm.checkInDate" :min="todayISO" type="date" />
              </div>
              <div class="home-search-panel__return-date">
                <label>Ngày trả phòng</label>
                <input v-model="searchForm.checkOutDate" :min="searchForm.checkInDate || todayISO" type="date" />
              </div>
              <div class="home-search-panel__guest-room">
                <label>Khách và phòng</label>
                <GuestRoomSelector v-model="guestRoomSelection" />
              </div>
            </div>

            <router-link :to="searchTarget" class="primary-button service-search-panel__submit">Tìm kiếm khách sạn</router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="page-section hotel-home__section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Ưu đãi nổi bật</p>
          <h2>Khách sạn đang giảm giá theo điểm đến.</h2>
        </div>
      </div>

      <div class="hotel-home__city-tabs">
        <button
          v-for="city in citiesList"
          :key="city"
          :class="['hotel-home__city-tab', { active: selectedCity === city }]"
          @click="selectedCity = city"
        >
          {{ city }}
        </button>
      </div>

      <div class="hotel-home__grid">
        <TravelCard
          v-for="hotel in featuredHotels"
          :key="hotel.id"
          :service="hotel"
          :is-wishlisted="isWishlisted(hotel)"
          :show-discount-amount="true"
          @toggle-wishlist="handleToggleWishlist"
        />
      </div>
    </section>

    <section class="page-section hotel-home__section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Khuyến mại</p>
          <h2>Mã giảm giá đang áp dụng.</h2>
        </div>
      </div>

      <div class="hotel-home__promo-grid">
        <article v-for="promo in promotionsList" :key="promo.id" class="promo-card">
          <p class="eyebrow eyebrow--blue">{{ promo.code }}</p>
          <h3>{{ promo.description }}</h3>
          <p class="muted">Hieu luc: {{ promo.startDate }} - {{ promo.endDate }}</p>
        </article>
      </div>
    </section>

    <section class="page-section hotel-home__section hotel-home__section--last">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Điểm đến phổ biến</p>
          <h2>Khách sạn tốt nhất tại các điểm đến.</h2>
        </div>
      </div>

      <div class="hotel-home__dest-grid">
        <article
          v-for="destination in destinationsList"
          :key="destination.id"
          class="hotel-home__dest-card"
          @click="handleSelectDestination(destination)"
        >
          <img :src="destination.heroImage" :alt="destination.name" />
          <div class="hotel-home__dest-overlay"></div>
          <div class="hotel-home__dest-content">
            <h3>{{ destination.name }}</h3>
            <p>{{ destination.province }}</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TravelCard from '@/components/travel/TravelCard.vue'
import GuestRoomSelector from '@/components/travel/GuestRoomSelector.vue'
import { useHotelGuestRoomStore } from '@/stores/useHotelGuestRoomStore'
import { useServiceStore } from '@/stores/useServiceStore'
import { useWishlistStore } from '@/stores/useWishlistStore'

const router = useRouter()
const route = useRoute()
const serviceStore = useServiceStore()
const wishlistStore = useWishlistStore()
const guestRoomStore = useHotelGuestRoomStore()

const todayISO = (() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})()

const searchForm = ref({
  destination: '',
  checkInDate: '',
  checkOutDate: ''
})

const guestRoomSelection = computed({
  get: () => guestRoomStore.selection,
  set: (value) => {
    guestRoomStore.setSelection(value)
  }
})

const selectedCity = ref('Tất cả')

const currentCategory = computed(() => {
  const categories = Array.isArray(serviceStore.categories) ? serviceStore.categories : []
  return categories.find((category) => category.homePath === route.path || category.searchPath === route.path) || null
})

const currentCategoryId = computed(() => String(currentCategory.value?.id || route.query.category || ''))

const allHotels = computed(() => {
  const source = Array.isArray(serviceStore.services) ? serviceStore.services : []
  return source
    .filter((service) => !currentCategoryId.value || service.categoryId === currentCategoryId.value)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const citiesList = computed(() => ['Tất cả', ...new Set(allHotels.value.map((hotel) => hotel.destination))])

const filteredHotels = computed(() => {
  if (selectedCity.value === 'Tất cả') return allHotels.value.slice(0, 8)
  return allHotels.value.filter((hotel) => hotel.destination === selectedCity.value).slice(0, 8)
})

const featuredHotels = computed(() => {
  const discounted = filteredHotels.value.filter(
    (hotel) => Number(hotel.discount) > 0 || Number(hotel.price) > Number(hotel.salePrice)
  )

  return discounted.length ? discounted : filteredHotels.value
})

const destinationsList = computed(() => {
  const source = Array.isArray(serviceStore.destinations) ? serviceStore.destinations : []
  return source.slice(0, 9)
})

const promotionsList = computed(() => {
  const source = Array.isArray(serviceStore.activePromotions) ? serviceStore.activePromotions : []
  return source.slice(0, 3)
})

const searchTarget = computed(() => {
  const basePath = '/dich-vu'
  const query = new URLSearchParams()
  if (currentCategoryId.value) {
    query.set('category', currentCategoryId.value)
  }
  if (searchForm.value.destination) query.set('destination', searchForm.value.destination)
  if (searchForm.value.checkInDate) query.set('checkInDate', searchForm.value.checkInDate)
  if (searchForm.value.checkOutDate) query.set('checkOutDate', searchForm.value.checkOutDate)
  const guestRoomQuery = guestRoomStore.getQueryPayload()
  query.set('guests', guestRoomQuery.guests)
  query.set('adults', guestRoomQuery.adults)
  query.set('children', guestRoomQuery.children)
  query.set('rooms', guestRoomQuery.rooms)
  if (guestRoomQuery.childrenAges) {
    query.set('childrenAges', guestRoomQuery.childrenAges)
  }

  return `${basePath}?${query.toString()}`
})

const handleToggleWishlist = (serviceId) => {
  wishlistStore.toggleWishlist(serviceId)
}

const isWishlisted = (service) => wishlistStore.isInWishlist(service.id)

const handleSelectDestination = (destination) => {
  router.push({
    name: 'travel-list',
    query: {
      destination: destination.name,
      category: currentCategoryId.value || undefined
    }
  })
}
</script>

<style scoped>
.hotel-home__hero {
  margin-top: 14px;
  position: relative;
}

.hotel-home__hero-banner {
  min-height: 260px;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow);
}

.hotel-home__hero-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hotel-home__hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(125deg, rgba(13, 26, 48, 0.72), rgba(10, 109, 217, 0.2));
}

.hotel-home__hero-content {
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 62px;
  color: #ffffff;
  z-index: 2;
  max-width: 680px;
}

.hotel-home__hero-content h1 {
  margin: 0 0 8px;
  font-size: clamp(1.65rem, 2.6vw, 2.5rem);
}

.hotel-home__hero-content p {
  margin: 0;
  font-size: 1rem;
  opacity: 0.92;
}

.hotel-home__search-wrap {
  margin-top: -30px;
  position: relative;
  z-index: 3;
}

.hotel-home__search-wrap .search-panel {
  grid-template-columns: 1fr;
  margin-top: 0;
}

.hotel-home__search-wrap .home-search-panel {
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.25fr);
}

.hotel-home__search-wrap .home-search-panel__destination,
.hotel-home__search-wrap .home-search-panel__date,
.hotel-home__search-wrap .home-search-panel__return-date,
.hotel-home__search-wrap .home-search-panel__guest-room {
  grid-column: auto;
}

.hotel-home__search-wrap .service-search-panel__submit {
  min-width: 190px;
  align-self: end;
}

.hotel-home__section {
  margin-top: 18px;
}

.hotel-home__section--last {
  margin-bottom: 38px;
}

.hotel-home__city-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
  margin-bottom: 16px;
}

.hotel-home__city-tab {
  border: 1px solid #dce8f8;
  background: #f2f7ff;
  color: #5f6e86;
  border-radius: 999px;
  padding: 7px 13px;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.hotel-home__city-tab.active {
  color: #0b63c3;
  border-color: #cfe0f6;
  background: #eef5ff;
}

.hotel-home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 14px;
}

.hotel-home__card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid var(--border);
  overflow: hidden;
  cursor: pointer;
}

.hotel-home__card-image-wrap {
  position: relative;
  height: 168px;
}

.hotel-home__card-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hotel-home__discount {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--accent);
  color: #fff;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 5px 10px;
}

.hotel-home__card-content {
  padding: 14px;
  display: grid;
  gap: 6px;
}

.hotel-home__card-content h3 {
  margin: 0;
  font-size: 1.02rem;
}

.hotel-home__muted {
  margin: 0;
  color: var(--muted);
  font-size: 0.88rem;
}

.hotel-home__price {
  margin: 0;
  color: var(--primary);
  font-weight: 700;
  font-size: 1.05rem;
}

.hotel-home__promo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 14px;
}

.hotel-home__dest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}

.hotel-home__dest-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
  height: 180px;
  cursor: pointer;
}

.hotel-home__dest-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hotel-home__dest-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 20%, rgba(12, 24, 44, 0.62) 100%);
}

.hotel-home__dest-content {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 12px;
  color: #fff;
  z-index: 2;
}

.hotel-home__dest-content h3,
.hotel-home__dest-content p {
  margin: 0;
}

.hotel-home__dest-content p {
  opacity: 0.9;
  font-size: 0.86rem;
}

@media (max-width: 1024px) {
  .hotel-home__hero-content {
    bottom: 56px;
  }
}

@media (max-width: 768px) {
  .hotel-home__hero-banner {
    min-height: 210px;
    border-radius: 16px;
  }

  .hotel-home__hero-content {
    left: 16px;
    right: 16px;
    bottom: 42px;
  }

  .hotel-home__search-wrap {
    margin-top: -20px;
  }

  .hotel-home__search-wrap .home-search-panel {
    grid-template-columns: 1fr 1fr;
  }

  .hotel-home__search-wrap .home-search-panel__guest-room {
    grid-column: 1 / -1;
  }

  .hotel-home__dest-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .hotel-home__dest-grid,
  .hotel-home__grid,
  .hotel-home__promo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
