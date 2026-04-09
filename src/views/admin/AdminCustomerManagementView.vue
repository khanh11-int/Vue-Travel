<template>
  <section class="admin-page">
    <div class="panel-card">
      <div class="section-heading compact admin-heading-stack">
        <div>
          <p class="eyebrow">Quản lý khách hàng</p>
          <h2>Quản trị tài khoản người dùng</h2>
        </div>
      </div>

      <div class="admin-toolbar">
        <input v-model="filters.keyword" type="text" placeholder="Tìm theo tên, email hoặc số điện thoại" />
        <select v-model="filters.role">
          <option value="">Tất cả vai trò</option>
          <option value="customer">Khách hàng</option>
          <option value="admin">Admin</option>
        </select>
        <select v-model="filters.sortBy">
          <option value="name">Sắp xếp theo tên</option>
          <option value="email">Sắp xếp theo email</option>
        </select>
      </div>

      <form class="admin-form-grid" @submit.prevent="handleSubmitUser">
        <input v-model="userForm.fullName" type="text" placeholder="Họ tên" />
        <input v-model="userForm.email" type="email" placeholder="Email" />
        <input v-model="userForm.phone" type="text" placeholder="Số điện thoại" />
        <select v-model="userForm.role">
          <option value="customer">Khách hàng</option>
          <option value="admin">Admin</option>
        </select>
        <input v-model="userForm.password" type="password" :placeholder="isEditing ? 'Mật khẩu mới (để trống để giữ nguyên)' : 'Mật khẩu'" />
        <input v-model="userForm.address" type="text" placeholder="Địa chỉ" />

        <small v-if="formError" class="error-text admin-form-span-2">{{ formError }}</small>

        <div class="admin-form-actions admin-form-span-2">
          <button class="primary-button" type="submit" :disabled="submitting">
            {{ isEditing ? 'Lưu khách hàng' : 'Tạo khách hàng' }}
          </button>
          <button class="secondary-button" type="button" @click="resetUserForm">Làm mới</button>
        </div>
      </form>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Liên hệ</th>
              <th>Vai trò</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <strong>{{ user.fullName }}</strong>
                <p class="muted small-text">ID: {{ user.id }}</p>
              </td>
              <td>
                <p class="small-text">{{ user.email }}</p>
                <p class="muted small-text">{{ user.phone || '-' }} · {{ user.address || '-' }}</p>
              </td>
              <td>
                <span :class="['status-chip', user.role === 'admin' ? 'status-chip--blue' : 'status-chip--success']">
                  {{ user.role === 'admin' ? 'Admin' : 'Khách hàng' }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="ghost-button" type="button" @click="startEditUser(user)">Sửa</button>
                  <button class="secondary-button" type="button" @click="handleDeleteUser(user.id)">Xóa</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="deleteTargetUserId" class="admin-confirm-overlay" @click.self="closeDeleteUserModal">
        <div class="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
          <p class="eyebrow">Xác nhận thao tác</p>
          <h3 id="delete-user-title">Bạn có chắc muốn xóa tài khoản này?</h3>
          <p class="muted">Tài khoản đã xóa sẽ không thể đăng nhập và không còn xuất hiện trong danh sách khách hàng.</p>
          <div class="admin-confirm-actions">
            <button class="secondary-button" type="button" @click="closeDeleteUserModal">Hủy</button>
            <button class="primary-button" type="button" @click="confirmDeleteUser">Đồng ý xóa</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAdminStore } from '@/stores/admin/useAdminStore'
import { useAuthStore } from '@/stores/auth/useAuthStore'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const submitting = ref(false)
const formError = ref('')
const isEditing = ref(false)
const editingUserId = ref('')
const deleteTargetUserId = ref('')

const filters = reactive({
  keyword: '',
  role: '',
  sortBy: 'name'
})

const defaultForm = () => ({
  id: '',
  fullName: '',
  email: '',
  phone: '',
  address: '',
  role: 'customer',
  password: ''
})

const userForm = reactive(defaultForm())

onMounted(async () => {
  try {
    await adminStore.fetchUsers()
  } catch (error) {
    formError.value = error?.message || 'Không thể tải danh sách khách hàng.'
  }
})

const users = computed(() => adminStore.users)

const filteredUsers = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  const sortField = filters.sortBy

  return [...users.value]
    .filter((user) => {
      const haystack = [user.fullName, user.email, user.phone].join(' ').toLowerCase()
      const matchesKeyword = !keyword || haystack.includes(keyword)
      const matchesRole = !filters.role || user.role === filters.role
      return matchesKeyword && matchesRole
    })
    .sort((left, right) => String(left[sortField] || '').localeCompare(String(right[sortField] || ''), 'vi'))
})

const resetUserForm = () => {
  Object.assign(userForm, defaultForm())
  isEditing.value = false
  editingUserId.value = ''
  formError.value = ''
}

const startEditUser = (user) => {
  Object.assign(userForm, {
    id: String(user.id || ''),
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    role: user.role || 'customer',
    password: ''
  })
  editingUserId.value = String(user.id)
  isEditing.value = true
  formError.value = ''
}

const handleSubmitUser = async () => {
  formError.value = ''
  if (!userForm.fullName.trim() || !userForm.email.trim()) {
    formError.value = 'Họ tên và email là bắt buộc.'
    return
  }

  if (!isEditing.value && !userForm.password.trim()) {
    formError.value = 'Vui lòng nhập mật khẩu cho tài khoản mới.'
    return
  }

  submitting.value = true
  try {
    const existingUser = users.value.find((user) => String(user.id) === editingUserId.value)
    await adminStore.saveUser({
      ...existingUser,
      ...userForm,
      id: isEditing.value ? editingUserId.value : undefined,
      password: userForm.password.trim() || existingUser?.password || '123456'
    })
    resetUserForm()
  } catch (error) {
    formError.value = error?.message || 'Không thể lưu khách hàng.'
  } finally {
    submitting.value = false
  }
}

const handleDeleteUser = (userId) => {
  deleteTargetUserId.value = String(userId || '')
}

const closeDeleteUserModal = () => {
  deleteTargetUserId.value = ''
}

const confirmDeleteUser = async () => {
  if (!deleteTargetUserId.value) return

  const userId = deleteTargetUserId.value
  const currentUserId = String(authStore.currentUser?.id || '')
  if (String(userId) === currentUserId) {
    formError.value = 'Không thể xóa tài khoản admin đang đăng nhập.'
    closeDeleteUserModal()
    return
  }

  try {
    await adminStore.deleteUser(userId)
    closeDeleteUserModal()
  } catch (error) {
    formError.value = error?.message || 'Không thể xóa khách hàng.'
  }
}
</script>
