<template>
  <section class="admin-page">
    <div class="panel-card">
      <div class="section-heading compact admin-heading-stack">
        <div>
          <p class="eyebrow">Quản lý đặt vé bay đi</p>
          <h2>Đơn đặt chỗ chuyến bay</h2>
          <p class="muted small-text">Theo dõi booking, đổi trạng thái và kiểm tra phương thức thanh toán.</p>
        </div>
      </div>

      <div class="admin-toolbar">
        <input v-model="filters.keyword" type="text" placeholder="Tìm theo mã booking, khách hàng hoặc chuyến bay" />
        <select v-model="filters.status">
          <option value="">Tất cả trạng thái</option>
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <select v-model="filters.paymentMethod">
          <option value="">Tất cả phương thức</option>
          <option value="cash">Tiền mặt</option>
          <option value="vietqr">VietQR</option>
        </select>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã booking</th>
              <th>Khách hàng</th>
              <th>Chuyến bay</th>
              <th>Ngày tạo</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="booking in filteredBookings" :key="booking.id">
              <td><strong>{{ booking.bookingCode }}</strong></td>
              <td>
                <strong>{{ booking.contact?.fullName || 'Khách hàng' }}</strong>
                <p class="muted small-text">{{ booking.contact?.phone }} · {{ booking.contact?.email }}</p>
              </td>
              <td>
                <strong>{{ booking.airlineName }} {{ booking.flightNumber }}</strong>
                <p class="muted small-text">{{ booking.fromAirport }} → {{ booking.toAirport }} · {{ booking.flightDate }}</p>
              </td>
              <td>{{ formatDateVN(booking.createdAt) }}</td>
              <td>{{ formatCurrencyVND(booking.priceSummary?.totalPrice || booking.totalPrice || 0) }}</td>
              <td>{{ paymentMethodLabel(booking.paymentMethod) }}</td>
              <td>
                <span :class="['status-chip', getStatusClass(booking.status)]">{{ statusLabel(booking.status) }}</span>
              </td>
              <td>
                <select :value="booking.status" @change="handleStatusChange(booking, $event.target.value)">
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
import { flightBookingsApi } from '@/services/api'
import { formatCurrencyVND, formatDateVN } from '@/utils/formatters'
import { BOOKING_STATUS_LABELS } from '@/utils/travelBooking'

const filters = reactive({ keyword: '', status: '', paymentMethod: '' })
const flightBookings = reactive([])

const statusOptions = computed(() => Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => ({ value, label })))

const loadFlightBookings = async () => {
  const result = await flightBookingsApi.getAll()
  flightBookings.splice(0, flightBookings.length, ...(Array.isArray(result) ? result : []))
}

const paymentMethodLabel = (method) => (String(method || '') === 'vietqr' ? 'VietQR' : 'Tiền mặt')
const statusLabel = (status) => BOOKING_STATUS_LABELS[status] || status || 'pending'
const getStatusClass = (status) => ({
  pending: 'status-chip--warning',
  confirmed: 'status-chip--blue',
  cancelled: 'status-chip--danger',
  completed: 'status-chip--success'
}[status] || 'status-chip--blue')

const filteredBookings = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  return flightBookings.filter((booking) => {
    const matchesKeyword = !keyword || [booking.bookingCode, booking.contact?.fullName, booking.flightNumber, booking.airlineName]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
    const matchesStatus = !filters.status || booking.status === filters.status
    const matchesPayment = !filters.paymentMethod || String(booking.paymentMethod || '') === filters.paymentMethod
    return matchesKeyword && matchesStatus && matchesPayment
  })
})

const handleStatusChange = async (booking, status) => {
  try {
    const updated = await flightBookingsApi.update(booking.id, { ...booking, status })
    const index = flightBookings.findIndex((item) => String(item.id) === String(booking.id))
    if (index > -1) {
      flightBookings[index] = updated
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadFlightBookings()
})
</script>

<style scoped>
.admin-table-wrapper {
  margin-top: 12px;
}
</style>
