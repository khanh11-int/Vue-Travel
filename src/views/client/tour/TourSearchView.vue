<template>
  <section class="page-section service-search-page">
    <div class="service-search-page__main">
      <p class="eyebrow">Tour nội địa</p>
      <h1 class="home-hero__title">Chọn tour theo điểm đến và ngày khởi hành</h1>
      <p class="hero-copy">Lọc tour dễ hơn theo nhu cầu đoàn khách, sau đó chọn lịch khởi hành chi tiết trong trang dịch vụ.</p>

      <div class="search-panel service-search-panel home-search-tabs">
        <ServiceSearchNav active-id="tour" />

        <div class="service-search-panel__row">
          <div class="home-search-panel">
            <div class="home-search-panel__destination">
              <label>Điểm đến</label>
              <input v-model="form.destination" type="text" placeholder="Ví dụ: Hội An" />
            </div>
            <div class="home-search-panel__date">
              <label>Ngày khởi hành (nếu có)</label>
              <input v-model="form.departureDate" :min="todayISO" type="date" />
            </div>
            <div class="home-search-panel__travelers">
              <label>Số người</label>
              <input v-model.number="form.travelers" type="number" min="1" max="20" />
            </div>
          </div>

          <router-link :to="searchTarget" class="primary-button service-search-panel__submit">Tìm kiếm tour</router-link>
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
  departureDate: '',
  travelers: 2
})

const searchTarget = computed(() => {
  const query = new URLSearchParams()
  query.set('category', 'tour')

  if (form.value.destination) query.set('destination', form.value.destination)
  if (form.value.departureDate) query.set('departureDate', form.value.departureDate)
  query.set('travelers', String(Math.max(1, Number(form.value.travelers) || 1)))

  return `/dich-vu?${query.toString()}`
})
</script>
