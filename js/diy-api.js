import { request } from './http.js';
import { mockDiyMethods } from './mock/diy-methods.js';

export function fetchDiyMethods() {
  return request('/diy/methods');
}

export { mockDiyMethods };
