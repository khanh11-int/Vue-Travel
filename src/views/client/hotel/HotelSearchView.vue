<template>
  <section class="page-section service-search-page service-search-page--compact">
    <div class="service-search-page__main">
      <div class="search-panel service-search-panel home-search-tabs">
        <ServiceSearchNav :active-id="currentCategoryId" />

        <div class="service-search-panel__row">
          <div class="home-search-panel">
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
          </div>

          <router-link :to="searchTarget" class="primary-button service-search-panel__submit">{{ searchButtonLabel }}</router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ServiceSearchNav from '@/components/travel/ServiceSearchNav.vue'
import GuestRoomSelector from '@/components/hotel-home/GuestRoomSelector.vue'
import { useHotelGuestRoomStore } from '@/stores/useHotelGuestRoomStore'
import { useServiceStore } from '@/stores/useServiceStore'
import { useCategorySearchSchemaStore } from '@/stores/useCategorySearchSchemaStore'

const DEFAULT_GUEST_QUERY_KEYS = {
  guests: 'guests',
  adults: 'adults',
  children: 'children',
  rooms: 'rooms',
  childrenAges: 'childrenAges'
}

const route = useRoute()
const serviceStore = useServiceStore()
const guestRoomStore = useHotelGuestRoomStore()
const categorySearchSchemaStore = useCategorySearchSchemaStore()

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

const currentCategoryId = computed(() => {
  return String(route.query.category || matchedCategoryByPath.value?.id || categories.value[0]?.id || '')
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

const getQueryValue = (key) => {
  if (!key) return ''
  const value = route.query[key]
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

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
      defaults[startKey] = getQueryValue(field.startQueryKey || startKey) || defaults[startKey] || ''
      defaults[endKey] = getQueryValue(field.endQueryKey || endKey) || defaults[endKey] || ''
      return
    }

    const key = field.key
    if (!key) return
    const queryValue = getQueryValue(field.queryKey || key)

    if (field.type === 'number') {
      const minimum = Number(field.min || 1)
      const parsed = Number(queryValue || defaults[key] || field.defaultValue || minimum)
      defaults[key] = Math.max(minimum, Number.isFinite(parsed) ? parsed : minimum)
      return
    }

    defaults[key] = queryValue || defaults[key] || ''
  })

  return defaults
}

const applyGuestRoomFromQuery = (searchConfig = null) => {
  const guestField = (Array.isArray(searchConfig?.fields) ? searchConfig.fields : [])
    .find((field) => field.type === 'guest-room')

  if (!guestField) return

  const queryKeys = { ...DEFAULT_GUEST_QUERY_KEYS, ...(guestField.queryKeys || {}) }
  guestRoomStore.setFromQuery({
    guests: getQueryValue(queryKeys.guests),
    adults: getQueryValue(queryKeys.adults),
    children: getQueryValue(queryKeys.children),
    rooms: getQueryValue(queryKeys.rooms),
    childrenAges: getQueryValue(queryKeys.childrenAges)
  })
}

watch([activeSearchConfig, () => route.fullPath], ([searchConfig]) => {
  categorySearchSchemaStore.setForm(createDefaultFormState(searchConfig))
  applyGuestRoomFromQuery(searchConfig)
}, { immediate: true })

const form = computed(() => {
  return categorySearchSchemaStore.getCurrentFormState({ storeByCategory: false })
})

const updateFieldValue = (key, value) => {
  if (!key) return
  categorySearchSchemaStore.setFieldValue({
    storeByCategory: false,
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

const searchTarget = computed(() => {
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

  const searchPath = activeSearchConfig.value?.searchPath
    || activeCategory.value?.searchPath
    || '/dich-vu'
  return `${searchPath}?${query.toString()}`
})
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
