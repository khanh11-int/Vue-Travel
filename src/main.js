import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTravelStore } from '@/stores/useTravelStore'
import './assets/main.css'

const bootstrap = async () => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const authStore = useAuthStore(pinia)
  const travelStore = useTravelStore(pinia)

  await Promise.all([
    authStore.initialize(),
    travelStore.initialize()
  ])

  app.use(router)
  app.mount('#app')
}

bootstrap()
