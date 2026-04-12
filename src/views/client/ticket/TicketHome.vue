<template>
  <div class="ticket-home">
    <section class="ticket-home__hero page-section">
      <div class="ticket-home__hero-banner">
        <img
          src="https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1400&q=80"
          alt="Vé tham quan nội địa"
          class="ticket-home__hero-image"
        />
        <div class="ticket-home__hero-overlay"></div>
        <div class="ticket-home__hero-content">
          <h1>Khám phá vé tham quan nổi bật tại Việt Nam</h1>
          <p>Đặt vé dễ dàng, giá tốt và tận hưởng trải nghiệm du lịch của bạn.</p>
        </div>
      </div>

      <div class="ticket-home__search-wrap">
        <div class="search-panel service-search-panel home-search-tabs">
          <UnifiedSearchPanel
            layout="inline"
            :category="currentCategory"
            :search-config="currentCategory?.searchConfig"
            :model-value="searchModel"
            :min-date="todayISO"
            @update:model-value="searchModel = $event"
            @submit="handleSubmitSearch"
          />
        </div>
      </div>
    </section>

    <section class="page-section ticket-home__section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Ưu đãi nổi bật</p>
          <h2>Vé tham quan đang có giá ưu đãi theo điểm đến.</h2>
        </div>
      </div>

      <div class="ticket-home__city-tabs">
        <button
          v-for="city in citiesList"
          :key="city"
          :class="['ticket-home__city-tab', { active: selectedCity === city }]"
          @click="selectedCity = city"
        >
          {{ city }}
        </button>
      </div>

      <div class="ticket-home__grid">
        <TravelCard
          v-for="ticket in featuredTickets"
          :key="ticket.id"
          :service="ticket"
          :is-wishlisted="isWishlisted(ticket)"
          :show-discount-amount="true"
          @toggle-wishlist="handleToggleWishlist"
        />
      </div>
    </section>

    <section class="page-section ticket-home__section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Khuyến mại</p>
          <h2>Mã giảm giá đang áp dụng cho vé tham quan.</h2>
        </div>
      </div>

      <div class="ticket-home__promo-grid">
        <article v-for="promo in promotionsList" :key="promo.id" class="promo-card">
          <p class="eyebrow eyebrow--blue">{{ promo.code }}</p>
          <h3>{{ promo.description }}</h3>
          <p class="muted">Hieu luc: {{ promo.startDate }} - {{ promo.endDate }}</p>
        </article>
      </div>
    </section>

    <section class="page-section ticket-home__section ticket-home__section--last">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Điểm đến phổ biến</p>
          <h2>Top điểm đến được tìm vé nhiều nhất.</h2>
        </div>
      </div>

      <div class="ticket-home__dest-grid">
        <article
          v-for="destination in destinationsList"
          :key="destination.id"
          class="ticket-home__dest-card"
          @click="handleSelectDestination(destination)"
        >
          <img :src="destination.heroImage" :alt="destination.name" />
          <div class="ticket-home__dest-overlay"></div>
          <div class="ticket-home__dest-content">
            <h3>{{ destination.name }}</h3>
            <p>{{ destination.province }}</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UnifiedSearchPanel from '@/components/travel/UnifiedSearchPanel.vue'
import TravelCard from '@/components/travel/TravelCard.vue'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { useWishlistStore } from '@/stores/wishlist/useWishlistStore'
import { buildSearchQueryByCategory, createSearchModelByCategory, getTodayISO } from '@/utils/searchQueryBuilder'

const router = useRouter()
const route = useRoute()
const serviceStore = useServiceStore()
const wishlistStore = useWishlistStore()

const todayISO = getTodayISO()
const selectedCity = ref('Tất cả')

const currentCategory = computed(() => {
  const categories = Array.isArray(serviceStore.categories) ? serviceStore.categories : []
  return categories.find((category) => category.homePath === route.path || category.searchPath === route.path) || null
})

const currentCategoryId = computed(() => String(currentCategory.value?.id || route.query.category || ''))
const searchModel = ref({})

watch([currentCategory, () => route.fullPath], () => {
  searchModel.value = createSearchModelByCategory({
    categoryId: currentCategoryId.value,
    searchConfig: currentCategory.value?.searchConfig,
    routeQuery: route.query,
    todayISO
  })
}, { immediate: true })

const allTickets = computed(() => {
  const source = Array.isArray(serviceStore.services) ? serviceStore.services : []
  return source
    .filter((service) => Number(service?.availableSlots || 0) > 0)
    .filter((service) => !currentCategoryId.value || service.categoryId === currentCategoryId.value)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const citiesList = computed(() => ['Tất cả', ...new Set(allTickets.value.map((ticket) => ticket.destination))])

const filteredTickets = computed(() => {
  if (selectedCity.value === 'Tất cả') return allTickets.value.slice(0, 8)
  return allTickets.value.filter((ticket) => ticket.destination === selectedCity.value).slice(0, 8)
})

const featuredTickets = computed(() => {
  const discounted = filteredTickets.value.filter((ticket) => {
    const listedPrice = Number(ticket.originalPrice) || Number(ticket.price) || 0
    return Number(ticket.discount) > 0 || listedPrice > Number(ticket.salePrice)
  })

  return discounted.length ? discounted : filteredTickets.value
})

const destinationsList = computed(() => {
  const source = Array.isArray(serviceStore.destinations) ? serviceStore.destinations : []
  return source.slice(0, 9)
})

const promotionsList = computed(() => {
  const source = Array.isArray(serviceStore.activePromotions) ? serviceStore.activePromotions : []
  return source.slice(0, 3)
})

const handleSubmitSearch = () => {
  const { path, query } = buildSearchQueryByCategory({
    category: currentCategory.value,
    searchConfig: currentCategory.value?.searchConfig,
    modelValue: searchModel.value,
    targetPath: '/dich-vu'
  })

  router.push({ path, query })
}

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
.ticket-home__hero {
  margin-top: 14px;
  position: relative;
}

.ticket-home__hero-banner {
  height: 150px;
  min-height: 150px;
  max-height: 150px;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow);
}

.ticket-home__hero-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ticket-home__hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(125deg, rgba(13, 26, 48, 0.72), rgba(10, 109, 217, 0.2));
}

.ticket-home__hero-content {
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 32px;
  color: #ffffff;
  z-index: 2;
  max-width: 680px;
}

.ticket-home__hero-content h1 {
  margin: 0 0 8px;
  font-size: clamp(1.35rem, 2.2vw, 2rem);
}

.ticket-home__hero-content p {
  margin: 0;
  font-size: 0.92rem;
  opacity: 0.92;
}

.ticket-home__search-wrap {
  margin-top: -10px;
  position: relative;
  z-index: 3;
}

.ticket-home__search-wrap .search-panel {
  grid-template-columns: 1fr;
  margin-top: 0;
}

.ticket-home__search-wrap .home-search-panel {
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr) minmax(0, 1.2fr);
}

.ticket-home__search-wrap .home-search-panel__destination,
.ticket-home__search-wrap .home-search-panel__date,
.ticket-home__search-wrap .home-search-panel__date-range,
.ticket-home__search-wrap .home-search-panel__tickets {
  grid-column: auto;
}

.ticket-home__search-wrap .service-search-panel__submit {
  min-width: 190px;
  align-self: end;
}

.ticket-home__section {
  margin-top: 18px;
}

.ticket-home__section--last {
  margin-bottom: 38px;
}

.ticket-home__city-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
  margin-bottom: 16px;
}

.ticket-home__city-tab {
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

.ticket-home__city-tab.active {
  color: #0b63c3;
  border-color: #cfe0f6;
  background: #eef5ff;
}

.ticket-home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 14px;
}

.ticket-home__promo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 14px;
}

.ticket-home__dest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}

.ticket-home__dest-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
  height: 180px;
  cursor: pointer;
}

.ticket-home__dest-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ticket-home__dest-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 20%, rgba(12, 24, 44, 0.62) 100%);
}

.ticket-home__dest-content {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 12px;
  color: #fff;
  z-index: 2;
}

.ticket-home__dest-content h3,
.ticket-home__dest-content p {
  margin: 0;
}

.ticket-home__dest-content p {
  opacity: 0.9;
  font-size: 0.86rem;
}

@media (max-width: 1024px) {
  .ticket-home__hero-content {
    bottom: 12px;
  }
}

@media (max-width: 768px) {
  .ticket-home__hero-banner {
    height: 96px;
    min-height: 96px;
    max-height: 96px;
    border-radius: 16px;
  }

  .ticket-home__hero-content {
    left: 16px;
    right: 16px;
    bottom: 10px;
  }

  .ticket-home__search-wrap {
    margin-top: -6px;
  }

  .ticket-home__search-wrap .home-search-panel {
    grid-template-columns: 1fr;
  }

  .ticket-home__dest-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .ticket-home__dest-grid,
  .ticket-home__grid,
  .ticket-home__promo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
