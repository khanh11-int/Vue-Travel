<template>
  <section v-if="isBootstrapping" class="app-loading">
    <p>Đang tải dữ liệu từ db.json...</p>
  </section>

  <router-view v-else />
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
.app-loading {
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: #4a5a73;
  font-weight: 600;
}
</style>
