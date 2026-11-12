<script setup lang="ts">
import { ref } from 'vue'
import type { Artwork } from '@/types/artwork'
import { assetUrl } from '@/utils/asset-url'

defineProps<{
  artwork: Artwork
  liked: boolean
}>()

const emit = defineEmits<{
  open: [artwork: Artwork]
  like: [artwork: Artwork]
}>()

const imageFailed = ref(false)

function fallbackImage(event: Event) {
  if (imageFailed.value) return
  imageFailed.value = true
  ;(event.currentTarget as HTMLImageElement).src = '/assets/indigo-textile.svg'
}
</script>

<template>
  <article
    class="polaroid-card"
    role="button"
    tabindex="0"
    :aria-label="`查看作品：${artwork.title}`"
    @click="emit('open', artwork)"
    @keydown.enter="emit('open', artwork)"
    @keydown.space.prevent="emit('open', artwork)"
  >
    <div class="clip"></div>
    <img
      class="polaroid-image"
      :src="assetUrl(artwork.imageUrl)"
      :alt="artwork.title"
      loading="lazy"
      decoding="async"
      @error="fallbackImage"
    >
    <div class="polaroid-caption">
      <div class="polaroid-title">{{ artwork.title }}</div>
      <div class="polaroid-desc">
        {{ artwork.description || '这位匠人很懒，没有留下感悟。' }}
      </div>
      <div class="polaroid-author">—— {{ artwork.authorName }} · {{ artwork.tieMethod }}</div>
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
  </article>
</template>
