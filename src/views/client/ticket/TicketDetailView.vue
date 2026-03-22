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
        Thêm vào giỏ
      </button>
      <button class="ghost-button full-width" type="button" @click="store.toggleWishlist(service.id)">
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
import { useTravelStore } from '@/stores/useTravelStore'
import { getPrimaryDateLabel } from '@/utils/bookingRules'
import { formatCurrencyVND } from '@/utils/formatters'

const ticketDetailLogic = {
  quantityLabel: 'Số lượng vé',
  scheduleLabel: 'Chọn lịch phù hợp',
  parseQuery: (query) => ({
    startDate: String(query.useDate || query.startDate || query.date || '').trim(),
    endDate: '',
    quantity: Number(query.ticketQuantity || query.quantity || 2),
    scheduleId: ''
  }),
  buildScheduleOptions: () => [],
  requiresScheduleSelection: () => false,
  buildSelectedScheduleMeta: () => '',
  buildBookingMeta: ({ bookingForm, selectedSchedule, displaySalePrice }) => ({
    useDate: bookingForm.startDate,
    ticketQuantity: bookingForm.quantity,
    durationLabel: selectedSchedule?.durationLabel || '',
    unitPrice: displaySalePrice
  }),
  buildCheckoutQuery: ({ bookingForm, selectedSchedule, displaySalePrice, requiresEndDate }) => ({
    useDate: bookingForm.startDate,
    ticketQuantity: bookingForm.quantity,
    durationLabel: selectedSchedule?.durationLabel || undefined,
    unitPrice: displaySalePrice,
    startDate: bookingForm.startDate,
    endDate: requiresEndDate ? bookingForm.endDate : '',
    quantity: bookingForm.quantity
  })
}

const route = useRoute()
const router = useRouter()
const store = useTravelStore()
const todayISO = (() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})()

const service = computed(() => {
  const found = store.getServiceBySlug(route.params.slug)
  if (!found || found.categoryId !== 'ticket') return null
  return found
})
const serviceComments = computed(() => (service.value ? store.getCommentsByService(service.value.id) : []))
const isWishlisted = computed(() => service.value && store.state.wishlist.includes(service.value.id))
const primaryDateLabel = computed(() => getPrimaryDateLabel(service.value))
const quantityLabel = computed(() => ticketDetailLogic.quantityLabel)
const relatedServices = computed(() => {
  if (!service.value) return []

  return store.state.services
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
const maxSelectableSlots = computed(() => Math.max(0, Number(service.value?.availableSlots || 0)))

const bookingForm = reactive({
  startDate: '',
  quantity: 2
})
const bookingFeedback = ref('')
const bookingSuccess = ref('')
const selectedImage = ref('')

watch([service, () => route.query], ([nextService]) => {
  if (!nextService) return

  selectedImage.value = nextService.image
  const queryDefaults = ticketDetailLogic.parseQuery(route.query)
  bookingForm.startDate = queryDefaults.startDate
  bookingForm.quantity = Math.min(
    Math.max(1, Number.isFinite(queryDefaults.quantity) ? queryDefaults.quantity : 2),
    Math.max(nextService.availableSlots, 1)
  )
}, { immediate: true, deep: true })

const totalPrice = computed(() => displaySalePrice.value * bookingForm.quantity)

const validateBookingInput = () => {
  bookingFeedback.value = ''
  bookingSuccess.value = ''

  if (!service.value) return false
  if (service.value.availableSlots <= 0) {
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
  if (bookingForm.quantity > maxSelectableSlots.value) {
    bookingFeedback.value = `Số lượng vượt quá ${maxSelectableSlots.value} chỗ còn lại.`
    return false
  }
  return true
}

const addToCartWithCurrentSelection = () => {
  store.addToCart({
    serviceId: service.value.id,
    quantity: bookingForm.quantity,
    bookingType: 'ticket',
    bookingMeta: ticketDetailLogic.buildBookingMeta({
      bookingForm,
      selectedSchedule: null,
      displaySalePrice: displaySalePrice.value
    }),
    startDate: bookingForm.startDate,
    endDate: ''
  })
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

const handleAddToCart = () => {
  if (!validateBookingInput()) return
  addToCartWithCurrentSelection()
  bookingSuccess.value = 'Đã thêm dịch vụ vào giỏ đặt chỗ.'
}

const handleBookNow = () => {
  if (!validateBookingInput()) return

  router.push({
    path: '/thanh-toan',
    query: {
      mode: 'direct',
      serviceId: service.value.id,
      ...ticketDetailLogic.buildCheckoutQuery({
        bookingForm,
        selectedSchedule: null,
        displaySalePrice: displaySalePrice.value,
        requiresEndDate: false
      })
    }
  })
}

const submitComment = (payload) => {
  if (!service.value) return
  store.addComment({
    serviceId: service.value.id,
    userName: payload.userName,
    rating: payload.rating,
    content: payload.content
  })
}
</script>
