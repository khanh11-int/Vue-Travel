<template>
  <section v-if="service" class="page-section detail-layout">
    <div class="detail-main">
      <div class="gallery-grid detail-gallery-grid">
        <img :src="selectedImage || service.image" :alt="service.name" class="gallery-main detail-gallery-main" />
        <div v-if="galleryImages.length > 1" class="gallery-thumbs detail-gallery-thumbs">
          <button
            v-for="(item, index) in galleryImages"
            :key="`${item}-${index}`"
            type="button"
            :class="['detail-thumb-button', { active: selectedImage === item }]"
            @click="selectedImage = item"
          >
            <img :src="item" :alt="`${service.name} ${index + 1}`" class="gallery-thumb" />
          </button>
        </div>
      </div>

      <div class="detail-head">
        <p class="eyebrow">{{ service.destination }}, {{ service.province }}</p>
        <h1>{{ service.name }}</h1>
        <div class="detail-meta">
          <RatingStars :value="service.rating" />
          <span class="detail-dot">•</span>
          <span class="muted">{{ service.availableSlots > 0 ? `Còn ${service.availableSlots} chỗ` : 'Hiện đã hết chỗ' }}</span>
        </div>
        <p class="lead">{{ service.shortDescription }}</p>
      </div>

      <div class="info-card">
        <h3>Mô tả chi tiết</h3>
        <p class="detail-paragraph">{{ service.description }}</p>
      </div>

      <div class="info-card">
        <h3>Tiện ích nổi bật</h3>
        <ul class="chip-list">
          <li v-for="amenity in service.amenities" :key="amenity">{{ amenity }}</li>
        </ul>
      </div>

      <div class="info-card">
        <h3>Lịch trình / Quy định sử dụng</h3>
        <ol class="detail-itinerary">
          <li v-for="item in service.itinerary" :key="item">{{ item }}</li>
        </ol>
      </div>

      <div class="info-card">
        <h3>Đánh giá & bình luận</h3>
        <form class="comment-form" @submit.prevent="submitComment">
          <input v-model="commentForm.userName" type="text" placeholder="Họ tên của bạn" required />
          <select v-model.number="commentForm.rating" required>
            <option :value="5">5 sao</option>
            <option :value="4">4 sao</option>
            <option :value="3">3 sao</option>
            <option :value="2">2 sao</option>
            <option :value="1">1 sao</option>
          </select>
          <textarea
            v-model="commentForm.content"
            rows="4"
            placeholder="Chia sẻ trải nghiệm của bạn"
            required
          />
          <button type="submit" class="primary-button">Gửi bình luận</button>
        </form>

        <div class="comment-list">
          <article v-for="comment in serviceComments" :key="comment.id" class="comment-item">
            <div>
              <strong>{{ comment.userName }}</strong>
              <p class="muted">{{ formatDateVN(comment.createdAt) }}</p>
            </div>
            <RatingStars :value="comment.rating" />
            <p>{{ comment.content }}</p>
          </article>
        </div>
      </div>

      <div class="info-card" v-if="relatedServices.length">
        <div class="section-heading compact">
          <div>
            <p class="eyebrow">Gợi ý thêm</p>
            <h3>Dịch vụ liên quan</h3>
          </div>
        </div>
        <div class="travel-grid">
          <article v-for="item in relatedServices" :key="item.id" class="detail-related-card">
            <img :src="item.image" :alt="item.name" class="detail-related-image" />
            <div class="detail-related-body">
              <p class="muted">{{ item.destination }}, {{ item.province }}</p>
              <h4>{{ item.name }}</h4>
              <strong>{{ formatCurrencyVND(item.salePrice) }}</strong>
              <router-link class="secondary-button" :to="`/dich-vu/${item.slug}`">Xem chi tiết</router-link>
            </div>
          </article>
        </div>
      </div>
    </div>

    <aside class="booking-panel sticky-card detail-booking-panel">
      <p class="eyebrow">Đặt chỗ</p>
      <h3 class="detail-price">{{ formatCurrencyVND(service.salePrice) }}</h3>
      <p class="muted">Giá áp dụng cho thị trường Việt Nam, chưa bao gồm phí dịch vụ.</p>

      <label>{{ primaryDateLabel }}</label>
      <input v-model="bookingForm.startDate" :min="todayISO" type="date" />

      <label v-if="requiresEndDate">Ngày về</label>
      <input v-if="requiresEndDate" v-model="bookingForm.endDate" :min="bookingForm.startDate || todayISO" type="date" />

      <label>Số lượng khách</label>
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
        :disabled="service.availableSlots <= 0"
        @click="handleBookNow"
      >
        {{ service.availableSlots > 0 ? 'Đặt ngay' : 'Hết chỗ' }}
      </button>
      <button
        class="secondary-button full-width"
        type="button"
        :disabled="service.availableSlots <= 0"
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
import RatingStars from '@/components/common/RatingStars.vue'
import { useTravelStore } from '@/stores/useTravelStore'
import { formatCurrencyVND, formatDateVN } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const store = useTravelStore()
const todayISO = (() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})()

const service = computed(() => store.getServiceBySlug(route.params.slug))
const serviceComments = computed(() => (service.value ? store.getCommentsByService(service.value.id) : []))
const isWishlisted = computed(() => service.value && store.state.wishlist.includes(service.value.id))
const requiresEndDate = computed(() => service.value?.categoryId !== 'ticket')
const primaryDateLabel = computed(() => (requiresEndDate.value ? 'Ngày đi' : 'Ngày sử dụng'))
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

const bookingForm = reactive({
  startDate: '',
  endDate: '',
  quantity: 2
})
const bookingFeedback = ref('')
const bookingSuccess = ref('')
const selectedImage = ref('')

watch(service, (nextService) => {
  if (!nextService) return

  selectedImage.value = nextService.image
  const queryStartDate = String(route.query.startDate || route.query.date || '').trim()
  const queryEndDate = String(route.query.endDate || route.query.returnDate || '').trim()
  const queryGuests = Number(route.query.guests || 2)

  bookingForm.startDate = queryStartDate
  bookingForm.endDate = queryEndDate
  bookingForm.quantity = Math.min(
    Math.max(1, Number.isFinite(queryGuests) ? queryGuests : 2),
    Math.max(nextService.availableSlots, 1)
  )
}, { immediate: true })

const commentForm = reactive({
  userName: '',
  rating: 5,
  content: ''
})

const totalPrice = computed(() => (service.value?.salePrice || 0) * bookingForm.quantity)

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

  if (requiresEndDate.value) {
    if (!bookingForm.endDate) {
      bookingFeedback.value = 'Vui lòng chọn ngày về.'
      return false
    }

    if (new Date(bookingForm.endDate) < new Date(bookingForm.startDate)) {
      bookingFeedback.value = 'Ngày về phải sau hoặc bằng ngày đi.'
      return false
    }
  }

  if (bookingForm.quantity > service.value.availableSlots) {
    bookingFeedback.value = `Số lượng vượt quá ${service.value.availableSlots} chỗ còn lại.`
    return false
  }

  return true
}

const addToCartWithCurrentSelection = () => {
  store.addToCart({
    serviceId: service.value.id,
    quantity: bookingForm.quantity,
    startDate: bookingForm.startDate,
    endDate: requiresEndDate.value ? bookingForm.endDate : ''
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
  if (!service.value) return
  if (bookingForm.quantity >= service.value.availableSlots) {
    bookingFeedback.value = `Dịch vụ này chỉ còn ${service.value.availableSlots} chỗ.`
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
      startDate: bookingForm.startDate,
      endDate: requiresEndDate.value ? bookingForm.endDate : '',
      quantity: bookingForm.quantity
    }
  })
}

const submitComment = () => {
  if (!service.value) return
  store.addComment({
    serviceId: service.value.id,
    userName: commentForm.userName,
    rating: commentForm.rating,
    content: commentForm.content
  })
  commentForm.userName = ''
  commentForm.rating = 5
  commentForm.content = ''
}
</script>