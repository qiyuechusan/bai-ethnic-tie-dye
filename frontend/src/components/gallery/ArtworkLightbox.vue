<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import type { Artwork } from '@/types/artwork'
import { assetUrl } from '@/utils/asset-url'

const props = defineProps<{
  artwork: Artwork | null
  liked: boolean
}>()

const emit = defineEmits<{
  close: []
  like: [artwork: Artwork]
}>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.artwork) emit('close')
}

watch(
  () => props.artwork,
  (artwork) => {
    document.body.classList.toggle('modal-open', Boolean(artwork))
  },
  { immediate: true },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('modal-open')
})
</script>

<template>
  <Teleport to="body">
    <div
      id="lightbox"
      class="lightbox"
      :class="{ active: artwork }"
      role="dialog"
      aria-modal="true"
      aria-label="作品大图"
      @click.self="emit('close')"
    >
      <div v-if="artwork" class="lightbox-content">
        <button class="lightbox-close" type="button" aria-label="关闭" @click="emit('close')">×</button>
        <img :src="assetUrl(artwork.imageUrl)" :alt="artwork.title" decoding="async">
        <div class="lightbox-info">
          <h2>{{ artwork.title }}</h2>
          <p>{{ artwork.description || '这位匠人很懒，没有留下感悟。' }}</p>
          <div class="lightbox-meta">
            <span>作者：{{ artwork.authorName }} · 技法：{{ artwork.tieMethod }}</span>
            <button
              class="like-vat"
              :class="{ active: liked }"
              type="button"
              :disabled="liked"
              :aria-label="liked ? '已点赞' : `点赞，当前 ${artwork.likes} 次`"
              @click.stop="emit('like', artwork)"
            >
              <i class="vat-icon"></i>
              <span class="like-count">{{ artwork.likes }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
