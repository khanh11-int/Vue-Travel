<template>
  <section class="admin-page">
    <div class="panel-card">
      <div class="section-heading compact admin-heading-stack">
        <div>
          <p class="eyebrow">Quản lý dịch vụ</p>
          <h2>Dịch vụ du lịch nội địa Việt Nam</h2>
        </div>
        <button class="primary-button" type="button" @click="startCreateService">+ Thêm dịch vụ</button>
      </div>

      <div class="admin-toolbar">
        <input v-model="filters.keyword" type="text" placeholder="Tìm theo tên dịch vụ hoặc điểm đến" />
        <select v-model="filters.categoryId">
          <option value="">Tất cả danh mục</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        <select v-model="filters.province">
          <option value="">Tất cả tỉnh/thành</option>
          <option v-for="province in provinceOptions" :key="province" :value="province">
            {{ province }}
          </option>
        </select>
      </div>

      <form class="admin-form-grid" @submit.prevent="handleSubmitService">
        <input v-model="serviceForm.name" type="text" placeholder="Tên dịch vụ" />
        <input v-model="serviceForm.slug" type="text" placeholder="Slug" />
        <select v-model="serviceForm.categoryId">
          <option value="">Chọn danh mục</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        <input v-model="serviceForm.destination" type="text" placeholder="Điểm đến" />
        <input v-model.number="serviceForm.price" type="number" min="0" placeholder="Giá gốc" />
        <input v-model.number="serviceForm.salePrice" type="number" min="0" placeholder="Giá khuyến mãi" />
        <input v-model.number="serviceForm.availableSlots" type="number" min="0" placeholder="Số chỗ còn lại" />
        <input v-model="serviceForm.province" type="text" placeholder="Tỉnh / thành" />
        <input v-model="serviceForm.image" type="text" placeholder="URL ảnh đại diện" class="admin-form-span-2" />
        <textarea v-model="serviceForm.shortDescription" rows="3" placeholder="Mô tả ngắn" class="admin-form-span-2" />

        <label v-if="serviceForm.categoryId === 'combo'" class="admin-form-span-2">
          <input v-model="serviceForm.isFixedSchedule" type="checkbox" />
          Combo theo lịch cố định
        </label>

        <div v-if="serviceForm.categoryId === 'tour'" class="admin-form-span-2">
          <label>Lịch khởi hành (JSON Array)</label>
          <textarea
            v-model="departuresInput"
            rows="6"
            placeholder='[{"departureId":"T001-2026-07-20","startDate":"2026-07-20","endDate":"2026-07-22","durationDays":3,"durationNights":2,"remainingSlots":10}]'
          />
        </div>

        <div v-if="serviceForm.categoryId === 'combo' && serviceForm.isFixedSchedule" class="admin-form-span-2">
          <label>Gói combo (JSON Array)</label>
          <textarea
            v-model="packagesInput"
            rows="6"
            placeholder='[{"packageId":"C001-A","name":"Đợt A","applyFrom":"2026-07-01","applyTo":"2026-07-31","startDate":"2026-07-10","endDate":"2026-07-12","durationDays":3,"durationNights":2,"remainingSlots":8,"packagePrice":2990000}]'
          />
        </div>

        <small v-if="formError" class="error-text admin-form-span-2">{{ formError }}</small>

        <div class="admin-form-actions admin-form-span-2">
          <button class="primary-button" type="submit">{{ isEditing ? 'Lưu thay đổi' : 'Tạo dịch vụ' }}</button>
          <button class="secondary-button" type="button" @click="resetServiceForm">Làm mới</button>
        </div>
      </form>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Dịch vụ</th>
              <th>Danh mục</th>
              <th>Địa điểm</th>
              <th>Giá bán</th>
              <th>Chỗ còn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in filteredServices" :key="service.id">
              <td>
                <strong>{{ service.name }}</strong>
                <p class="muted small-text">{{ service.shortDescription }}</p>
              </td>
              <td>{{ getCategoryLabel(service.categoryId) }}</td>
              <td>{{ service.destination }}, {{ service.province }}</td>
              <td>{{ formatCurrencyVND(service.salePrice) }}</td>
              <td>
                <span :class="['status-chip', service.availableSlots > 0 ? 'status-chip--blue' : 'status-chip--danger']">
                  {{ service.availableSlots > 0 ? `${service.availableSlots} chỗ` : 'Hết chỗ' }}
                </span>
              </td>
              <td>{{ service.status === 'active' ? 'Còn bán' : 'Ngưng bán' }}</td>
              <td>
                <div class="table-actions">
                  <button class="ghost-button" type="button" @click="startEditService(service)">Sửa</button>
                  <button class="secondary-button" type="button" @click="store.toggleServiceStatus(service.id)">
                    {{ service.status === 'active' ? 'Ẩn' : 'Hiện' }}
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
const categories = computed(() => store.state.categories)

const filters = reactive({
  keyword: '',
  categoryId: '',
  province: ''
})

const defaultForm = () => ({
  id: null,
  name: '',
  slug: '',
  categoryId: '',
  destination: '',
  province: '',
  price: 0,
  salePrice: 0,
  rating: 4.5,
  availableSlots: 10,
  status: 'active',
  image: '',
  gallery: [],
  shortDescription: '',
  description: '',
  amenities: [],
  createdAt: new Date().toISOString(),
  featured: false,
  itinerary: [],
  departures: [],
  packages: [],
  isFixedSchedule: false
})

const serviceForm = reactive(defaultForm())
const isEditing = ref(false)
const departuresInput = ref('[]')
const packagesInput = ref('[]')
const formError = ref('')

const provinceOptions = computed(() =>
  [...new Set(store.state.services.map((service) => service.province))].sort((left, right) => left.localeCompare(right, 'vi'))
)

const filteredServices = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  return store.state.services.filter((service) => {
    const matchesKeyword = !keyword || [service.name, service.destination, service.province]
      .join(' ')
      .toLowerCase()
      .includes(keyword)

    const matchesCategory = !filters.categoryId || service.categoryId === filters.categoryId
    const matchesProvince = !filters.province || service.province === filters.province
    return matchesKeyword && matchesCategory && matchesProvince
  })
})

const getCategoryLabel = (categoryId) =>
  store.state.categories.find((category) => category.id === categoryId)?.name || 'Dịch vụ'

const resetServiceForm = () => {
  Object.assign(serviceForm, defaultForm())
  departuresInput.value = '[]'
  packagesInput.value = '[]'
  formError.value = ''
  isEditing.value = false
}

const startCreateService = () => {
  resetServiceForm()
}

const startEditService = (service) => {
  Object.assign(serviceForm, {
    ...service,
    gallery: [...(service.gallery || [])],
    amenities: [...(service.amenities || [])],
    itinerary: [...(service.itinerary || [])],
    departures: [...(service.departures || [])],
    packages: [...(service.packages || [])],
    isFixedSchedule: Boolean(service.isFixedSchedule)
  })
  departuresInput.value = JSON.stringify(service.departures || [], null, 2)
  packagesInput.value = JSON.stringify(service.packages || [], null, 2)
  formError.value = ''
  isEditing.value = true
}

const parseArrayField = (rawValue, fieldName) => {
  if (!rawValue.trim()) return []

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) {
      throw new Error(`${fieldName} phải là mảng JSON`) 
    }
    return parsed
  } catch (error) {
    throw new Error(`${fieldName} không đúng định dạng JSON`) 
  }
}

const handleSubmitService = () => {
  formError.value = ''
  if (!serviceForm.name || !serviceForm.slug || !serviceForm.categoryId || !serviceForm.destination || !serviceForm.province) return

  let departures = [...(serviceForm.departures || [])]
  let packages = [...(serviceForm.packages || [])]

  try {
    if (serviceForm.categoryId === 'tour') {
      departures = parseArrayField(departuresInput.value, 'Lịch khởi hành')
    }

    if (serviceForm.categoryId === 'combo' && serviceForm.isFixedSchedule) {
      packages = parseArrayField(packagesInput.value, 'Gói combo')
    }
  } catch (error) {
    formError.value = error.message
    return
  }

  store.saveService({
    ...serviceForm,
    image: serviceForm.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    gallery: serviceForm.gallery.length ? serviceForm.gallery : [serviceForm.image],
    amenities: serviceForm.amenities.length ? serviceForm.amenities : ['Hỗ trợ khách Việt', 'Xác nhận nhanh'],
    itinerary: serviceForm.itinerary.length ? serviceForm.itinerary : ['Lịch trình đang cập nhật'],
    description: serviceForm.description || serviceForm.shortDescription,
    departures,
    packages,
    isFixedSchedule: serviceForm.categoryId === 'combo' ? Boolean(serviceForm.isFixedSchedule) : false
  })

  resetServiceForm()
}
</script>