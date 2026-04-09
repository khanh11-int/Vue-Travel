<template>
  <div ref="rootRef" class="selector">
    <button type="button" class="selector__trigger" @click="togglePopup">
      {{ summary }}
    </button>

    <div v-if="isOpen" class="selector__popup" role="dialog" aria-label="Chọn người đi tour">
      <div class="selector__row">
        <div>
          <p class="selector__label">Người lớn</p>
          <p class="selector__hint">Từ 18 tuổi</p>
        </div>
        <div class="selector__counter">
          <button type="button" :disabled="draft.adults <= 1" @click="draft.adults = Math.max(1, draft.adults - 1)">-</button>
          <span>{{ draft.adults }}</span>
          <button type="button" @click="draft.adults += 1">+</button>
        </div>
      </div>

      <div class="selector__row">
        <div>
          <p class="selector__label">Trẻ em</p>
          <p class="selector__hint">1 - 17 tuổi</p>
        </div>
        <div class="selector__counter">
          <button type="button" :disabled="draft.children <= 0" @click="decreaseChildren">-</button>
          <span>{{ draft.children }}</span>
          <button type="button" :disabled="draft.children >= MAX_CHILDREN" @click="increaseChildren">+</button>
        </div>
      </div>

      <div v-if="draft.children > 0" class="selector__ages">
        <p class="selector__ages-title">Độ tuổi trẻ em</p>
        <div v-for="(age, index) in draft.childrenAges" :key="`tour-child-${index}`" class="selector__age-field">
          <label :for="`tour-child-age-${index}`">Trẻ em {{ index + 1 }}</label>
          <select :id="`tour-child-age-${index}`" :value="age" @change="updateChildAge(index, $event)">
            <option v-for="ageOption in ageOptions" :key="ageOption" :value="ageOption">{{ ageOption }} tuổi</option>
          </select>
        </div>
      </div>

      <div class="selector__actions">
        <button type="button" class="primary-button" @click="commit">Xong</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

const MAX_CHILDREN = 6
const DEFAULT_CHILD_AGE = 8

const normalize = (payload = {}) => {
  const adults = Math.max(1, Math.floor(Number(payload.adults) || 1))
  const children = Math.max(0, Math.min(MAX_CHILDREN, Math.floor(Number(payload.children) || 0)))
  const sourceAges = Array.isArray(payload.childrenAges) ? payload.childrenAges : []
  const childrenAges = sourceAges
    .slice(0, children)
    .map((age) => Math.min(17, Math.max(1, Math.floor(Number(age) || DEFAULT_CHILD_AGE))) )

  while (childrenAges.length < children) {
    childrenAges.push(DEFAULT_CHILD_AGE)
  }

  return {
    adults,
    children,
    childrenAges
  }
}

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'done'])

const rootRef = ref(null)
const isOpen = ref(false)
const ageOptions = Array.from({ length: 17 }, (_, index) => index + 1)
const draft = reactive(normalize(props.modelValue))

const summary = computed(() => `${draft.adults} người lớn, ${draft.children} trẻ em`)

const syncDraft = () => {
  Object.assign(draft, normalize(props.modelValue))
}

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) syncDraft()
  },
  { deep: true }
)

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

const updateChildAge = (index, event) => {
  const age = Math.min(17, Math.max(1, Number(event.target.value) || DEFAULT_CHILD_AGE))
  draft.childrenAges[index] = age
}

const closeWithoutSave = () => {
  isOpen.value = false
  syncDraft()
}

const onOutsideClick = (event) => {
  if (!isOpen.value) return
  if (rootRef.value?.contains(event.target)) return
  closeWithoutSave()
}

onMounted(() => {
  document.addEventListener('mousedown', onOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onOutsideClick)
})

const togglePopup = () => {
  if (isOpen.value) {
    closeWithoutSave()
    return
  }

  syncDraft()
  isOpen.value = true
}

const commit = () => {
  const normalized = normalize(draft)
  emit('update:modelValue', normalized)
  emit('done', normalized)
  isOpen.value = false
}
</script>

<style scoped>
.selector {
  position: relative;
}

.selector__trigger {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #dce5f2;
  border-radius: 14px;
  background: #f9fbff;
  text-align: left;
  color: #1d2d45;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selector__popup {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  width: min(520px, calc(100vw - 24px));
  z-index: 30;
  background: #ffffff;
  border: 1px solid #d7e2f2;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(23, 32, 51, 0.14);
  padding: 14px;
  display: grid;
  gap: 12px;
}

.selector__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.selector__label {
  margin: 0;
  font-weight: 700;
}

.selector__hint {
  margin: 2px 0 0;
  color: #597089;
  font-size: 0.86rem;
}

.selector__counter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.selector__counter button {
  width: 30px;
  height: 30px;
  border: 1px solid #bfd1e8;
  border-radius: 8px;
  background: #f1f7ff;
  color: #1d5aa8;
  font-weight: 700;
  cursor: pointer;
}

.selector__counter button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.selector__counter span {
  min-width: 24px;
  text-align: center;
  font-weight: 700;
}

.selector__ages {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  border-top: 1px solid #d7e2f2;
  padding-top: 10px;
}

.selector__ages-title {
  grid-column: 1 / -1;
  margin: 0;
  font-weight: 700;
}

.selector__age-field {
  display: grid;
  gap: 6px;
}

.selector__age-field label {
  font-size: 0.9rem;
  font-weight: 600;
}

.selector__age-field select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d7e2f2;
  background: #f9fbff;
}

.selector__actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #d7e2f2;
  padding-top: 10px;
}

.selector__actions .primary-button {
  min-height: 38px;
  padding: 0 16px;
}

@media (max-width: 640px) {
  .selector__popup {
    left: 0;
    right: auto;
    width: min(520px, calc(100vw - 16px));
  }
}
</style>
