<template>
  <div class="service-search-nav" role="navigation" aria-label="Điều hướng loại dịch vụ">
    <router-link
      v-for="item in resolvedRoutes"
      :key="item.id"
      :to="item.to"
      :class="['home-search-tab', { active: item.id === resolvedActiveId }]"
    >
      {{ item.label }}
    </router-link>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { useRoute } from 'vue-router'
import { useServiceStore } from '@/stores/useServiceStore'

const props = defineProps({
  activeId: {
    type: String,
    default: ''
  },
  routes: {
    type: Array,
    default: () => []
  }
})

const route = useRoute()
const serviceStore = useServiceStore()

const resolvedRoutes = computed(() => {
  if (Array.isArray(props.routes) && props.routes.length) {
    return props.routes
  }

  const categories = Array.isArray(serviceStore.categories) ? serviceStore.categories : []
  return categories
    .filter((category) => category?.status !== 'inactive')
    .map((category) => ({
      id: category.id,
      label: category.name,
      to: category.searchPath || category.homePath || { name: 'travel-list', query: { category: category.id } }
    }))
})

const resolvedActiveId = computed(() => {
  if (props.activeId) return props.activeId

  const categories = Array.isArray(serviceStore.categories) ? serviceStore.categories : []
  const activeByPath = categories.find(
    (category) => category.searchPath === route.path || category.homePath === route.path
  )

  return String(route.query.category || activeByPath?.id || '')
})
</script>
