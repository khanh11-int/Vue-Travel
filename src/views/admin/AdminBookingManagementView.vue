<template>
  <section class="admin-page">
    <div class="panel-card">
      <div class="section-heading compact admin-heading-stack">
        <div>
          <p class="eyebrow">Quản lý booking</p>
          <h2>Điều phối đơn đặt chỗ</h2>
        </div>
      </div>

      <div class="admin-category-tabs">
        <button
          type="button"
          :class="['admin-category-tab', { active: filters.categoryId === '' }]"
          @click="filters.categoryId = ''"
        >
          Tất cả
        </button>
        <button
          v-for="category in bookingCategoryTabs"
          :key="category.id"
          type="button"
          :class="['admin-category-tab', { active: filters.categoryId === category.id }]"
          @click="filters.categoryId = category.id"
        >
          {{ category.label }} <span class="nav-pill">{{ category.count }}</span>
        </button>
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
                <p class="muted small-text">{{ bookingCategoryLabel(booking) }} · {{ booking.items.length }} mục trong đơn</p>
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
                  :disabled="getValidStatusOptions(booking).length === 1"
                >
                  <option v-for="option in getValidStatusOptions(booking)" :key="option.value" :value="option.value">
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
import { useRoute } from 'vue-router'
import { useBookingStore } from '@/stores/booking/useBookingStore'
import { formatCurrencyVND, formatDateVN } from '@/utils/formatters'
import { BOOKING_STATUS_LABELS, getValidNextStatuses } from '@/utils/travelBooking'

const route = useRoute()
const store = useBookingStore()
const routeCategoryId = computed(() => String(route.meta?.categoryId || route.query.category || '').trim())
const filters = reactive({ keyword: '', status: '', categoryId: routeCategoryId.value || '' })

const getBookingCategoryId = (booking) => {
  const firstItem = Array.isArray(booking?.items) && booking.items.length > 0 ? booking.items[0] : {}
  return String(firstItem.bookingType || firstItem.service?.categoryId || 'hotel')
}

const bookingCategoryLabel = (booking) => ({
  hotel: 'Khách sạn',
  tour: 'Tour',
  ticket: 'Vé tham quan'
}[getBookingCategoryId(booking)] || 'Dịch vụ')

const bookingCategoryTabs = computed(() => {
  const categories = [
    { id: 'hotel', label: 'Khách sạn' },
    { id: 'tour', label: 'Tour' },
    { id: 'ticket', label: 'Vé tham quan' }
  ]

  const filteredCategories = routeCategoryId.value
    ? categories.filter((category) => category.id === routeCategoryId.value)
    : categories

  return filteredCategories.map((category) => ({
    ...category,
    count: store.adminBookingHistory.filter((booking) => getBookingCategoryId(booking) === category.id).length
  }))
})

const statusOptions = computed(() =>
  Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => ({ value, label }))
)

const getValidStatusOptions = (booking) => {
  if (!booking) return statusOptions.value
  
  // Xác định loại dịch vụ từ booking items
  const firstItem = Array.isArray(booking.items) && booking.items.length > 0 ? booking.items[0] : {}
  const bookingType = firstItem.bookingType || firstItem.service?.categoryId || 'hotel'
  
  // Lấy danh sách trạng thái hợp lệ tiếp theo
  const validStatuses = getValidNextStatuses(booking.status, bookingType)
  
  // Cộng thêm trạng thái hiện tại để luôn có một lựa chọn
  const allValidStatuses = [booking.status, ...validStatuses]
  
  return statusOptions.value.filter(option => allValidStatuses.includes(option.value))
}

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
    const matchesCategory = !filters.categoryId || getBookingCategoryId(booking) === filters.categoryId
    return matchesKeyword && matchesStatus && matchesCategory
  })
})

const getStatusClass = (status) => ({
  pending: 'status-chip--warning',
  confirmed: 'status-chip--blue',
  'checked-in': 'status-chip--blue',
  'checked-out': 'status-chip--purple',
  completed: 'status-chip--success',
  cancelled: 'status-chip--danger'
}[status] || 'status-chip--blue')
</script>