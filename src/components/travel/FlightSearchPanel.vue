<template>
  <div class="flight-search-card">
    <div class="flight-toolbar">
      <div class="flight-toolbar-right">
        <div ref="passengerDropdownRef" class="flight-passenger-dropdown">
          <button
            class="flight-passenger-trigger"
            type="button"
            @click.stop="togglePassengerDropdown"
            :aria-expanded="isPassengerDropdownOpen"
          >
            {{ passengerSummary }}
            <span class="flight-passenger-caret">▾</span>
          </button>

          <div v-if="isPassengerDropdownOpen" class="flight-passenger-panel" @click.stop>
            <div class="passenger-row">
              <div>
                <strong>Người lớn</strong>
                <p>Từ 12 tuổi</p>
              </div>
              <div class="stepper">
                <button type="button" @click="adjustPassenger('adults', -1)" :disabled="normalizedPassengers.adults <= 1">-</button>
                <strong>{{ normalizedPassengers.adults }}</strong>
                <button type="button" @click="adjustPassenger('adults', 1)" :disabled="normalizedTotalPassengers >= 9">+</button>
              </div>
            </div>

            <div class="passenger-row">
              <div>
                <strong>Trẻ em</strong>
                <p>Từ 2 - 11 tuổi</p>
              </div>
              <div class="stepper">
                <button type="button" @click="adjustPassenger('children', -1)" :disabled="normalizedPassengers.children <= 0">-</button>
                <strong>{{ normalizedPassengers.children }}</strong>
                <button type="button" @click="adjustPassenger('children', 1)" :disabled="normalizedTotalPassengers >= 9">+</button>
              </div>
            </div>

            <div class="passenger-row">
              <div>
                <strong>Em bé</strong>
                <p>Dưới 2 tuổi</p>
              </div>
              <div class="stepper">
                <button type="button" @click="adjustPassenger('infants', -1)" :disabled="normalizedPassengers.infants <= 0">-</button>
                <strong>{{ normalizedPassengers.infants }}</strong>
                <button
                  type="button"
                  @click="adjustPassenger('infants', 1)"
                  :disabled="normalizedTotalPassengers >= 9 || normalizedPassengers.infants >= normalizedPassengers.adults"
                >
                  +
                </button>
              </div>
            </div>

            <button class="flight-passenger-done" type="button" @click="closePassengerDropdown">Xong</button>
          </div>
        </div>

        <label class="flight-inline-cabin">
          <span>Hạng ghế</span>
          <select :value="cabinClass" @change="emit('update:cabinClass', $event.target.value)">
            <option v-for="item in cabinOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <div class="flight-search-grid">
      <label class="flight-field">
        <span>Điểm đi</span>
        <select :value="fromAirport" @change="emit('update:fromAirport', $event.target.value)">
          <option v-for="airport in airports" :key="airport.code" :value="airport.code">
            {{ airport.name }} ({{ airport.code }})
          </option>
        </select>
      </label>

      <button class="swap-button" type="button" @click="emit('swap')" aria-label="Đổi chiều điểm đi và điểm đến">
        ⇄
      </button>

      <label class="flight-field">
        <span>Điểm đến</span>
        <select :value="toAirport" @change="emit('update:toAirport', $event.target.value)">
          <option v-for="airport in airports" :key="airport.code" :value="airport.code">
            {{ airport.name }} ({{ airport.code }})
          </option>
        </select>
      </label>

      <label class="flight-field">
        <span>Ngày bay</span>
        <input :value="departDate" :min="minDate" type="date" @input="emit('update:departDate', $event.target.value)" />
      </label>

      <button class="primary-button flight-search-button" type="button" :disabled="loading" @click="emit('search')">
        {{ loading ? 'Đang tìm...' : searchLabel }}
      </button>
    </div>

    <p v-if="searchErrorMessage" class="error-text">{{ searchErrorMessage }}</p>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  airports: {
    type: Array,
    default: () => []
  },
  cabinOptions: {
    type: Array,
    default: () => []
  },
  fromAirport: {
    type: String,
    default: ''
  },
  toAirport: {
    type: String,
    default: ''
  },
  departDate: {
    type: String,
    default: ''
  },
  cabinClass: {
    type: String,
    default: 'economy'
  },
  passengers: {
    type: Object,
    default: () => ({ adults: 1, children: 0, infants: 0 })
  },
  totalPassengers: {
    type: Number,
    default: 1
  },
  minDate: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  searchErrorMessage: {
    type: String,
    default: ''
  },
  searchLabel: {
    type: String,
    default: 'Tìm chuyến bay'
  }
})

const emit = defineEmits([
  'update:fromAirport',
  'update:toAirport',
  'update:departDate',
  'update:cabinClass',
  'adjust-passenger',
  'swap',
  'search'
])

const passengerDropdownRef = ref(null)
const isPassengerDropdownOpen = ref(false)

const normalizedPassengers = computed(() => ({
  adults: Math.max(1, Number(props.passengers?.adults || 1) || 1),
  children: Math.max(0, Number(props.passengers?.children || 0) || 0),
  infants: Math.max(0, Number(props.passengers?.infants || 0) || 0)
}))

const normalizedTotalPassengers = computed(() => Math.max(1, Number(props.totalPassengers || 1) || 1))

const passengerSummary = computed(() => {
  const { adults, children, infants } = normalizedPassengers.value
  return `${adults} Người lớn, ${children} Trẻ em, ${infants} Em bé`
})

const closePassengerDropdown = () => {
  isPassengerDropdownOpen.value = false
}

const togglePassengerDropdown = () => {
  isPassengerDropdownOpen.value = !isPassengerDropdownOpen.value
}

const adjustPassenger = (key, delta) => {
  emit('adjust-passenger', { key, delta })
}

const handleClickOutsidePassengerDropdown = (event) => {
  if (!isPassengerDropdownOpen.value) return
  if (!passengerDropdownRef.value) return
  if (!passengerDropdownRef.value.contains(event.target)) {
    closePassengerDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutsidePassengerDropdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsidePassengerDropdown)
})
</script>

<style scoped>
.flight-search-card {
  margin-top: -34px;
  position: relative;
  z-index: 4;
  background: #ffffff;
  border: 1px solid #d6e2f4;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 16px 35px rgba(11, 40, 84, 0.12);
}

.flight-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;
}

.flight-toolbar-right {
  width: 100%;
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}

.flight-passenger-dropdown {
  position: relative;
}

.flight-passenger-trigger {
  min-height: 36px;
  min-width: 230px;
  border-radius: 999px;
  border: 1px solid #d8e3f2;
  background: #f7fbff;
  color: #334764;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
}

.flight-passenger-caret {
  color: #6a7f9f;
  font-size: 0.78rem;
}

.flight-passenger-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 300px;
  max-width: min(300px, 90vw);
  border: 1px solid #d8e3f2;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 34px rgba(15, 44, 88, 0.16);
  padding: 10px;
  z-index: 12;
}

.passenger-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px dashed #dbe6f5;
}

.passenger-row:last-of-type {
  border-bottom: 0;
}

.passenger-row strong {
  color: #1c3152;
}

.passenger-row p {
  margin: 2px 0 0;
  color: #7689a8;
  font-size: 0.8rem;
}

.flight-passenger-done {
  margin-top: 10px;
  min-height: 34px;
  width: 100%;
  border: 1px solid #b3d6f2;
  border-radius: 999px;
  background: #dff2ff;
  color: #0b6cbe;
  font-weight: 700;
  cursor: pointer;
}

.flight-inline-cabin {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #2a3c59;
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
}

.flight-inline-cabin select {
  min-height: 36px;
  min-width: 166px;
  border-radius: 8px;
  border: 1px solid #d8e3f2;
  background: #fbfdff;
  padding: 0 10px;
}

.flight-search-grid {
  display: grid;
  grid-template-columns: 1.15fr auto 1.15fr 1fr auto;
  gap: 10px;
  align-items: end;
}

.flight-search-button {
  min-height: 42px;
  padding: 0 22px;
  border-radius: 999px;
  white-space: nowrap;
}

.flight-field {
  display: grid;
  gap: 6px;
  font-weight: 600;
  color: #21324f;
}

.flight-field span {
  font-size: 0.86rem;
}

.flight-field input,
.flight-field select {
  width: 100%;
  min-height: 42px;
  border-radius: 10px;
  border: 1px solid #d8e3f2;
  padding: 0 10px;
  background: #fbfdff;
}

.swap-button {
  min-width: 42px;
  min-height: 42px;
  border-radius: 10px;
  border: 1px solid #cbdcf2;
  background: #f3f8ff;
  font-size: 1.2rem;
  cursor: pointer;
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 128px;
  gap: 10px;
}

.stepper button {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #ccdaed;
  background: #f7fbff;
  cursor: pointer;
}

.stepper button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .flight-toolbar {
    justify-content: flex-end;
  }

  .flight-toolbar-right {
    flex-wrap: wrap;
  }

  .flight-passenger-trigger {
    min-width: 210px;
  }

  .flight-search-grid {
    grid-template-columns: 1fr 42px 1fr 1fr;
  }

  .flight-search-button {
    grid-column: 1 / -1;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .flight-search-card {
    margin-top: -22px;
    border-radius: 14px;
  }

  .flight-search-grid {
    grid-template-columns: 1fr;
  }

  .flight-toolbar {
    align-items: start;
  }

  .flight-toolbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .flight-inline-cabin {
    justify-content: space-between;
  }

  .swap-button {
    width: 42px;
    justify-self: center;
    transform: rotate(90deg);
  }

  .flight-passenger-panel {
    left: 0;
    right: auto;
  }
}
</style>
