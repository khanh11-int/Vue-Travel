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

        <div v-else-if="field.type === 'guest-room'" class="ota-search-field ota-search-field--meta ota-search-field--guest-room">
          <span :class="['ota-search-icon', `ota-search-icon--${field.icon || 'users'}`]" aria-hidden="true"></span>
          <GuestRoomSelector v-model="guestRoomSelection" />
        </div>
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
        :is-wishlisted="isWishlisted(service.id)"
        @toggle-wishlist="handleToggleWishlist"
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
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GuestRoomSelector from '@/components/hotel-home/GuestRoomSelector.vue'
import { useHotelGuestRoomStore } from '@/stores/useHotelGuestRoomStore'
import TravelCard from '@/components/travel/TravelCard.vue'
import { useServiceStore } from '@/stores/useServiceStore'
import { useWishlistStore } from '@/stores/useWishlistStore'
import { useCategorySearchSchema } from '@/composables/useCategorySearchSchema'

const route = useRoute()
const serviceStore = useServiceStore()
const wishlistStore = useWishlistStore()
const guestRoomStore = useHotelGuestRoomStore()

const activeService = ref('')

const {
  todayISO,
  categories,
  activeSearchFields,
  form,
  updateFieldValue,
  guestRoomSelection,
  searchButtonLabel,
  searchTarget
} = useCategorySearchSchema({
  route,
  serviceStore,
  guestRoomStore,
  activeCategoryId: activeService,
  storeByCategory: true,
  includeRouteQueryDefaults: false,
  forceDefaultSearchPath: true
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

const featuredServices = computed(() => (Array.isArray(serviceStore.featuredServices) ? serviceStore.featuredServices : []))
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
.ota-search-field--guest-room {
  grid-template-columns: auto minmax(0, 1fr);
  padding-right: 8px;
}

.ota-search-field--guest-room :deep(.guest-room-selector__trigger) {
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 0;
  font-weight: 700;
  color: #1d2d45;
}

.ota-search-field--guest-room :deep(.guest-room-selector__popup) {
  left: -34px;
  top: calc(100% + 10px);
}
</style>