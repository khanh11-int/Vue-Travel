<template>
  <article class="travel-card" role="link" tabindex="0" @click="openDetail" @keydown.enter="openDetail" @keydown.space.prevent="openDetail">
    <div class="travel-card__image-wrapper">
      <img :src="service.image" :alt="service.name" class="travel-card__image" />
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
      <p class="muted">{{ service.destination }}, {{ service.province }}</p>
      <p class="travel-card__description">{{ service.shortDescription }}</p>

      <div class="travel-card__price-row">
        <span :class="['availability', service.availableSlots > 0 ? 'available' : 'sold-out']">
          {{ service.availableSlots > 0 ? `Còn ${service.availableSlots} chỗ` : 'Hết chỗ' }}
        </span>
        <div class="travel-card__price-main">
          <p v-if="hasDiscountedPrice" class="price-before">{{ formatCurrencyVND(effectiveOriginalPrice) }}</p>
          <div class="travel-card__price-current">
            <small class="price-label">{{ hasDiscountedPrice ? 'Giá ưu đãi' : 'Giá từ' }}</small>
            <p class="price price--sale">{{ formatCurrencyVND(currentSalePrice) }}</p>
          </div>
        </div>

      </div>

      <p v-if="showDiscountAmount && discountAmount > 0" class="travel-card__discount-amount">
        Tiết kiệm {{ formatCurrencyVND(discountAmount) }}
      </p>
    </div>
  </article>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import RatingStars from '@/components/common/RatingStars.vue'
import { useServiceStore } from '@/stores/useServiceStore'
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
    default: false
  }
})

defineEmits(['toggle-wishlist'])

const router = useRouter()
const route = useRoute()
const serviceStore = useServiceStore()

const categoryLabel = computed(() =>
  serviceStore.categories.find((category) => category.id === props.service.categoryId)?.name || 'Dịch vụ'
)

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

const currentSalePrice = computed(() => Number(props.service.salePrice || props.service.price || 0) || 0)

const effectiveOriginalPrice = computed(() => {
  const salePrice = currentSalePrice.value
  const listedPrice = Number(props.service.price || 0) || 0
  return Math.max(listedPrice, salePrice)
})

const hasDiscountedPrice = computed(() => effectiveOriginalPrice.value > currentSalePrice.value)

const discountAmount = computed(() => {
  if (!hasDiscountedPrice.value) return 0
  return effectiveOriginalPrice.value - currentSalePrice.value
})

const openDetail = () => {
  router.push(detailRoute.value)
}
</script>