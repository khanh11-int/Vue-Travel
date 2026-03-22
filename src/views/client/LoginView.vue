<template>
  <section class="page-section auth-layout">
    <div class="auth-hero">
      <p class="eyebrow">Chào mừng đến với Việt Voyage</p>
      <h1>Đăng nhập để lưu wishlist, đặt chỗ và quản lý lịch sử du lịch nội địa.</h1>
      <p>
        Demo sẵn 2 tài khoản mock: <strong>admin@vietvoyage.vn</strong> / <strong>123456</strong>
        và <strong>user@vietvoyage.vn</strong> / <strong>123456</strong>.
        Quyền truy cập được xác định theo role của tài khoản, không chọn bằng checkbox.
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

      <input
        v-if="mode === 'register'"
        v-model="form.phone"
        type="text"
        placeholder="Số điện thoại"
      />
      <small v-if="errors.phone" class="error-text">{{ errors.phone }}</small>

      <input
        v-if="mode === 'register'"
        v-model="form.address"
        type="text"
        placeholder="Địa chỉ"
      />
      <small v-if="errors.address" class="error-text">{{ errors.address }}</small>

      <input v-model="form.email" type="email" placeholder="Email" />
      <small v-if="errors.email" class="error-text">{{ errors.email }}</small>

      <input v-model="form.password" type="password" placeholder="Mật khẩu" />
      <small v-if="errors.password" class="error-text">{{ errors.password }}</small>

      <input
        v-if="mode === 'register'"
        v-model="form.confirmPassword"
        type="password"
        placeholder="Xác nhận mật khẩu"
      />
      <small v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</small>

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
  phone: '',
  address: '',
  email: 'user@vietvoyage.vn',
  password: '123456',
  confirmPassword: ''
})

const errors = reactive({
  fullName: '',
  phone: '',
  address: '',
  email: '',
  password: '',
  confirmPassword: ''
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
  errors.phone = ''
  errors.address = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  if (nextMode === 'login') {
    form.email = 'user@vietvoyage.vn'
    form.password = '123456'
  } else {
    form.fullName = ''
    form.phone = ''
    form.address = ''
    form.email = ''
    form.password = ''
    form.confirmPassword = ''
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
  const trimmedName = form.fullName.trim()
  const trimmedPhone = form.phone.trim()
  const trimmedAddress = form.address.trim()
  const normalizedEmail = form.email.trim().toLowerCase()
  const normalizedPhone = trimmedPhone.replace(/\D/g, '')
  const nameRegex = /^[A-Za-zÀ-ỹ\s]+$/
  const emailExists = mode.value === 'register'
    && authStore.state.users.some((entry) => entry.email.toLowerCase() === normalizedEmail)
  const phoneExists = mode.value === 'register'
    && authStore.state.users.some((entry) => (entry.phone || '').replace(/\D/g, '') === normalizedPhone)

  errors.fullName = mode.value === 'register' && (
    trimmedName.length < 2
    || trimmedName.length > 50
    || !nameRegex.test(trimmedName)
  )
    ? 'Họ tên 2-50 ký tự và chỉ gồm chữ cái, khoảng trắng.'
    : ''
  if (mode.value === 'register' && !/^0\d{9}$/.test(trimmedPhone)) {
    errors.phone = 'Số điện thoại phải bắt đầu bằng 0 và gồm 10 số.'
  } else if (phoneExists) {
    errors.phone = 'Số điện thoại đã tồn tại.'
  } else {
    errors.phone = ''
  }
  errors.address = mode.value === 'register' && (trimmedAddress.length < 10 || trimmedAddress.length > 200)
    ? 'Địa chỉ cần từ 10 đến 200 ký tự.'
    : ''
  if (!/.+@.+\..+/.test(normalizedEmail)) {
    errors.email = 'Email không hợp lệ.'
  } else if (mode.value === 'register' && !normalizedEmail.endsWith('@gmail.com')) {
    errors.email = 'Email đăng ký phải có đuôi @gmail.com.'
  } else if (emailExists) {
    errors.email = 'Email đã tồn tại.'
  } else {
    errors.email = ''
  }
  if (mode.value === 'register') {
    errors.password = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,32}$/.test(form.password)
      ? ''
      : 'Mật khẩu 8-32 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'
  } else {
    errors.password = form.password ? '' : 'Vui lòng nhập mật khẩu.'
  }
  errors.confirmPassword = mode.value === 'register' && form.confirmPassword !== form.password
    ? 'Mật khẩu xác nhận chưa khớp.'
    : ''

  return !errors.fullName && !errors.phone && !errors.address && !errors.email && !errors.password && !errors.confirmPassword
}

const handleSubmit = () => {
  resetFeedback()
  if (!validate()) return

  const result = mode.value === 'login'
    ? authStore.login({
      email: form.email,
      password: form.password
    })
    : authStore.register({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
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