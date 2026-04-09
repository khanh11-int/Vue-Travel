<template>
  <section v-if="service" class="page-section detail-layout">
    <DetailMainContent
      :service="service"
      :selected-image="selectedImage"
      :gallery-images="galleryImages"
      @update:selected-image="selectedImage = $event"
    />

    <div class="detail-side-column">
      <aside class="booking-panel ticket-booking-panel">
        <p class="eyebrow">Đặt chỗ</p>
        <h3 class="detail-price">{{ formatCurrencyVND(effectiveUnitPrice) }}</h3>
        <p class="muted ticket-booking-note">Giá áp dụng cho thị trường Việt Nam, chưa bao gồm phí dịch vụ.</p>

        <div class="booking-block">
          <div class="ticket-booking-field-grid">
            <div class="ticket-booking-field">
              <label>{{ primaryDateLabel }}</label>
              <input v-model="bookingForm.startDate" :min="todayISO" type="date" />
            </div>

            <div class="ticket-booking-field">
              <label>Gói dịch vụ tại địa điểm</label>
              <select v-model="bookingForm.packageId" class="ticket-package-select">
                <option v-for="pkg in ticketPackages" :key="pkg.id" :value="pkg.id">
                  {{ pkg.name }} - {{ formatCurrencyVND(pkg.salePrice) }} · Còn {{ pkg.availableSlots || 0 }} chỗ
                </option>
              </select>
            </div>
          </div>

          <ul v-if="selectedTicketPackage && selectedTicketPackage.features?.length" class="ticket-package-features">
            <li v-for="feature in selectedTicketPackage.features" :key="feature">{{ feature }}</li>
          </ul>

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

        <div class="ticket-booking-actions">
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
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DetailMainContent from '@/components/travel/DetailMainContent.vue'
import DetailCommentSection from '@/components/travel/DetailCommentSection.vue'
import DetailRelatedServices from '@/components/travel/DetailRelatedServices.vue'
import TicketGuestSelector from '@/components/travel/TicketGuestSelector.vue'
import { useCartStore } from '@/stores/cart/useCartStore'
import { useServiceStore } from '@/stores/service/useServiceStore'
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
      availableSlots: Math.max(0, Number(pkg.availableSlots || 0)),
      features: Array.isArray(pkg.features) ? pkg.features : []
    }))
  }

  return [{
    id: 'basic-default',
    name: 'Gói cơ bản',
    salePrice: Math.max(0, Number(service.value?.salePrice || 0)),
    price: Math.max(0, Number(service.value?.price || service.value?.salePrice || 0)),
    childSurcharge: Number(service.value?.childSurcharge || service.value?.ticketChildPolicy?.surcharge || 120000),
    availableSlots: Math.max(0, Number(service.value?.availableSlots || 0)),
    features: []
  }]
})
const selectedTicketPackage = computed(() => {
  const currentId = String(bookingForm.packageId || '').trim()
  return ticketPackages.value.find((pkg) => pkg.id === currentId) || ticketPackages.value[0] || null
})
const effectiveUnitPrice = computed(() => Number(selectedTicketPackage.value?.salePrice || service.value?.salePrice || 0))
const childSurchargeUnit = computed(() => {
  const configured = Number(
    selectedTicketPackage.value?.childSurcharge
      || service.value?.ticketChildPolicy?.surcharge
      || service.value?.childSurcharge
      || 120000
  )
  return Math.max(50000, Math.min(200000, configured || 120000))
})
const maxSelectableSlots = computed(() => {
  if (selectedTicketPackage.value && Number.isFinite(Number(selectedTicketPackage.value.availableSlots))) {
    return Math.max(0, Number(selectedTicketPackage.value.availableSlots || 0))
  }
  return Math.max(0, Number(service.value?.availableSlots || 0))
})
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

.ticket-booking-panel {
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

.booking-block {
  display: grid;
  gap: 12px;
  margin-bottom: 0;
  padding: 12px;
  border: 1px solid #d4e0f0;
  border-radius: 12px;
  background: linear-gradient(180deg, #eff5ff 0%, #eaf2ff 100%);
}

.ticket-booking-note {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #6a7d99;
}

.ticket-booking-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ticket-booking-field {
  display: grid;
  gap: 7px;
}

.ticket-booking-field input,
.ticket-booking-field select {
  width: 100%;
  min-height: 42px;
  padding: 10px 13px;
  border: 1px solid #c8d6ea;
  border-radius: 10px;
  background: #f5f8ff;
  color: #1d3555;
  font-size: 0.92rem;
}

.ticket-booking-field input:focus,
.ticket-booking-field select:focus {
  outline: none;
  border-color: #7ea8de;
  box-shadow: 0 0 0 3px rgba(36, 110, 199, 0.12);
}

.ticket-package-select {
  width: 100%;
  min-height: 42px;
  padding: 10px 13px;
  border: 1px solid #c8d6ea;
  border-radius: 10px;
  background: #f5f8ff;
}

.ticket-package-features {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
  color: #4d6484;
  font-size: 0.86rem;
}

.ticket-booking-panel :deep(.selector__trigger) {
  min-height: 42px;
  padding: 10px 13px;
  border: 1px solid #c8d6ea;
  border-radius: 10px;
  background: #f5f8ff;
  color: #1d3555;
  font-size: 0.92rem;
}

.ticket-booking-panel :deep(.selector__popup) {
  border-radius: 10px;
  z-index: 120;
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
  padding: 11px;
  border-radius: 12px;
  border: 1px solid #d4e0f0;
  background: linear-gradient(180deg, #eff5ff 0%, #eaf2ff 100%);
}

.ticket-pricing-breakdown .booking-summary-row {
  margin: 0;
}

.ticket-pricing-breakdown .booking-summary-row + .booking-summary-row {
  margin-top: 6px;
}

.ticket-booking-actions {
  display: grid;
  gap: 10px;
  margin-top: 4px;
}

.ticket-booking-actions .primary-button,
.ticket-booking-actions .secondary-button {
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

  .ticket-booking-panel {
    grid-column: 1;
    grid-row: auto;
  }

  .ticket-booking-field-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .ticket-booking-field-grid,
  .ticket-child-age-grid {
    grid-template-columns: 1fr;
  }
}
</style>
