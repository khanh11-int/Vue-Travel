<template>
  <section class="admin-page">
    <div class="panel-card">
      <div class="section-heading compact admin-heading-stack">
        <div>
          <p class="eyebrow">Quản lý booking</p>
          <h2>Điều phối đơn đặt chỗ</h2>
        </div>
      </div>

      <div class="admin-toolbar">
        <input v-model="filters.keyword" type="text" placeholder="Tìm theo mã booking hoặc tên khách" />
        <select v-model="filters.status">
          <option value="">Tất cả trạng thái</option>
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã booking</th>
              <th>Khách hàng</th>
              <th>Dịch vụ</th>
              <th>Ngày tạo</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="booking in filteredBookings" :key="booking.id">
              <td><strong>{{ booking.code }}</strong></td>
              <td>
                <strong>{{ booking.customer.fullName }}</strong>
                <p class="muted small-text">{{ booking.customer.phone }} · {{ booking.customer.city }}</p>
              </td>
              <td>
                <strong>{{ booking.items[0]?.service?.name || 'Dịch vụ nội địa' }}</strong>
                <p class="muted small-text">{{ booking.items.length }} mục trong đơn</p>
              </td>
              <td>{{ formatDateVN(booking.createdAt) }}</td>
              <td>{{ formatCurrencyVND(booking.total) }}</td>
              <td>
                <span :class="['status-chip', getStatusClass(booking.status)]">{{ booking.statusLabel }}</span>
              </td>
              <td>
                <select
                  :value="booking.status"
                  @change="store.updateBookingStatus(booking.id, $event.target.value)"
                  :disabled="booking.status === 'completed'"
                >
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useBookingStore } from '@/stores/booking/useBookingStore'
import { formatCurrencyVND, formatDateVN } from '@/utils/formatters'
import { BOOKING_STATUS_LABELS } from '@/utils/travelBooking'

const store = useBookingStore()
const filters = reactive({ keyword: '', status: '' })

const statusOptions = computed(() =>
  Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => ({ value, label }))
)

onMounted(() => {
  store.fetchAllBookings()
})

const filteredBookings = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  return store.adminBookingHistory.filter((booking) => {
    const matchesKeyword = !keyword || [booking.code, booking.customer.fullName]
      .join(' ')
      .toLowerCase()
      .includes(keyword)

    const matchesStatus = !filters.status || booking.status === filters.status
    return matchesKeyword && matchesStatus
  })
})

const getStatusClass = (status) => ({
  pending: 'status-chip--warning',
  confirmed: 'status-chip--blue',
  processing: 'status-chip--blue',
  completed: 'status-chip--success',
  cancelled: 'status-chip--danger'
}[status] || 'status-chip--blue')
</script>