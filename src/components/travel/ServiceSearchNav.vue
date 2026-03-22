<template>
  <div class="service-search-nav" role="navigation" aria-label="Điều hướng loại dịch vụ">
    <router-link
      v-for="item in routes"
      :key="item.id"
      :to="item.to"
      :class="['home-search-tab', { active: item.id === activeId }]"
    >
      {{ item.label }}
    </router-link>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  activeId: {
    type: String,
    required: true
  },
  routes: {
    type: Array,
    default: () => [
      { id: 'hotel', label: 'Khách sạn', to: '/khach-san' },
      { id: 'ticket', label: 'Vé tham quan', to: '/ve-tham-quan' },
      { id: 'tour', label: 'Tour', to: '/tour' },
      { id: 'combo', label: 'Combo', to: '/combo' }
    ]
  }
})
</script>
