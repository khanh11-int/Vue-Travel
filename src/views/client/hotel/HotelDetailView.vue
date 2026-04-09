<template>
  <section v-if="service" class="page-section detail-layout">
    <DetailMainContent
      :service="service"
      :selected-image="selectedImage"
      :gallery-images="galleryImages"
      :service-comments="serviceComments"
      :related-services="relatedServices"
      @update:selected-image="selectedImage = $event"
      @submit-comment="submitComment"
    />

    <aside class="booking-panel sticky-card detail-booking-panel">
      <p class="eyebrow">Đặt chỗ</p>
      <h3 class="detail-price">{{ formatCurrencyVND(displaySalePrice) }}</h3>
      <p class="muted">Giá áp dụng cho thị trường Việt Nam, chưa bao gồm phí dịch vụ.</p>

      <label>{{ primaryDateLabel }}</label>
      <input v-model="bookingForm.startDate" :min="todayISO" type="date" />

      <label>Ngày trả phòng</label>
      <input v-model="bookingForm.endDate" :min="bookingForm.startDate || todayISO" type="date" />

      <label>Khách và phòng</label>
      <GuestRoomSelector v-model="bookingForm.guestRoomSelection" />

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

        <div v-if="selectedRoomType" class="room-type-details">
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
        <div v-if="childrenChargeRange.count > 0" class="hotel-pricing-breakdown__row">
          <span>Phụ thu trẻ em</span>
          <strong>{{ childSurchargeDisplay }}</strong>
        </div>
        <p v-if="childrenChargeRange.count > 0" class="hotel-pricing-breakdown__note muted">
          Tổng phụ thu: {{ childrenChargeRange.count }} trẻ × {{ formatCurrencyVND(childrenChargeRange.pricePerChild) }}/đêm
        </p>
        <p class="hotel-pricing-breakdown__note muted" v-if="childrenUnderFourCount > 0">
          Trẻ dưới 4 tuổi: miễn phí ({{ childrenUnderFourCount }} trẻ)
        </p>
      </div>

      <div class="booking-summary-row hotel-pricing-total">
        <span>Tạm tính</span>
        <strong>{{ formatCurrencyVND(totalPrice) }}</strong>
      </div>

      <small v-if="bookingFeedback" class="error-text">{{ bookingFeedback }}</small>
      <small v-else-if="bookingSuccess" class="success-text">{{ bookingSuccess }}</small>

      <button
        class="primary-button full-width"
        type="button"
        :disabled="maxSelectableSlots <= 0"
        @click="handleBookNow"
      >
        {{ maxSelectableSlots > 0 ? 'Đặt ngay' : 'Hết chỗ' }}
      </button>
      <button
        class="secondary-button full-width"
        type="button"
        :disabled="maxSelectableSlots <= 0"
        @click="handleAddToCart"
      >
        {{ isEditingFromCart ? 'Cập nhật giỏ hàng' : 'Thêm vào giỏ' }}
      </button>
      <button class="ghost-button full-width" type="button" @click="toggleWishlist(service.id)">
        {{ isWishlisted ? 'Đã lưu wishlist' : 'Thêm vào wishlist' }}
      </button>
    </aside>
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
import { useAdminStore } from '@/stores/admin/useAdminStore'
import { useCartStore } from '@/stores/cart/useCartStore'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { useWishlistStore } from '@/stores/wishlist/useWishlistStore'
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
const cartStore = useCartStore()
const adminStore = useAdminStore()
const wishlistStore = useWishlistStore()
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
const isWishlisted = computed(() => wishlistStore.isInWishlist(service.value?.id))
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
const isEditingFromCart = computed(() => route.query.edit === '1')
const originalCartItem = computed(() => ({
  serviceId: route.query.originServiceId ?? service.value?.id,
  startDate: String(route.query.originStartDate || ''),
  endDate: String(route.query.originEndDate || ''),
  bookingType: String(route.query.originBookingType || 'hotel'),
  bookingMeta: {
    rooms: Number(route.query.originRooms || 1),
    roomType: String(route.query.originRoomType || route.query.roomType || '')
  }
}))

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

const addToCartWithCurrentSelection = () => {
  const nextItem = {
    serviceId: service.value.id,
    quantity: bookingQuantity.value,
    bookingType: 'hotel',
    bookingMeta: hotelDetailLogic.buildBookingMeta({
      bookingForm,
      selectedSchedule: null,
      displaySalePrice: displaySalePrice.value
    }),
    startDate: bookingForm.startDate,
    endDate: bookingForm.endDate
  }

  if (isEditingFromCart.value) {
    cartStore.removeCartItem(
      originalCartItem.value.serviceId,
      originalCartItem.value.startDate,
      originalCartItem.value.endDate,
      originalCartItem.value.bookingType,
      originalCartItem.value.bookingMeta
    )
    cartStore.addToCart(nextItem)
    return
  }

  cartStore.addToCart(nextItem)
}

const toggleWishlist = () => {
  if (!service.value?.id) return
  wishlistStore.toggleWishlist(service.value.id)
}

const handleAddToCart = () => {
  if (!validateBookingInput()) return
  addToCartWithCurrentSelection()

  if (isEditingFromCart.value) {
    router.push('/gio-hang')
    return
  }

  bookingSuccess.value = 'Đã thêm dịch vụ vào giỏ đặt chỗ.'
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

const submitComment = (payload) => {
  if (!service.value) return
  adminStore.addComment({
    serviceId: service.value.id,
    userName: payload.userName,
    rating: payload.rating,
    content: payload.content
  })
}
</script>

<style scoped>
.hotel-pricing-breakdown {
  margin-top: 10px;
  padding: 12px;
  border: 1px solid #dbe6f5;
  border-radius: 12px;
  background: linear-gradient(180deg, #f7fbff 0%, #f2f7ff 100%);
}

.hotel-pricing-breakdown__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.95rem;
  color: #486280;
}

.hotel-pricing-breakdown__row + .hotel-pricing-breakdown__row {
  margin-top: 6px;
}

.hotel-pricing-breakdown__row strong {
  color: #1f3552;
  font-weight: 700;
  text-align: right;
}

.hotel-pricing-breakdown__note {
  margin: 8px 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
}

.hotel-pricing-total {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #cad9ef;
}

.room-type-wrapper {
  padding: 12px;
  border: 1px solid #dbe6f5;
  border-radius: 12px;
  background: linear-gradient(180deg, #f9fbff 0%, #f2f7ff 100%);
}

.room-type-select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #cce0f0;
  border-radius: 10px;
  background: #ffffff;
  color: #1f3552;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  margin-bottom: 10px;
  appearance: auto;
}

.room-type-select:hover {
  border-color: #a0c8f0;
  background: #f8faff;
}

.room-type-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.room-type-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid #dbe6f5;
}

.room-type-detail-item {
  font-size: 0.9rem;
  color: #667fa0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-type-detail-item strong {
  color: #1f3552;
  font-weight: 700;
}
</style>
