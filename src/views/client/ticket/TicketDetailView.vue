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
      <h3 class="detail-price">{{ formatCurrencyVND(effectiveUnitPrice) }}</h3>
      <p class="muted">Giá áp dụng cho thị trường Việt Nam, chưa bao gồm phí dịch vụ.</p>

      <div class="booking-block">
        <label>{{ primaryDateLabel }}</label>
        <input v-model="bookingForm.startDate" :min="todayISO" type="date" />

        <label>Gói dịch vụ tại địa điểm</label>
        <select v-model="bookingForm.packageId" class="ticket-package-select">
          <option v-for="pkg in ticketPackages" :key="pkg.id" :value="pkg.id">
            {{ pkg.name }} - {{ formatCurrencyVND(pkg.salePrice) }}
          </option>
        </select>

        <ul v-if="selectedTicketPackage && selectedTicketPackage.features?.length" class="ticket-package-features">
          <li v-for="feature in selectedTicketPackage.features" :key="feature">{{ feature }}</li>
        </ul>

        <div class="ticket-pricing-breakdown">
          <div class="booking-summary-row">
            <span>Loại dịch vụ vé</span>
            <strong>{{ ticketServiceTypeLabel }}</strong>
          </div>
          <div class="booking-summary-row">
            <span>Gói đã chọn</span>
            <strong>{{ selectedTicketPackage?.name || 'Gói cơ bản' }}</strong>
          </div>
        </div>
      </div>

      <div class="booking-block">
        <label>Số vé và trẻ em</label>
        <TicketGuestSelector v-model="ticketGuestSelection" />

        <div class="ticket-pricing-breakdown">
          <div class="booking-summary-row">
            <span>Khách tổng</span>
            <strong>{{ totalGuests }} khách</strong>
          </div>
          <div class="booking-summary-row">
            <span>Vé tính giá người lớn</span>
            <strong>{{ chargeableAdultCount }} vé</strong>
          </div>
          <div class="booking-summary-row" v-if="childSurchargeCount > 0">
            <span>Phụ thu trẻ em (8-14 tuổi)</span>
            <strong>{{ formatCurrencyVND(childSurchargeTotal) }}</strong>
          </div>
          <p class="muted" v-if="freeChildrenCount > 0">Trẻ dưới 8 tuổi miễn phí: {{ freeChildrenCount }} trẻ</p>
        </div>
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
import DetailMainContent from '@/components/travel/DetailMainContent.vue'
import TicketGuestSelector from '@/components/travel/TicketGuestSelector.vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { useCartStore } from '@/stores/useCartStore'
import { useServiceStore } from '@/stores/useServiceStore'
import { useWishlistStore } from '@/stores/useWishlistStore'
import { getPrimaryDateLabel } from '@/utils/bookingRules'
import { formatCurrencyVND } from '@/utils/formatters'

const parseChildrenAgesFromQuery = (query) => {
  const raw = String(query.childrenAges || '').trim()
  if (!raw) return []

  return raw
    .split(',')
    .map((item) => Math.min(17, Math.max(1, Number(item.trim()) || 8)))
}

const ticketDetailLogic = {
  parseQuery: (query) => ({
    startDate: String(query.useDate || query.startDate || query.date || '').trim(),
    adults: Number(query.adults || query.ticketQuantity || query.quantity || 2),
    children: Number(query.children || 0),
    childrenAges: parseChildrenAgesFromQuery(query),
    packageId: String(query.packageId || '').trim()
  }),
  buildBookingMeta: ({ bookingForm, selectedTicketPackage, effectiveUnitPrice, pricingSummary }) => ({
    useDate: bookingForm.startDate,
    packageId: bookingForm.packageId,
    packageName: selectedTicketPackage?.name || 'Gói cơ bản',
    adults: bookingForm.adults,
    children: bookingForm.children,
    childrenAges: [...bookingForm.childrenAges],
    totalGuests: pricingSummary.totalGuests,
    ticketQuantity: pricingSummary.chargeableAdultCount,
    freeChildren: pricingSummary.freeChildrenCount,
    chargeableAdults: pricingSummary.chargeableAdultCount,
    childSurchargeCount: pricingSummary.childSurchargeCount,
    childSurchargeUnit: pricingSummary.childSurchargeUnit,
    childSurchargeTotal: pricingSummary.childSurchargeTotal,
    totalPrice: pricingSummary.totalPrice,
    unitPrice: effectiveUnitPrice
  }),
  buildCheckoutQuery: ({ bookingForm, selectedTicketPackage, effectiveUnitPrice, pricingSummary }) => ({
    useDate: bookingForm.startDate,
    packageId: bookingForm.packageId || undefined,
    packageName: selectedTicketPackage?.name || undefined,
    adults: bookingForm.adults,
    children: bookingForm.children,
    childrenAges: bookingForm.childrenAges.join(',') || undefined,
    ticketQuantity: pricingSummary.chargeableAdultCount,
    quantity: pricingSummary.totalGuests,
    totalGuests: pricingSummary.totalGuests,
    freeChildren: pricingSummary.freeChildrenCount,
    childSurchargeCount: pricingSummary.childSurchargeCount,
    childSurchargeUnit: pricingSummary.childSurchargeUnit,
    childSurchargeTotal: pricingSummary.childSurchargeTotal,
    totalPrice: pricingSummary.totalPrice,
    unitPrice: effectiveUnitPrice,
    startDate: bookingForm.startDate
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
  if (!found || found.categoryId !== 'ticket') return null
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

const ticketPackages = computed(() => {
  const rawPackages = Array.isArray(service.value?.ticketPackages) ? service.value.ticketPackages : []
  if (rawPackages.length > 0) {
    return rawPackages.map((pkg, index) => ({
      id: String(pkg.id || `pkg-${index + 1}`),
      name: String(pkg.name || `Gói ${index + 1}`),
      salePrice: Math.max(0, Number(pkg.salePrice || pkg.price || service.value?.salePrice || 0)),
      price: Math.max(0, Number(pkg.price || pkg.salePrice || service.value?.price || 0)),
      childSurcharge: Number(pkg.childSurcharge || service.value?.childSurcharge || service.value?.ticketChildPolicy?.surcharge || 120000),
      features: Array.isArray(pkg.features) ? pkg.features : []
    }))
  }

  return [{
    id: 'basic-default',
    name: 'Gói cơ bản',
    salePrice: Math.max(0, Number(service.value?.salePrice || 0)),
    price: Math.max(0, Number(service.value?.price || service.value?.salePrice || 0)),
    childSurcharge: Number(service.value?.childSurcharge || service.value?.ticketChildPolicy?.surcharge || 120000),
    features: []
  }]
})
const selectedTicketPackage = computed(() => {
  const currentId = String(bookingForm.packageId || '').trim()
  return ticketPackages.value.find((pkg) => pkg.id === currentId) || ticketPackages.value[0] || null
})
const effectiveUnitPrice = computed(() => Number(selectedTicketPackage.value?.salePrice || service.value?.salePrice || 0))
const ticketServiceTypeLabel = computed(() => String(service.value?.ticketServiceType || 'Vé tham quan'))
const childSurchargeUnit = computed(() => {
  const configured = Number(
    selectedTicketPackage.value?.childSurcharge
      || service.value?.ticketChildPolicy?.surcharge
      || service.value?.childSurcharge
      || 120000
  )
  return Math.max(50000, Math.min(200000, configured || 120000))
})
const maxSelectableSlots = computed(() => Math.max(0, Number(service.value?.availableSlots || 0)))
const isEditingFromCart = computed(() => route.query.edit === '1')
const originalCartItem = computed(() => ({
  serviceId: route.query.originServiceId ?? service.value?.id,
  startDate: String(route.query.originStartDate || ''),
  endDate: String(route.query.originEndDate || ''),
  bookingType: String(route.query.originBookingType || 'ticket'),
  bookingMeta: {}
}))

const bookingForm = reactive({
  startDate: '',
  packageId: '',
  adults: 2,
  children: 0,
  childrenAges: []
})
const bookingFeedback = ref('')
const bookingSuccess = ref('')
const selectedImage = ref('')
const ticketGuestSelection = ref({
  tickets: bookingForm.adults,
  children: bookingForm.children,
  childrenAges: [...bookingForm.childrenAges]
})

const normalizedChildrenAges = computed(() => {
  const targetLength = Math.max(0, Number(bookingForm.children) || 0)
  return Array.from({ length: targetLength }, (_, index) => {
    const age = Number(bookingForm.childrenAges[index] ?? 8)
    return Math.min(17, Math.max(1, Number.isFinite(age) ? age : 8))
  })
})

const freeChildrenCount = computed(() => normalizedChildrenAges.value.filter((age) => age < 8).length)
const surchargeChildrenCount = computed(() => normalizedChildrenAges.value.filter((age) => age >= 8 && age <= 14).length)
const chargedAsAdultChildrenCount = computed(() => normalizedChildrenAges.value.filter((age) => age >= 15).length)
const chargeableAdultCount = computed(() => Math.max(1, bookingForm.adults) + chargedAsAdultChildrenCount.value)
const childSurchargeCount = computed(() => surchargeChildrenCount.value)
const childSurchargeTotal = computed(() => childSurchargeCount.value * childSurchargeUnit.value)
const totalGuests = computed(() => Math.max(1, bookingForm.adults) + Math.max(0, bookingForm.children))
const totalPrice = computed(() => (chargeableAdultCount.value * effectiveUnitPrice.value) + childSurchargeTotal.value)

const pricingSummary = computed(() => ({
  totalGuests: totalGuests.value,
  chargeableAdultCount: chargeableAdultCount.value,
  freeChildrenCount: freeChildrenCount.value,
  childSurchargeCount: childSurchargeCount.value,
  childSurchargeUnit: childSurchargeUnit.value,
  childSurchargeTotal: childSurchargeTotal.value,
  totalPrice: totalPrice.value
}))

watch([service, () => route.query], ([nextService]) => {
  if (!nextService) return

  selectedImage.value = nextService.image
  const queryDefaults = ticketDetailLogic.parseQuery(route.query)
  bookingForm.startDate = queryDefaults.startDate
  bookingForm.packageId = queryDefaults.packageId
  bookingForm.adults = Math.max(1, Number.isFinite(queryDefaults.adults) ? queryDefaults.adults : 2)
  bookingForm.children = Math.max(0, Number.isFinite(queryDefaults.children) ? queryDefaults.children : 0)
  bookingForm.childrenAges = queryDefaults.childrenAges.slice(0, bookingForm.children)
  ticketGuestSelection.value = {
    tickets: bookingForm.adults,
    children: bookingForm.children,
    childrenAges: [...bookingForm.childrenAges]
  }
}, { immediate: true, deep: true })

watch([service, ticketPackages], () => {
  if (!service.value) return
  const validIds = new Set(ticketPackages.value.map((pkg) => pkg.id))
  if (!bookingForm.packageId || !validIds.has(bookingForm.packageId)) {
    bookingForm.packageId = ticketPackages.value[0]?.id || ''
  }
}, { immediate: true })

watch(() => bookingForm.children, (nextChildren) => {
  const normalizedChildren = Math.max(0, Math.floor(Number(nextChildren) || 0))
  bookingForm.children = normalizedChildren

  if (bookingForm.childrenAges.length > normalizedChildren) {
    bookingForm.childrenAges = bookingForm.childrenAges.slice(0, normalizedChildren)
    return
  }

  if (bookingForm.childrenAges.length < normalizedChildren) {
    bookingForm.childrenAges = [
      ...bookingForm.childrenAges,
      ...Array.from({ length: normalizedChildren - bookingForm.childrenAges.length }, () => 8)
    ]
  }
}, { immediate: true })

watch(() => ticketGuestSelection.value, (nextSelection) => {
  if (!nextSelection) return
  bookingForm.adults = Math.max(1, Number(nextSelection.tickets) || 1)
  bookingForm.children = Math.max(0, Number(nextSelection.children) || 0)
  bookingForm.childrenAges = Array.isArray(nextSelection.childrenAges) ? [...nextSelection.childrenAges] : []
}, { deep: true })

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
    bookingType: 'ticket',
    bookingMeta: ticketDetailLogic.buildBookingMeta({
      bookingForm,
      selectedTicketPackage: selectedTicketPackage.value,
      effectiveUnitPrice: effectiveUnitPrice.value,
      pricingSummary: pricingSummary.value
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
      ...ticketDetailLogic.buildCheckoutQuery({
        bookingForm,
        selectedTicketPackage: selectedTicketPackage.value,
        effectiveUnitPrice: effectiveUnitPrice.value,
        pricingSummary: pricingSummary.value
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
.detail-booking-panel {
  display: grid;
  gap: 10px;
}

.booking-block {
  display: grid;
  gap: 10px;
}

.ticket-package-select {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #d2deee;
  border-radius: 10px;
  background: #fbfdff;
}

.ticket-package-features {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
  color: #3d5674;
  font-size: 0.9rem;
}

.detail-booking-panel > input {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #d2deee;
  border-radius: 10px;
  background: #fbfdff;
}

.detail-booking-panel > input:focus {
  outline: none;
  border-color: #77a8e8;
  box-shadow: 0 0 0 3px rgba(65, 131, 217, 0.18);
}

.ticket-child-age-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.ticket-child-age-grid label {
  display: grid;
  gap: 6px;
  font-size: 0.86rem;
  color: #506581;
}

.ticket-child-age-grid input {
  width: 100%;
  padding: 10px 11px;
  border: 1px solid #d2deee;
  border-radius: 10px;
  background: #ffffff;
}

.ticket-pricing-breakdown {
  margin-top: 6px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #dbe6f5;
  background: linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%);
}

.ticket-pricing-breakdown .booking-summary-row {
  margin: 0;
}

.ticket-pricing-breakdown .booking-summary-row + .booking-summary-row {
  margin-top: 6px;
}

@media (max-width: 640px) {
  .ticket-child-age-grid {
    grid-template-columns: 1fr;
  }
}
</style>
