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
        :show-discount-amount="true"
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
import GuestRoomSelector from '@/components/travel/GuestRoomSelector.vue'
import TicketGuestSelector from '@/components/travel/TicketGuestSelector.vue'
import TourTravelerSelector from '@/components/travel/TourTravelerSelector.vue'
import { useHotelGuestRoomStore } from '@/stores/hotelGuestRoom/useHotelGuestRoomStore'
import { useCategorySearchSchemaStore } from '@/stores/categorySearchSchema/useCategorySearchSchemaStore'
import TravelCard from '@/components/travel/TravelCard.vue'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { useWishlistStore } from '@/stores/wishlist/useWishlistStore'

const DEFAULT_GUEST_QUERY_KEYS = {
  guests: 'guests',
  adults: 'adults',
  children: 'children',
  rooms: 'rooms',
  childrenAges: 'childrenAges'
}

const route = useRoute()
const serviceStore = useServiceStore()
const wishlistStore = useWishlistStore()
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

const featuredServices = computed(() => {
  const source = Array.isArray(serviceStore.featuredServices) ? serviceStore.featuredServices : []
  return source.filter((service) => Number(service?.availableSlots || 0) > 0)
})
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
</style>