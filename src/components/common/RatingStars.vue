<template>
  <div class="rating-stars" :aria-label="`Đánh giá ${value} trên 5`">
    <span v-for="star in 5" :key="star" :class="['star', { active: star <= roundedValue }]">★</span>
    <strong>{{ value.toFixed(1) }}</strong>
  </div>
</template>

<script setup>
/* global defineProps */
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    default: 0
  }
})

const roundedValue = computed(() => Math.round(props.value))
</script>
