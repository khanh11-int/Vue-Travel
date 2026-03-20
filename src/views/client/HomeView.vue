<template>
  <section class="page-section hero-section">
    <div>
      <p class="eyebrow">Khám phá Việt Nam</p>
      <h1>Website du lịch nội địa Việt Nam theo phong cách Traveloka mini.</h1>
      <p class="hero-copy">
        Tập trung khách sạn, tour, vé tham quan và combo tại Hà Nội, Đà Nẵng, Hạ Long,
        Đà Lạt, Phú Quốc cùng nhiều điểm đến nổi bật khác.
      </p>

      <div class="search-panel">
        <div>
          <label>Điểm đến</label>
          <input v-model="searchForm.destination" type="text" placeholder="Ví dụ: Hạ Long, Đà Nẵng" />
        </div>
        <div>
          <label>Ngày đi</label>
          <input v-model="searchForm.travelDate" type="date" />
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

    <div class="hero-card">
      <p class="eyebrow">Điểm đến nổi bật</p>
      <ul>
        <li v-for="destination in destinations" :key="destination.id">
          <strong>{{ destination.name }}</strong>
          <span>{{ destination.province }}</span>
        </li>
      </ul>
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
  categoryId: ''
})

const featuredServices = computed(() => store.featuredServices.value)

const searchTarget = computed(() => {
  const query = new URLSearchParams()
  if (searchForm.destination) query.set('destination', searchForm.destination)
  if (searchForm.travelDate) query.set('date', searchForm.travelDate)
  if (searchForm.categoryId) query.set('category', searchForm.categoryId)
  return `/dich-vu?${query.toString()}`
})

const handleBookNow = (service) => {
  store.addToCart({ serviceId: service.id, quantity: 1, travelDate: searchForm.travelDate })
  router.push('/gio-hang')
}
</script>
