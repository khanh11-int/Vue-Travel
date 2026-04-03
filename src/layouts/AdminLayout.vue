<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div>
        <p class="eyebrow">Admin Mock</p>
        <h2>Vtravel CMS</h2>
      </div>
      <nav>
        <router-link to="/admin">Dashboard</router-link>
        <router-link to="/admin/services">Dịch vụ</router-link>
        <router-link to="/admin/bookings">Đơn đặt chỗ</router-link>
        <router-link to="/admin/categories">Danh mục</router-link>
        <router-link to="/admin/customers">Khách hàng</router-link>
        <router-link to="/admin/comments">Bình luận</router-link>
        <router-link to="/admin/promotions">Khuyến mãi</router-link>
      </nav>
    </aside>

    <section class="admin-content">
      <header class="admin-topbar">
        <div>
          <p class="eyebrow">Bảng điều khiển</p>
          <h1>Quản trị vận hành du lịch nội địa</h1>
        </div>
        <div class="table-actions">
          <router-link class="ghost-button" to="/">Xem trang khách</router-link>
          <button class="ghost-button" type="button">{{ currentUserLabel }}</button>
        </div>
      </header>
      <router-view />
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()

const currentUserLabel = computed(() => authStore.currentUser?.fullName || 'Admin Vtravel')
</script>