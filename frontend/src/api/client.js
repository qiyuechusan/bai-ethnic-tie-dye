const API_BASE = '/api'

window.LANBAI_API_BASE = API_BASE
window.LANBAI_API_ORIGIN = ''
window.LANBAI_ASSET_URL = (path) => (path ? path : '')

export async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) }
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers,
    })
  } catch {
    throw new Error('无法连接后端服务，请确认 Spring Boot 已启动在 8080 端口')
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error(`接口返回格式异常（HTTP ${response.status}）`)
  }

  if (!response.ok) {
    if (response.status === 401) {
      const authPaths = ['/login', '/register', '/guest', '/logout']
      if (!authPaths.includes(path) && window.location.pathname !== '/login') {
        window.location.href = '/login?loginRequired=1'
      }
    }
    const error = new Error(payload?.message || `请求失败（HTTP ${response.status}）`)
    error.status = response.status
    error.code = payload?.code
    throw error
  }

  if (payload?.code !== 0) {
    const error = new Error(payload?.message || '请求失败')
    error.status = response.status
    error.code = payload?.code
    throw error
  }

  return payload.data
}

window.LANBAI_API = request
