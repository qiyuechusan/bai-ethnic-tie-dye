import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './api/client'
import './styles/styles.css'
import './styles/lab.css'
import './styles/lab-agent.css'
import './styles/tutor.css'
import './styles/craft-clinic.css'
import './styles/module3-scenario.css'

const legacyHandlers = [
  'switchView',
  'openPattern',
  'openScenario',
  'openGallery',
  'openModal',
  'closeModal',
  'toggleUploadForm',
  'previewImage',
  'filterArtworks',
  'handleUpload',
  'openLightbox',
  'closeLightbox',
  'likeFromLightbox',
  'showExploreModal',
  'closeExploreModal',
  'showDataModal',
  'closeDataModal',
  'switchTab',
  'alert'
]

const app = createApp(App)

legacyHandlers.forEach((name) => {
  app.config.globalProperties[name] = (...args) => {
    const fn = window[name]
    return typeof fn === 'function' ? fn.apply(window, args) : undefined
  }
})

app.config.globalProperties.window = window
app.config.globalProperties.document = document

app.use(createPinia()).use(router).mount('#app')
