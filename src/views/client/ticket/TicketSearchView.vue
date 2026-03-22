<template>
  <section class="page-section service-search-page">
    <div class="service-search-page__main">
      <p class="eyebrow">Vé tham quan</p>
      <h1 class="home-hero__title">Tìm vé tham quan nhanh theo ngày sử dụng</h1>
      <p class="hero-copy">Tối ưu đặt vé nội địa theo điểm đến và số lượng vé, phù hợp lịch trình của bạn.</p>

      <div class="search-panel service-search-panel home-search-tabs">
        <ServiceSearchNav active-id="ticket" />

        <div class="service-search-panel__row">
          <div class="home-search-panel">
            <div class="home-search-panel__destination">
              <label>Điểm đến</label>
              <input v-model="form.destination" type="text" placeholder="Ví dụ: Phú Quốc" />
            </div>
            <div class="home-search-panel__date">
              <label>Ngày sử dụng</label>
              <input v-model="form.useDate" :min="todayISO" type="date" />
            </div>
            <div class="home-search-panel__tickets">
              <label>Số lượng vé</label>
              <input v-model.number="form.ticketQuantity" type="number" min="1" max="30" />
            </div>
          </div>

          <router-link :to="searchTarget" class="primary-button service-search-panel__submit">Tìm kiếm vé</router-link>
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
  useDate: '',
  ticketQuantity: 2
})

const searchTarget = computed(() => {
  const query = new URLSearchParams()
  query.set('category', 'ticket')

  if (form.value.destination) query.set('destination', form.value.destination)
  if (form.value.useDate) query.set('useDate', form.value.useDate)
  query.set('ticketQuantity', String(Math.max(1, Number(form.value.ticketQuantity) || 1)))

  return `/dich-vu?${query.toString()}`
})
</script>
