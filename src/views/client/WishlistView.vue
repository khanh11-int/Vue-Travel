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
        @toggle-wishlist="handleToggleWishlist"
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
import { computed, onMounted, watch } from 'vue'
import TravelCard from '@/components/travel/TravelCard.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useServiceStore } from '@/stores/useServiceStore'
import { useWishlistStore } from '@/stores/useWishlistStore'

const authStore = useAuthStore()
const serviceStore = useServiceStore()
const wishlistStore = useWishlistStore()

onMounted(() => {
  wishlistStore.syncUserScope()
})

watch(
  () => authStore.currentUser?.id || null,
  () => {
    wishlistStore.syncUserScope()
  }
)

const wishlistItems = computed(() => {
  const wishlistIds = Array.isArray(wishlistStore.wishlist) ? wishlistStore.wishlist : []
  return serviceStore.services.filter((service) => wishlistIds.some((id) => Number(id) === Number(service.id)))
})

const handleToggleWishlist = (serviceId) => {
  wishlistStore.toggleWishlist(serviceId)
}
</script>