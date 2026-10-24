import { request } from './http.js';

export function chatWithTutor(payload) {
  return request('/tutor/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function submitTutorAnswer(payload) {
  return request('/tutor/submit-answer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function generateTutorQuiz(payload) {
  return request('/tutor/quiz/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchTutorCatalog() {
  return request('/tutor/catalog');
}

export function fetchTutorKnowledge({ category = '', offset = 0, limit = 20 } = {}) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  if (category) {
    params.set('category', category);
  }
  return request(`/tutor/knowledge?${params.toString()}`);
}

export function fetchTutorSessions() {
  return request('/tutor/sessions');
}

export function fetchTutorHistory(sessionId) {
  return request(`/tutor/history?sessionId=${encodeURIComponent(sessionId)}`);
}

export function fetchTutorStats(sessionId) {
  return request(`/tutor/stats?sessionId=${encodeURIComponent(sessionId)}`);
}
