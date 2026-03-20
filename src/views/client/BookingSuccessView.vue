<template>
  <section class="page-section success-state">
    <div class="success-card">
      <div class="success-icon">✓</div>
      <p class="eyebrow">Đặt chỗ thành công</p>
      <h1>Booking của bạn đã được tạo thành công.</h1>
      <p class="lead">
        Mã booking: <strong>{{ bookingCode }}</strong>. Bạn có thể theo dõi tiến trình xử lý tại trang lịch sử đặt chỗ.
      </p>

      <div class="success-actions">
        <router-link class="primary-button" to="/lich-su-dat-cho">Xem lịch sử booking</router-link>
        <router-link class="secondary-button" to="/">Quay về trang chủ</router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const bookingCode = computed(() => route.query.code || 'VV-UNKNOWN')
</script>