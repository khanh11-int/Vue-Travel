<template>
  <section v-if="service" class="page-section">
    <div class="booking-form-container">
      <div class="booking-form-header">
        <router-link class="ghost-button" :to="{ name: 'hotel-detail', params: { slug: route.params.slug } }">
          ← Quay lại
        </router-link>
        <h1>Đặt phòng {{ service.name }}</h1>
        <p class="muted">{{ service.destination }}, {{ service.province }}</p>
      </div>

      <div class="booking-form-grid">
        <div class="booking-form-main">
          <div class="form-section">
            <h3>Thông tin đặt phòng</h3>
            
            <label>{{ primaryDateLabel }}</label>
            <input v-model="bookingForm.startDate" :min="todayISO" type="date" />

            <label>Ngày trả phòng</label>
            <input v-model="bookingForm.endDate" :min="bookingForm.startDate || todayISO" type="date" />

            <label>Khách và phòng</label>
            <GuestRoomSelector v-model="bookingForm.guestRoomSelection" />
          </div>

          <div class="form-section">
            <h3>Chọn loại phòng</h3>
            <div class="room-type-grid">
              <button
                v-for="option in roomTypeOptions"
                :key="option.value"
                :class="['room-type-card', { active: bookingForm.roomType === option.value }]"
                type="button"
                :disabled="option.availableSlots <= 0"
                @click="bookingForm.roomType = option.value"
              >
                <div class="room-type-card__name">{{ option.label }}</div>
                <div class="room-type-card__price">{{ formatCurrencyVND(option.unitPrice) }}</div>
                <div class="room-type-card__slots" :class="{ 'slots-low': option.availableSlots <= 3 }">
                  Còn {{ option.availableSlots || 0 }} chỗ
                </div>
              </button>
            </div>
          </div>

          <details class="form-section booking-collapsible" v-if="selectedRoomType">
            <summary>Xem chi tiết giá</summary>
            <div class="room-type-details">
              <div class="room-type-detail-item">
                <span>Giá người lớn/đêm</span>
                <strong>{{ formatCurrencyVND(adultUnitPricePerNight) }}</strong>
              </div>
              <div class="room-type-detail-item">
                <span>Phụ thu trẻ 4-14 tuổi/đêm</span>
                <strong>{{ formatCurrencyVND(effectiveChildSurchargePerNight) }}</strong>
              </div>
              <div class="room-type-detail-item">
                <span>Số chỗ loại phòng còn lại</span>
                <strong>{{ selectedRoomType?.availableSlots || 0 }}</strong>
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
            </div>
          </details>
        </div>

        <aside class="booking-form-sidebar">
          <div class="booking-summary-card">
            <img :src="service.image" :alt="service.name" class="booking-summary-image" />
            
            <div class="booking-summary-info">
              <p class="muted" style="margin: 0 0 4px; font-size: 0.85rem;">{{ service.destination }}</p>
              <h4 style="margin: 0 0 8px;">{{ service.name }}</h4>
              <div class="booking-summary-price">
                <span class="muted">Giá/phòng/đêm</span>
                <strong>{{ formatCurrencyVND(displaySalePrice) }}</strong>
              </div>
            </div>

            <div class="booking-summary-breakdown">
              <div class="booking-summary-row">
                <span>Loại phòng</span>
                <strong>{{ selectedRoomType?.label || 'Chưa chọn' }}</strong>
              </div>
              <div class="booking-summary-row">
                <span>Ngày nhận</span>
                <strong>{{ bookingForm.startDate || 'Chưa chọn' }}</strong>
              </div>
              <div class="booking-summary-row">
                <span>Ngày trả</span>
                <strong>{{ bookingForm.endDate || 'Chưa chọn' }}</strong>
              </div>
              <div class="booking-summary-row">
                <span>Số đêm</span>
                <strong>{{ stayNights }} đêm</strong>
              </div>
              <div class="booking-summary-row">
                <span>Khách</span>
                <strong>{{ bookingQuantity }} khách</strong>
              </div>
            </div>

            <div class="booking-summary-total">
              <span>Tổng cộng</span>
              <strong class="total-amount">{{ formatCurrencyVND(totalPrice) }}</strong>
            </div>

            <div class="booking-form-actions">
              <small v-if="bookingFeedback" class="error-text">{{ bookingFeedback }}</small>
              <small v-else-if="bookingSuccess" class="success-text">{{ bookingSuccess }}</small>

              <button
                class="primary-button full-width"
                type="button"
                :disabled="maxSelectableSlots <= 0"
                @click="handleAddToCart"
              >
                Thêm vào giỏ hàng
              </button>
              <button
                class="secondary-button full-width"
                type="button"
                :disabled="maxSelectableSlots <= 0"
                @click="handleBookNow"
              >
                Đặt ngay
              </button>
              <button class="ghost-button full-width" type="button" @click="toggleWishlist">
                {{ isWishlisted ? 'Đã lưu wishlist' : 'Thêm vào wishlist' }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <section v-else class="page-section empty-state">
    <h1>Không tìm thấy dịch vụ</h1>
    <router-link class="primary-button" to="/khach-san">Quay lại danh sách</router-link>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GuestRoomSelector from '@/components/travel/GuestRoomSelector.vue'
import { useCartStore } from '@/stores/cart/useCartStore'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { useWishlistStore } from '@/stores/wishlist/useWishlistStore'
import { getPrimaryDateLabel } from '@/utils/bookingRules'
import { formatCurrencyVND } from '@/utils/formatters'
import {
  calculateTotalGuests,
  normalizeGuestRoomSelection
} from '@/utils/hotelGuestRoom'

const route = useRoute()
const router = useRouter()
const serviceStore = useServiceStore()
const cartStore = useCartStore()
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

const isWishlisted = computed(() => wishlistStore.isInWishlist(service.value?.id))
const primaryDateLabel = computed(() => getPrimaryDateLabel(service.value))

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

const roomTypeOptions = computed(() => {
  if (!service.value?.roomTypes) return []
  return service.value.roomTypes.map((rt) => ({
    value: rt.id,
    label: rt.name,
    unitPrice: rt.salePrice,
    availableSlots: rt.availableSlots
  }))
})

const selectedRoomType = computed(() => {
  if (!service.value?.roomTypes) return null
  return service.value.roomTypes.find((rt) => rt.id === bookingForm.roomType)
})

const displaySalePrice = computed(() => Number(service.value?.salePrice || 0))
const stayNights = computed(() => {
  if (!bookingForm.startDate || !bookingForm.endDate) return 0
  const start = new Date(bookingForm.startDate)
  const end = new Date(bookingForm.endDate)
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)))
})

const bookingQuantity = computed(() => calculateTotalGuests(bookingForm.guestRoomSelection))

const chargeableAdultCount = computed(() => {
  const adults = bookingForm.guestRoomSelection.adults || 0
  return Math.max(1, adults)
})

const childrenChargeRange = computed(() => {
  const children = bookingForm.guestRoomSelection.childrenAges || []
  const count = children.filter((age) => age >= 4 && age <= 14).length
  const pricePerChild = selectedRoomType.value ? Number(selectedRoomType.value.childSurcharge || 0) : 0
  return { count, pricePerChild }
})

const effectiveChildSurchargePerNight = computed(() => {
  if (!selectedRoomType.value) return 0
  return Number(selectedRoomType.value.childSurcharge || 0)
})

const childSurchargeDisplay = computed(() => {
  const count = childrenChargeRange.value.count
  const price = childrenChargeRange.value.pricePerChild
  return formatCurrencyVND(count * price * stayNights.value)
})

const adultUnitPricePerNight = computed(() => {
  if (!selectedRoomType.value) return 0
  return Number(selectedRoomType.value.salePrice || 0)
})

const maxSelectableSlots = computed(() => {
  const selected = selectedRoomType.value
  if (selected && Number.isFinite(Number(selected.availableSlots))) {
    return Math.max(0, Number(selected.availableSlots || 0))
  }
  return Math.max(0, Number(service.value?.availableSlots || 0))
})

const totalPrice = computed(() => {
  const adultCount = chargeableAdultCount.value
  const adultPrice = adultUnitPricePerNight.value * stayNights.value * adultCount
  const childSurcharge = childSurchargeDisplay.value ? parseFloat(childSurchargeDisplay.value.replace(/[^0-9.-]/g, '')) : 0
  return adultPrice + (childSurcharge || 0)
})

const bookingFeedback = ref('')
const bookingSuccess = ref('')

const toggleWishlist = () => {
  if (!service.value?.id) return
  wishlistStore.toggleWishlist(service.value.id)
}

const handleAddToCart = () => {
  bookingFeedback.value = ''
  bookingSuccess.value = ''
  
  if (!bookingForm.startDate || !bookingForm.endDate) {
    bookingFeedback.value = 'Vui lòng chọn ngày nhận và ngày trả phòng'
    return
  }

  if (!bookingForm.roomType) {
    bookingFeedback.value = 'Vui lòng chọn loại phòng'
    return
  }

  if (maxSelectableSlots.value <= 0) {
    bookingFeedback.value = 'Loại phòng này đã hết chỗ'
    return
  }

  const nextItem = {
    serviceId: service.value.id,
    bookingType: 'hotel',
    startDate: bookingForm.startDate,
    endDate: bookingForm.endDate,
    quantity: bookingQuantity.value,
    bookingMeta: {
      roomType: bookingForm.roomType,
      rooms: bookingForm.guestRoomSelection.rooms,
      adults: bookingForm.guestRoomSelection.adults,
      children: bookingForm.guestRoomSelection.children,
      childrenAges: [...bookingForm.guestRoomSelection.childrenAges],
      nights: stayNights.value,
      totalPrice: totalPrice.value
    }
  }

  cartStore.addToCart(nextItem)
  bookingSuccess.value = '✓ Đã thêm vào giỏ hàng'
}

const handleBookNow = () => {
  bookingFeedback.value = ''
  bookingSuccess.value = ''
  
  if (!bookingForm.startDate || !bookingForm.endDate) {
    bookingFeedback.value = 'Vui lòng chọn ngày nhận và ngày trả phòng'
    return
  }

  if (!bookingForm.roomType) {
    bookingFeedback.value = 'Vui lòng chọn loại phòng'
    return
  }

  if (maxSelectableSlots.value <= 0) {
    bookingFeedback.value = 'Loại phòng này đã hết chỗ'
    return
  }

  router.push({
    path: '/thanh-toan',
    query: {
      mode: 'direct',
      serviceId: service.value.id,
      roomType: bookingForm.roomType,
      startDate: bookingForm.startDate,
      endDate: bookingForm.endDate,
      adults: bookingForm.guestRoomSelection.adults,
      children: bookingForm.guestRoomSelection.children,
      rooms: bookingForm.guestRoomSelection.rooms,
      nights: stayNights.value,
      quantity: bookingQuantity.value,
      totalPrice: totalPrice.value
    }
  })
}
</script>

<style scoped>
.page-section {
  padding: 24px 0 48px;
}

.booking-form-container {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  gap: 28px;
}

.booking-form-header {
  display: grid;
  gap: 8px;
}

.booking-form-header h1 {
  margin: 0;
  font-size: clamp(1.4rem, 2.5vw, 1.8rem);
  line-height: 1.2;
}

.booking-form-header .muted {
  margin: 0;
}

.booking-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 380px;
  gap: 24px;
  align-items: start;
}

.booking-form-main {
  display: grid;
  gap: 20px;
}

.form-section {
  background: white;
  border: 1px solid #dce5f2;
  border-radius: 20px;
  padding: 24px;
  display: grid;
  gap: 12px;
}

.form-section h3 {
  margin: 0 0 12px;
  font-size: 1.1rem;
}

.form-section label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: #172033;
}

.form-section input,
.form-section select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #dce5f2;
  border-radius: 12px;
  font-size: 0.95rem;
  background: #f9fbff;
}

.booking-form-sidebar {
  position: sticky;
  top: 80px;
}

.booking-summary-card {
  background: white;
  border: 1px solid #dce5f2;
  border-radius: 20px;
  padding: 16px;
  display: grid;
  gap: 16px;
  box-shadow: 0 4px 16px rgba(23, 32, 51, 0.08);
}

.booking-summary-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 14px;
}

.booking-summary-info {
  display: grid;
  gap: 4px;
}

.booking-summary-price {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f4fa;
}

.booking-summary-price strong {
  font-size: 1.3rem;
  color: #0a6dd9;
}

.booking-summary-breakdown {
  display: grid;
  gap: 10px;
  padding: 12px 0;
  border-top: 1px solid #f0f4fa;
  border-bottom: 1px solid #f0f4fa;
}

.booking-summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.booking-summary-row span {
  color: #61708c;
}

.booking-summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  font-weight: 700;
}

.total-amount {
  font-size: 1.4rem;
  color: #0a6dd9;
}

.booking-form-actions {
  display: grid;
  gap: 10px;
}

@media (max-width: 1024px) {
  .booking-form-grid {
    grid-template-columns: 1fr;
  }

  .booking-form-sidebar {
    position: static;
  }
}
</style>
