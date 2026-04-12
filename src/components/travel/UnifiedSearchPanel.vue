<template>
  <div v-if="layout === 'inline'" :class="['service-search-panel__row', { 'service-search-panel__row--flight': isFlightCategory }]">
    <template v-if="isFlightCategory">
      <FlightSearchPanel
        :airports="flightAirports"
        :cabin-options="flightCabinOptions"
        :from-airport="flightFromAirport"
        :to-airport="flightToAirport"
        :depart-date="flightDepartDate"
        :cabin-class="flightCabinClass"
        :passengers="flightPassengers"
        :total-passengers="flightTotalPassengers"
        :min-date="minDate"
        :loading="flightLoading"
        :search-error-message="flightErrorMessage"
        @update:from-airport="updateFlightField('fromAirport', $event)"
        @update:to-airport="updateFlightField('toAirport', $event)"
        @update:depart-date="updateFlightField('departDate', $event)"
        @update:cabin-class="updateFlightField('cabinClass', $event)"
        @swap="handleSwapAirports"
        @search="emitSubmit"
        @adjust-passenger="handleAdjustPassenger"
      />
    </template>

    <template v-else>
      <div :class="['home-search-panel', `home-search-panel--${categoryId || 'default'}`]">
        <template v-for="(field, index) in searchFields" :key="`${field.type}-${field.key || index}`">
          <div v-if="['text', 'date', 'number'].includes(field.type)" :class="['ota-search-item', resolveFieldLayoutClass(field)]">
            <span class="ota-search-label">{{ resolveFieldLabel(field) }}</span>
            <label :class="['ota-search-field', { 'ota-search-field--meta': field.type === 'number' }]">
              <span :class="['ota-search-icon', `ota-search-icon--${field.icon || 'location'}`]" aria-hidden="true"></span>
              <input
                v-if="field.type === 'text'"
                :value="resolvedModel[field.key] || ''"
                type="text"
                :placeholder="field.placeholder || 'Nhap thong tin tim kiem'"
                @input="updateFieldValue(field.key, $event.target.value)"
              />
              <input
                v-else-if="field.type === 'date'"
                :value="resolvedModel[field.key] || ''"
                :min="minDate"
                type="date"
                @input="updateFieldValue(field.key, $event.target.value)"
              />
              <input
                v-else
                :value="resolvedModel[field.key]"
                type="number"
                :min="field.min || 1"
                :max="field.max || 50"
                :placeholder="field.placeholder || 'So luong'"
                @input="updateFieldValue(field.key, Number($event.target.value))"
              />
            </label>
          </div>

          <template v-else-if="field.type === 'date-range'">
            <div class="ota-search-item home-search-panel__date">
              <span class="ota-search-label">{{ resolveRangeLabel().start }}</span>
              <label class="ota-search-field">
                <span :class="['ota-search-icon', `ota-search-icon--${field.icon || 'calendar'}`]" aria-hidden="true"></span>
                <input
                  :value="resolvedModel[field.startKey] || ''"
                  :min="minDate"
                  type="date"
                  @input="updateFieldValue(field.startKey, $event.target.value)"
                />
              </label>
            </div>

            <div class="ota-search-item home-search-panel__return-date">
              <span class="ota-search-label">{{ resolveRangeLabel().end }}</span>
              <label class="ota-search-field">
                <span :class="['ota-search-icon', `ota-search-icon--${field.icon || 'calendar'}`]" aria-hidden="true"></span>
                <input
                  :value="resolvedModel[field.endKey] || ''"
                  :min="resolvedModel[field.startKey] || minDate"
                  type="date"
                  @input="updateFieldValue(field.endKey, $event.target.value)"
                />
              </label>
            </div>
          </template>

          <div
            v-else-if="field.type === 'guest-room'"
            :class="['ota-search-item', resolveFieldLayoutClass(field)]"
          >
            <span class="ota-search-label">{{ resolveFieldLabel(field) }}</span>
            <div class="ota-search-field ota-search-field--meta ota-search-field--selector">
              <span :class="['ota-search-icon', `ota-search-icon--${field.icon || 'users'}`]" aria-hidden="true"></span>
              <GuestRoomSelector
                v-if="categoryId === 'hotel'"
                :model-value="resolvedGuestRoomSelection"
                @update:model-value="updateFieldValue('guestRoomSelection', $event)"
              />
              <TicketGuestSelector
                v-else-if="categoryId === 'ticket'"
                :model-value="resolvedTicketGuestSelection"
                @update:model-value="updateFieldValue('ticketGuestSelection', $event)"
              />
              <TourTravelerSelector
                v-else-if="categoryId === 'tour'"
                :model-value="resolvedTourTravelerSelection"
                @update:model-value="updateFieldValue('tourTravelerSelection', $event)"
              />
            </div>
          </div>
        </template>
      </div>

      <div class="ota-search-item ota-search-item--submit">
        <span class="ota-search-label ota-search-label--hidden" aria-hidden="true">.</span>
        <button
          type="button"
          class="primary-button service-search-panel__submit"
          @click="emitSubmit"
        >
          {{ submitText }}
        </button>
      </div>
    </template>
  </div>

  <div v-else class="search-panel service-search-panel home-search-tabs">
    <ServiceSearchNav v-if="showNav" :active-id="categoryId" />
    <UnifiedSearchPanel
      layout="inline"
      :search-config="searchConfig"
      :category="category"
      :model-value="modelValue"
      :show-nav="false"
      :submit-label="submitLabel"
      :min-date="minDate"
      :flight-airports="flightAirports"
      :flight-cabin-options="flightCabinOptions"
      :flight-loading="flightLoading"
      :flight-error-message="flightErrorMessage"
      @update:model-value="emit('update:modelValue', $event)"
      @submit="emitSubmit"
    />
  </div>
</template>

<script setup>
import { computed, defineEmits, defineOptions, defineProps } from 'vue'
import FlightSearchPanel from '@/components/travel/FlightSearchPanel.vue'
import GuestRoomSelector from '@/components/travel/GuestRoomSelector.vue'
import ServiceSearchNav from '@/components/travel/ServiceSearchNav.vue'
import TicketGuestSelector from '@/components/travel/TicketGuestSelector.vue'
import TourTravelerSelector from '@/components/travel/TourTravelerSelector.vue'
import { getTodayISO } from '@/utils/searchQueryBuilder'

defineOptions({ name: 'UnifiedSearchPanel' })

const props = defineProps({
  layout: {
    type: String,
    default: 'inline'
  },
  searchConfig: {
    type: Object,
    default: null
  },
  category: {
    type: [Object, String],
    default: null
  },
  modelValue: {
    type: Object,
    default: () => ({})
  },
  showNav: {
    type: Boolean,
    default: false
  },
  submitLabel: {
    type: String,
    default: ''
  },
  minDate: {
    type: String,
    default: () => getTodayISO()
  },
  flightAirports: {
    type: Array,
    default: () => []
  },
  flightCabinOptions: {
    type: Array,
    default: () => []
  },
  flightLoading: {
    type: Boolean,
    default: false
  },
  flightErrorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const categoryId = computed(() => String(props.category?.id || props.category || '').trim())
const isFlightCategory = computed(() => categoryId.value === 'flight')
const searchFields = computed(() => (Array.isArray(props.searchConfig?.fields) ? props.searchConfig.fields : []))
const submitText = computed(() => props.submitLabel || props.searchConfig?.submitLabel || 'Tim dich vu')
const resolvedModel = computed(() => (props.modelValue && typeof props.modelValue === 'object' ? props.modelValue : {}))

const resolvedGuestRoomSelection = computed(() => {
  const source = resolvedModel.value.guestRoomSelection || {}
  return {
    adults: Math.max(1, Number(source.adults || 1) || 1),
    children: Math.max(0, Number(source.children || 0) || 0),
    rooms: Math.max(1, Number(source.rooms || 1) || 1),
    childrenAges: Array.isArray(source.childrenAges) ? source.childrenAges : []
  }
})

const resolvedTicketGuestSelection = computed(() => {
  const source = resolvedModel.value.ticketGuestSelection || {}
  return {
    tickets: Math.max(1, Number(source.tickets || 1) || 1),
    children: Math.max(0, Number(source.children || 0) || 0),
    childrenAges: Array.isArray(source.childrenAges) ? source.childrenAges : []
  }
})

const resolvedTourTravelerSelection = computed(() => {
  const source = resolvedModel.value.tourTravelerSelection || {}
  return {
    adults: Math.max(1, Number(source.adults || 1) || 1),
    children: Math.max(0, Number(source.children || 0) || 0),
    childrenAges: Array.isArray(source.childrenAges) ? source.childrenAges : []
  }
})

const flightPassengers = computed(() => {
  const source = resolvedModel.value.passengers || {}
  return {
    adults: Math.max(1, Number(source.adults || 1) || 1),
    children: Math.max(0, Number(source.children || 0) || 0),
    infants: Math.max(0, Number(source.infants || 0) || 0)
  }
})

const flightTotalPassengers = computed(() => {
  return flightPassengers.value.adults + flightPassengers.value.children + flightPassengers.value.infants
})

const flightFromAirport = computed(() => String(resolvedModel.value.fromAirport || 'HAN').trim().toUpperCase())
const flightToAirport = computed(() => String(resolvedModel.value.toAirport || 'SGN').trim().toUpperCase())
const flightDepartDate = computed(() => String(resolvedModel.value.departDate || props.minDate).trim())
const flightCabinClass = computed(() => String(resolvedModel.value.cabinClass || 'economy').trim())

const resolveFieldLayoutClass = (field) => {
  if (!field || typeof field !== 'object') return ''

  if (field.type === 'text') {
    return 'home-search-panel__destination'
  }

  if (field.type === 'date') {
    return 'home-search-panel__date'
  }

  if (field.type === 'guest-room') {
    if (categoryId.value === 'hotel') return 'home-search-panel__guest-room'
    if (categoryId.value === 'tour') return 'home-search-panel__travelers'
    if (categoryId.value === 'ticket') return 'home-search-panel__tickets'
    return 'home-search-panel__guests'
  }

  if (field.type === 'number') {
    const key = String(field.key || '').toLowerCase()
    if (key.includes('room')) return 'home-search-panel__rooms'
    return 'home-search-panel__guests'
  }

  return ''
}

const resolveFieldLabel = (field) => {
  if (!field || typeof field !== 'object') return ''

  if (field.type === 'text') {
    return 'Điểm đến'
  }

  if (field.type === 'date') {
    return 'Ngày đi'
  }

  if (field.type === 'guest-room') {
    if (categoryId.value === 'hotel') return 'Khách và phòng'
    if (categoryId.value === 'tour') return 'Hành khách'
    if (categoryId.value === 'ticket') return 'Số lượng'
  }

  if (field.type === 'number') {
    return 'Số lượng'
  }

  return ''
}

const resolveRangeLabel = () => {
  if (categoryId.value === 'hotel') {
    return {
      start: 'Ngày nhận phòng',
      end: 'Ngày trả phòng'
    }
  }

  return {
    start: 'Ngày đi',
    end: 'Ngày về'
  }
}

const emitModel = (nextModel) => {
  emit('update:modelValue', {
    ...resolvedModel.value,
    ...(nextModel || {})
  })
}

const updateFieldValue = (key, value) => {
  if (!key) return
  emitModel({ [key]: value })
}

const updateFlightField = (key, value) => {
  emitModel({ [key]: value })
}

const handleSwapAirports = () => {
  emitModel({
    fromAirport: flightToAirport.value,
    toAirport: flightFromAirport.value
  })
}

const handleAdjustPassenger = ({ key, delta } = {}) => {
  if (!key || !delta) return

  const next = { ...flightPassengers.value }
  const floor = key === 'adults' ? 1 : 0
  next[key] = Math.max(floor, Number(next[key] || 0) + Number(delta || 0))

  const total = Math.max(1, Number(next.adults || 1)) + Math.max(0, Number(next.children || 0)) + Math.max(0, Number(next.infants || 0))
  if (total > 9) return

  if (key === 'adults' && Number(next.infants || 0) > Number(next.adults || 1)) {
    next.infants = Number(next.adults || 1)
  }

  if (key === 'infants' && Number(next.infants || 0) > Number(next.adults || 1)) {
    return
  }

  emitModel({
    passengers: {
      adults: Math.max(1, Number(next.adults || 1) || 1),
      children: Math.max(0, Number(next.children || 0) || 0),
      infants: Math.max(0, Number(next.infants || 0) || 0)
    }
  })
}

const emitSubmit = () => {
  emit('submit')
}
</script>

<style scoped>
.ota-search-item {
  display: grid;
  gap: 4px;
  align-content: end;
  min-width: 0;
}

.ota-search-label {
  font-size: 0.75rem;
  line-height: 1;
  color: #4d6487;
  font-weight: 700;
  padding: 0 4px;
}

.ota-search-label--hidden {
  visibility: hidden;
}

.ota-search-item--submit {
  min-width: 170px;
}

.ota-search-item--submit .service-search-panel__submit {
  height: 44px;
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
  min-height: 100%;
  width: 100%;
  display: inline-flex;
  align-items: center;
  font-weight: 700;
  color: #1d2d45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ota-search-field--selector :deep(.selector__popup),
.ota-search-field--selector :deep(.guest-room-selector__popup) {
  left: 0;
  top: calc(100% + 10px);
}

.service-search-panel__row--flight {
  grid-template-columns: minmax(0, 1fr);
}

/* Keep per-category grid behavior inside this component to avoid scoped CSS conflicts in parent views. */
.home-search-panel--hotel,
.home-search-panel--tour {
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.25fr);
}

.home-search-panel--hotel .home-search-panel__destination,
.home-search-panel--hotel .home-search-panel__date,
.home-search-panel--hotel .home-search-panel__return-date,
.home-search-panel--hotel .home-search-panel__guest-room,
.home-search-panel--tour .home-search-panel__destination,
.home-search-panel--tour .home-search-panel__date,
.home-search-panel--tour .home-search-panel__return-date,
.home-search-panel--tour .home-search-panel__travelers {
  grid-column: auto;
}

.home-search-panel--hotel .home-search-panel__date-range,
.home-search-panel--tour .home-search-panel__date-range {
  grid-column: span 2;
}

.home-search-panel--ticket {
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr) minmax(0, 1.2fr);
}

.home-search-panel--ticket .home-search-panel__destination,
.home-search-panel--ticket .home-search-panel__date,
.home-search-panel--ticket .home-search-panel__date-range,
.home-search-panel--ticket .home-search-panel__tickets {
  grid-column: auto;
}

@media (max-width: 768px) {
  .home-search-panel--hotel,
  .home-search-panel--tour {
    grid-template-columns: 1fr 1fr;
  }

  .home-search-panel--hotel .home-search-panel__date-range,
  .home-search-panel--hotel .home-search-panel__guest-room,
  .home-search-panel--tour .home-search-panel__date-range,
  .home-search-panel--tour .home-search-panel__travelers {
    grid-column: 1 / -1;
  }

  .home-search-panel--ticket {
    grid-template-columns: 1fr;
  }

  .ota-search-item--submit {
    min-width: 0;
    width: 100%;
  }

  .ota-search-item--submit .service-search-panel__submit {
    width: 100%;
  }
}
</style>
