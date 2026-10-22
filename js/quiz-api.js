import { request } from './http.js';
import { mockAnswer, mockQuestions } from './mock/quiz.js';

export function fetchQuestions({ limit = 8, category = '' } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (category) {
    params.set('category', category);
  }
  return request(`/quiz/questions?${params.toString()}`);
}

export function submitAnswer(questionId, optionKey) {
  return request('/quiz/answer', {
    method: 'POST',
    body: JSON.stringify({ questionId, optionKey }),
  });
}

export { mockAnswer, mockQuestions };
