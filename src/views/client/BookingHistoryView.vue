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
          <span>{{ booking.items[0]?.service?.name }}</span>
          <span>{{ formatDateVN(booking.createdAt) }}</span>
          <span class="status-chip">{{ booking.statusLabel }}</span>
          <strong>{{ formatCurrencyVND(booking.total) }}</strong>
          <router-link class="ghost-button" :to="{ name: 'booking-detail', params: { id: booking.id } }">
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
import { formatCurrencyVND, formatDateVN } from '@/utils/formatters'

const store = useBookingStore()
const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isLoggedIn)
const bookings = computed(() => store.bookingHistory)
const hasSearched = ref(false)
const lookupError = ref('')
const guestLookupResults = ref([])
const lookupForm = reactive({
  code: '',
  phone: ''
})

const normalizeCode = (value) => String(value || '').trim().toUpperCase()
const normalizePhone = (value) => String(value || '').replace(/\D/g, '')

const bookingsToRender = computed(() => {
  return isLoggedIn.value ? bookings.value : guestLookupResults.value
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
  }
})

watch(
  () => authStore.currentUser?.id || null,
  () => {
    store.syncUserScope()
    hasSearched.value = false
    guestLookupResults.value = []

    if (isLoggedIn.value) {
      store.fetchMyBookings()
    }
  }
)

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
  hasSearched.value = true
}


</script>