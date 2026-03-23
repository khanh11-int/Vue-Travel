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
import { useBookingStore } from '@/stores/useBookingStore'
import { useTravelContextStore } from '@/stores/useTravelContextStore'
import { formatCurrencyVND } from '@/utils/formatters'

const contextStore = useTravelContextStore()
const bookingStore = useBookingStore()

const adminSummary = computed(() => {
  const services = contextStore.state.services
  const bookings = bookingStore.adminBookingHistory
  const now = new Date()

  const monthlyRevenue = bookings
    .filter((booking) => {
      const bookingDate = new Date(booking.createdAt)
      return bookingDate.getFullYear() === now.getFullYear()
        && bookingDate.getMonth() === now.getMonth()
    })
    .reduce((sum, booking) => sum + Number(booking.total || 0), 0)

  const revenueSeries = Array.from({ length: 7 }, (_, index) => {
    const target = new Date(now)
    target.setDate(now.getDate() - (6 - index))
    return bookings
      .filter((booking) => {
        const bookingDate = new Date(booking.createdAt)
        return bookingDate.toDateString() === target.toDateString()
      })
      .reduce((sum, booking) => sum + Math.round(Number(booking.total || 0) / 100000), 0)
  })

  return {
    totalServices: services.length,
    totalBookings: bookings.length,
    monthlyRevenue,
    pendingBookings: bookings.filter((booking) => booking.status === 'pending').length,
    lowStockServices: services.filter((service) => Number(service.availableSlots || 0) <= 5),
    revenueSeries
  }
})
</script>