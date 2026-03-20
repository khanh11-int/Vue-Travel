<template>
  <article class="travel-card">
    <div class="travel-card__image-wrapper">
      <img :src="service.image" :alt="service.name" class="travel-card__image" />
      <button class="wishlist-button" type="button" @click="$emit('toggle-wishlist', service.id)">
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
        <div>
          <small>Giá từ</small>
          <p class="price">{{ formatCurrencyVND(service.salePrice) }}</p>
        </div>
        <span :class="['availability', service.availableSlots > 0 ? 'available' : 'sold-out']">
          {{ service.availableSlots > 0 ? `Còn ${service.availableSlots} chỗ` : 'Hết chỗ' }}
        </span>
      </div>

      <div class="travel-card__actions">
        <router-link :to="`/dich-vu/${service.slug}`" class="secondary-button">Xem chi tiết</router-link>
        <button class="primary-button" type="button" @click="$emit('book-now', service)">
          Đặt ngay
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed } from 'vue'
import RatingStars from '@/components/common/RatingStars.vue'
import { categories } from '@/data/mockData'
import { formatCurrencyVND } from '@/utils/formatters'

const props = defineProps({
  service: {
    type: Object,
    required: true
  },
  isWishlisted: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-wishlist', 'book-now'])

const categoryLabel = computed(() =>
  categories.find((category) => category.id === props.service.categoryId)?.name || 'Dịch vụ'
)
</script>
