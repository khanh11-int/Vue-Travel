<template>
  <div class="info-card detail-comment-column detail-comment-card">
    <h3>Đánh giá & bình luận</h3>
    <p class="muted">
      Bình luận chỉ được gửi sau khi hoàn tất đặt chỗ. Dưới đây là các bình luận mới nhất từ khách đã trải nghiệm dịch vụ.
    </p>

    <div v-if="recentComments.length" class="comment-list">
      <article v-for="comment in recentComments" :key="comment.id" class="comment-item">
        <div>
          <strong>{{ comment.userName }}</strong>
          <p class="muted">{{ formatDateVN(comment.createdAt) }}</p>
        </div>
        <RatingStars :value="comment.rating" />
        <p>{{ comment.content }}</p>
      </article>
    </div>

    <p v-else class="muted">Chưa có bình luận cho dịch vụ này.</p>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import RatingStars from '@/components/common/RatingStars.vue'
import { formatDateVN } from '@/utils/formatters'

const props = defineProps({
  serviceComments: {
    type: Array,
    default: () => []
  }
})

const recentComments = computed(() =>
  [...(Array.isArray(props.serviceComments) ? props.serviceComments : [])]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 8)
)
</script>
