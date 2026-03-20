<template>
  <section v-if="service" class="page-section detail-layout">
    <div>
      <div class="gallery-grid">
        <img :src="service.image" :alt="service.name" class="gallery-main" />
        <div v-if="service.gallery?.length" class="gallery-thumbs">
          <img
            v-for="item in service.gallery"
            :key="item"
            :src="item"
            :alt="service.name"
            class="gallery-thumb"
          />
        </div>
      </div>

      <div class="section-heading compact">
        <div>
          <p class="eyebrow">{{ service.destination }}, {{ service.province }}</p>
          <h1>{{ service.name }}</h1>
            <p class="muted">
            {{ service.availableSlots > 0 ? `Còn ${service.availableSlots} chỗ` : 'Hiện đã hết chỗ' }}
          </p>
        </div>
        <RatingStars :value="service.rating" />
      </div>

      <p class="lead">{{ service.description }}</p>

      <div class="info-card">
        <h3>Tiện ích / Thông tin nổi bật</h3>
        <ul class="chip-list">
          <li v-for="amenity in service.amenities" :key="amenity">{{ amenity }}</li>
        </ul>
      </div>

      <div class="info-card">
        <h3>Lịch trình / Quy định sử dụng</h3>
        <ol>
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
    </div>

    <aside class="booking-panel">
      <p class="eyebrow">Đặt chỗ giả lập</p>
      <h3>{{ formatCurrencyVND(service.salePrice) }}</h3>
      <p class="muted">Giá hiển thị theo VNĐ và áp dụng cho thị trường Việt Nam.</p>

      <label>Ngày sử dụng</label>
      <input v-model="bookingForm.travelDate" type="date" />

      <label>Số lượng khách</label>
      <div class="quantity-box">
        <button type="button" @click="decreaseQuantity">-</button>
        <span>{{ bookingForm.quantity }}</span>
        <button type="button" @click="increaseQuantity">+</button>
      </div>
      <small v-if="bookingFeedback" class="error-text">{{ bookingFeedback }}</small>

      <div class="booking-summary-row">
        <span>Tạm tính</span>
        <strong>{{ formatCurrencyVND(totalPrice) }}</strong>
      </div>

      <button class="primary-button full-width" type="button" :disabled="service.availableSlots <= 0" @click="handleBookNow">
        {{ service.availableSlots > 0 ? 'Đặt ngay' : 'Hết chỗ' }}
      </button>
      <button class="secondary-button full-width" type="button" @click="store.toggleWishlist(service.id)">
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

const service = computed(() => store.getServiceBySlug(route.params.slug))
const serviceComments = computed(() => (service.value ? store.getCommentsByService(service.value.id) : []))
const isWishlisted = computed(() => service.value && store.state.wishlist.includes(service.value.id))

const bookingForm = reactive({
  travelDate: '',
  quantity: 2
})
const bookingFeedback = ref('')

watch(service, (nextService) => {
  if (!nextService) return
  bookingForm.quantity = Math.min(bookingForm.quantity, Math.max(nextService.availableSlots, 1))
})

const commentForm = reactive({
  userName: '',
  rating: 5,
  content: ''
})

const totalPrice = computed(() => (service.value?.salePrice || 0) * bookingForm.quantity)

const decreaseQuantity = () => {
    bookingFeedback.value = ''
  if (bookingForm.quantity > 1) bookingForm.quantity -= 1
}

const increaseQuantity = () => {
  bookingFeedback.value = ''
  if (!service.value) return
  if (bookingForm.quantity >= service.value.availableSlots) {
    bookingFeedback.value = `Dịch vụ này chỉ còn ${service.value.availableSlots} chỗ.`
    return
  }
  bookingForm.quantity += 1
}

const handleBookNow = () => {
    bookingFeedback.value = ''
  if (!service.value) return
  if (service.value.availableSlots <= 0) {
    bookingFeedback.value = 'Dịch vụ hiện đã hết chỗ.'
    return
  }
  if (bookingForm.quantity > service.value.availableSlots) {
    bookingFeedback.value = `Số lượng vượt quá ${service.value.availableSlots} chỗ còn lại.`
    return
  }

  store.addToCart({
    serviceId: service.value.id,
    quantity: bookingForm.quantity,
    travelDate: bookingForm.travelDate
  })
  router.push('/gio-hang')
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