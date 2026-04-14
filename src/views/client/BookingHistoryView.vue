<template>
  <section class="page-section">
    <div class="section-heading compact">
      <div>
        <p class="eyebrow">Lịch sử đặt chỗ</p>
        <h1>{{ isLoggedIn ? 'Theo dõi tất cả booking của bạn' : 'Tra cứu booking nhanh' }}</h1>
      </div>
    </div>

    <div v-if="!isLoggedIn" class="panel-card" style="margin-bottom: 18px;">
      <div class="form-grid" style="margin-bottom: 10px;">
        <div class="field-group">
          <label>Mã đặt chỗ</label>
          <input
            v-model="lookupForm.code"
            type="text"
            placeholder="Ví dụ: VV318939"
            @keyup.enter="handleLookupBookings"
          />
        </div>
        <div class="field-group">
          <label>Số điện thoại</label>
          <input
            v-model="lookupForm.phone"
            type="text"
            placeholder="Ví dụ: 0987654321"
            @keyup.enter="handleLookupBookings"
          />
        </div>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
        <button class="primary-button" type="button" @click="handleLookupBookings">Tra cứu đặt chỗ</button>
        <p class="muted" style="margin: 0;">
          Nhập mã đặt chỗ hoặc số điện thoại để xem trạng thái booking.
        </p>
      </div>
      <small v-if="lookupError" class="error-text" style="margin-top: 8px; display: inline-block;">{{ lookupError }}</small>
    </div>

    <div class="history-tabs" role="tablist" aria-label="Lọc lịch sử theo loại dịch vụ">
      <button
        v-for="tab in historyTabs"
        :key="tab.value"
        class="history-tab"
        :class="{ active: activeTab === tab.value }"
        type="button"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="bookingsToRender.length" class="history-table">
      <div class="history-row history-row--head history-row--booking">
        <span>Mã booking</span>
        <span>Dịch vụ</span>
        <span>Ngày tạo</span>
        <span>Trạng thái</span>
        <span>Tổng tiền</span>
        <span>Chi tiết</span>
      </div>
      <template v-for="booking in bookingsToRender" :key="booking.id">
        <div class="history-row history-row--booking history-row--booking-detail">
          <strong>{{ booking.code }}</strong>
          <span>{{ booking.serviceName }}</span>
          <span>{{ formatDateVN(booking.createdAt) }}</span>
          <span class="status-chip">{{ booking.statusLabel }}</span>
          <strong>{{ formatCurrencyVND(booking.total) }}</strong>
          <router-link class="ghost-button" :to="booking.detailRoute">
            Xem chi tiết
          </router-link>
        </div>
      </template>
    </div>
    <div v-else class="empty-state">
      <h2>{{ isLoggedIn ? 'Chưa có booking nào' : 'Chưa có kết quả tra cứu' }}</h2>
      <p>{{ emptyStateMessage }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useBookingStore } from '@/stores/booking/useBookingStore'
import { flightBookingsApi } from '@/services/api'
import { formatCurrencyVND, formatDateVN } from '@/utils/formatters'

const store = useBookingStore()
const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isLoggedIn)
const bookings = computed(() => store.bookingHistory)
const hasSearched = ref(false)
const lookupError = ref('')
const guestLookupResults = ref([])
const myFlightBookings = ref([])
const guestFlightLookupResults = ref([])
const activeTab = ref('all')
const lookupForm = reactive({
  code: '',
  phone: ''
})

const historyTabs = Object.freeze([
  { value: 'all', label: 'Tất cả' },
  { value: 'hotel', label: 'Khách sạn' },
  { value: 'tour', label: 'Tour' },
  { value: 'ticket', label: 'Vé tham quan' },
  { value: 'flight', label: 'Chuyến bay' }
])

const normalizeCode = (value) => String(value || '').trim().toUpperCase()
const normalizePhone = (value) => String(value || '').replace(/\D/g, '')
const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

const resolveTravelBookingType = (booking) => {
  const firstItem = Array.isArray(booking?.items) && booking.items.length ? booking.items[0] : null
  const rawType = firstItem?.bookingType || firstItem?.service?.categoryId || ''
  const normalizedType = String(rawType || '').trim().toLowerCase()
  return ['hotel', 'tour', 'ticket'].includes(normalizedType) ? normalizedType : 'hotel'
}

const resolveTravelServiceName = (booking) => {
  const firstItem = Array.isArray(booking?.items) && booking.items.length ? booking.items[0] : null
  return String(firstItem?.service?.name || firstItem?.bookingSummary || 'Dịch vụ du lịch')
}

const resolveFlightStatusLabel = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'confirmed') return 'Đã xác nhận'
  if (normalized === 'cancelled') return 'Đã hủy'
  if (normalized === 'pending') return 'Chờ xác nhận'
  return String(status || 'Đã tạo')
}

const normalizeTravelBookings = (list = []) => {
  return (Array.isArray(list) ? list : []).map((booking) => {
    const bookingType = resolveTravelBookingType(booking)
    return {
      id: `travel-${booking.id}`,
      code: booking.code,
      serviceName: resolveTravelServiceName(booking),
      createdAt: booking.createdAt,
      statusLabel: booking.statusLabel || 'Chờ xác nhận',
      total: Math.max(0, Number(booking.total || 0) || 0),
      category: bookingType,
      detailRoute: { name: 'booking-detail', params: { id: booking.id } }
    }
  })
}

const normalizeFlightBookings = (list = []) => {
  return (Array.isArray(list) ? list : []).map((booking) => {
    const routeLabel = `${booking.fromAirport || ''} - ${booking.toAirport || ''}`.trim()
    const routeSuffix = routeLabel === '-' ? '' : ` (${routeLabel})`

    return {
      id: `flight-${booking.id || booking.bookingCode}`,
      code: booking.bookingCode,
      serviceName: `${booking.flightNumber || 'Chuyến bay'}${routeSuffix}`,
      createdAt: booking.createdAt,
      statusLabel: resolveFlightStatusLabel(booking.status),
      total: Math.max(0, Number(booking.totalPrice || booking.priceSummary?.totalPrice || 0) || 0),
      category: 'flight',
      detailRoute: { name: 'flight-invoice', query: { bookingCode: booking.bookingCode } }
    }
  })
}

const allHistoryRows = computed(() => {
  const travelRows = normalizeTravelBookings(isLoggedIn.value ? bookings.value : guestLookupResults.value)
  const flightRows = normalizeFlightBookings(isLoggedIn.value ? myFlightBookings.value : guestFlightLookupResults.value)

  return [...travelRows, ...flightRows].sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime()
    const rightTime = new Date(right.createdAt || 0).getTime()
    return rightTime - leftTime
  })
})

const bookingsToRender = computed(() => {
  if (activeTab.value === 'all') return allHistoryRows.value
  return allHistoryRows.value.filter((booking) => booking.category === activeTab.value)
})

const emptyStateMessage = computed(() => {
  if (isLoggedIn.value) {
    return 'Sau khi hoàn tất checkout, booking của bạn sẽ hiển thị tại đây.'
  }

  if (!hasSearched.value) {
    return 'Nhập số điện thoại hoặc mã đặt chỗ để tra cứu tình trạng booking.'
  }

  return 'Không tìm thấy booking phù hợp. Vui lòng kiểm tra lại mã đặt chỗ hoặc số điện thoại.'
})

onMounted(() => {
  store.syncUserScope()
  if (isLoggedIn.value) {
    store.fetchMyBookings()
    loadMyFlightBookings()
  }
})

watch(
  () => authStore.currentUser?.id || null,
  () => {
    store.syncUserScope()
    hasSearched.value = false
    guestLookupResults.value = []
    guestFlightLookupResults.value = []
    activeTab.value = 'all'

    if (isLoggedIn.value) {
      store.fetchMyBookings()
      loadMyFlightBookings()
    } else {
      myFlightBookings.value = []
    }
  }
)

const loadMyFlightBookings = async () => {
  const currentUser = authStore.currentUser || {}
  const userId = currentUser?.id == null ? '' : String(currentUser.id)
  const userPhone = normalizePhone(currentUser.phone)
  const userEmail = normalizeEmail(currentUser.email)

  if (!userId && !userPhone && !userEmail) {
    myFlightBookings.value = []
    return
  }

  try {
    const records = await flightBookingsApi.getAll()
    const normalized = Array.isArray(records) ? records : []

    myFlightBookings.value = normalized.filter((booking) => {
      const bookingUserId = booking?.userId == null ? '' : String(booking.userId)
      const bookingCustomerUserId = booking?.customerUserId == null ? '' : String(booking.customerUserId)
      const bookingPhone = normalizePhone(booking?.contact?.phone)
      const bookingEmail = normalizeEmail(booking?.contact?.email)
      const matchedByUserId = Boolean(userId) && (bookingUserId === userId || bookingCustomerUserId === userId)

      const matchedByPhone = Boolean(userPhone) && bookingPhone === userPhone
      const matchedByEmail = Boolean(userEmail) && bookingEmail === userEmail

      return matchedByUserId || matchedByPhone || matchedByEmail
    })
  } catch {
    myFlightBookings.value = []
  }
}

const lookupGuestFlightBookings = async ({ code = '', phone = '' } = {}) => {
  try {
    const records = await flightBookingsApi.getAll()
    const normalized = Array.isArray(records) ? records : []
    const normalizedCode = normalizeCode(code)
    const normalizedPhone = normalizePhone(phone)

    guestFlightLookupResults.value = normalized.filter((booking) => {
      const bookingCode = normalizeCode(booking?.bookingCode)
      const bookingPhone = normalizePhone(booking?.contact?.phone)

      if (normalizedCode && normalizedPhone) {
        return bookingCode === normalizedCode && bookingPhone === normalizedPhone
      }

      if (normalizedCode) return bookingCode === normalizedCode
      if (normalizedPhone) return bookingPhone === normalizedPhone
      return false
    })
  } catch {
    guestFlightLookupResults.value = []
  }
}

const handleLookupBookings = async () => {
  const normalizedCode = normalizeCode(lookupForm.code)
  const normalizedPhone = normalizePhone(lookupForm.phone)

  hasSearched.value = false
  lookupError.value = ''

  if (!normalizedCode && !normalizedPhone) {
    lookupError.value = 'Vui lòng nhập số điện thoại hoặc mã đặt chỗ để tra cứu.'
    return
  }

  guestLookupResults.value = await store.lookupGuestBookings({
    code: normalizedCode,
    phone: normalizedPhone
  })
  await lookupGuestFlightBookings({
    code: normalizedCode,
    phone: normalizedPhone
  })
  hasSearched.value = true
}


</script>

<style scoped>
.history-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.history-tab {
  border: 1px solid #d6e2f4;
  background: #f5f9ff;
  color: #2c4468;
  border-radius: 999px;
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
}

.history-tab.active {
  background: #0a6dd9;
  border-color: #0a6dd9;
  color: #fff;
}
</style>