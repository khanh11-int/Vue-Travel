<template>
  <section class="page-section hero-section">
    <div>
      <p class="eyebrow">Khám phá Việt Nam</p>
       <h1>Đặt khách sạn, tour, vé tham quan nội địa nhanh chóng</h1>
      <p class="hero-copy">
        Tập trung khách sạn, tour, vé tham quan và combo tại Hà Nội, TP.HCM, Đà Nẵng,
        Nha Trang, Đà Lạt, Phú Quốc cùng nhiều điểm đến nổi bật khác trên khắp Việt Nam.
      </p>

      <div class="search-panel search-panel--wide">
        <div>
          <label>Điểm đến</label>
          <input v-model="searchForm.destination" type="text" placeholder="Ví dụ: Hạ Long, Nha Trang" />
        </div>
        <div>
          <label>Ngày đi</label>
          <input v-model="searchForm.travelDate" type="date" />
        </div>
        <div>
          <label>Ngày về</label>
          <input v-model="searchForm.returnDate" type="date" />
        </div>
        <div>
          <label>Số khách</label>
          <input v-model.number="searchForm.guests" type="number" min="1" max="20" />
        </div>
        <div>
          <label>Loại dịch vụ</label>
          <select v-model="searchForm.categoryId">
            <option value="">Tất cả dịch vụ</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        <router-link :to="searchTarget" class="primary-button">Tìm kiếm ngay</router-link>
      </div>
    </div>
    <div class="quick-category-row">
        <router-link
          v-for="category in categories"
          :key="category.id"
          :to="{ name: 'travel-list', query: { category: category.id } }"
          class="quick-category-pill"
        >
          {{ category.name }}
        </router-link>
      </div>

    <div class="hero-card">
      <p class="eyebrow">Điểm đến nổi bật</p>
      <ul>
        <li v-for="destination in featuredDestinations" :key="destination.id">
          <strong>{{ destination.name }}</strong>
          <span>{{ destination.province }}</span>
        </li>
      </ul>
    </div>
  </section>

 <section class="page-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Ưu đãi hot</p>
        <h2>Mã khuyến mãi nổi bật cho chuyến đi trong nước.</h2>
      </div>
      <router-link to="/gio-hang" class="secondary-button">Xem giỏ hàng</router-link>
    </div>

    <div class="promo-grid">
      <article v-for="promotion in activePromotions" :key="promotion.id" class="promo-card">
        <p class="eyebrow eyebrow--blue">{{ promotion.code }}</p>
        <h3>{{ promotion.description }}</h3>
        <p class="muted">Hiệu lực từ {{ promotion.startDate }} đến {{ promotion.endDate }}</p>
      </article>
    </div>
  </section>

  <section class="page-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Dịch vụ tiêu biểu</p>
        <h2>Đề xuất phù hợp cho khách du lịch nội địa Việt Nam.</h2>
      </div>
      <router-link to="/dich-vu" class="secondary-button">Xem tất cả</router-link>
    </div>

    <div class="travel-grid">
      <TravelCard
        v-for="service in featuredServices"
        :key="service.id"
        :service="service"
        :is-wishlisted="store.state.wishlist.includes(service.id)"
        @toggle-wishlist="store.toggleWishlist"
        @book-now="handleBookNow"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import TravelCard from '@/components/travel/TravelCard.vue'
import { categories, destinations } from '@/data/mockData'
import { useTravelStore } from '@/stores/useTravelStore'

const router = useRouter()
const store = useTravelStore()

const searchForm = reactive({
  destination: '',
  travelDate: '',
  returnDate: '',
  guests: 2,
  categoryId: ''
})

const featuredServices = computed(() => store.featuredServices.value)
const activePromotions = computed(() => store.activePromotions.value.slice(0, 3))
const featuredDestinations = computed(() => destinations.slice(0, 6))

const searchTarget = computed(() => {
  const query = new URLSearchParams()
  if (searchForm.destination) query.set('destination', searchForm.destination)
  if (searchForm.travelDate) query.set('date', searchForm.travelDate)
  if (searchForm.returnDate) query.set('returnDate', searchForm.returnDate)
  if (searchForm.guests) query.set('guests', String(searchForm.guests))
  if (searchForm.categoryId) query.set('category', searchForm.categoryId)
  return `/dich-vu?${query.toString()}`
})

const handleBookNow = (service) => {
    store.addToCart({
    serviceId: service.id,
    quantity: searchForm.guests || 1,
    travelDate: searchForm.travelDate
  })
  router.push('/gio-hang')
}
</script>