const API_BASE = '/api'

window.LANBAI_API_BASE = API_BASE
window.LANBAI_API_ORIGIN = ''
window.LANBAI_ASSET_URL = (path) => path || ''

export async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers,
    })
  } catch {
    throw new Error('无法连接后端服务，请确认 Spring Boot 已启动在 8080 端口')
  }

  let payload: {
    code?: number
    message?: string
    data?: T
  }
  try {
    payload = await response.json()
  } catch {
    throw new Error(`接口返回格式异常（HTTP ${response.status}）`)
  }

  if (!response.ok) {
    if (response.status === 401) {
      const authPaths = ['/login', '/register', '/guest', '/logout']
      if (!authPaths.includes(path) && window.location.pathname !== '/login') {
        window.location.assign('/login?loginRequired=1')
      }
    }
    const error = new Error(payload.message || `请求失败（HTTP ${response.status}）`) as Error & {
      status?: number
      code?: number
    }
    error.status = response.status
    error.code = payload.code
    throw error
  }

  if (payload.code !== 0) {
    const error = new Error(payload.message || '请求失败') as Error & {
      status?: number
      code?: number
    }
    error.status = response.status
    error.code = payload.code
    throw error
  }

  return payload.data as T
}

window.LANBAI_API = request
