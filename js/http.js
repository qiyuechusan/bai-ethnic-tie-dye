import { API_BASE } from './config.js';

/**
 * 统一请求封装：只返回后端 { code, message, data } 中的 data。
 * 非 2xx 或 code !== 0 时抛出带中文提示的 Error。
 */
export async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error('无法连接后端服务，请确认 Spring Boot 已启动在 8080 端口');
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error(`接口返回格式异常（HTTP ${response.status}）`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = 'index.html?loginRequired=1';
    }
    const error = new Error(payload?.message || `请求失败（HTTP ${response.status}）`);
    error.status = response.status;
    error.code = payload?.code;
    throw error;
  }
  if (payload?.code !== 0) {
    const error = new Error(payload?.message || '请求失败');
    error.status = response.status;
    error.code = payload?.code;
    throw error;
  }
  return payload.data;
}
