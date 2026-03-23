<template>
  <section class="admin-dashboard">
    <div class="stats-grid">
      <article class="stat-card">
        <p>Tổng dịch vụ</p>
        <h3>{{ adminSummary.totalServices }}</h3>
      </article>
      <article class="stat-card">
        <p>Tổng booking</p>
        <h3>{{ adminSummary.totalBookings }}</h3>
      </article>
      <article class="stat-card">
        <p>Doanh thu tháng</p>
        <h3>{{ formatCurrencyVND(adminSummary.monthlyRevenue) }}</h3>
      </article>
      <article class="stat-card">
        <p>Booking chờ xử lý</p>
        <h3>{{ adminSummary.pendingBookings }}</h3>
      </article>
    </div>

    <div class="admin-grid">
      <article class="panel-card">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Biểu đồ mock</p>
            <h2>Doanh thu 7 ngày gần nhất</h2>
          </div>
        </div>
        <div class="chart-bars">
          <div v-for="(value, index) in adminSummary.revenueSeries" :key="index" class="chart-item">
            <div class="chart-bar" :style="{ height: `${value}px` }"></div>
            <span>T{{ index + 1 }}</span>
          </div>
        </div>
      </article>

      <article class="panel-card">
        <p class="eyebrow">Cảnh báo vận hành</p>
        <h2>Dịch vụ sắp hết chỗ</h2>
        <ul class="warning-list">
          <li v-for="service in adminSummary.lowStockServices" :key="service.id">
            <strong>{{ service.name }}</strong>
            <span>{{ service.availableSlots }} chỗ còn lại</span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useTravelStore } from '@/stores/useTravelStore'
import { formatCurrencyVND } from '@/utils/formatters'

const store = useTravelStore()
const adminSummary = computed(() => store.adminSummary)
</script>