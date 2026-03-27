<template>
  <section class="page-section service-search-page service-search-page--compact">
    <div class="service-search-page__main">
      <div class="search-panel service-search-panel home-search-tabs">
        <ServiceSearchNav active-id="hotel" />

        <div class="service-search-panel__row">
          <div class="home-search-panel">
            <div class="home-search-panel__destination">
              <label>Điểm đến</label>
              <input v-model="form.destination" type="text" placeholder="Ví dụ: Đà Nẵng" />
            </div>
            <div class="home-search-panel__date">
              <label>Ngày nhận phòng</label>
              <input v-model="form.checkInDate" :min="todayISO" type="date" />
            </div>
            <div class="home-search-panel__return-date">
              <label>Ngày trả phòng</label>
              <input v-model="form.checkOutDate" :min="form.checkInDate || todayISO" type="date" />
            </div>
            <div class="home-search-panel__guest-room">
              <label>Khách và Phòng</label>
              <GuestRoomSelector v-model="guestRoomSelection" />
            </div>
          </div>

          <router-link :to="searchTarget" class="primary-button service-search-panel__submit">Tìm kiếm khách sạn</router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ServiceSearchNav from '@/components/travel/ServiceSearchNav.vue'
import GuestRoomSelector from '@/components/hotel-home/GuestRoomSelector.vue'
import { useHotelGuestRoomStore } from '@/stores/useHotelGuestRoomStore'

const todayISO = (() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})()

const route = useRoute()
const guestRoomStore = useHotelGuestRoomStore()
guestRoomStore.setFromQuery(route.query)

const form = ref({
  destination: String(route.query.destination || ''),
  checkInDate: String(route.query.checkInDate || ''),
  checkOutDate: String(route.query.checkOutDate || '')
})

const guestRoomSelection = computed({
  get: () => guestRoomStore.selection,
  set: (value) => {
    guestRoomStore.setSelection(value)
  }
})

const searchTarget = computed(() => {
  const query = new URLSearchParams()
  query.set('category', 'hotel')

  if (form.value.destination) query.set('destination', form.value.destination)
  if (form.value.checkInDate) query.set('checkInDate', form.value.checkInDate)
  if (form.value.checkOutDate) query.set('checkOutDate', form.value.checkOutDate)

  const guestRoomQuery = guestRoomStore.getQueryPayload()
  query.set('guests', guestRoomQuery.guests)
  query.set('adults', guestRoomQuery.adults)
  query.set('children', guestRoomQuery.children)
  query.set('rooms', guestRoomQuery.rooms)

  if (guestRoomQuery.childrenAges) {
    query.set('childrenAges', guestRoomQuery.childrenAges)
  }

  return `/dich-vu?${query.toString()}`
})
</script>
