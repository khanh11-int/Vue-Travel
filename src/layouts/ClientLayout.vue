<template>
  <div class="app-shell">
    <header class="ota-top-header">
      <router-link class="brand" to="/" aria-label="Việt Voyage">
        <img :src="logoImage" alt="Việt Voyage" class="brand-logo" />
      </router-link>
      <nav class="ota-utility-nav" aria-label="Tiện ích người dùng">
        <div class="ota-nav-left">
          <router-link :to="{ path: '/', hash: '#diem-dieu-tro-noi-bat' }">Khám phá</router-link>
          <router-link :to="{ path: '/', hash: '#uu-dai-hot' }">Khuyến mãi</router-link>
          <router-link :to="{ path: '/', hash: '#chan-trang-ho-tro' }">Hỗ trợ</router-link>
        </div>

        <div class="ota-nav-right">
          <router-link to="/wishlist">Đã lưu <span class="nav-pill">{{ wishlistCount }}</span></router-link>
          <router-link to="/lich-su-dat-cho">Đặt chỗ của tôi</router-link>

          <div v-if="!isLoggedIn" class="ota-account-links">
            <router-link to="/dang-nhap">Đăng nhập</router-link>
            <router-link :to="{ path: '/dang-nhap', query: { mode: 'register' } }" class="ota-register-link">Đăng ký</router-link>
          </div>

          <div v-else class="ota-account-chip">
            <span>{{ currentUserLabel }} |</span>
            <button class="ota-logout-button" type="button" @click="handleLogout">Đăng xuất</button>
          </div>
        </div>
      </nav>
    </header>

    <main>
      <router-view />
    </main>

    <footer id="chan-trang-ho-tro" class="main-footer">
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
const isLoggedIn = computed(() => authStore.isLoggedIn.value)
const currentUserLabel = computed(() => {
  if (!authStore.state.currentUser) return 'Tài khoản'
  return authStore.state.currentUser.fullName
})

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>