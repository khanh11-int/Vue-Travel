<template>
  <div class="app-shell">
    <header class="main-header">
      <router-link class="brand" to="/" aria-label="Việt Voyage">
        <img :src="logoImage" alt="Việt Voyage" class="brand-logo" />
      </router-link>
      <nav class="main-nav">
        <router-link to="/">Trang chủ</router-link>
        <router-link to="/dich-vu">Khám phá</router-link>
        <router-link to="/wishlist" class="nav-right-start">Wishlist <span class="nav-pill">{{ wishlistCount }}</span></router-link>
        <router-link to="/gio-hang">Giỏ hàng <span class="nav-pill">{{ cartCount }}</span></router-link>
        <router-link to="/lich-su-dat-cho">Đơn đặt chỗ</router-link>
        <router-link v-if="!isLoggedIn" to="/dang-nhap">Đăng nhập</router-link>
        <router-link
          v-if="!isLoggedIn"
          :to="{ path: '/dang-nhap', query: { mode: 'register' } }"
          class="nav-register-button"
        >
          Đăng ký
        </router-link>
        <div v-else class="user-nav">
          <span class="user-chip">{{ currentUserLabel }}</span>
          <button class="ghost-button" type="button" @click="handleLogout">Đăng xuất</button>
        </div>
      </nav>
    </header>

    <main>
      <router-view />
    </main>

    <footer class="main-footer">
      <div>
        <h3>Việt Voyage</h3>
        <p>Nền tảng du lịch nội địa Việt Nam lấy cảm hứng từ trải nghiệm OTA hiện đại.</p>
      </div>
      <div>
        <h4>Liên hệ & chính sách</h4>
        <p>Hotline 1900 6868 · cskh@vietvoyage.vn · Chính sách bảo mật · Điều khoản dịch vụ</p>
      </div>
      <div>
        <h4>Thanh toán & hỗ trợ</h4>
        <p>VNPay · MoMo · Thẻ nội địa · Hỗ trợ đặt chỗ 24/7 cho khách hàng tại Việt Nam</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/stores/useTravelStore'
import { useAuthStore } from '@/stores/useAuthStore'
import logoImage from '@/assets/logo.png'

const router = useRouter()
const store = useTravelStore()
const authStore = useAuthStore()

const wishlistCount = computed(() => store.wishlistItems.value.length)
const cartCount = computed(() => store.cartItems.value.length)
const isLoggedIn = computed(() => authStore.isLoggedIn.value)
const currentUserLabel = computed(() => {
  if (!authStore.state.currentUser) return ''
  return `${authStore.state.currentUser.fullName} · ${authStore.state.currentUser.role === 'admin' ? 'Admin' : 'Khách hàng'}`
})

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>