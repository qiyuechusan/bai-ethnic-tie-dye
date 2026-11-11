import { defineStore } from 'pinia'
import { request } from '@/api/client'

export const useSessionStore = defineStore('session', {
  state: () => ({
    role: '',
    user: null,
    loaded: false,
  }),
  actions: {
    apply(session) {
      this.role = session?.role || ''
      this.user = session?.user || null
      this.loaded = true
      return session
    },
    async load() {
      try {
        const session = await request('/session')
        this.apply(session)
      } catch {
        this.role = ''
        this.user = null
        this.loaded = true
      }
      return { role: this.role, user: this.user }
    },
    async login(payload) {
      const session = await request('/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return this.apply(session)
    },
    async register(payload) {
      return request('/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    async guest() {
      try {
        const session = await request('/guest', {
          method: 'POST',
          body: JSON.stringify({}),
        })
        return this.apply(session)
      } catch {
        return { role: 'guest', user: null }
      }
    },
    async logout() {
      try {
        await request('/logout', {
          method: 'POST',
          body: '{}',
        })
      } finally {
        this.role = ''
        this.user = null
      }
    },
  },
})
