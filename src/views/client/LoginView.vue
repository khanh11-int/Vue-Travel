<template>
  <section class="page-section auth-layout">
    <div class="auth-hero">
      <p class="eyebrow">Chào mừng đến với Việt Voyage</p>
      <h1>Đăng nhập để lưu wishlist, đặt chỗ và quản lý lịch sử du lịch nội địa.</h1>
      <p>
        Demo sẵn 2 tài khoản mock: <strong>admin@vietvoyage.vn</strong> / <strong>123456</strong>
        và <strong>user@vietvoyage.vn</strong> / <strong>123456</strong>.
      </p>
    </div>

    <form class="auth-form" @submit.prevent="handleSubmit">
      <div class="auth-tabs">
        <button
          type="button"
          :class="['auth-tab', { active: mode === 'login' }]"
          @click="switchMode('login')"
        >
          Đăng nhập
        </button>
        <button
          type="button"
          :class="['auth-tab', { active: mode === 'register' }]"
          @click="switchMode('register')"
        >
          Đăng ký
        </button>
      </div>

      <h2>{{ mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới' }}</h2>

      <input
        v-if="mode === 'register'"
        v-model="form.fullName"
        type="text"
        placeholder="Họ và tên"
      />
      <small v-if="errors.fullName" class="error-text">{{ errors.fullName }}</small>

      <input v-model="form.email" type="email" placeholder="Email" />
      <small v-if="errors.email" class="error-text">{{ errors.email }}</small>

      <input v-model="form.password" type="password" placeholder="Mật khẩu" />
      <small v-if="errors.password" class="error-text">{{ errors.password }}</small>

      <label v-if="mode === 'login'" class="checkbox-row">
        <input v-model="form.isAdmin" type="checkbox" />
        <span>Đăng nhập</span>
      </label>

      <p v-if="feedback.message" :class="feedback.success ? 'success-text' : 'error-text'">
        {{ feedback.message }}
      </p>

      <button class="primary-button full-width" type="submit">
        {{ mode === 'login' ? 'Tiếp tục đăng nhập' : 'Đăng ký tài khoản' }}
      </button>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const mode = ref('login')

const form = reactive({
  fullName: '',
  email: 'admin@vietvoyage.vn',
  password: '123456',
  isAdmin: true
})

const errors = reactive({
  fullName: '',
  email: '',
  password: ''
})

const feedback = reactive({
  success: false,
  message: ''
})

const resetFeedback = () => {
  feedback.success = false
  feedback.message = ''
}

const switchMode = (nextMode) => {
  mode.value = nextMode
  resetFeedback()
  errors.fullName = ''
  errors.email = ''
  errors.password = ''

  if (nextMode === 'login') {
    form.email = 'admin@vietvoyage.vn'
    form.password = '123456'
    form.isAdmin = true
  } else {
    form.fullName = ''
    form.email = ''
    form.password = ''
    form.isAdmin = false
  }
}

watch(
  () => route.query.mode,
  (modeQuery) => {
    switchMode(modeQuery === 'register' ? 'register' : 'login')
  },
  { immediate: true }
)

const validate = () => {
  errors.fullName = mode.value === 'register' && !form.fullName.trim() ? 'Vui lòng nhập họ tên.' : ''
  errors.email = /.+@.+\..+/.test(form.email) ? '' : 'Email không hợp lệ.'
  errors.password = form.password.length >= 6 ? '' : 'Mật khẩu tối thiểu 6 ký tự.'

  return !errors.fullName && !errors.email && !errors.password
}

const handleSubmit = () => {
  resetFeedback()
  if (!validate()) return

  const result = mode.value === 'login'
    ? authStore.login({
      email: form.email,
      password: form.password,
      asAdmin: form.isAdmin
    })
    : authStore.register({
      fullName: form.fullName.trim(),
      email: form.email,
      password: form.password
    })

  feedback.success = result.success
  feedback.message = result.message

  if (!result.success) return

  const redirectPath = route.query.redirect || (result.user.role === 'admin' ? '/admin' : '/')
  router.push(redirectPath)
}
</script>