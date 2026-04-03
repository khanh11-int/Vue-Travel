<template>
  <section class="admin-dashboard">
    <article v-if="adminStore.dashboardLoading" class="panel-card">
      <p class="eyebrow">Đang tải</p>
      <h2>Đang đồng bộ dữ liệu dashboard từ db.json...</h2>
    </article>

    <article v-else-if="adminStore.dashboardError" class="panel-card">
      <p class="eyebrow">Lỗi tải dữ liệu</p>
      <h2>{{ adminStore.dashboardError }}</h2>
      <button class="ghost-button" type="button" @click="loadDashboard">Tải lại</button>
    </article>

    <article v-else-if="!hasData" class="panel-card">
      <p class="eyebrow">Chưa có dữ liệu</p>
      <h2>Dashboard chưa có bản ghi dịch vụ hoặc booking để hiển thị.</h2>
    </article>

    <template v-else>
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
            <p class="eyebrow">Biểu đồ doanh thu thật</p>
            <h2>Doanh thu 7 ngày gần nhất (VND)</h2>
          </div>
        </div>
        <div class="chart-bars">
          <div v-for="item in revenueBars" :key="item.label" class="chart-item">
            <div class="chart-bar" :style="{ height: `${item.height}px` }"></div>
            <span>{{ item.label }}</span>
            <small class="muted small-text">{{ formatCurrencyVND(item.value) }}</small>
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
          <li v-if="!adminSummary.lowStockServices.length">
            <strong>Không có cảnh báo</strong>
            <span>Tất cả dịch vụ còn đủ chỗ.</span>
          </li>
        </ul>
      </article>

      <article class="panel-card">
        <p class="eyebrow">Phân bổ dịch vụ</p>
        <h2>Số lượng theo danh mục</h2>
        <ul class="warning-list">
          <li v-for="item in adminSummary.categoryDistribution" :key="item.categoryId">
            <strong>{{ item.label }}</strong>
            <span>{{ item.value }} dịch vụ</span>
          </li>
        </ul>
      </article>

      <article class="panel-card">
        <p class="eyebrow">Trạng thái booking</p>
        <h2>Tỷ trọng trạng thái đơn</h2>
        <ul class="warning-list">
          <li v-for="item in adminSummary.bookingStatusDistribution" :key="item.label">
            <strong>{{ getStatusLabel(item.label) }}</strong>
            <span>{{ item.value }} đơn</span>
          </li>
        </ul>
      </article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { formatCurrencyVND } from '@/utils/formatters'

const adminStore = useAdminStore()

const loadDashboard = async () => {
  await adminStore.fetchDashboardSnapshot()
}

onMounted(async () => {
  await loadDashboard()
})

const hasData = computed(() => adminSummary.value.totalServices > 0 || adminSummary.value.totalBookings > 0)

const adminSummary = computed(() => {
  return adminStore.dashboard
})

const revenueBars = computed(() => {
  const series = Array.isArray(adminSummary.value.revenueSeries) ? adminSummary.value.revenueSeries : []
  const maxValue = series.reduce((maximum, item) => Math.max(maximum, Number(item.value || 0)), 0)
  const baseHeight = 32
  const maxHeight = 220

  return series.map((item) => {
    const value = Number(item.value || 0)
    const ratio = maxValue > 0 ? value / maxValue : 0
    return {
      ...item,
      value,
      height: Math.round(baseHeight + ratio * (maxHeight - baseHeight))
    }
  })
})

const getStatusLabel = (status) => ({
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy'
}[status] || status)
</script>