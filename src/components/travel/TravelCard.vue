<template>
  <article class="travel-card" role="link" tabindex="0" @click="openDetail" @keydown.enter="openDetail" @keydown.space.prevent="openDetail">
    <div class="travel-card__image-wrapper">
      <span class="travel-card__location-tag">{{ service.destination || service.province }}</span>
      <img :src="service.image" :alt="service.name" class="travel-card__image" />
      <span v-if="showDiscountAmount && hasDiscountedPrice" class="travel-card__discount-banner">Giảm {{ discountPercent }}%</span>
      <button
        :class="['wishlist-button', { 'wishlist-button--active': isWishlisted }]"
        type="button"
        @click.stop="$emit('toggle-wishlist', service.id)"
      >
        {{ isWishlisted ? '♥' : '♡' }}
      </button>
    </div>

    <div class="travel-card__body">
      <div class="travel-card__top">
        <span class="badge">{{ categoryLabel }}</span>
        <RatingStars :value="service.rating" />
      </div>

      <h3>{{ service.name }}</h3>

      <div class="travel-card__price-row">
        <div class="travel-card__price-main">
          <p v-if="hasDiscountedPrice" class="price-before">{{ formatCurrencyVND(originalPrice) }}</p>
          <div class="travel-card__price-current">
            <small class="price-label">{{ hasDiscountedPrice ? 'Giá sau giảm' : 'Giá từ' }}</small>
            <p class="price price--sale">{{ formatCurrencyVND(displayPrice) }}</p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import RatingStars from '@/components/common/RatingStars.vue'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { formatCurrencyVND } from '@/utils/formatters'
import { getDetailRouteLocation } from '@/utils/serviceRouting'

const props = defineProps({
  service: {
    type: Object,
    required: true
  },
  queryContext: {
    type: Object,
    default: () => ({})
  },
  isWishlisted: {
    type: Boolean,
    default: false
  },
  showDiscountAmount: {
    type: Boolean,
    default: true
  }
})

defineEmits(['toggle-wishlist'])

const router = useRouter()
const route = useRoute()
const serviceStore = useServiceStore()

const categoryLabel = computed(() =>
  serviceStore.categories.find((category) => category.id === props.service.categoryId)?.name || 'Dịch vụ'
)

const originalPrice = computed(() => Math.max(0, Number(props.service.price || 0) || 0))

const discountPercent = computed(() => Math.max(0, Math.min(100, Math.round(Number(props.service.discountPercent ?? props.service.discount ?? 0) || 0))))

const displayPrice = computed(() => {
  const legacySalePrice = Math.max(0, Number(props.service.salePrice || 0) || 0)
  if (legacySalePrice > 0) return legacySalePrice
  if (!discountPercent.value || !originalPrice.value) return originalPrice.value
  return Math.max(0, Math.round(originalPrice.value * (1 - discountPercent.value / 100)))
})

const detailRoute = computed(() => {
  const baseRoute = getDetailRouteLocation(props.service)
  const injectedQuery = props.queryContext && Object.keys(props.queryContext).length
    ? props.queryContext
    : {}

  return {
    ...baseRoute,
    query: {
      ...injectedQuery,
      ...(route.query || {}),
      ...(baseRoute.query || {})
    }
  }
})

const hasDiscountedPrice = computed(() => discountPercent.value > 0 && displayPrice.value < originalPrice.value)

const openDetail = () => {
  router.push(detailRoute.value)
}
</script>