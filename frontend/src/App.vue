<template>
  <router-view />
</template>

<script setup>
import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watchEffect(() => {
  document.body.className = route.meta.bodyClass || ''
  if (route.meta.title) {
    document.title = route.meta.title
  }
})
</script>
