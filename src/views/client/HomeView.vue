<template>
  <section class="page-section hero-section home-hero">
    <div class="home-hero__main">
      <p class="eyebrow">Khám phá Việt Nam</p>
      <h1 class="home-hero__title">Đặt dịch vụ du lịch nội địa nhanh chóng</h1>
      <p class="hero-copy">
        Tập trung dịch vụ và combo tại Hà Nội, TP.HCM, Đà Nẵng,
        Nha Trang, Đà Lạt, Phú Quốc cùng nhiều điểm đến nổi bật khác trên khắp Việt Nam.
      </p>

      <div class="search-panel search-panel--wide home-search-panel">
        <div class="home-search-panel__destination">
          <label>Điểm đến</label>
          <input v-model="searchForm.destination" type="text" placeholder="Ví dụ: Hạ Long, Nha Trang" />
        </div>
        <div class="home-search-panel__date">
          <label>Ngày đi</label>
          <input v-model="searchForm.startDate" :min="todayISO" type="date" />
        </div>
        <div class="home-search-panel__return-date">
          <label>Ngày về</label>
          <input v-model="searchForm.endDate" :min="searchForm.startDate || todayISO" type="date" />
        </div>
        <div class="home-search-panel__guests">
          <label>Số khách</label>
          <input v-model.number="searchForm.guests" type="number" min="1" max="20" />
        </div>
        <div class="home-search-panel__category">
          <label>Loại dịch vụ</label>
          <select v-model="searchForm.categoryId">
            <option value="">Tất cả dịch vụ</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        <router-link :to="searchTarget" class="primary-button home-search-panel__submit">Tìm kiếm ngay</router-link>
      </div>
    </div>

    <aside class="hero-card home-hero__featured">
      <p class="eyebrow">Điểm đến nổi bật</p>
      <ul class="home-destination-list">
        <li v-for="destination in featuredDestinations" :key="destination.id">
          <div>
            <strong>{{ destination.name }}</strong>
            <span>{{ destination.province }}</span>
          </div>
          <router-link :to="{ name: 'travel-list', query: { province: destination.province } }">Khám phá</router-link>
        </li>
      </ul>
    </aside>
  </section>

  <section class="page-section home-promo-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Ưu đãi hot</p>
        <h2>Mã khuyến mãi nổi bật cho chuyến đi trong nước.</h2>
      </div>
      <router-link to="/gio-hang" class="secondary-button">Xem giỏ hàng</router-link>
    </div>

    <div class="promo-grid home-promo-grid">
      <article v-for="promotion in activePromotions" :key="promotion.id" class="promo-card home-promo-card">
        <p class="eyebrow eyebrow--blue">{{ promotion.code }}</p>
        <h3>{{ promotion.description }}</h3>
        <p class="muted">Hiệu lực từ {{ promotion.startDate }} đến {{ promotion.endDate }}</p>
        <p class="home-promo-note">Áp dụng cho booking nội địa theo điều kiện chương trình.</p>
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
const todayISO = (() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})()

const searchForm = reactive({
  destination: '',
  startDate: '',
  endDate: '',
  guests: 2,
  categoryId: ''
})

const featuredServices = computed(() => store.featuredServices.value)
const activePromotions = computed(() => store.activePromotions.value.slice(0, 3))
const featuredDestinations = computed(() => destinations.slice(0, 6))

const searchTarget = computed(() => {
  const query = new URLSearchParams()
  if (searchForm.destination) query.set('destination', searchForm.destination)
  if (searchForm.startDate) query.set('startDate', searchForm.startDate)
  if (searchForm.endDate) query.set('endDate', searchForm.endDate)
  if (searchForm.guests) query.set('guests', String(searchForm.guests))
  if (searchForm.categoryId) query.set('category', searchForm.categoryId)
  return `/dich-vu?${query.toString()}`
})

const handleBookNow = (service) => {
  const requiresEndDate = service.categoryId !== 'ticket'
  if (searchForm.startDate && searchForm.startDate < todayISO) {
    router.push({ name: 'travel-detail', params: { slug: service.slug } })
    return
  }

  if (searchForm.endDate && searchForm.startDate && searchForm.endDate < searchForm.startDate) {
    router.push({ name: 'travel-detail', params: { slug: service.slug } })
    return
  }

  if (!searchForm.startDate || (requiresEndDate && !searchForm.endDate)) {
    router.push({
      name: 'travel-detail',
      params: { slug: service.slug },
      query: {
        startDate: searchForm.startDate || undefined,
        endDate: searchForm.endDate || undefined,
        guests: searchForm.guests || undefined
      }
    })
    return
  }

  store.addToCart({
    serviceId: service.id,
    quantity: searchForm.guests || 1,
    startDate: searchForm.startDate,
    endDate: requiresEndDate ? searchForm.endDate : ''
  })
  router.push('/gio-hang')
}
</script>