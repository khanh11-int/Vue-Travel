<template>
  <section class="admin-page">
    <div class="panel-card">
      <div class="section-heading compact admin-heading-stack">
        <div>
          <p class="eyebrow">Quản lý danh mục</p>
          <h2>Danh mục dịch vụ du lịch</h2>
        </div>
      </div>

      <form class="admin-form-grid" @submit.prevent="handleSubmitCategory">
        <input v-model="categoryForm.id" type="text" placeholder="Mã danh mục (vd: cruise)" :disabled="isEditing" />
        <input v-model="categoryForm.name" type="text" placeholder="Tên danh mục" />
        <select v-model="categoryForm.status">
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Ngưng hoạt động</option>
        </select>
        <input v-model="categoryForm.homePath" type="text" placeholder="Đường dẫn home (vd: /tour)" />
        <input v-model="categoryForm.searchPath" type="text" placeholder="Đường dẫn search (vd: /tour)" />
        <textarea v-model="categoryForm.description" rows="3" class="admin-form-span-2" placeholder="Mô tả danh mục" />

        <small v-if="formError" class="error-text admin-form-span-2">{{ formError }}</small>

        <div class="admin-form-actions admin-form-span-2">
          <button class="primary-button" type="submit" :disabled="submitting">
            {{ isEditing ? 'Lưu danh mục' : 'Tạo danh mục' }}
          </button>
          <button class="secondary-button" type="button" @click="resetCategoryForm">Làm mới</button>
        </div>
      </form>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên</th>
              <th>Đường dẫn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in categories" :key="category.id">
              <td><strong>{{ category.id }}</strong></td>
              <td>
                <strong>{{ category.name }}</strong>
                <p class="muted small-text">{{ category.description }}</p>
              </td>
              <td>
                <p class="small-text">Home: {{ category.homePath || '-' }}</p>
                <p class="small-text">Search: {{ category.searchPath || '-' }}</p>
              </td>
              <td>
                <span :class="['status-chip', category.status === 'active' ? 'status-chip--success' : 'status-chip--danger']">
                  {{ category.status === 'active' ? 'Hoạt động' : 'Ngưng' }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="ghost-button" type="button" @click="startEditCategory(category)">Sửa</button>
                  <button class="secondary-button" type="button" @click="handleDeleteCategory(category.id)">Xóa</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="deleteTargetCategoryId" class="admin-confirm-overlay" @click.self="closeDeleteCategoryModal">
        <div class="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-category-title">
          <p class="eyebrow">Xác nhận thao tác</p>
          <h3 id="delete-category-title">Bạn có chắc muốn xóa danh mục này?</h3>
          <p class="muted">Danh mục đã xóa sẽ không còn hiển thị trong bộ lọc và biểu mẫu dịch vụ.</p>
          <div class="admin-confirm-actions">
            <button class="secondary-button" type="button" @click="closeDeleteCategoryModal">Hủy</button>
            <button class="primary-button" type="button" @click="confirmDeleteCategory">Đồng ý xóa</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAdminStore } from '@/stores/admin/useAdminStore'
import { useServiceStore } from '@/stores/service/useServiceStore'

const adminStore = useAdminStore()
const serviceStore = useServiceStore()
const submitting = ref(false)
const formError = ref('')
const isEditing = ref(false)
const deleteTargetCategoryId = ref('')

const defaultForm = () => ({
  id: '',
  name: '',
  description: '',
  status: 'active',
  homePath: '',
  searchPath: ''
})

const categoryForm = reactive(defaultForm())
const categories = computed(() => serviceStore.categories)

onMounted(async () => {
  await serviceStore.fetchCategories()
})

const resetCategoryForm = () => {
  Object.assign(categoryForm, defaultForm())
  isEditing.value = false
  formError.value = ''
}

const startEditCategory = (category) => {
  Object.assign(categoryForm, {
    id: String(category.id || ''),
    name: category.name || '',
    description: category.description || '',
    status: category.status || 'active',
    homePath: category.homePath || '',
    searchPath: category.searchPath || ''
  })
  isEditing.value = true
  formError.value = ''
}

const normalizeCategoryId = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

const handleSubmitCategory = async () => {
  formError.value = ''

  if (!categoryForm.name.trim()) {
    formError.value = 'Tên danh mục là bắt buộc.'
    return
  }

  const normalizedId = isEditing.value ? categoryForm.id : normalizeCategoryId(categoryForm.id || categoryForm.name)
  if (!normalizedId) {
    formError.value = 'Mã danh mục không hợp lệ.'
    return
  }

  submitting.value = true
  try {
    await adminStore.saveCategory({
      ...categoryForm,
      id: normalizedId,
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim()
    })
    resetCategoryForm()
  } catch (error) {
    formError.value = error?.message || 'Không thể lưu danh mục.'
  } finally {
    submitting.value = false
  }
}

const handleDeleteCategory = (categoryId) => {
  deleteTargetCategoryId.value = String(categoryId || '')
}

const closeDeleteCategoryModal = () => {
  deleteTargetCategoryId.value = ''
}

const confirmDeleteCategory = async () => {
  if (!deleteTargetCategoryId.value) return

  formError.value = ''
  try {
    await adminStore.deleteCategory(deleteTargetCategoryId.value)
    closeDeleteCategoryModal()
  } catch (error) {
    formError.value = error?.message || 'Không thể xóa danh mục.'
  }
}
</script>
