<template>
  <section class="page-section service-search-page service-search-page--compact">
    <div class="service-search-page__main">
      <div class="search-panel service-search-panel home-search-tabs">
        <ServiceSearchNav :active-id="currentCategoryId" />

        <div class="service-search-panel__row">
          <div class="home-search-panel">
            <label class="ota-search-field">
              <span class="ota-search-icon ota-search-icon--location" aria-hidden="true"></span>
              <input v-model="searchForm.destination" type="text" placeholder="Điểm tham quan" />
            </label>

            <label class="ota-search-field">
              <span class="ota-search-icon ota-search-icon--calendar" aria-hidden="true"></span>
              <input v-model="searchForm.useDate" :min="todayISO" type="date" />
            </label>

            <div class="ota-search-field ota-search-field--meta ota-search-field--selector">
              <span class="ota-search-icon ota-search-icon--users" aria-hidden="true"></span>
              <TicketGuestSelector v-model="ticketGuestSelection" />
            </div>
          </div>

          <router-link :to="searchTarget" class="primary-button service-search-panel__submit">Tìm vé</router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import TicketGuestSelector from '@/components/travel/TicketGuestSelector.vue'
import ServiceSearchNav from '@/components/travel/ServiceSearchNav.vue'
import { useServiceStore } from '@/stores/service/useServiceStore'

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

const currentCategoryId = computed(() => String(route.query.category || activeCategory.value?.id || 'ticket'))

const searchForm = ref({
  destination: String(route.query.destination || ''),
  useDate: String(route.query.useDate || route.query.startDate || '')
})

const ticketGuestSelection = ref({
  tickets: Math.max(1, Number(route.query.ticketQuantity || route.query.adults || route.query.quantity || 2) || 2),
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
  if (searchForm.value.useDate) query.set('useDate', searchForm.value.useDate)

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

  return `${basePath}?${query.toString()}`
})
</script>

<style scoped>
.ota-search-field--selector {
  grid-template-columns: auto minmax(0, 1fr);
  padding-right: 8px;
}
</style>
