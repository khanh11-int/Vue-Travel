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
            <div class="home-search-panel__guests">
              <label>Số khách</label>
              <input v-model.number="form.guests" type="number" min="1" max="20" />
            </div>
            <div class="home-search-panel__rooms">
              <label>Số phòng</label>
              <input v-model.number="form.rooms" type="number" min="1" max="10" />
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
import ServiceSearchNav from '@/components/travel/ServiceSearchNav.vue'

const todayISO = (() => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
})()

const form = ref({
  destination: '',
  checkInDate: '',
  checkOutDate: '',
  guests: 2,
  rooms: 1
})

const searchTarget = computed(() => {
  const query = new URLSearchParams()
  query.set('category', 'hotel')

  if (form.value.destination) query.set('destination', form.value.destination)
  if (form.value.checkInDate) query.set('checkInDate', form.value.checkInDate)
  if (form.value.checkOutDate) query.set('checkOutDate', form.value.checkOutDate)
  query.set('guests', String(Math.max(1, Number(form.value.guests) || 1)))
  query.set('rooms', String(Math.max(1, Number(form.value.rooms) || 1)))

  return `/dich-vu?${query.toString()}`
})
</script>
