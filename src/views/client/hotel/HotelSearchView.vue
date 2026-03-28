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
import { useRoute } from 'vue-router'
import ServiceSearchNav from '@/components/travel/ServiceSearchNav.vue'
import GuestRoomSelector from '@/components/hotel-home/GuestRoomSelector.vue'
import { useHotelGuestRoomStore } from '@/stores/useHotelGuestRoomStore'
import { useServiceStore } from '@/stores/useServiceStore'
import { useCategorySearchSchema } from '@/composables/useCategorySearchSchema'

const route = useRoute()
const serviceStore = useServiceStore()
const guestRoomStore = useHotelGuestRoomStore()

const {
  todayISO,
  currentCategoryId,
  activeSearchFields,
  form,
  updateFieldValue,
  guestRoomSelection,
  searchButtonLabel,
  searchTarget
} = useCategorySearchSchema({
  route,
  serviceStore,
  guestRoomStore
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
