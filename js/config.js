/**
 * 前端运行配置。
 *
 * - 由 Spring Boot 托管（8080）时，接口走同源 /api。
 * - 用 VS Code Live Server / npx serve 在 5500 调试时，接口指向 8080。
 */
const DEV_PORTS = new Set(['3000', '5173', '5500', '5501', '8081']);
const fallbackOrigin = DEV_PORTS.has(window.location.port) ? 'http://localhost:8080' : '';

// 优先使用 js/api-base.js 计算好的地址；未加载时退回到同样的端口判断。
export const API_BASE = window.LANBAI_API_BASE || `${fallbackOrigin}/api`;
export const API_ORIGIN = window.LANBAI_API_ORIGIN ?? fallbackOrigin;
