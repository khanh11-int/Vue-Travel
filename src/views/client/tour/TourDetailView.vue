<template>
  <section v-if="service" class="page-section detail-layout">
    <DetailMainContent
      :service="service"
      :selected-image="selectedImage"
      :gallery-images="galleryImages"
      @update:selected-image="selectedImage = $event"
    />

    <div class="detail-side-column">
      <aside class="booking-panel tour-booking-panel">
        <p class="eyebrow">Đặt chỗ</p>
        <h3 class="detail-price">{{ formatCurrencyVND(effectiveUnitPrice) }}</h3>
        <p class="muted tour-booking-note">{{ effectiveScheduleMode === 'fixed' ? pricingTiers.fixed?.note || 'Lịch cố định áp dụng ưu đãi.' : pricingTiers.flexible?.note || 'Lịch linh hoạt áp dụng giá gốc, không ưu đãi.' }}</p>

        <!-- Block 1: Schedule Selection -->
        <div class="booking-block">
          <div v-if="isHybridSchedule" class="tour-pricing-select">
            <label>Chọn loại lịch</label>
            <select v-model="bookingForm.scheduleMode" class="tour-pricing-dropdown">
              <option value="fixed">{{ pricingTiers.fixed?.label || 'Lịch cố định (ưu đãi)' }}</option>
              <option value="flexible">{{ pricingTiers.flexible?.label || 'Lịch linh hoạt' }}</option>
            </select>
          </div>

          <template v-if="effectiveScheduleMode === 'fixed'">
            <label v-if="scheduleOptions.length > 0" class="tour-schedule-label">{{ scheduleLabel }}</label>
            <div v-if="scheduleOptions.length > 0" class="schedule-option-grid">
              <button
                v-for="option in scheduleOptions"
                :key="option.id"
                type="button"
                class="schedule-option-card"
                :class="{ active: bookingForm.selectedScheduleId === option.id, disabled: option.remainingSlots <= 0 }"
                :disabled="option.remainingSlots <= 0"
                @click="selectScheduleOption(option.id)"
              >
                <span class="schedule-option-card__date">{{ formatDateRangeVN(option.startDate, option.endDate) }}</span>
                <span class="schedule-option-card__meta">{{ option.durationLabel }} · Còn {{ option.remainingSlots }} chỗ</span>
              </button>
            </div>
            <small v-if="selectedSchedule" class="muted">{{ selectedScheduleMeta }}</small>
          </template>

          <template v-else>
            <div class="tour-flexible-date-row">
              <div class="tour-flexible-date-field">
                <label>Ngày khởi hành</label>
                <input v-model="bookingForm.startDate" :min="flexibleStartMin" :max="flexibleStartMax" type="date" />
              </div>

              <div class="tour-flexible-date-field">
                <label>Ngày kết thúc <span class="muted">(tự động)</span></label>
                <input v-model="bookingForm.endDate" :min="bookingForm.startDate || flexibleStartMin" :max="flexibleEndMax" type="date" disabled />
              </div>
            </div>
            <small class="muted" v-if="flexibleWindowText">{{ flexibleWindowText }}</small>
          </template>

        </div>

        <!-- Block 2: Traveler Selection -->
        <div class="booking-block">
          <label>Người lớn và trẻ em</label>
          <TourTravelerSelector v-model="travelerSelection" />

          <div class="tour-pricing-breakdown">
            <div class="booking-summary-row">
              <span>Tổng khách</span>
              <strong>{{ totalGuests }} khách</strong>
            </div>
            <div class="booking-summary-row">
              <span>Người lớn (100%)</span>
              <strong>{{ chargeableAdultCount }} khách</strong>
            </div>
            <div class="booking-summary-row" v-if="childHalfCount > 0">
              <span>Trẻ 5-9 tuổi ({{ Math.round(childPriceRatio * 100) }}%)</span>
              <strong>{{ childHalfCount }} trẻ</strong>
            </div>
            <p class="muted" v-if="freeChildrenCount > 0">Trẻ dưới 5 tuổi miễn phí: {{ freeChildrenCount }} trẻ</p>
          </div>

          <div class="booking-summary-row tour-pricing-total">
            <span>Tạm tính</span>
            <strong>{{ formatCurrencyVND(totalPrice) }}</strong>
          </div>
        </div>

        <small v-if="bookingFeedback" class="error-text">{{ bookingFeedback }}</small>
        <small v-else-if="bookingSuccess" class="success-text">{{ bookingSuccess }}</small>

        <div class="tour-booking-actions">
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
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DetailMainContent from '@/components/travel/DetailMainContent.vue'
import DetailCommentSection from '@/components/travel/DetailCommentSection.vue'
import DetailRelatedServices from '@/components/travel/DetailRelatedServices.vue'
import TourTravelerSelector from '@/components/travel/TourTravelerSelector.vue'
import { formatDateRangeVN, formatCurrencyVND } from '@/utils/formatters'
import { useCartStore } from '@/stores/cart/useCartStore'
import { useServiceStore } from '@/stores/service/useServiceStore'

const tourDetailLogic = {
  scheduleLabel: 'Chọn lịch khởi hành',
  parseQuery: (query) => ({
    startDate: String(query.departureDate || query.startDate || query.date || '').trim(),
    endDate: String(query.endDate || '').trim(),
    adults: Number(query.adults || query.travelers || query.guests || query.quantity || 2),
    children: Number(query.children || 0),
    childrenAges: String(query.childrenAges || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => Math.min(17, Math.max(1, Number(item) || 8))),
    scheduleId: String(query.departureId || '').trim(),
    scheduleMode: String(query.scheduleMode || '').trim()
  }),
  buildScheduleOptions: (service) =>
    (service?.departures || []).map((departure) => {
      const durationLabel = departure.durationDays
        ? `${departure.durationDays}N${departure.durationNights || 0}Đ`
        : 'Theo chương trình'

      return {
        id: String(departure.departureId || ''),
        startDate: departure.startDate,
        endDate: departure.endDate || departure.startDate,
        remainingSlots: Number(departure.remainingSlots || 0),
        price: Number(departure.priceOverride || service.salePrice || 0),
        durationLabel,
        displayLabel: `${formatDateRangeVN(departure.startDate, departure.endDate || departure.startDate)} · ${durationLabel} · Còn ${departure.remainingSlots || 0} chỗ`
      }
    }),
  requiresScheduleSelection: (_service, options) => options.length > 0,
  buildSelectedScheduleMeta: (selectedSchedule) => {
    if (!selectedSchedule) return ''
    return `${selectedSchedule.durationLabel} · ${formatDateRangeVN(selectedSchedule.startDate, selectedSchedule.endDate)}`
  },
  buildBookingMeta: ({ bookingForm, selectedSchedule, effectiveUnitPrice, pricingSummary }) => ({
    departureId: bookingForm.scheduleMode === 'fixed' ? (bookingForm.selectedScheduleId || '') : '',
    departureDate: bookingForm.startDate,
    endDate: bookingForm.scheduleMode === 'flexible' ? bookingForm.endDate : '',
    scheduleMode: bookingForm.scheduleMode,
    adults: bookingForm.adults,
    children: bookingForm.children,
    childrenAges: [...bookingForm.childrenAges],
    totalGuests: pricingSummary.totalGuests,
    travelers: pricingSummary.totalGuests,
    freeChildren: pricingSummary.freeChildrenCount,
    childDiscountRate: pricingSummary.childPriceRatio,
    childChargedAsAdultCount: pricingSummary.childChargedAsAdultCount,
    totalPrice: pricingSummary.totalPrice,
    durationLabel: selectedSchedule?.durationLabel || pricingSummary.durationLabel,
    unitPrice: effectiveUnitPrice
  }),
  buildCheckoutQuery: ({ bookingForm, selectedSchedule, effectiveUnitPrice, pricingSummary }) => ({
    departureDate: bookingForm.startDate,
    departureId: bookingForm.scheduleMode === 'fixed' ? (bookingForm.selectedScheduleId || undefined) : undefined,
    scheduleMode: bookingForm.scheduleMode,
    adults: bookingForm.adults,
    children: bookingForm.children,
    childrenAges: bookingForm.childrenAges.join(',') || undefined,
    totalGuests: pricingSummary.totalGuests,
    travelers: pricingSummary.totalGuests,
    freeChildren: pricingSummary.freeChildrenCount,
    childDiscountRate: pricingSummary.childPriceRatio,
    childChargedAsAdultCount: pricingSummary.childChargedAsAdultCount,
    totalPrice: pricingSummary.totalPrice,
    durationLabel: selectedSchedule?.durationLabel || pricingSummary.durationLabel || undefined,
    unitPrice: effectiveUnitPrice,
    startDate: bookingForm.startDate,
    endDate: bookingForm.scheduleMode === 'flexible' ? bookingForm.endDate : '',
    quantity: pricingSummary.totalGuests
  })
}

const route = useRoute()
const router = useRouter()
const serviceStore = useServiceStore()
const cartStore = useCartStore()
const service = computed(() => {
  const found = serviceStore.getServiceBySlug(route.params.slug)
  if (!found || found.categoryId !== 'tour') return null
  return found
})

const serviceComments = computed(() => (service.value ? serviceStore.getCommentsByService(service.value.id) : []))
const scheduleLabel = computed(() => tourDetailLogic.scheduleLabel)
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

const bookingForm = reactive({
  startDate: '',
  endDate: '',
  selectedScheduleId: '',
  scheduleMode: 'fixed',
  adults: 2,
  children: 0,
  childrenAges: []
})
const bookingFeedback = ref('')
const bookingSuccess = ref('')
const selectedImage = ref('')

const travelerSelection = ref({
  adults: 2,
  children: 0,
  childrenAges: []
})

const pricingTiers = computed(() => {
  if (!service.value?.pricingTiers) {
    return {
      fixed: {
        label: 'Lịch cố định (ưu đãi)',
        note: 'Lịch cố định áp dụng ưu đãi.'
      },
      flexible: {
        label: 'Lịch linh hoạt',
        note: 'Lịch linh hoạt áp dụng giá gốc, không ưu đãi.'
      }
    }
  }
  return service.value.pricingTiers
})

const scheduleOptions = computed(() => (service.value ? tourDetailLogic.buildScheduleOptions(service.value) : []))
const serviceScheduleType = computed(() => {
  const raw = String(service.value?.scheduleType || '').toLowerCase().trim()
  if (raw === 'fixed' || raw === 'flexible' || raw === 'hybrid') return raw
  return scheduleOptions.value.length ? 'fixed' : 'flexible'
})
const isFixedScheduleSupported = computed(() => serviceScheduleType.value === 'fixed' || serviceScheduleType.value === 'hybrid')
const isFlexibleScheduleSupported = computed(() => serviceScheduleType.value === 'flexible' || serviceScheduleType.value === 'hybrid')
const isHybridSchedule = computed(() => isFixedScheduleSupported.value && isFlexibleScheduleSupported.value)
const effectiveScheduleMode = computed(() => {
  if (isHybridSchedule.value) {
    return bookingForm.scheduleMode === 'flexible' ? 'flexible' : 'fixed'
  }
  if (isFlexibleScheduleSupported.value && !isFixedScheduleSupported.value) return 'flexible'
  return 'fixed'
})

const selectedSchedule = computed(() =>
  scheduleOptions.value.find((option) => option.id === bookingForm.selectedScheduleId) || null
)
const selectedScheduleMeta = computed(() => tourDetailLogic.buildSelectedScheduleMeta(selectedSchedule.value))
const effectiveUnitPrice = computed(() => {
  if (effectiveScheduleMode.value === 'fixed') {
    return Number(selectedSchedule.value?.price || service.value?.salePrice || 0)
  }
  // Flexible mode: get base price
  return Number(service.value?.pricingTiers?.flexible?.adultPrice || service.value?.price || service.value?.salePrice || 0)
})
const maxSelectableSlots = computed(() => {
  if (effectiveScheduleMode.value === 'fixed') {
    return Math.max(0, Number(selectedSchedule.value?.remainingSlots || 0))
  }
  return Math.max(0, Number(service.value?.availableSlots || 0))
})

const childPriceRatio = computed(() => {
  const configured = Number(service.value?.tourChildPolicy?.childRate || 0.75)
  return Math.max(0.5, Math.min(0.75, configured || 0.75))
})
const childAgeThreshold = computed(() => {
  const configured = Number(service.value?.tourChildPolicy?.adultAgeThreshold || 10)
  return Math.max(9, Math.min(10, configured || 10))
})
const flexibleStartMin = computed(() => String(service.value?.flexibleWindow?.startDate || '').trim())
const flexibleStartMax = computed(() => String(service.value?.flexibleWindow?.endDate || '').trim())
const flexibleEndMax = computed(() => String(service.value?.flexibleWindow?.endDate || '').trim())
const flexibleWindowText = computed(() => {
  const start = flexibleStartMin.value
  const end = flexibleStartMax.value
  if (!start || !end) return ''
  return `Khoảng linh hoạt: ${formatDateRangeVN(start, end)}`
})

const isEditingFromCart = computed(() => route.query.edit === '1')
const originalCartItem = computed(() => ({
  serviceId: route.query.originServiceId ?? service.value?.id,
  startDate: String(route.query.originStartDate || ''),
  endDate: String(route.query.originEndDate || ''),
  bookingType: String(route.query.originBookingType || 'tour'),
  bookingMeta: {
    departureId: String(route.query.departureId || route.query.originDepartureId || ''),
    scheduleMode: String(route.query.scheduleMode || route.query.originScheduleMode || 'fixed')
  }
}))

const normalizedChildrenAges = computed(() => {
  const count = Math.max(0, Number(bookingForm.children) || 0)
  return Array.from({ length: count }, (_, index) => {
    const age = Number(bookingForm.childrenAges[index] ?? 8)
    return Math.min(17, Math.max(1, Number.isFinite(age) ? age : 8))
  })
})
const freeChildrenCount = computed(() => normalizedChildrenAges.value.filter((age) => age < 5).length)
const childHalfCount = computed(() => normalizedChildrenAges.value.filter((age) => age >= 5 && age < childAgeThreshold.value).length)
const childChargedAsAdultCount = computed(() => normalizedChildrenAges.value.filter((age) => age >= childAgeThreshold.value).length)
const chargeableAdultCount = computed(() => Math.max(1, bookingForm.adults) + childChargedAsAdultCount.value)
const totalGuests = computed(() => Math.max(1, bookingForm.adults) + Math.max(0, bookingForm.children))
const durationLabelFlexible = computed(() => {
  if (effectiveScheduleMode.value !== 'flexible') return ''
  if (!bookingForm.startDate || !bookingForm.endDate) return ''

  const start = new Date(bookingForm.startDate)
  const end = new Date(bookingForm.endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''

  const days = Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1)
  const nights = Math.max(0, days - 1)
  return `${days}N${nights}Đ`
})
const totalPrice = computed(() => {
  const adultsSubtotal = chargeableAdultCount.value * effectiveUnitPrice.value
  const childSubtotal = childHalfCount.value * Math.round(effectiveUnitPrice.value * childPriceRatio.value)
  return adultsSubtotal + childSubtotal
})
const pricingSummary = computed(() => ({
  totalGuests: totalGuests.value,
  freeChildrenCount: freeChildrenCount.value,
  childPriceRatio: childPriceRatio.value,
  childChargedAsAdultCount: childChargedAsAdultCount.value,
  totalPrice: totalPrice.value,
  durationLabel: durationLabelFlexible.value
}))

const resolveInitialScheduleOption = (options, preferredScheduleId, preferredStartDate) => {
  if (!Array.isArray(options) || !options.length) return null

  const requestedById = preferredScheduleId
    ? options.find((option) => option.id === preferredScheduleId)
    : null

  if (requestedById?.remainingSlots > 0) return requestedById

  const requestedByDate = preferredStartDate
    ? options.find((option) => option.startDate === preferredStartDate && option.remainingSlots > 0)
      || options.find((option) => option.startDate === preferredStartDate)
    : null

  if (requestedByDate) return requestedByDate

  return options.find((option) => option.remainingSlots > 0)
    || requestedById
    || options[0]
    || null
}

watch([service, () => route.query], ([nextService]) => {
  if (!nextService) return

  selectedImage.value = nextService.image
  const queryDefaults = tourDetailLogic.parseQuery(route.query)
  const requestedMode = queryDefaults.scheduleMode
  if (isHybridSchedule.value) {
    bookingForm.scheduleMode = requestedMode === 'flexible' ? 'flexible' : 'fixed'
  } else {
    bookingForm.scheduleMode = isFlexibleScheduleSupported.value ? 'flexible' : 'fixed'
  }

  const resolvedSchedule = resolveInitialScheduleOption(
    scheduleOptions.value,
    queryDefaults.scheduleId,
    queryDefaults.startDate
  )

  bookingForm.selectedScheduleId = bookingForm.scheduleMode === 'fixed' ? (resolvedSchedule?.id || '') : ''
  bookingForm.startDate = bookingForm.scheduleMode === 'fixed'
    ? (resolvedSchedule?.startDate || queryDefaults.startDate)
    : queryDefaults.startDate
  bookingForm.endDate = bookingForm.scheduleMode === 'flexible' ? queryDefaults.endDate : ''
  bookingForm.adults = Math.max(1, Number.isFinite(queryDefaults.adults) ? queryDefaults.adults : 2)
  bookingForm.children = Math.max(0, Number.isFinite(queryDefaults.children) ? queryDefaults.children : 0)
  bookingForm.childrenAges = queryDefaults.childrenAges.slice(0, bookingForm.children)

  const maxByResolvedSchedule = Math.max(
    1,
    Number(bookingForm.scheduleMode === 'fixed'
      ? (resolvedSchedule?.remainingSlots || nextService.availableSlots || 1)
      : (nextService.availableSlots || 1))
  )

  if ((bookingForm.adults + bookingForm.children) > maxByResolvedSchedule) {
    const overflow = (bookingForm.adults + bookingForm.children) - maxByResolvedSchedule
    bookingForm.children = Math.max(0, bookingForm.children - overflow)
    bookingForm.childrenAges = bookingForm.childrenAges.slice(0, bookingForm.children)
  }

  travelerSelection.value = {
    adults: bookingForm.adults,
    children: bookingForm.children,
    childrenAges: [...bookingForm.childrenAges]
  }
}, { immediate: true, deep: true })

watch(() => bookingForm.selectedScheduleId, () => {
  bookingFeedback.value = ''
  bookingSuccess.value = ''
  if (effectiveScheduleMode.value === 'fixed' && selectedSchedule.value) {
    bookingForm.startDate = selectedSchedule.value.startDate || ''
    if (totalGuests.value > maxSelectableSlots.value) {
      bookingForm.children = Math.max(0, maxSelectableSlots.value - bookingForm.adults)
      bookingForm.childrenAges = bookingForm.childrenAges.slice(0, bookingForm.children)
    }
  }
})

watch(() => bookingForm.children, (nextChildren) => {
  const normalized = Math.max(0, Math.floor(Number(nextChildren) || 0))
  bookingForm.children = normalized

  if (bookingForm.childrenAges.length > normalized) {
    bookingForm.childrenAges = bookingForm.childrenAges.slice(0, normalized)
    return
  }

  if (bookingForm.childrenAges.length < normalized) {
    bookingForm.childrenAges = [
      ...bookingForm.childrenAges,
      ...Array.from({ length: normalized - bookingForm.childrenAges.length }, () => 8)
    ]
  }
}, { immediate: true })

watch(() => bookingForm.scheduleMode, (nextMode) => {
  bookingFeedback.value = ''
  bookingSuccess.value = ''

  if (!isHybridSchedule.value) return

  if (nextMode === 'fixed') {
    const firstAvailable = scheduleOptions.value.find((option) => option.remainingSlots > 0) || scheduleOptions.value[0]
    bookingForm.selectedScheduleId = firstAvailable?.id || ''
    bookingForm.startDate = firstAvailable?.startDate || bookingForm.startDate
    bookingForm.endDate = ''
    return
  }

  bookingForm.selectedScheduleId = ''
  bookingForm.endDate = ''
}, { immediate: true })

watch(() => bookingForm.startDate, (nextStartDate) => {
  if (effectiveScheduleMode.value !== 'flexible') return
  if (!nextStartDate) return

  // Auto-calculate endDate based on minimum tour duration from fixed departures
  const minDuration = scheduleOptions.value.length > 0
    ? Math.min(...scheduleOptions.value.map((d) => d.endDate ? 
        Math.max(1, Math.round((new Date(d.endDate) - new Date(d.startDate)) / (24 * 60 * 60 * 1000)) + 1)
        : 1))
    : 2 // Default to 2 days if no departures available

  const startDateObj = new Date(nextStartDate)
  if (!Number.isNaN(startDateObj.getTime())) {
    const endDateObj = new Date(startDateObj)
    endDateObj.setDate(endDateObj.getDate() + minDuration - 1)
    
    const endDateISO = endDateObj.toISOString().split('T')[0]
    const maxDate = flexibleEndMax.value
    
    if (!maxDate || endDateISO <= maxDate) {
      bookingForm.endDate = endDateISO
    } else {
      bookingForm.endDate = maxDate
    }
  }
})

watch(() => travelerSelection.value, (nextSelection) => {
  if (!nextSelection) return
  bookingForm.adults = Math.max(1, Number(nextSelection.adults) || 2)
  bookingForm.children = Math.max(0, Number(nextSelection.children) || 0)
  bookingForm.childrenAges = Array.isArray(nextSelection.childrenAges) ? [...nextSelection.childrenAges] : []
}, { deep: true })

const validateBookingInput = () => {
  bookingFeedback.value = ''
  bookingSuccess.value = ''
  if (!service.value || service.value.availableSlots <= 0) {
    bookingFeedback.value = 'Dịch vụ hiện đã hết chỗ.'
    return false
  }

  if (effectiveScheduleMode.value === 'fixed') {
    if (!selectedSchedule.value) {
      bookingFeedback.value = 'Vui lòng chọn lịch khởi hành.'
      return false
    }
    if (selectedSchedule.value.remainingSlots <= 0) {
      bookingFeedback.value = 'Lịch này đã hết chỗ. Vui lòng chọn lịch khác.'
      return false
    }
  } else {
    if (!bookingForm.startDate || !bookingForm.endDate) {
      bookingFeedback.value = 'Vui lòng chọn ngày khởi hành và ngày kết thúc.'
      return false
    }
    if (new Date(bookingForm.endDate) < new Date(bookingForm.startDate)) {
      bookingFeedback.value = 'Ngày kết thúc phải sau hoặc bằng ngày khởi hành.'
      return false
    }
    if (flexibleStartMin.value && bookingForm.startDate < flexibleStartMin.value) {
      bookingFeedback.value = `Ngày khởi hành phải từ ${flexibleStartMin.value} trở đi.`
      return false
    }
    if (flexibleEndMax.value && bookingForm.endDate > flexibleEndMax.value) {
      bookingFeedback.value = `Ngày kết thúc phải trước hoặc bằng ${flexibleEndMax.value}.`
      return false
    }
  }

  if (totalGuests.value > maxSelectableSlots.value) {
    bookingFeedback.value = `Số lượng vượt quá ${maxSelectableSlots.value} chỗ còn lại.`
    return false
  }
  return true
}

const addToCartWithCurrentSelection = () => {
  const nextItem = {
    serviceId: service.value.id,
    quantity: totalGuests.value,
    bookingType: 'tour',
    bookingMeta: tourDetailLogic.buildBookingMeta({
      bookingForm,
      selectedSchedule: selectedSchedule.value,
      effectiveUnitPrice: effectiveUnitPrice.value,
      pricingSummary: pricingSummary.value
    }),
    startDate: bookingForm.startDate,
    endDate: bookingForm.scheduleMode === 'flexible' ? bookingForm.endDate : ''
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

const selectScheduleOption = (scheduleId) => {
  bookingForm.selectedScheduleId = String(scheduleId || '')
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

const handleBookNow = async () => {
  await nextTick()
  if (!validateBookingInput()) return
  router.push({
    path: '/thanh-toan',
    query: {
      mode: 'direct',
      serviceId: service.value.id,
      ...tourDetailLogic.buildCheckoutQuery({
        bookingForm,
        selectedSchedule: selectedSchedule.value,
        effectiveUnitPrice: effectiveUnitPrice.value,
        pricingSummary: pricingSummary.value
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

.tour-booking-panel {
  display: grid;
  grid-column: 1;
  grid-row: auto;
  align-content: start;
  align-self: start;
  justify-self: stretch;
  position: static;
  top: auto;
  width: 100%;
  max-width: none;
  height: auto;
  overflow: visible;
  gap: 12px;
  border-radius: 18px;
  border: 1px solid #d9e3f2;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
  box-shadow: 0 14px 28px rgba(20, 45, 84, 0.1);
  max-height: none;
}

.tour-booking-note {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #6a7d99;
}

.tour-booking-panel > input {
  width: 100%;
  min-height: 42px;
  padding: 10px 13px;
  border: 1px solid #c8d6ea;
  border-radius: 10px;
  background: #f5f8ff;
}

.tour-booking-panel > input:focus {
  outline: none;
  border-color: #7ea8de;
  box-shadow: 0 0 0 3px rgba(36, 110, 199, 0.12);
}

.tour-booking-panel > input:disabled {
  background: #f0f5fb;
  color: #8a9aaf;
  cursor: not-allowed;
  opacity: 0.7;
}

.schedule-mode-switch {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #dbe6f5;
  border-radius: 12px;
  background: #f8fbff;
}

.schedule-mode-switch label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.detail-booking-panel label .muted {
  font-size: 0.85rem;
  color: #8a9aaf;
  font-weight: normal;
}

.tour-booking-panel :deep(.selector__trigger) {
  min-height: 42px;
  padding: 10px 13px;
  border: 1px solid #c8d6ea;
  border-radius: 10px;
  background: #f5f8ff;
  color: #1d3555;
  font-size: 0.92rem;
}

.tour-booking-panel :deep(.selector__popup) {
  border-radius: 10px;
  z-index: 120;
}

.tour-child-age-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.tour-child-age-grid label {
  display: grid;
  gap: 6px;
  font-size: 0.86rem;
  color: #506581;
}

.tour-child-age-grid input {
  width: 100%;
  padding: 10px 11px;
  border: 1px solid #d2deee;
  border-radius: 10px;
  background: #ffffff;
}

.tour-pricing-breakdown {
  margin-top: 6px;
  padding: 11px;
  border-radius: 12px;
  border: 1px solid #d4e0f0;
  background: linear-gradient(180deg, #eff5ff 0%, #eaf2ff 100%);
}

.tour-pricing-breakdown .booking-summary-row {
  margin: 0;
}

.tour-pricing-breakdown .booking-summary-row + .booking-summary-row {
  margin-top: 6px;
}

.tour-flexible-date-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.tour-flexible-date-field {
  display: grid;
  gap: 8px;
}

@media (max-width: 640px) {
  .tour-child-age-grid {
    grid-template-columns: 1fr;
  }

  .tour-flexible-date-row {
    grid-template-columns: 1fr;
  }
}

.booking-block {
  display: grid;
  gap: 12px;
  margin-bottom: 0;
  padding: 12px;
  border: 1px solid #d4e0f0;
  border-radius: 12px;
  background: linear-gradient(180deg, #eff5ff 0%, #eaf2ff 100%);
}

.booking-block:last-of-type {
  margin-bottom: 0;
}

.tour-pricing-select {
  display: grid;
  gap: 8px;
}

.tour-pricing-dropdown {
  width: 100%;
  min-height: 42px;
  padding: 10px 13px;
  border: 1px solid #c8d6ea;
  border-radius: 10px;
  background: #f5f8ff;
  font-size: 0.92rem;
  color: #1d2d45;
  font-weight: 500;
  cursor: pointer;
}

.tour-pricing-dropdown:focus {
  outline: none;
  border-color: #7ea8de;
  box-shadow: 0 0 0 3px rgba(36, 110, 199, 0.12);
}

.tour-schedule-label {
  font-weight: 600;
  color: #1d2d45;
  margin-top: 4px;
}

.tour-pricing-total {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #dbe6f5;
  font-weight: 700;
  font-size: 1.1rem;
}

.tour-pricing-total span {
  font-weight: 600;
}

.tour-booking-actions {
  display: grid;
  gap: 10px;
  margin-top: 4px;
}

.tour-booking-actions .primary-button,
.tour-booking-actions .secondary-button {
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

  .tour-booking-panel {
    grid-column: 1;
    grid-row: auto;
  }
}
</style>
