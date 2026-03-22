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
          <p class="muted">{{ searchContextSummary }}</p>
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
import { serviceRequiresEndDate } from '@/utils/bookingRules'
import { getDetailRouteLocation } from '@/utils/serviceRouting'
import {
  resolveCategoryFromQuery,
  resolveEndDateByCategory,
  resolveQuantityByCategory,
  resolveSearchSummary,
  resolveStartDateByCategory
} from '@/utils/searchContext'

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

const selectedCategory = computed(() => resolveCategoryFromQuery(route.query, filters.categoryId))

const selectedStartDate = computed(() => resolveStartDateByCategory(route.query, selectedCategory.value))

const selectedEndDate = computed(() => resolveEndDateByCategory(route.query, selectedCategory.value))

watch(
  () => route.query,
  (query) => {
    filters.keyword = query.destination || ''
    filters.categoryId = query.category || ''
    filters.province = query.province || ''
  }
)

const selectedQuantity = computed(() => resolveQuantityByCategory(route.query, selectedCategory.value))

const searchContextSummary = computed(() => resolveSearchSummary(route.query, selectedCategory.value))

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
  const requiresEndDate = serviceRequiresEndDate(service)
  const category = service.categoryId
  const defaultQuantity = Math.max(1, Number(selectedQuantity.value) || 1)

  if (category === 'tour' || category === 'combo') {
    router.push({
      ...getDetailRouteLocation(service),
      query: category === 'tour'
        ? {
          departureDate: selectedStartDate.value || undefined,
          travelers: defaultQuantity
        }
        : {
          applyDate: selectedStartDate.value || undefined,
          travelers: defaultQuantity
        }
    })
    return
  }

  if (category === 'hotel') {
    if (!selectedStartDate.value || !selectedEndDate.value) {
      router.push({
        ...getDetailRouteLocation(service),
        query: {
          checkInDate: selectedStartDate.value || undefined,
          checkOutDate: selectedEndDate.value || undefined,
          guests: defaultQuantity,
          rooms: Number(route.query.rooms || 1) || 1
        }
      })
      return
    }
  } else if (!selectedStartDate.value) {
    const query = {
      guests: defaultQuantity
    }

    if (category === 'ticket') {
      query.useDate = selectedStartDate.value || undefined
      query.ticketQuantity = defaultQuantity
    } else if (category === 'tour') {
      query.departureDate = selectedStartDate.value || undefined
      query.travelers = defaultQuantity
    } else if (category === 'combo') {
      query.applyDate = selectedStartDate.value || undefined
      query.travelers = defaultQuantity
    }

    router.push(getDetailRouteLocation(service, query))
    return
  }

  store.addToCart({
    serviceId: service.id,
    quantity: defaultQuantity,
    bookingType: category,
    bookingMeta: category === 'hotel'
      ? {
        checkInDate: selectedStartDate.value,
        checkOutDate: selectedEndDate.value,
        guests: defaultQuantity,
        rooms: Number(route.query.rooms || 1) || 1
      }
      : category === 'ticket'
        ? {
          useDate: selectedStartDate.value,
          ticketQuantity: defaultQuantity
        }
        : category === 'tour'
          ? {
            departureDate: selectedStartDate.value,
            travelers: defaultQuantity
          }
          : {
            applyDate: selectedStartDate.value,
            travelers: defaultQuantity
          },
    startDate: selectedStartDate.value,
    endDate: requiresEndDate ? selectedEndDate.value : ''
  })
  router.push('/gio-hang')
}

const resetFilters = () => {
  Object.assign(filters, {
    keyword: '',
    categoryId: '',
    province: '',
    minPrice: 0,
    maxPrice: 0,
    minRating: 0,
    availability: '',
    sortBy: 'featured'
  })
}
</script>