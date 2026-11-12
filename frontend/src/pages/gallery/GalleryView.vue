<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ArtworkCard from '@/components/gallery/ArtworkCard.vue'
import ArtworkLightbox from '@/components/gallery/ArtworkLightbox.vue'
import ArtworkUploadForm from '@/components/gallery/ArtworkUploadForm.vue'
import { likeArtwork as likeArtworkRequest, listArtworks, uploadArtwork } from '@/api/artworks'
import { initPage } from '@/legacy/app'
import type { Artwork, ArtworkUploadPayload } from '@/types/artwork'

const FILTERS = [
  { label: '全部', value: '全部' },
  { label: '螺旋捆扎', value: '捆扎' },
  { label: '风琴折叠', value: '折叠夹扎' },
  { label: '缝扎勾勒', value: '缝扎' },
] as const

const artworks = ref<Artwork[]>([])
const activeFilter = ref('全部')
const selectedArtwork = ref<Artwork | null>(null)
const likedIds = ref<number[]>([])
const loading = ref(true)
const uploadOpen = ref(false)
const submitting = ref(false)
const uploadError = ref('')
const pageError = ref('')
const formKey = ref(0)

const filteredArtworks = computed(() => {
  if (activeFilter.value === '全部') return artworks.value
  return artworks.value.filter((artwork) => artwork.tieMethod === activeFilter.value)
})

const likedSet = computed(() => new Set(likedIds.value))

async function loadGallery() {
  loading.value = true
  pageError.value = ''
  try {
    artworks.value = await listArtworks()
    if (selectedArtwork.value) {
      selectedArtwork.value =
        artworks.value.find((artwork) => artwork.id === selectedArtwork.value?.id) || null
    }
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : '作品读取失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

function toggleUpload() {
  uploadOpen.value = !uploadOpen.value
  uploadError.value = ''
}

async function submitUpload(payload: ArtworkUploadPayload) {
  submitting.value = true
  uploadError.value = ''
  try {
    await uploadArtwork(payload)
    uploadOpen.value = false
    formKey.value += 1
    await loadGallery()
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : '上传失败，请稍后重试。'
  } finally {
    submitting.value = false
  }
}

async function likeArtwork(artwork: Artwork) {
  if (likedSet.value.has(artwork.id)) return
  pageError.value = ''
  try {
    const result = await likeArtworkRequest(artwork.id)
    const target = artworks.value.find((item) => item.id === artwork.id)
    if (target) target.likes = result.likes
    if (selectedArtwork.value?.id === artwork.id) selectedArtwork.value.likes = result.likes
    likedIds.value = [...likedIds.value, artwork.id]
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : '点赞失败，请稍后重试。'
  }
}

onMounted(() => {
  initPage()
  loadGallery()
})
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <canvas class="dye-canvas" id="dyeCanvas" aria-hidden="true"></canvas>
  <div class="paper-grain" aria-hidden="true"></div>

  <header class="site-header" id="siteHeader">
    <div class="nav-shell">
      <a class="brand" href="/home" aria-label="苍洱纹册首页">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <path d="M24 4.5C19.4 13 13.2 20 13.2 28.1a10.8 10.8 0 1 0 21.6 0C34.8 20 28.6 13 24 4.5Z" />
            <path class="brand-mark-line" d="M18 28.2c2.7-1.9 4.2-4.1 4.5-6.8M24 34.5c.2-6.1 2.9-10.6 8.2-13.5" />
          </svg>
        </span>
        <span class="brand-copy">
          <strong>苍洱纹册</strong>
        </span>
      </a>

      <nav class="main-nav" id="mainNav" aria-label="主导航">
        <a href="/home">首页</a>
        <a href="/home#modules">六个展区</a>
        <a href="/diy">扎染实验室</a>
        <a href="/timeline">工艺长卷</a>
        <a href="/pattern">智染研习社</a>
        <a href="/quiz">问蓝知染</a>
        <a href="/map">寻迹地图</a>
        <a class="is-active" href="/gallery" aria-current="page">作品墙</a>
        <a class="mobile-login" href="/login">登录 / 注册</a>
      </nav>

      <div class="header-actions">
        <span class="visitor-state"><i></i>访客漫游中</span>
        <a class="header-login" href="/login">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 20c.6-4 2.7-6 6.5-6s5.9 2 6.5 6" />
          </svg>
          登录 / 注册
        </a>
        <button
          class="menu-button"
          id="menuButton"
          type="button"
          aria-expanded="false"
          aria-controls="mainNav"
          aria-label="打开菜单"
        >
          <span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <main class="standalone-main" id="main-content">
    <section class="atlas-section" aria-labelledby="gallery-title">
      <header class="atlas-heading">
        <div>
          <h1 id="gallery-title">作品墙</h1>
        </div>
      </header>

      <div id="modal-ask" class="page-modal">
        <div class="modal-content gallery-page-content">
          <div class="gallery-page-toolbar">
            <h2 class="modal-title gallery-page-title">匠人作品墙</h2>
            <button class="gallery-upload-button" type="button" @click="toggleUpload">
              {{ uploadOpen ? '收起上传' : '+ 钉一张拍立得' }}
            </button>
          </div>

          <ArtworkUploadForm
            v-if="uploadOpen"
            :key="formKey"
            :submitting="submitting"
            :error="uploadError"
            @submit="submitUpload"
            @cancel="toggleUpload"
          />

          <div class="filter-tags" role="group" aria-label="按扎结方式筛选">
            <button
              v-for="filter in FILTERS"
              :key="filter.value"
              type="button"
              :class="{ active: activeFilter === filter.value }"
              @click="activeFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>

          <p v-if="pageError" class="gallery-feedback is-error" role="alert">{{ pageError }}</p>
          <p v-if="loading" class="gallery-feedback">正在取下墙上的作品…</p>
          <p v-else-if="filteredArtworks.length === 0" class="gallery-feedback">
            暂时还没有作品，快来挂上第一张拍立得吧！
          </p>

          <div v-else class="clothesline-container">
            <div class="rope"></div>
            <div class="clothesline-items">
              <ArtworkCard
                v-for="artwork in filteredArtworks"
                :key="artwork.id"
                :artwork="artwork"
                :liked="likedSet.has(artwork.id)"
                @open="selectedArtwork = $event"
                @like="likeArtwork"
              />
            </div>
          </div>

          <ArtworkLightbox
            :artwork="selectedArtwork"
            :liked="Boolean(selectedArtwork && likedSet.has(selectedArtwork.id))"
            @close="selectedArtwork = null"
            @like="likeArtwork"
          />
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="footer-brand">
      <a class="brand invert" href="/home" aria-label="苍洱纹册首页">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <path d="M24 4.5C19.4 13 13.2 20 13.2 28.1a10.8 10.8 0 1 0 21.6 0C34.8 20 28.6 13 24 4.5Z" />
            <path class="brand-mark-line" d="M18 28.2c2.7-1.9 4.2-4.1 4.5-6.8M24 34.5c.2-6.1 2.9-10.6 8.2-13.5" />
          </svg>
        </span>
        <span class="brand-copy"><strong>苍洱纹册</strong></span>
      </a>
      <p>让一匹蓝布，继续讲述<br>苍山洱海间的非遗故事。</p>
    </div>
    <div class="footer-nav">
      <div>
        <span>探索</span>
        <a href="/home#modules">六大展区</a>
        <a href="/diy">扎染实验室</a>
        <a href="/timeline">工艺长卷</a>
        <a href="/pattern">智染研习社</a>
        <a href="/quiz">问蓝知染</a>
        <a href="/map">寻迹地图</a>
        <a href="/gallery">作品墙</a>
      </div>
      <div>
        <span>连接</span>
        <a href="/login">登录 / 注册</a>
        <a href="/home">返回首页</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>云南大理 · 白族扎染数字科普站</span>
    </div>
  </footer>
</template>
