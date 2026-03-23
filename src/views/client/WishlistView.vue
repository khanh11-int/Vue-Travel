<template>
  <section class="page-section">
    <div class="section-heading compact">
      <div>
        <p class="eyebrow">Wishlist</p>
        <h1>Danh sách yêu thích của bạn</h1>
      </div>
    </div>

    <div v-if="wishlistItems.length" class="travel-grid">
      <TravelCard
        v-for="service in wishlistItems"
        :key="service.id"
        :service="service"
        :is-wishlisted="true"
        @toggle-wishlist="store.toggleWishlist"
        @book-now="handleBookNow"
      />
    </div>
    <div v-else class="empty-state">
      <h2>Bạn chưa lưu dịch vụ nào</h2>
      <p>Hãy khám phá các điểm đến nội địa Việt Nam và thêm dịch vụ phù hợp vào wishlist.</p>
      <router-link class="primary-button" to="/dich-vu">Khám phá ngay</router-link>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import TravelCard from '@/components/travel/TravelCard.vue'
import { useCatalogStore } from '@/stores/useCatalogStore'
import { getDetailRouteLocation } from '@/utils/serviceRouting'

const router = useRouter()
const store = useCatalogStore()
const wishlistItems = computed(() => store.wishlistItems)

const handleBookNow = (service) => {
  router.push(getDetailRouteLocation(service, { guests: 1 }))
}
</script>