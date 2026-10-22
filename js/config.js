/**
 * 前端运行配置。
 *
 * - 由 Spring Boot 托管（8080）时，接口走同源 /api。
 * - 用 VS Code Live Server / npx serve 在 5500 调试时，接口指向 8080。
 * - USE_MOCK = true 可强制使用本地演示数据，便于离线看页面。
 */
export const USE_MOCK = false;

const DEV_PORTS = new Set(['3000', '5173', '5500', '5501', '8081']);

export const API_BASE = DEV_PORTS.has(window.location.port)
  ? 'http://localhost:8080/api'
  : '/api';
