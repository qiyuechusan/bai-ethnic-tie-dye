<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { ArtworkUploadPayload } from '@/types/artwork'

defineProps<{
  submitting: boolean
  error: string
}>()

const emit = defineEmits<{
  submit: [payload: ArtworkUploadPayload]
  cancel: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const title = ref('')
const authorName = ref('')
const description = ref('')
const tieMethod = ref('捆扎')
const validationError = ref('')

function revokePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

function chooseFile() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0] || null
  revokePreview()
  selectedFile.value = file
  validationError.value = ''
  if (file) previewUrl.value = URL.createObjectURL(file)
}

function submit() {
  const file = selectedFile.value
  if (!file) {
    validationError.value = '请先选择一张作品照片。'
    chooseFile()
    return
  }
  if (!title.value.trim()) {
    validationError.value = '请填写作品名称。'
    return
  }
  validationError.value = ''
  emit('submit', {
    file,
    title: title.value.trim(),
    authorName: authorName.value.trim(),
    description: description.value.trim(),
    tieMethod: tieMethod.value,
  })
}

onBeforeUnmount(revokePreview)
</script>

<template>
  <div class="upload-section">
    <div class="polaroid-form-card">
      <form @submit.prevent="submit">
        <button class="polaroid-photo-preview" type="button" @click="chooseFile">
          <span v-if="!previewUrl" class="upload-placeholder">点击此处选择照片</span>
          <img v-if="previewUrl" :src="previewUrl" alt="待上传作品预览">
        </button>
        <input
          ref="fileInput"
          class="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="onFileChange"
        >

        <div class="polaroid-bottom">
          <input
            v-model="title"
            type="text"
            placeholder="作品名称"
            required
            class="marker-input upload-title-input"
          >
          <input v-model="authorName" type="text" placeholder="你的称呼（选填）" class="marker-input">
          <textarea
            v-model="description"
            placeholder="写下一句感悟..."
            class="marker-input"
            rows="2"
          ></textarea>
          <select v-model="tieMethod" class="marker-input upload-method-select">
            <option value="捆扎">螺旋捆扎</option>
            <option value="缝扎">缝扎勾勒</option>
            <option value="折叠夹扎">风琴折叠</option>
          </select>

          <p v-if="validationError || error" class="upload-error" role="alert">
            {{ validationError || error }}
          </p>
          <div class="upload-actions">
            <button type="submit" class="btn-pill" :disabled="submitting">
              {{ submitting ? '悬挂中…' : '挂上麻绳' }}
            </button>
            <button type="button" class="btn-pill upload-cancel" :disabled="submitting" @click="emit('cancel')">
              取消
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
