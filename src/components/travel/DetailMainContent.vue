<template>
  <div class="detail-main detail-main-column">
    <div class="detail-gallery-wrapper detail-gallery-panel">
      <div class="detail-gallery-stage">
        <img :src="currentImage" :alt="service.name" class="gallery-main detail-gallery-main" />
      </div>

      <template v-if="normalizedGallery.length > 1">
        <div class="detail-gallery-thumbnails">
          <button
            v-for="(item, index) in previewThumbnails"
            :key="`thumb-${item}-${index}`"
            :class="['detail-gallery-thumbnail', { active: index === currentImageIndex }]"
            type="button"
            :aria-label="`Xem ảnh ${index + 1}`"
            @click="goToImage(index)"
          >
            <img :src="item" :alt="`Ảnh ${index + 1}`" />
          </button>
          <button
            v-if="normalizedGallery.length > previewThumbnails.length"
            type="button"
            class="detail-gallery-thumbnail detail-gallery-thumbnail--more"
            :aria-label="`Xem thêm ${normalizedGallery.length - previewThumbnails.length} ảnh`"
            @click="goToImage(previewThumbnails.length)"
          >
            Xem tất cả
          </button>
        </div>
      </template>
    </div>

    <div class="detail-head">
      <p class="eyebrow">{{ service.destination }}, {{ service.province }}</p>
      <h1>{{ service.name }}</h1>
      <div class="detail-meta">
        <RatingStars :value="service.rating" />
      </div>
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

  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue'
import RatingStars from '@/components/common/RatingStars.vue'

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
  }
})

const emit = defineEmits(['update:selectedImage'])

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

const previewThumbnails = computed(() => normalizedGallery.value.slice(0, 3))

const goToImage = (index) => {
  if (!normalizedGallery.value.length) return
  const safeIndex = Math.max(0, Math.min(index, normalizedGallery.value.length - 1))
  emit('update:selectedImage', normalizedGallery.value[safeIndex])
}

</script>
