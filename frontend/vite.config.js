import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const assetsRoot = fileURLToPath(new URL('../assets', import.meta.url))
const distRoot = fileURLToPath(new URL('./dist', import.meta.url))

const mime = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
}

function assetsPlugin() {
  return {
    name: 'tie-dye-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        if (!url.startsWith('/assets/')) {
          next()
          return
        }
        const relative = decodeURIComponent(url.slice('/assets/'.length))
        const filePath = path.join(assetsRoot, relative)
        if (!filePath.startsWith(assetsRoot)) {
          next()
          return
        }
        fs.stat(filePath, (error, stat) => {
          if (error || !stat.isFile()) {
            next()
            return
          }
          res.setHeader('Content-Type', mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream')
          res.setHeader('Cache-Control', 'public, max-age=86400')
          fs.createReadStream(filePath).pipe(res)
        })
      })
    },
    closeBundle() {
      fs.cpSync(assetsRoot, path.join(distRoot, 'assets'), { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [
    vue({
      template: {
        transformAssetUrls: false,
      },
    }),
    assetsPlugin(),
  ],
  base: '/',
  publicDir: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
    },
  },
})
