<template>
  <section class="admin-page">
    <div class="panel-card">
      <div class="section-heading compact admin-heading-stack">
        <div>
          <p class="eyebrow">Quản lý khuyến mãi</p>
          <h2>Mã giảm giá cho booking nội địa</h2>
        </div>
      </div>

      <form class="admin-form-grid" @submit.prevent="handleSubmitPromotion">
        <input v-model="promotionForm.code" type="text" placeholder="Mã khuyến mãi" />
        <select v-model="promotionForm.type">
          <option value="percent">Giảm theo %</option>
          <option value="amount">Giảm số tiền</option>
        </select>
        <input v-model.number="promotionForm.value" type="number" min="0" placeholder="Giá trị" />
        <select v-model="promotionForm.status">
          <option value="active">Đang áp dụng</option>
          <option value="inactive">Ngưng áp dụng</option>
        </select>
        <input v-model="promotionForm.startDate" type="date" />
        <input v-model="promotionForm.endDate" type="date" />
        <textarea v-model="promotionForm.description" rows="3" placeholder="Mô tả chương trình" class="admin-form-span-2" />
        <div class="admin-form-actions admin-form-span-2">
          <button class="primary-button" type="submit">{{ isEditing ? 'Lưu khuyến mãi' : 'Tạo khuyến mãi' }}</button>
          <button class="secondary-button" type="button" @click="resetPromotionForm">Làm mới</button>
        </div>
      </form>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Hiệu lực</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="promotion in promotions" :key="promotion.id">
              <td><strong>{{ promotion.code }}</strong><p class="muted small-text">{{ promotion.description }}</p></td>
              <td>{{ promotion.type === 'percent' ? 'Phần trăm' : 'Số tiền' }}</td>
              <td>{{ promotion.type === 'percent' ? `${promotion.value}%` : formatCurrencyVND(promotion.value) }}</td>
              <td>{{ promotion.startDate }} → {{ promotion.endDate }}</td>
              <td>{{ promotion.status === 'active' ? 'Đang áp dụng' : 'Ngưng áp dụng' }}</td>
              <td>
                <div class="table-actions">
                  <button class="ghost-button" type="button" @click="startEditPromotion(promotion)">Sửa</button>
                  <button class="secondary-button" type="button" @click="store.togglePromotionStatus(promotion.id)">
                    {{ promotion.status === 'active' ? 'Tắt' : 'Bật' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useTravelStore } from '@/stores/useTravelStore'
import { formatCurrencyVND } from '@/utils/formatters'

const store = useTravelStore()
const isEditing = ref(false)

const defaultForm = () => ({
  id: null,
  code: '',
  type: 'percent',
  value: 10,
  description: '',
  status: 'active',
  startDate: '',
  endDate: ''
})

const promotionForm = reactive(defaultForm())
const promotions = computed(() => store.state.promotions)

const resetPromotionForm = () => {
  Object.assign(promotionForm, defaultForm())
  isEditing.value = false
}

const startEditPromotion = (promotion) => {
  Object.assign(promotionForm, { ...promotion })
  isEditing.value = true
}

const handleSubmitPromotion = () => {
  if (!promotionForm.code || !promotionForm.startDate || !promotionForm.endDate) return
  store.savePromotion({ ...promotionForm })
  resetPromotionForm()
}
</script>