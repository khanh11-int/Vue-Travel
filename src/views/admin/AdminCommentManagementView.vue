<template>
  <section class="admin-page">
    <div class="panel-card">
      <div class="section-heading compact admin-heading-stack">
        <div>
          <p class="eyebrow">Quản lý bình luận</p>
          <h2>Kiểm duyệt đánh giá từ khách hàng</h2>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Dịch vụ</th>
              <th>Nội dung</th>
              <th>Đánh giá</th>
              <th>Hiển thị</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="comment in comments" :key="comment.id">
              <td>{{ comment.userName }}</td>
              <td>{{ getServiceName(comment.serviceId) }}</td>
              <td>{{ comment.content }}</td>
              <td>{{ comment.rating }}/5</td>
              <td>
                <span :class="['status-chip', comment.visible === false ? 'status-chip--danger' : 'status-chip--success']">
                  {{ comment.visible === false ? 'Đang ẩn' : 'Đang hiển thị' }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="ghost-button" type="button" @click="store.toggleCommentVisibility(comment.id)">
                    {{ comment.visible === false ? 'Hiện lại' : 'Ẩn' }}
                  </button>
                  <button class="secondary-button" type="button" @click="store.deleteComment(comment.id)">Xóa</button>
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
import { computed } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { useServiceStore } from '@/stores/useServiceStore'

const store = useAdminStore()
const serviceStore = useServiceStore()
const comments = computed(() => serviceStore.comments)
const getServiceName = (serviceId) => serviceStore.services.find((service) => service.id === serviceId)?.name || 'Dịch vụ nội địa'
</script>