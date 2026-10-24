import { request } from './http.js';

export function generateDiyPattern(payload) {
  return request('/diy/agent/pattern', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchDiySuggestions() {
  return request('/diy/agent/suggestions');
}

export function fetchDiyHistory(sessionId) {
  const params = new URLSearchParams();
  if (sessionId) {
    params.set('sessionId', sessionId);
  }
  const suffix = params.toString();
  return request(`/diy/agent/history${suffix ? `?${suffix}` : ''}`);
}
