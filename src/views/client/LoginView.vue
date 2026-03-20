<template>
  <section class="page-section auth-layout">
    <div class="auth-hero">
      <p class="eyebrow">Chào mừng đến với Việt Voyage</p>
      <h1>Đăng nhập để lưu wishlist, đặt chỗ và quản lý lịch sử du lịch nội địa.</h1>
      <p>
        Đây là giao diện đăng nhập giả lập dành cho đồ án Vue 3 front-end. Bạn có thể mở
        khóa khu vực admin bằng tài khoản mock.
      </p>
    </div>

    <form class="auth-form" @submit.prevent="handleSubmit">
      <h2>Đăng nhập / Đăng ký</h2>
      <input v-model="form.email" type="email" placeholder="Email" required />
      <input v-model="form.password" type="password" placeholder="Mật khẩu" required />
      <label class="checkbox-row">
        <input v-model="form.isAdmin" type="checkbox" />
        <span>Đăng nhập với vai trò admin mock</span>
      </label>
      <button class="primary-button full-width" type="submit">Tiếp tục</button>
      <p class="muted">Gợi ý: tick admin để truy cập dashboard mock tại /admin.</p>
    </form>
  </section>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const form = reactive({
  email: 'admin@vietvoyage.vn',
  password: '123456',
  isAdmin: true
})

const handleSubmit = () => {
  window.localStorage.setItem('vietvoyage_user', JSON.stringify({ email: form.email, role: form.isAdmin ? 'admin' : 'customer' }))
  if (form.isAdmin) {
    window.localStorage.setItem('vietvoyage_admin_session', 'active')
  }
  router.push(route.query.redirect || '/')
}
</script>