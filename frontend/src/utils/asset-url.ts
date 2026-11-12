export function assetUrl(path: string): string {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/.test(path)) return path
  if (path.startsWith('/')) return path
  return `/${path}`
}
