<template>
  <div v-if="relatedServices.length" class="info-card detail-related-section">
    <div class="section-heading compact">
      <div>
        <p class="eyebrow">Gợi ý thêm</p>
        <h3>Dịch vụ liên quan</h3>
      </div>
    </div>
    <div class="travel-grid">
      <article v-for="item in relatedServices" :key="item.id" class="detail-related-card">
        <img :src="item.image" :alt="item.name" class="detail-related-image" />
        <div class="detail-related-body">
          <p class="muted">{{ item.destination }}, {{ item.province }}</p>
          <h4>{{ item.name }}</h4>
          <strong>{{ formatCurrencyVND(item.salePrice) }}</strong>
          <router-link class="secondary-button" :to="getDetailRouteLocation(item)">Xem chi tiết</router-link>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { formatCurrencyVND } from '@/utils/formatters'
import { getDetailRouteLocation } from '@/utils/serviceRouting'

defineProps({
  relatedServices: {
    type: Array,
    default: () => []
  }
})
</script>
