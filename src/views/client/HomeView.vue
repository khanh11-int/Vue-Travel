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

    <div :class="['home-ota-searchbar', { 'home-ota-searchbar--flight': activeService === 'flight' }]">
      <UnifiedSearchPanel
        layout="inline"
        :category="activeCategory"
        :search-config="activeSearchConfig"
        :model-value="activeSearchModel"
        :min-date="todayISO"
        :flight-airports="flightStore.airports"
        :flight-cabin-options="flightStore.cabinOptions"
        :flight-error-message="homeFlightSearchError"
        @update:model-value="updateActiveSearchModel"
        @submit="handleHomeSearchSubmit"
      />
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
import { useRoute, useRouter } from 'vue-router'
import UnifiedSearchPanel from '@/components/travel/UnifiedSearchPanel.vue'
import TravelCard from '@/components/travel/TravelCard.vue'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { useWishlistStore } from '@/stores/wishlist/useWishlistStore'
import { useFlightStore } from '@/stores/flight/useFlightStore'
import { buildSearchQueryByCategory, createSearchModelByCategory, getTodayISO } from '@/utils/searchQueryBuilder'

const route = useRoute()
const router = useRouter()
const serviceStore = useServiceStore()
const wishlistStore = useWishlistStore()
const flightStore = useFlightStore()

const activeService = ref('')
const homeFlightSearchError = ref('')
const searchModelsByCategory = ref({})
const todayISO = getTodayISO()

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

const ensureCategorySearchModel = (category) => {
  const categoryId = String(category?.id || '').trim()
  if (!categoryId) return
  if (searchModelsByCategory.value[categoryId]) return

  searchModelsByCategory.value = {
    ...searchModelsByCategory.value,
    [categoryId]: createSearchModelByCategory({
      categoryId,
      searchConfig: category?.searchConfig,
      routeQuery: route.query,
      todayISO
    })
  }
}

watch(categories, (nextCategories) => {
  nextCategories.forEach((category) => ensureCategorySearchModel(category))
}, { immediate: true })

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

watch(activeCategory, (nextCategory) => {
  if (!nextCategory) return
  ensureCategorySearchModel(nextCategory)
}, { immediate: true })

const activeSearchModel = computed(() => {
  return searchModelsByCategory.value[currentCategoryId.value] || {}
})

const updateActiveSearchModel = (nextModel) => {
  searchModelsByCategory.value = {
    ...searchModelsByCategory.value,
    [currentCategoryId.value]: {
      ...(activeSearchModel.value || {}),
      ...(nextModel || {})
    }
  }

  if (activeService.value === 'flight') {
    homeFlightSearchError.value = ''
  }
}

const handleHomeSearchSubmit = () => {
  const { path, query, errors } = buildSearchQueryByCategory({
    category: activeCategory.value,
    searchConfig: activeSearchConfig.value,
    modelValue: activeSearchModel.value,
    targetPath: activeService.value === 'flight' ? '' : '/dich-vu'
  })

  if (errors?.length) {
    homeFlightSearchError.value = errors[0]
    return
  }

  homeFlightSearchError.value = ''
  router.push({ path, query })
}

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
.home-ota-searchbar {
  /* UnifiedSearchPanel already controls its internal grid; wrapper should not split it into 4 columns. */
  display: block;
  grid-template-columns: 1fr;
}

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