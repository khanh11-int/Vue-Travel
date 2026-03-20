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
        <label>Khoảng giá</label>
        <div class="range-grid">
          <input v-model.number="filters.minPrice" type="number" min="0" placeholder="Từ" />
          <input v-model.number="filters.maxPrice" type="number" min="0" placeholder="Đến" />
        </div>
      </div>
      <div class="field-group">
        <label>Đánh giá tối thiểu</label>
        <select v-model.number="filters.minRating">
          <option :value="0">Tất cả</option>
          <option :value="4">Từ 4 sao</option>
          <option :value="4.5">Từ 4.5 sao</option>
        </select>
      </div>
      <div class="field-group">
        <label>Tình trạng</label>
        <select v-model="filters.availability">
          <option value="">Tất cả</option>
          <option value="available">Còn chỗ</option>
          <option value="soldout">Hết chỗ</option>
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
      <button class="ghost-button full-width" type="button" @click="resetFilters">Xóa bộ lọc</button>
    </aside>

    <div>
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Khám phá dịch vụ</p>
          <h1>{{ filteredServices.length }} lựa chọn du lịch nội địa Việt Nam</h1>
          <p class="muted">
            Ngày đi: {{ route.query.date || 'Chưa chọn' }} · Ngày về: {{ route.query.returnDate || 'Chưa chọn' }} ·
            {{ guestLabel }}
          </p>
        </div>
      </div>

      <div v-if="filteredServices.length" class="travel-grid">
        <TravelCard
          v-for="service in filteredServices"
          :key="service.id"
          :service="service"
          :is-wishlisted="store.state.wishlist.includes(service.id)"
          @toggle-wishlist="store.toggleWishlist"
          @book-now="handleBookNow"
        />
      </div>
      <div v-else class="empty-state">
        <h2>Không tìm thấy dịch vụ phù hợp</h2>
        <p>Hãy thử nới lỏng bộ lọc để xem thêm khách sạn, tour hoặc vé tham quan nội địa khác.</p>
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

const createInitialFilters = () => ({
  keyword: route.query.destination || '',
  categoryId: route.query.category || '',
  province: route.query.province || '',
  minPrice: 0,
  maxPrice: 0,
  minRating: 0,
  availability: '',
  sortBy: 'featured'
})

const filters = reactive(createInitialFilters())

watch(
  () => route.query,
  (query) => {
    filters.keyword = query.destination || ''
    filters.categoryId = query.category || ''
    filters.province = query.province || ''
  }
)

const guestLabel = computed(() => `${route.query.guests || 1} khách`)

const filteredServices = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()

  const result = store.state.services.filter((service) => {
    const matchesKeyword = !keyword || [service.name, service.destination, service.province]
      .join(' ')
      .toLowerCase()
      .includes(keyword)

    const matchesCategory = !filters.categoryId || service.categoryId === filters.categoryId
    const matchesProvince = !filters.province || service.province === filters.province
    const matchesMinPrice = !filters.minPrice || service.salePrice >= filters.minPrice
    const matchesMaxPrice = !filters.maxPrice || service.salePrice <= filters.maxPrice
    const matchesRating = !filters.minRating || service.rating >= filters.minRating
    const matchesAvailability = !filters.availability
      || (filters.availability === 'available' && service.availableSlots > 0)
      || (filters.availability === 'soldout' && service.availableSlots <= 0)

    return matchesKeyword && matchesCategory && matchesProvince && matchesMinPrice
      && matchesMaxPrice && matchesRating && matchesAvailability
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
  store.addToCart({
    serviceId: service.id,
    quantity: Number(route.query.guests || 1),
    travelDate: route.query.date || ''
  })
  router.push('/gio-hang')
}
</script>