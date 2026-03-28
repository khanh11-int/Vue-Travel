<template>
  <nav class="sub-nav-bar">
    <div class="sub-nav-container">
      <router-link
        v-for="item in navItems"
        :key="item.id"
        :to="item.to"
        :class="['sub-nav-link', { active: isActive(item.to) }]"
      >
        {{ item.label }}
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useServiceStore } from '@/stores/useServiceStore'

const route = useRoute()
const serviceStore = useServiceStore()

const navItems = computed(() => {
  const categories = Array.isArray(serviceStore.categories) ? serviceStore.categories : []

  return categories
    .filter((category) => category?.status !== 'inactive')
    .map((category) => ({
      id: category.id,
      label: category.name,
      to: category.homePath || category.searchPath || { name: 'travel-list', query: { category: category.id } }
    }))
})

const isActive = (path) => {
  return route.path.startsWith(path)
}
</script>

<style scoped>
.sub-nav-bar {
  background: transparent;
  border-bottom: 0;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: none;
}

.sub-nav-container {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.sub-nav-link {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 22px;
  color: var(--muted);
  font-weight: 600;
  font-size: 0.95rem;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.sub-nav-link:hover {
  color: var(--primary);
  background: #f9fafc;
}

.sub-nav-link.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

@media (max-width: 768px) {
  .sub-nav-container {
    justify-content: flex-start;
    overflow-x: auto;
    gap: 0;
  }

  .sub-nav-link {
    padding: 10px 16px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .sub-nav-link {
    padding: 10px 12px;
    font-size: 0.85rem;
  }
}
</style>
