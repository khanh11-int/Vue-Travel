<template>
  <div class="detail-main">
    <div class="detail-gallery-wrapper">
      <div class="detail-gallery-stage">
        <img :src="currentImage" :alt="service.name" class="gallery-main detail-gallery-main" />

        <template v-if="normalizedGallery.length > 1">
          <button class="detail-gallery-nav detail-gallery-nav--prev" type="button" @click="goToPreviousImage">
            ←
          </button>
          <button class="detail-gallery-nav detail-gallery-nav--next" type="button" @click="goToNextImage">
            →
          </button>

          <div class="detail-gallery-dots" role="tablist" aria-label="Chuyển ảnh dịch vụ">
            <button
              v-for="(item, index) in normalizedGallery"
              :key="`${item}-${index}`"
              :class="['detail-gallery-dot', { active: index === currentImageIndex }]"
              type="button"
              :aria-label="`Ảnh ${index + 1}`"
              @click="goToImage(index)"
            />
          </div>
        </template>
      </div>

      <template v-if="normalizedGallery.length > 1">
        <div class="detail-gallery-thumbnails">
          <button
            v-for="(item, index) in normalizedGallery.slice(0, 6)"
            :key="`thumb-${item}-${index}`"
            :class="['detail-gallery-thumbnail', { active: index === currentImageIndex }]"
            type="button"
            :aria-label="`Xem ảnh ${index + 1}`"
            @click="goToImage(index)"
          >
            <img :src="item" :alt="`Ảnh ${index + 1}`" />
          </button>
          <button
            v-if="normalizedGallery.length > 6"
            type="button"
            class="detail-gallery-thumbnail detail-gallery-thumbnail--more"
            :aria-label="`Xem thêm ${normalizedGallery.length - 6} ảnh`"
            @click="goToImage(6)"
          >
            +{{ normalizedGallery.length - 6 }}
          </button>
        </div>
      </template>
    </div>

    <div class="detail-head">
      <p class="eyebrow">{{ service.destination }}, {{ service.province }}</p>
      <h1>{{ service.name }}</h1>
      <div class="detail-meta">
        <RatingStars :value="service.rating" />
        <span class="detail-dot">•</span>
        <span class="muted">{{ service.availableSlots > 0 ? `Còn ${service.availableSlots} chỗ` : 'Hiện đã hết chỗ' }}</span>
      </div>
      <p class="lead">{{ service.shortDescription }}</p>
    </div>

    <div class="info-card">
      <h3>Mô tả chi tiết</h3>
      <p class="detail-paragraph">{{ service.description }}</p>
    </div>

    <div class="info-card">
      <h3>Tiện ích nổi bật</h3>
      <ul class="chip-list">
        <li v-for="amenity in service.amenities" :key="amenity">{{ amenity }}</li>
      </ul>
    </div>

    <div class="info-card">
      <h3>Lịch trình / Quy định sử dụng</h3>
      <ol class="detail-itinerary">
        <li v-for="item in service.itinerary" :key="item">{{ item }}</li>
      </ol>
    </div>

    <div class="info-card">
      <h3>Đánh giá & bình luận</h3>
      <form class="comment-form" @submit.prevent="handleSubmitComment">
        <input v-model="commentForm.userName" type="text" placeholder="Họ tên của bạn" required />
        <select v-model.number="commentForm.rating" required>
          <option :value="5">5 sao</option>
          <option :value="4">4 sao</option>
          <option :value="3">3 sao</option>
          <option :value="2">2 sao</option>
          <option :value="1">1 sao</option>
        </select>
        <textarea
          v-model="commentForm.content"
          rows="4"
          placeholder="Chia sẻ trải nghiệm của bạn"
          required
        />
        <button type="submit" class="primary-button">Gửi bình luận</button>
      </form>

      <div class="comment-list">
        <article v-for="comment in serviceComments" :key="comment.id" class="comment-item">
          <div>
            <strong>{{ comment.userName }}</strong>
            <p class="muted">{{ formatDateVN(comment.createdAt) }}</p>
          </div>
          <RatingStars :value="comment.rating" />
          <p>{{ comment.content }}</p>
        </article>
      </div>
    </div>

    <div class="info-card" v-if="relatedServices.length">
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Gợi ý thêm</p>
          <h3>Dịch vụ liên quan</h3>
        </div>
      </div>
      <div class="travel-grid">
        <article v-for="item in relatedServices" :key="item.id" class="detail-related-card">
          <img :src="item.image" :alt="item.name" class="detail-related-image" />
          <div class="detail-related-body">
            <p class="muted">{{ item.destination }}, {{ item.province }}</p>
            <h4>{{ item.name }}</h4>
            <strong>{{ formatCurrencyVND(item.salePrice) }}</strong>
            <router-link class="secondary-button" :to="getDetailRouteLocation(item)">Xem chi tiết</router-link>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps, reactive } from 'vue'
import RatingStars from '@/components/common/RatingStars.vue'
import { formatCurrencyVND, formatDateVN } from '@/utils/formatters'
import { getDetailRouteLocation } from '@/utils/serviceRouting'

const props = defineProps({
  service: {
    type: Object,
    required: true
  },
  selectedImage: {
    type: String,
    default: ''
  },
  galleryImages: {
    type: Array,
    default: () => []
  },
  serviceComments: {
    type: Array,
    default: () => []
  },
  relatedServices: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:selectedImage', 'submit-comment'])

const normalizedGallery = computed(() => {
  const source = Array.isArray(props.galleryImages) ? props.galleryImages : []
  const fallback = props.service?.image ? [props.service.image] : []
  return [...new Set((source.length ? source : fallback).filter(Boolean))]
})

const currentImage = computed(() => props.selectedImage || normalizedGallery.value[0] || props.service.image)

const currentImageIndex = computed(() => {
  const index = normalizedGallery.value.findIndex((item) => item === currentImage.value)
  return index >= 0 ? index : 0
})

const goToImage = (index) => {
  if (!normalizedGallery.value.length) return
  const safeIndex = Math.max(0, Math.min(index, normalizedGallery.value.length - 1))
  emit('update:selectedImage', normalizedGallery.value[safeIndex])
}

const goToPreviousImage = () => {
  if (!normalizedGallery.value.length) return
  const nextIndex = (currentImageIndex.value - 1 + normalizedGallery.value.length) % normalizedGallery.value.length
  goToImage(nextIndex)
}

const goToNextImage = () => {
  if (!normalizedGallery.value.length) return
  const nextIndex = (currentImageIndex.value + 1) % normalizedGallery.value.length
  goToImage(nextIndex)
}

const commentForm = reactive({
  userName: '',
  rating: 5,
  content: ''
})

const handleSubmitComment = () => {
  emit('submit-comment', {
    userName: commentForm.userName,
    rating: commentForm.rating,
    content: commentForm.content
  })

  commentForm.userName = ''
  commentForm.rating = 5
  commentForm.content = ''
}
</script>
