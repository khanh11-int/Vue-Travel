<template>
  <section class="page-section list-layout">
    <aside class="filter-panel">
      <p class="eyebrow">Bộ lọc</p>
      <div class="field-group">
        <label>Tìm kiếm</label>
        <input v-model="filters.keyword" type="text" placeholder="Tên dịch vụ hoặc địa điểm" />
      </div>
      <div class="field-group">
        <label>Danh mục</label>
        <select v-model="filters.categoryId">
          <option value="">Tất cả</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
      <div class="field-group">
        <label>Tỉnh / Thành</label>
        <select v-model="filters.province">
          <option value="">Tất cả</option>
          <option v-for="destination in destinations" :key="destination.id" :value="destination.province">
            {{ destination.province }}
          </option>
        </select>
      </div>
      <div class="field-group">
        <label>Sắp xếp</label>
        <select v-model="filters.sortBy">
          <option value="featured">Nổi bật</option>
          <option value="priceAsc">Giá tăng dần</option>
          <option value="priceDesc">Giá giảm dần</option>
          <option value="ratingDesc">Đánh giá cao nhất</option>
          <option value="latest">Mới nhất</option>
        </select>
      </div>
    </aside>

    <div>
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Khám phá dịch vụ</p>
          <h1>{{ filteredServices.length }} lựa chọn du lịch nội địa Việt Nam</h1>
        </div>
      </div>

      <div class="travel-grid">
        <TravelCard
          v-for="service in filteredServices"
          :key="service.id"
          :service="service"
          :is-wishlisted="store.state.wishlist.includes(service.id)"
          @toggle-wishlist="store.toggleWishlist"
          @book-now="handleBookNow"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TravelCard from '@/components/travel/TravelCard.vue'
import { categories, destinations } from '@/data/mockData'
import { useTravelStore } from '@/stores/useTravelStore'

const route = useRoute()
const router = useRouter()
const store = useTravelStore()

const filters = reactive({
  keyword: route.query.destination || '',
  categoryId: route.query.category || '',
  province: '',
  sortBy: 'featured'
})

watch(
  () => route.query,
  (query) => {
    filters.keyword = query.destination || ''
    filters.categoryId = query.category || ''
  }
)

const filteredServices = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()

  const result = store.state.services.filter((service) => {
    const matchesKeyword = !keyword || [service.name, service.destination, service.province]
      .join(' ')
      .toLowerCase()
      .includes(keyword)

    const matchesCategory = !filters.categoryId || service.categoryId === filters.categoryId
    const matchesProvince = !filters.province || service.province === filters.province

    return matchesKeyword && matchesCategory && matchesProvince
  })

  return [...result].sort((left, right) => {
    switch (filters.sortBy) {
      case 'priceAsc':
        return left.salePrice - right.salePrice
      case 'priceDesc':
        return right.salePrice - left.salePrice
      case 'ratingDesc':
        return right.rating - left.rating
      case 'latest':
        return new Date(right.createdAt) - new Date(left.createdAt)
      default:
        return Number(right.featured) - Number(left.featured)
    }
  })
})

const handleBookNow = (service) => {
  store.addToCart({ serviceId: service.id, quantity: 1, travelDate: route.query.date || '' })
  router.push('/gio-hang')
}
</script>