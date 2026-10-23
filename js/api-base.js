/**
 * 全站 API 地址。经典脚本（app.js）与 ES Module（js/*.js）共用。
 *
 * - 由 Spring Boot 托管（8080）时，接口走同源 /api。
 * - 用 VS Code Live Server / npx serve 在 5500 调试时，接口指向 8080。
 * - 如需部署到其他地址，可在页面里先手动设置 window.LANBAI_API_BASE。
 */
(() => {
  const DEV_PORTS = new Set(["3000", "5173", "5500", "5501", "8081"]);
  const isDevServer = DEV_PORTS.has(window.location.port);
  const apiOrigin = isDevServer ? "http://localhost:8080" : "";

  window.LANBAI_API_ORIGIN = apiOrigin;
  window.LANBAI_API_BASE = window.LANBAI_API_BASE || `${apiOrigin}/api`;

  /** 把 /uploads/xxx 之类的后端绝对路径补成当前环境可访问的地址。 */
  window.LANBAI_ASSET_URL = (path) => {
    if (!path) return "";
    if (/^(https?:|data:|blob:)/.test(path)) return path;
    if (path.startsWith("/")) return `${apiOrigin}${path}`;
    return path;
  };

  /** 统一读取后端 { code, message, data } 信封，返回 data。 */
  window.LANBAI_API = async (path, options = {}) => {
    const headers = { Accept: "application/json", ...(options.headers || {}) };
    if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    let response;
    try {
      response = await fetch(`${window.LANBAI_API_BASE}${path}`, {
        credentials: "include",
        ...options,
        headers
      });
    } catch {
      throw new Error("无法连接后端服务，请确认 Spring Boot 已启动在 8080 端口");
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`接口返回格式异常（HTTP ${response.status}）`);
    }

    if (!response.ok) {
      const error = new Error(payload?.message || `请求失败（HTTP ${response.status}）`);
      error.status = response.status;
      error.code = payload?.code;
      throw error;
    }
    if (payload?.code !== 0) {
      const error = new Error(payload?.message || "请求失败");
      error.status = response.status;
      error.code = payload?.code;
      throw error;
    }
    return payload.data;
  };
})();
