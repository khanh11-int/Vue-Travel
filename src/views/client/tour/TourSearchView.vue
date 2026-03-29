<template>
  <section class="page-section service-search-page service-search-page--compact">
    <div class="service-search-page__main">
      <div class="search-panel service-search-panel home-search-tabs">
        <ServiceSearchNav :active-id="currentCategoryId" />

        <div class="service-search-panel__row">
          <div class="home-search-panel">
            <label class="ota-search-field">
              <span class="ota-search-icon ota-search-icon--location" aria-hidden="true"></span>
              <input v-model="searchForm.destination" type="text" placeholder="Điểm đến tour" />
            </label>

            <label class="ota-search-field">
              <span class="ota-search-icon ota-search-icon--calendar" aria-hidden="true"></span>
              <input v-model="searchForm.startDate" :min="todayISO" type="date" />
            </label>

            <label class="ota-search-field">
              <span class="ota-search-icon ota-search-icon--calendar" aria-hidden="true"></span>
              <input v-model="searchForm.endDate" :min="searchForm.startDate || todayISO" type="date" />
            </label>

            <div class="ota-search-field ota-search-field--meta ota-search-field--selector">
              <span class="ota-search-icon ota-search-icon--users" aria-hidden="true"></span>
              <TourTravelerSelector v-model="travelerSelection" />
            </div>
          </div>

          <router-link :to="searchTarget" class="primary-button service-search-panel__submit">Tìm tour</router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import TourTravelerSelector from '@/components/travel/TourTravelerSelector.vue'
import ServiceSearchNav from '@/components/travel/ServiceSearchNav.vue'
import { useServiceStore } from '@/stores/useServiceStore'

const route = useRoute()
const serviceStore = useServiceStore()

const todayISO = (() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})()

const categories = computed(() => (Array.isArray(serviceStore.categories) ? serviceStore.categories : []))
const activeCategory = computed(() => {
  return categories.value.find((category) => category.searchPath === route.path || category.homePath === route.path) || null
})

const currentCategoryId = computed(() => String(route.query.category || activeCategory.value?.id || 'tour'))

const searchForm = ref({
  destination: String(route.query.destination || ''),
  startDate: String(route.query.startDate || route.query.departureDate || ''),
  endDate: String(route.query.endDate || '')
})

const travelerSelection = ref({
  adults: Math.max(1, Number(route.query.adults || route.query.travelers || route.query.quantity || 2) || 2),
  children: Math.max(0, Number(route.query.children || 0) || 0),
  childrenAges: String(route.query.childrenAges || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Math.min(17, Math.max(1, Number(item) || 8)))
})

const searchTarget = computed(() => {
  const basePath = activeCategory.value?.searchPath || '/dich-vu'
  const query = new URLSearchParams()

  if (currentCategoryId.value) query.set('category', currentCategoryId.value)
  if (searchForm.value.destination) query.set('destination', searchForm.value.destination)
  if (searchForm.value.startDate) query.set('startDate', searchForm.value.startDate)
  if (searchForm.value.endDate) query.set('endDate', searchForm.value.endDate)

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

  return `${basePath}?${query.toString()}`
})
</script>

<style scoped>
.ota-search-field--selector {
  grid-template-columns: auto minmax(0, 1fr);
  padding-right: 8px;
}
</style>
