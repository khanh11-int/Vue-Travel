<template>
  <div ref="rootRef" class="guest-room-selector">
    <button type="button" class="guest-room-selector__trigger" @click="togglePopup">
      {{ committedSummary }}
    </button>

    <div v-if="isOpen" class="guest-room-selector__popup" role="dialog" aria-label="Chọn khách và phòng">
      <div class="guest-room-selector__row">
        <div>
          <p class="guest-room-selector__label">Người lớn</p>
          <p class="guest-room-selector__hint">Từ 18 tuổi</p>
        </div>
        <div class="guest-room-selector__counter">
          <button type="button" :disabled="draft.adults <= 1" @click="decreaseAdults">-</button>
          <span>{{ draft.adults }}</span>
          <button type="button" @click="increaseAdults">+</button>
        </div>
      </div>

      <div class="guest-room-selector__row">
        <div>
          <p class="guest-room-selector__label">Trẻ em</p>
          <p class="guest-room-selector__hint">1 - 17 tuổi</p>
        </div>
        <div class="guest-room-selector__counter">
          <button type="button" :disabled="draft.children <= 0" @click="decreaseChildren">-</button>
          <span>{{ draft.children }}</span>
          <button type="button" :disabled="draft.children >= MAX_CHILDREN" @click="increaseChildren">+</button>
        </div>
      </div>

      <div class="guest-room-selector__row">
        <div>
          <p class="guest-room-selector__label">Phòng</p>
          <p class="guest-room-selector__hint">Tối thiểu 1 phòng, tối đa {{ draft.adults }} phòng</p>
        </div>
        <div class="guest-room-selector__counter">
          <button type="button" :disabled="draft.rooms <= 1" @click="decreaseRooms">-</button>
          <span>{{ draft.rooms }}</span>
          <button type="button" :disabled="draft.rooms >= draft.adults" @click="increaseRooms">+</button>
        </div>
      </div>

      <div v-if="draft.children > 0" class="guest-room-selector__children-ages">
        <p class="guest-room-selector__ages-title">Độ tuổi trẻ em</p>
        <div v-for="(age, index) in draft.childrenAges" :key="`child-age-${index}`" class="guest-room-selector__age-field">
          <label :for="`child-age-${index}`">Trẻ em {{ index + 1 }}</label>
          <select :id="`child-age-${index}`" :value="age" @change="updateChildAge(index, $event)">
            <option v-for="ageOption in childAgeOptions" :key="ageOption" :value="ageOption">
              {{ ageOption }} tuổi
            </option>
          </select>
        </div>
      </div>

      <div class="guest-room-selector__actions">
        <button type="button" class="primary-button" @click="handleDone">Xong</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  DEFAULT_CHILD_AGE,
  MAX_CHILDREN,
  formatGuestRoomSummary,
  normalizeGuestRoomSelection
} from '@/utils/hotelGuestRoom'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'done'])

const rootRef = ref(null)
const isOpen = ref(false)
const childAgeOptions = Array.from({ length: 17 }, (_, index) => index + 1)
const draft = reactive(normalizeGuestRoomSelection(props.modelValue))

const committedSummary = computed(() => formatGuestRoomSummary(props.modelValue))

const syncDraftFromModel = () => {
  Object.assign(draft, normalizeGuestRoomSelection(props.modelValue))
}

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) {
      syncDraftFromModel()
    }
  },
  { deep: true }
)

const closePopupWithoutSaving = () => {
  isOpen.value = false
  syncDraftFromModel()
}

const handleOutsideClick = (event) => {
  if (!isOpen.value) return
  if (rootRef.value?.contains(event.target)) return
  closePopupWithoutSaving()
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
})

const togglePopup = () => {
  if (isOpen.value) {
    closePopupWithoutSaving()
    return
  }

  syncDraftFromModel()
  isOpen.value = true
}

const increaseAdults = () => {
  draft.adults += 1
}

const decreaseAdults = () => {
  draft.adults = Math.max(1, draft.adults - 1)
}

const increaseChildren = () => {
  if (draft.children >= MAX_CHILDREN) return
  draft.children += 1
  draft.childrenAges.push(DEFAULT_CHILD_AGE)
}

const decreaseChildren = () => {
  if (draft.children <= 0) return
  draft.children -= 1
  draft.childrenAges.pop()
}

const increaseRooms = () => {
  if (draft.rooms < draft.adults) {
    draft.rooms += 1
  }
}

const decreaseRooms = () => {
  draft.rooms = Math.max(1, draft.rooms - 1)
}

const updateChildAge = (index, event) => {
  const normalized = Number(event.target.value)
  draft.childrenAges[index] = Number.isNaN(normalized) ? DEFAULT_CHILD_AGE : normalized
}

const handleDone = () => {
  const normalized = normalizeGuestRoomSelection(draft)
  emit('update:modelValue', normalized)
  emit('done', normalized)
  isOpen.value = false
}
</script>

<style scoped>
.guest-room-selector {
  position: relative;
}

.guest-room-selector__trigger {
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #f9fbff;
  text-align: left;
  color: var(--text);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guest-room-selector__popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: min(360px, calc(100vw - 48px));
  z-index: 30;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(23, 32, 51, 0.14);
  padding: 14px;
  display: grid;
  gap: 12px;
}

.guest-room-selector__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.guest-room-selector__label {
  margin: 0;
  font-weight: 700;
}

.guest-room-selector__hint {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 0.86rem;
}

.guest-room-selector__counter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.guest-room-selector__counter button {
  width: 30px;
  height: 30px;
  border: 1px solid #bfd1e8;
  border-radius: 8px;
  background: #f1f7ff;
  color: #1d5aa8;
  font-weight: 700;
  cursor: pointer;
}

.guest-room-selector__counter button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.guest-room-selector__counter span {
  min-width: 24px;
  text-align: center;
  font-weight: 700;
}

.guest-room-selector__children-ages {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  border-top: 1px solid var(--border);
  padding-top: 10px;
}

.guest-room-selector__ages-title {
  grid-column: 1 / -1;
  margin: 0;
  font-weight: 700;
}

.guest-room-selector__age-field {
  display: grid;
  gap: 6px;
}

.guest-room-selector__age-field label {
  font-size: 0.9rem;
  font-weight: 600;
}

.guest-room-selector__age-field select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #f9fbff;
}

.guest-room-selector__actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border);
  padding-top: 10px;
}

.guest-room-selector__actions .primary-button {
  min-height: 38px;
  padding: 0 16px;
}

@media (max-width: 640px) {
  .guest-room-selector__popup {
    width: min(360px, calc(100vw - 28px));
  }

  .guest-room-selector__children-ages {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
