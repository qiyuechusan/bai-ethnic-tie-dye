/// <reference types="vite/client" />

interface Window {
  LANBAI_API_BASE: string
  LANBAI_API_ORIGIN: string
  LANBAI_ASSET_URL: (path: string) => string
  LANBAI_API: <T = unknown>(path: string, options?: RequestInit) => Promise<T>
  module3?: Record<string, (...args: unknown[]) => unknown>
  loadPatterns?: () => void
  loadArtworks?: () => void
}

declare module '@/legacy/app' {
  export function initPage(): void
}
