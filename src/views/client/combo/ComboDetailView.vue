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

      <template v-if="requiresScheduleSelection">
        <label>{{ scheduleLabel }}</label>
        <div class="schedule-option-grid">
          <button
            v-for="option in scheduleOptions"
            :key="option.id"
            type="button"
            class="schedule-option-card"
            :class="{ active: bookingForm.selectedScheduleId === option.id, disabled: option.remainingSlots <= 0 }"
            :disabled="option.remainingSlots <= 0"
            @click="selectScheduleOption(option.id)"
          >
            <span class="schedule-option-card__date">{{ option.name || formatDateRangeVN(option.startDate, option.endDate) }}</span>
            <span class="schedule-option-card__meta">{{ option.durationLabel }} · Còn {{ option.remainingSlots }} suất</span>
          </button>
        </div>
        <small v-if="selectedSchedule" class="muted">{{ selectedScheduleMeta }}</small>
      </template>

      <template v-else>
        <label>Ngày áp dụng</label>
        <input v-model="bookingForm.startDate" :min="todayISO" type="date" />
      </template>

      <label>{{ quantityLabel }}</label>
      <div class="quantity-box">
        <button type="button" @click="decreaseQuantity">-</button>
        <span>{{ bookingForm.quantity }}</span>
        <button type="button" @click="increaseQuantity">+</button>
      </div>

      <div class="booking-summary-row">
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
      <button class="ghost-button full-width" type="button" @click="catalogStore.toggleWishlist(service.id)">
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
import DetailMainContent from '@/components/travel/DetailMainContent.vue'
import { formatDateRangeVN, formatCurrencyVND } from '@/utils/formatters'
import { useAdminStore } from '@/stores/useAdminStore'
import { useCatalogStore } from '@/stores/useCatalogStore'
import { useTravelCartStore } from '@/stores/useCartStore'
import { useTravelContextStore } from '@/stores/useTravelContextStore'

const comboDetailLogic = {
  quantityLabel: 'Số lượng khách',
  scheduleLabel: 'Chọn gói áp dụng',
  parseQuery: (query) => ({
    startDate: String(query.applyDate || query.departureDate || query.startDate || query.date || '').trim(),
    endDate: '',
    quantity: Number(query.travelers || query.guests || query.quantity || 2),
    scheduleId: String(query.packageId || '').trim()
  }),
  buildScheduleOptions: (service) => {
    if (service?.isFixedSchedule === false) return []

    return (service?.packages || []).map((pkg) => {
      const startDate = pkg.startDate || pkg.applyFrom || ''
      const endDate = pkg.endDate || startDate
      const durationLabel = pkg.durationDays
        ? `${pkg.durationDays}N${pkg.durationNights || 0}Đ`
        : 'Theo chương trình'

      return {
        id: pkg.packageId,
        packageId: pkg.packageId,
        departureId: pkg.departureId || '',
        startDate,
        endDate,
        remainingSlots: Number(pkg.remainingSlots || 0),
        price: Number(pkg.packagePrice || service.salePrice || 0),
        durationLabel,
        applyFrom: pkg.applyFrom || '',
        applyTo: pkg.applyTo || '',
        displayLabel: `${pkg.name} · ${formatDateRangeVN(startDate, endDate)} · Còn ${pkg.remainingSlots || 0} suất`
      }
    })
  },
  requiresScheduleSelection: (service, options) => service?.isFixedSchedule !== false && options.length > 0,
  buildSelectedScheduleMeta: (selectedSchedule) => {
    if (!selectedSchedule) return ''

    const base = `${selectedSchedule.durationLabel} · ${formatDateRangeVN(selectedSchedule.startDate, selectedSchedule.endDate)}`
    if (selectedSchedule.applyFrom && selectedSchedule.applyTo) {
      return `${base} · Áp dụng ${formatDateRangeVN(selectedSchedule.applyFrom, selectedSchedule.applyTo)}`
    }

    return base
  },
  buildBookingMeta: ({ bookingForm, selectedSchedule, displaySalePrice }) => ({
    packageId: bookingForm.selectedScheduleId || '',
    departureId: selectedSchedule?.departureId || '',
    applyDate: bookingForm.startDate,
    travelers: bookingForm.quantity,
    durationLabel: selectedSchedule?.durationLabel || '',
    unitPrice: displaySalePrice
  }),
  buildCheckoutQuery: ({ bookingForm, selectedSchedule, displaySalePrice, requiresEndDate }) => ({
    applyDate: bookingForm.startDate,
    packageId: bookingForm.selectedScheduleId || undefined,
    departureId: selectedSchedule?.departureId || undefined,
    travelers: bookingForm.quantity,
    durationLabel: selectedSchedule?.durationLabel || undefined,
    unitPrice: displaySalePrice,
    startDate: bookingForm.startDate,
    endDate: requiresEndDate ? bookingForm.endDate : '',
    quantity: bookingForm.quantity
  })
}

const route = useRoute()
const router = useRouter()
const contextStore = useTravelContextStore()
const catalogStore = useCatalogStore()
const cartStore = useTravelCartStore()
const adminStore = useAdminStore()
const todayISO = (() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})()

const service = computed(() => {
  const found = catalogStore.getServiceBySlug(route.params.slug)
  if (!found || found.categoryId !== 'combo') return null
  return found
})

const serviceComments = computed(() => (service.value ? catalogStore.getCommentsByService(service.value.id) : []))
const isWishlisted = computed(() => service.value && contextStore.state.wishlist.includes(service.value.id))
const quantityLabel = computed(() => comboDetailLogic.quantityLabel)
const scheduleLabel = computed(() => comboDetailLogic.scheduleLabel)
const relatedServices = computed(() => {
  if (!service.value) return []
  return contextStore.state.services
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
  selectedScheduleId: '',
  quantity: 2
})
const bookingFeedback = ref('')
const bookingSuccess = ref('')
const selectedImage = ref('')

const scheduleOptions = computed(() => (service.value ? comboDetailLogic.buildScheduleOptions(service.value) : []))
const requiresScheduleSelection = computed(() =>
  comboDetailLogic.requiresScheduleSelection(service.value, scheduleOptions.value)
)
const selectedSchedule = computed(() =>
  scheduleOptions.value.find((option) => option.id === bookingForm.selectedScheduleId) || null
)
const selectedScheduleMeta = computed(() => comboDetailLogic.buildSelectedScheduleMeta(selectedSchedule.value))
const displaySalePrice = computed(() => Number(selectedSchedule.value?.price || service.value?.salePrice || 0))
const maxSelectableSlots = computed(() => {
  if (requiresScheduleSelection.value) {
    return Math.max(0, Number(selectedSchedule.value?.remainingSlots || 0))
  }
  return Math.max(0, Number(service.value?.availableSlots || 0))
})
const isEditingFromCart = computed(() => route.query.edit === '1')
const originalCartItem = computed(() => ({
  serviceId: route.query.originServiceId ?? service.value?.id,
  startDate: String(route.query.originStartDate || ''),
  endDate: String(route.query.originEndDate || ''),
  bookingType: String(route.query.originBookingType || 'combo'),
  bookingMeta: {
    packageId: String(route.query.packageId || ''),
    departureId: String(route.query.departureId || '')
  }
}))

watch([service, () => route.query], ([nextService]) => {
  if (!nextService) return
  selectedImage.value = nextService.image

  const queryDefaults = comboDetailLogic.parseQuery(route.query)
  bookingForm.startDate = queryDefaults.startDate
  bookingForm.quantity = Math.min(
    Math.max(1, Number.isFinite(queryDefaults.quantity) ? queryDefaults.quantity : 2),
    Math.max(nextService.availableSlots, 1)
  )

  if (requiresScheduleSelection.value) {
    const firstAvailable = scheduleOptions.value.find((option) => option.remainingSlots > 0)
    bookingForm.selectedScheduleId = queryDefaults.scheduleId || firstAvailable?.id || scheduleOptions.value[0]?.id || ''
    if (selectedSchedule.value) {
      bookingForm.startDate = selectedSchedule.value.startDate || bookingForm.startDate
    }
  }
}, { immediate: true, deep: true })

watch(() => bookingForm.selectedScheduleId, () => {
  bookingFeedback.value = ''
  bookingSuccess.value = ''
  if (!selectedSchedule.value) return
  bookingForm.startDate = selectedSchedule.value.startDate || bookingForm.startDate
  if (bookingForm.quantity > maxSelectableSlots.value) {
    bookingForm.quantity = Math.max(1, maxSelectableSlots.value)
  }
})

const totalPrice = computed(() => displaySalePrice.value * bookingForm.quantity)

const validateBookingInput = () => {
  bookingFeedback.value = ''
  bookingSuccess.value = ''
  if (!service.value || service.value.availableSlots <= 0) {
    bookingFeedback.value = 'Dịch vụ hiện đã hết chỗ.'
    return false
  }
  if (requiresScheduleSelection.value) {
    if (!selectedSchedule.value) {
      bookingFeedback.value = 'Vui lòng chọn gói áp dụng.'
      return false
    }
    if (selectedSchedule.value.remainingSlots <= 0) {
      bookingFeedback.value = 'Lịch/gói này đã hết chỗ. Vui lòng chọn lịch khác.'
      return false
    }
  } else if (!bookingForm.startDate) {
    bookingFeedback.value = 'Vui lòng chọn ngày áp dụng.'
    return false
  }

  if (bookingForm.quantity > maxSelectableSlots.value) {
    bookingFeedback.value = `Số lượng vượt quá ${maxSelectableSlots.value} chỗ còn lại.`
    return false
  }
  return true
}

const addToCartWithCurrentSelection = () => {
  const nextItem = {
    serviceId: service.value.id,
    quantity: bookingForm.quantity,
    bookingType: 'combo',
    bookingMeta: comboDetailLogic.buildBookingMeta({
      bookingForm,
      selectedSchedule: selectedSchedule.value,
      displaySalePrice: displaySalePrice.value
    }),
    startDate: bookingForm.startDate,
    endDate: ''
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

const decreaseQuantity = () => {
  bookingFeedback.value = ''
  bookingSuccess.value = ''
  if (bookingForm.quantity > 1) bookingForm.quantity -= 1
}

const increaseQuantity = () => {
  bookingFeedback.value = ''
  bookingSuccess.value = ''
  if (bookingForm.quantity >= maxSelectableSlots.value) {
    bookingFeedback.value = `Dịch vụ này chỉ còn ${maxSelectableSlots.value} chỗ.`
    return
  }
  bookingForm.quantity += 1
}

const selectScheduleOption = (scheduleId) => {
  bookingForm.selectedScheduleId = scheduleId
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
      ...comboDetailLogic.buildCheckoutQuery({
        bookingForm,
        selectedSchedule: selectedSchedule.value,
        displaySalePrice: displaySalePrice.value,
        requiresEndDate: false
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
