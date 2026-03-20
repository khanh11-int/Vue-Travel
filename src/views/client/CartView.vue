<template>
  <section class="page-section cart-layout">
    <div>
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Giỏ đặt chỗ</p>
          <h1>{{ cartItems.length }} dịch vụ đang chờ xác nhận</h1>
        </div>
        <router-link class="secondary-button" to="/dich-vu">Tiếp tục khám phá</router-link>
      </div>

      <div v-if="cartItems.length" class="cart-list">
        <article v-for="item in cartItems" :key="`${item.serviceId}-${item.travelDate}`" class="cart-item-card">
          <img :src="item.service?.image" :alt="item.service?.name" class="cart-item-image" />

          <div class="cart-item-main">
            <div class="cart-item-head">
              <div>
                <p class="eyebrow eyebrow--blue">{{ getCategoryLabel(item.service?.categoryId) }}</p>
                <h3>{{ item.service?.name }}</h3>
                <p class="muted">
                  {{ item.service?.destination }}, {{ item.service?.province }} · {{ formatDateVN(item.travelDate) }}
                </p>
              </div>
              <button class="icon-button" type="button" @click="store.removeCartItem(item.serviceId, item.travelDate)">
                ✕
              </button>
            </div>

            <div class="cart-item-footer">
              <div class="quantity-box compact">
                <button type="button" @click="store.updateCartQuantity(item.serviceId, item.travelDate, item.quantity - 1)">-</button>
                <span>{{ item.quantity }}</span>
                <button type="button" @click="store.updateCartQuantity(item.serviceId, item.travelDate, item.quantity + 1)">+</button>
              </div>

              <div class="price-stack">
                <small>Thành tiền</small>
                <strong>{{ formatCurrencyVND(item.lineTotal) }}</strong>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <h2>Giỏ đặt chỗ của bạn đang trống</h2>
        <p>Hãy chọn một khách sạn, tour hoặc vé tham quan nội địa Việt Nam để tiếp tục.</p>
      </div>
    </div>

    <aside class="summary-card sticky-card">
      <p class="eyebrow">Tóm tắt booking</p>
      <div class="summary-row">
        <span>Tạm tính</span>
        <strong>{{ formatCurrencyVND(subtotal) }}</strong>
      </div>
      <div class="summary-row">
        <span>Phí dịch vụ</span>
        <strong>{{ formatCurrencyVND(serviceFee) }}</strong>
      </div>
      <div class="summary-row summary-row--total">
        <span>Tổng cộng</span>
        <strong>{{ formatCurrencyVND(total) }}</strong>
      </div>

      <router-link v-if="cartItems.length" class="primary-button full-width" to="/thanh-toan">
        Tiếp tục thanh toán
      </router-link>
      <router-link v-else class="secondary-button full-width" to="/dich-vu">
        Quay lại danh sách
      </router-link>
    </aside>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { categories } from '@/data/mockData'
import { useTravelStore } from '@/stores/useTravelStore'
import { formatCurrencyVND, formatDateVN } from '@/utils/formatters'

const store = useTravelStore()

const cartItems = computed(() => store.cartItems.value)
const subtotal = computed(() => store.cartTotal.value)
const serviceFee = computed(() => (subtotal.value > 0 ? 50000 : 0))
const total = computed(() => subtotal.value + serviceFee.value)

const getCategoryLabel = (categoryId) =>
  categories.find((category) => category.id === categoryId)?.name || 'Dịch vụ'
</script>