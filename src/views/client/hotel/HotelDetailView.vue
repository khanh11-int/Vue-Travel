<template>
  <section v-if="service" class="page-section detail-layout">
    <DetailMainContent
      :service="service"
      :selected-image="selectedImage"
      :gallery-images="galleryImages"
      @update:selected-image="selectedImage = $event"
    />

    <div class="detail-side-column">
      <aside class="booking-panel hotel-booking-panel">
        <p class="eyebrow">Đặt chỗ</p>
        <h3 class="detail-price">{{ formatCurrencyVND(displaySalePrice) }}</h3>
        <p class="muted hotel-booking-note">Giá áp dụng cho thị trường Việt Nam, chưa bao gồm phí dịch vụ.</p>

        <div class="hotel-booking-field-grid">
          <div class="hotel-booking-field">
            <label>{{ primaryDateLabel }}</label>
            <input v-model="bookingForm.startDate" :min="todayISO" type="date" />
          </div>

          <div class="hotel-booking-field">
            <label>Ngày trả phòng</label>
            <input v-model="bookingForm.endDate" :min="bookingForm.startDate || todayISO" type="date" />
          </div>

          <div class="hotel-booking-field">
            <label>Khách và phòng</label>
            <GuestRoomSelector v-model="bookingForm.guestRoomSelection" />
          </div>

          <div class="hotel-booking-field">
            <label>Loại phòng</label>
            <div class="room-type-wrapper">
              <select
                v-model="bookingForm.roomType"
                class="room-type-select"
                :disabled="!roomTypeOptions.length"
              >
                <option
                  v-for="option in roomTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }} · Còn {{ option.availableSlots || 0 }} chỗ
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="hotel-booking-insight-grid">
          <div class="hotel-pricing-breakdown">
            <div class="hotel-pricing-breakdown__row">
              <span>Tổng số khách</span>
              <strong>{{ bookingQuantity }} khách · {{ stayNights }} đêm</strong>
            </div>
            <div class="hotel-pricing-breakdown__row">
              <span>Người lớn tính phí</span>
              <strong>{{ chargeableAdultCount }}</strong>
            </div>
            <div class="hotel-pricing-breakdown__row">
              <span>Trẻ 4-14 tuổi</span>
              <strong>{{ childrenChargeRange.count }}</strong>
            </div>
          </div>

          <div v-if="selectedRoomType" class="hotel-room-rate-box">
            <div class="room-type-detail-item">
              <span>Giá người lớn/đêm</span>
              <strong>{{ formatCurrencyVND(adultUnitPricePerNight) }}</strong>
            </div>
            <div class="room-type-detail-item">
              <span>Phụ thu trẻ 4-14 tuổi/đêm</span>
              <strong>{{ formatCurrencyVND(effectiveChildSurchargePerNight) }}</strong>
            </div>
          </div>
        </div>

        <p v-if="childrenChargeRange.count > 0" class="hotel-pricing-breakdown__note muted">
          Phụ thu trẻ em: {{ childSurchargeDisplay }}
        </p>
        <p class="hotel-pricing-breakdown__note muted" v-if="childrenUnderFourCount > 0">
          Trẻ dưới 4 tuổi: miễn phí ({{ childrenUnderFourCount }} trẻ)
        </p>

        <div class="booking-summary-row hotel-pricing-total">
          <span>Tạm tính</span>
          <strong>{{ formatCurrencyVND(totalPrice) }}</strong>
        </div>

        <small v-if="bookingFeedback" class="error-text">{{ bookingFeedback }}</small>
        <small v-else-if="bookingSuccess" class="success-text">{{ bookingSuccess }}</small>

        <div class="hotel-booking-actions">
          <button
            class="primary-button full-width"
            type="button"
            :disabled="maxSelectableSlots <= 0"
            @click="handleBookNow"
          >
            {{ maxSelectableSlots > 0 ? 'Đặt ngay' : 'Hết chỗ' }}
          </button>
        </div>
      </aside>

      <DetailCommentSection
        class="detail-side-comment"
        :service-comments="serviceComments"
      />
    </div>

    <DetailRelatedServices :related-services="relatedServices" />
  </section>

  <section v-else class="page-section empty-state">
    <h1>Không tìm thấy dịch vụ</h1>
    <router-link class="primary-button" to="/dich-vu">Quay lại danh sách</router-link>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GuestRoomSelector from '@/components/travel/GuestRoomSelector.vue'
import DetailMainContent from '@/components/travel/DetailMainContent.vue'
import DetailCommentSection from '@/components/travel/DetailCommentSection.vue'
import DetailRelatedServices from '@/components/travel/DetailRelatedServices.vue'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { getPrimaryDateLabel } from '@/utils/bookingRules'
import { formatCurrencyVND } from '@/utils/formatters'
import {
  calculateTotalGuests,
  normalizeGuestRoomSelection,
  parseGuestRoomFromQuery,
  serializeChildrenAges
} from '@/utils/hotelGuestRoom'

const clampGuestSelectionBySlots = (selection, maxSlots) => {
  const normalized = normalizeGuestRoomSelection(selection)
  const safeMaxSlots = Math.max(1, Number(maxSlots) || 1)
  const currentTotal = calculateTotalGuests(normalized)

  if (currentTotal <= safeMaxSlots) {
    return normalized
  }

  const adults = Math.max(1, Math.min(normalized.adults, safeMaxSlots))
  const remainingSlotsForChildren = Math.max(0, safeMaxSlots - adults)
  const children = Math.min(normalized.children, remainingSlotsForChildren)

  return normalizeGuestRoomSelection({
    ...normalized,
    adults,
    children
  })
}

const hotelDetailLogic = {
  scheduleLabel: 'Chọn lịch phù hợp',
  parseQuery: (query) => {
    const fallbackGuests = Math.max(1, Number(query.guests || query.quantity || 2) || 2)
    const parsedGuestRoom = parseGuestRoomFromQuery(query)

    return {
      startDate: String(query.checkInDate || query.startDate || query.date || '').trim(),
      endDate: String(query.checkOutDate || query.endDate || query.returnDate || '').trim(),
      guestRoomSelection: parsedGuestRoom || normalizeGuestRoomSelection({
        adults: fallbackGuests,
        children: 0,
        rooms: Number(query.rooms || 1)
      }),
      scheduleId: ''
    }
  },
  buildScheduleOptions: () => [],
  requiresScheduleSelection: () => false,
  buildSelectedScheduleMeta: () => '',
  buildBookingMeta: ({ bookingForm, selectedSchedule, displaySalePrice }) => ({
    roomType: bookingForm.roomType,
    roomTypeLabel: selectedRoomType.value?.label || bookingForm.roomType,
    checkInDate: bookingForm.startDate,
    checkOutDate: bookingForm.endDate,
    guests: calculateTotalGuests(bookingForm.guestRoomSelection),
    adults: bookingForm.guestRoomSelection.adults,
    children: bookingForm.guestRoomSelection.children,
    childrenAges: [...bookingForm.guestRoomSelection.childrenAges],
    rooms: bookingForm.guestRoomSelection.rooms,
    nights: stayNights.value,
    chargeableAdults: chargeableAdultCount.value,
    childrenUnderFour: childrenUnderFourCount.value,
    children4To14: childrenChargeRange.value.count,
    childSurchargeMin: effectiveChildSurchargePerNight.value,
    childSurchargeMax: effectiveChildSurchargePerNight.value,
    childSurchargePerNight: childSurchargePerNight.value,
    totalPrice: totalPrice.value,
    durationLabel: selectedSchedule?.durationLabel || '',
    unitPrice: displaySalePrice
  }),
  buildCheckoutQuery: ({ bookingForm, selectedSchedule, displaySalePrice, requiresEndDate }) => ({
    roomType: bookingForm.roomType || undefined,
    roomTypeLabel: selectedRoomType.value?.label || bookingForm.roomType || undefined,
    checkInDate: bookingForm.startDate,
    checkOutDate: bookingForm.endDate,
    guests: calculateTotalGuests(bookingForm.guestRoomSelection),
    adults: bookingForm.guestRoomSelection.adults,
    children: bookingForm.guestRoomSelection.children,
    rooms: bookingForm.guestRoomSelection.rooms,
    childrenAges: serializeChildrenAges(bookingForm.guestRoomSelection.childrenAges) || undefined,
    nights: stayNights.value,
    chargeableAdults: chargeableAdultCount.value,
    childrenUnderFour: childrenUnderFourCount.value,
    children4To14: childrenChargeRange.value.count,
    childSurchargeMin: effectiveChildSurchargePerNight.value,
    childSurchargeMax: effectiveChildSurchargePerNight.value,
    childSurchargePerNight: childSurchargePerNight.value,
    totalPrice: totalPrice.value,
    durationLabel: selectedSchedule?.durationLabel || undefined,
    unitPrice: displaySalePrice,
    startDate: bookingForm.startDate,
    endDate: requiresEndDate ? bookingForm.endDate : '',
    quantity: calculateTotalGuests(bookingForm.guestRoomSelection)
  })
}

const route = useRoute()
const router = useRouter()
const serviceStore = useServiceStore()
const todayISO = (() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})()

const service = computed(() => {
  const found = serviceStore.getServiceBySlug(route.params.slug)
  if (!found || found.categoryId !== 'hotel') return null
  return found
})
const serviceComments = computed(() => (service.value ? serviceStore.getCommentsByService(service.value.id) : []))
const primaryDateLabel = computed(() => getPrimaryDateLabel(service.value))
const relatedServices = computed(() => {
  if (!service.value) return []

  return serviceStore.services
    .filter((item) => item.id !== service.value.id)
    .filter((item) => item.categoryId === service.value.categoryId || item.province === service.value.province)
    .slice(0, 3)
})
const galleryImages = computed(() => {
  if (!service.value) return []

  const merged = [service.value.image, ...(service.value.gallery || [])].filter(Boolean)
  return [...new Set(merged)]
})

const displaySalePrice = computed(() => Number(service.value?.salePrice || 0))
const maxSelectableSlots = computed(() => {
  const selected = selectedRoomType.value
  if (selected && Number.isFinite(Number(selected.availableSlots))) {
    return Math.max(0, Number(selected.availableSlots || 0))
  }
  return Math.max(0, Number(service.value?.availableSlots || 0))
})

const bookingForm = reactive({
  startDate: '',
  endDate: '',
  guestRoomSelection: normalizeGuestRoomSelection({
    adults: 2,
    children: 0,
    rooms: 1
  }),
  roomType: ''
})
const bookingFeedback = ref('')
const bookingSuccess = ref('')
const selectedImage = ref('')

const bookingQuantity = computed(() => calculateTotalGuests(bookingForm.guestRoomSelection))
const roomTypeOptions = computed(() => {
  const source = Array.isArray(service.value?.roomTypes) ? service.value.roomTypes : []
  if (!source.length) {
    return [
      {
        value: 'standard',
        label: 'Phòng tiêu chuẩn',
        priceMultiplier: 1,
        childSurcharge: 300000,
        availableSlots: Math.max(0, Number(service.value?.availableSlots || 0))
      }
    ]
  }

  return source.map((item, index) => ({
    value: String(item.value || item.id || `room-type-${index + 1}`),
    label: String(item.label || item.name || `Loại phòng ${index + 1}`),
    priceMultiplier: Math.max(0.8, Number(item.priceMultiplier || 1) || 1),
    childSurcharge: Math.max(300000, Math.min(600000, Number(item.childSurcharge || 300000) || 300000)),
    availableSlots: Math.max(0, Number(item.availableSlots || 0))
  }))
})
const selectedRoomType = computed(() =>
  roomTypeOptions.value.find((item) => item.value === bookingForm.roomType) || roomTypeOptions.value[0] || null
)

watch([service, () => route.query], ([nextService]) => {
  if (!nextService) return

  selectedImage.value = nextService.image
  const queryDefaults = hotelDetailLogic.parseQuery(route.query)
  bookingForm.startDate = queryDefaults.startDate
  bookingForm.endDate = queryDefaults.endDate
  bookingForm.guestRoomSelection = clampGuestSelectionBySlots(
    queryDefaults.guestRoomSelection,
    nextService.availableSlots
  )

  const availableRoomTypeValues = roomTypeOptions.value.map((item) => item.value)
  const requestedRoomType = String(route.query.roomType || '')
  bookingForm.roomType = availableRoomTypeValues.includes(requestedRoomType)
    ? requestedRoomType
    : roomTypeOptions.value[0]?.value || ''
}, { immediate: true, deep: true })

const stayNights = computed(() => {
  const startDate = bookingForm.startDate
  const endDate = bookingForm.endDate
  if (!startDate || !endDate) return 1

  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1

  const msPerDay = 24 * 60 * 60 * 1000
  const days = Math.round((end - start) / msPerDay)
  return Math.max(1, days)
})

// Age-based pricing buckets
const childAgeBuckets = computed(() => {
  const childrenAges = Array.isArray(bookingForm.guestRoomSelection.childrenAges)
    ? bookingForm.guestRoomSelection.childrenAges
    : []

  return childrenAges.reduce((acc, age) => {
    const normalizedAge = Number(age)
    if (Number.isNaN(normalizedAge) || normalizedAge < 0) return acc
    if (normalizedAge < 4) acc.under4 += 1
    else if (normalizedAge <= 14) acc.from4to14 += 1
    else if (normalizedAge <= 17) acc.from15to17 += 1
    return acc
  }, {
    under4: 0,
    from4to14: 0,
    from15to17: 0
  })
})

const childrenUnderFourCount = computed(() => childAgeBuckets.value.under4)
const chargeableAdultCount = computed(() => bookingForm.guestRoomSelection.adults + childAgeBuckets.value.from15to17)
const baseRoomNightPrice = computed(() => {
  const sale = Number(service.value?.salePrice || 0)
  const listed = Number(service.value?.price || 0)
  const byNight = Number(service.value?.pricePerNight || 0)
  return Math.max(300000, byNight || sale || listed || 300000)
})
const adultUnitPricePerNight = computed(() => {
  const multiplier = Math.max(0.8, Number(selectedRoomType.value?.priceMultiplier || 1) || 1)
  return Math.round(baseRoomNightPrice.value * multiplier)
})
const effectiveChildSurchargePerNight = computed(() => {
  const configured = Math.max(300000, Math.min(600000, Number(selectedRoomType.value?.childSurcharge || 300000) || 300000))
  // Ensure child surcharge never exceeds current adult unit price.
  return Math.min(configured, adultUnitPricePerNight.value)
})
const childrenChargeRange = computed(() => ({
  count: childAgeBuckets.value.from4to14,
  pricePerChild: effectiveChildSurchargePerNight.value
}))
const childSurchargePerNight = computed(() => {
  return childrenChargeRange.value.count * childrenChargeRange.value.pricePerChild
})
const childSurchargeDisplay = computed(() => {
  const count = childrenChargeRange.value.count
  if (count <= 0) return formatCurrencyVND(0)
  return `${formatCurrencyVND(childrenChargeRange.value.pricePerChild)}/trẻ/đêm`
})

// Calculate total price: adults + children surcharge, all multiplied by nights and rooms
const totalPrice = computed(() => {
  if (!service.value) return 0

  const rooms = Math.max(1, bookingForm.guestRoomSelection.rooms)
  const nights = Math.max(1, stayNights.value)

  // Adults cost (includes children 15-17 as full price)
  const adultsSubtotal = chargeableAdultCount.value * adultUnitPricePerNight.value * nights * rooms

  // Children 4-14 cost
  const childrenSubtotal = childSurchargePerNight.value * nights * rooms

  // Children under 4 are free
  return Math.round(adultsSubtotal + childrenSubtotal)
})

const validateBookingInput = () => {
  bookingFeedback.value = ''
  bookingSuccess.value = ''

  if (!service.value) return false
  if (maxSelectableSlots.value <= 0) {
    bookingFeedback.value = 'Dịch vụ hiện đã hết chỗ.'
    return false
  }
  if (!bookingForm.startDate) {
    bookingFeedback.value = `Vui lòng chọn ${primaryDateLabel.value.toLowerCase()}.`
    return false
  }
  if (bookingForm.startDate < todayISO) {
    bookingFeedback.value = `${primaryDateLabel.value} không được nhỏ hơn ngày hiện tại.`
    return false
  }
  if (!bookingForm.endDate) {
    bookingFeedback.value = 'Vui lòng chọn ngày trả phòng.'
    return false
  }
  if (new Date(bookingForm.endDate) < new Date(bookingForm.startDate)) {
    bookingFeedback.value = 'Ngày trả phòng phải sau hoặc bằng ngày nhận phòng.'
    return false
  }
  if (bookingQuantity.value > maxSelectableSlots.value) {
    bookingFeedback.value = `Số lượng khách vượt quá ${maxSelectableSlots.value} chỗ còn lại.`
    return false
  }

  return true
}

const handleBookNow = () => {
  if (!validateBookingInput()) return

  router.push({
    path: '/thanh-toan',
    query: {
      mode: 'direct',
      serviceId: service.value.id,
      ...hotelDetailLogic.buildCheckoutQuery({
        bookingForm,
        selectedSchedule: null,
        displaySalePrice: displaySalePrice.value,
        requiresEndDate: true
      })
    }
  })
}

</script>

<style scoped>
.detail-layout {
  grid-template-areas:
    'main side'
    'related related';
  grid-template-columns: minmax(0, 1.08fr) minmax(340px, 1fr);
  align-items: start;
}

:deep(.detail-main-column) {
  grid-area: main;
}

:deep(.detail-related-section) {
  grid-area: related;
}

.detail-side-column {
  grid-area: side;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-content: start;
  align-self: start;
}

.detail-side-comment {
  grid-column: 1;
  grid-row: auto;
  position: static;
  top: auto;
}

.hotel-booking-panel {
  display: grid;
  grid-column: 1;
  grid-row: auto;
  align-content: start;
  position: static;
  top: auto;
  align-self: start;
  height: auto;
  gap: 12px;
  border-radius: 18px;
  border: 1px solid #d9e3f2;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
  box-shadow: 0 14px 28px rgba(20, 45, 84, 0.1);
  max-height: none;
  overflow: visible;
}

.hotel-booking-note {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #6a7d99;
}

.hotel-booking-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.hotel-booking-field {
  display: grid;
  gap: 7px;
}

.hotel-booking-field input,
.hotel-booking-field select {
  width: 100%;
  min-height: 42px;
  padding: 10px 13px;
  border: 1px solid #c8d6ea;
  border-radius: 10px;
  background: #f5f8ff;
  color: #1d3555;
  font-size: 0.92rem;
}

.hotel-booking-field input:focus,
.hotel-booking-field select:focus {
  outline: none;
  border-color: #7ea8de;
  box-shadow: 0 0 0 3px rgba(36, 110, 199, 0.12);
}

.hotel-booking-field :deep(.guest-room-selector__trigger) {
  min-height: 42px;
  padding: 10px 13px;
  border: 1px solid #c8d6ea;
  border-radius: 10px;
  background: #f5f8ff;
  color: #1d3555;
  font-size: 0.92rem;
}

.hotel-booking-field :deep(.guest-room-selector__popup) {
  border-radius: 10px;
  z-index: 120;
}

.hotel-booking-insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.hotel-pricing-breakdown {
  margin-top: 0;
  padding: 11px;
  border: 1px solid #d4e0f0;
  border-radius: 12px;
  background: linear-gradient(180deg, #eff5ff 0%, #eaf2ff 100%);
}

.hotel-pricing-breakdown__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.9rem;
  color: #516a8a;
}

.hotel-pricing-breakdown__row + .hotel-pricing-breakdown__row {
  margin-top: 4px;
}

.hotel-pricing-breakdown__row strong {
  color: #1f3552;
  font-weight: 700;
  text-align: right;
}

.hotel-room-rate-box {
  padding: 11px;
  border: 1px solid #d4e0f0;
  border-radius: 12px;
  background: linear-gradient(180deg, #eff5ff 0%, #eaf2ff 100%);
  display: grid;
  gap: 6px;
}

.hotel-pricing-breakdown__note {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.35;
}

.hotel-pricing-total {
  margin-top: 2px;
  padding: 10px 0 8px;
  border-top: 1px solid #d4deed;
  border-bottom: 1px solid #d4deed;
}

.room-type-wrapper {
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
}

.room-type-select {
  width: 100%;
  min-height: 42px;
  padding: 10px 13px;
  border: 1px solid #c8d6ea;
  border-radius: 10px;
  background: #f5f8ff;
  color: #1f3552;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 0;
  appearance: auto;
}

.room-type-select:hover {
  border-color: #9eb4d2;
  background: #f8fbff;
}

.room-type-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.room-type-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 0;
  border-top: 0;
}

.room-type-detail-item {
  font-size: 0.88rem;
  color: #5a7291;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-type-detail-item strong {
  color: #1f3552;
  font-weight: 700;
}

.hotel-booking-actions {
  display: grid;
  gap: 10px;
  margin-top: 4px;
}

.hotel-booking-actions .primary-button,
.hotel-booking-actions .secondary-button {
  min-height: 40px;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 700;
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-areas:
      'main'
      'side'
      'related';
    grid-template-columns: 1fr;
  }

  .detail-side-column {
    grid-area: side;
  }

  .hotel-booking-panel {
    grid-column: 1;
    grid-row: auto;
  }

  .hotel-booking-field-grid,
  .hotel-booking-insight-grid {
    grid-template-columns: 1fr;
  }
}
</style>
