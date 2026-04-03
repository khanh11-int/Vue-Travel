<template>
  <div class="app-shell-root">
    <section v-if="isBootstrapping" class="app-loading">
      <p>Đang tải dữ liệu từ db.json...</p>
    </section>

    <router-view />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useServiceStore } from '@/stores/useServiceStore'

const serviceStore = useServiceStore()
const isBootstrapping = ref(true)

onMounted(async () => {
  await serviceStore.bootstrapServices()
  isBootstrapping.value = false
})
</script>

<style scoped>
.app-shell-root {
  min-height: 100vh;
}

.app-loading {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(245, 248, 253, 0.92);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  color: #4a5a73;
  font-weight: 600;
}
</style>
