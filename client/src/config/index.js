/**
 * Cấu hình API cho client: base URL, timeout, helper resolve URL (axios, OAuth, fetch).
 * Bật/tắt tính năng dùng FeatureFlagsContext + API admin, không dùng hằng số tại đây.
 * @module config
 */

/**
 * Chuẩn hóa base URL API.
 * Nhiều người đặt VITE_API_URL=http://localhost:5000 (thiếu /api) → mọi request thành /employers/...
 * trong khi gateway chỉ mount tại /api/* → 404.
 */
function normalizeApiBaseUrl(raw) {
  const fallback = '/api';
  if (raw == null || String(raw).trim() === '') return fallback;
  const trimmed = String(raw).replace(/\/+$/, '');
  if (!trimmed.startsWith('http')) {
    const p = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    // "/" hoặc rỗng → mọi resolveApiResourceUrl thành "/auth/..." (thiếu /api) → 404.
    if (p === '/' || p.replace(/\//g, '') === '') return fallback;
    return p;
  }
  try {
    const u = new URL(trimmed);
    if (u.pathname === '/' || u.pathname === '') {
      return `${trimmed}/api`;
    }
  } catch {
    return fallback;
  }
  return trimmed;
}

/**
 * API Configuration
 */
export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
export const API_TIMEOUT = 30000; // 30 seconds
/** Upload PDF + trích xử lý + LLM — vượt quá API_TIMEOUT thường gặp. */
/** Server có retry + đổi model Gemini khi 503 — cần chờ lâu hơn upload thuần. */
export const API_TIMEOUT_AI_CV_MS = 180000; // 3 minutes

/**
 * URL đầy đủ cho fetch() — tránh relative dạng "api/..." gắn nhầm vào path trang (404).
 * @param {string} resourcePath ví dụ "auth/oauth/status" (không có leading slash)
 */
export function resolveApiResourceUrl(resourcePath) {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const rel = String(resourcePath || '').replace(/^\/+/, '');
  if (base.startsWith('http://') || base.startsWith('https://')) {
    const joined = `${base}/${rel}`;
    try {
      return new URL(joined).toString();
    } catch {
      return joined;
    }
  }
  /** Luôn path từ root — fetch/navigate cùng origin với Vite, proxy khớp chắc chắn. */
  const path = `/${base.replace(/^\/+/, '')}/${rel}`.replace(/\/+/g, '/');
  // Base "/" → path "/auth/..." (thiếu /api) → gateway 404.
  if (path.startsWith('/auth/') || path === '/auth') {
    return `/api${path}`.replace(/\/+/g, '/');
  }
  return path;
}

/**
 * URL tuyệt đối cho fetch / window.location trên trình duyệt — tránh URL tương đối "api/..." gắn sau route SPA (/login/... → 404).
 * Giữ nguyên URL tuyệt đối tới gateway khi VITE_API_URL là http(s).
 */
export function resolveBrowserApiUrl(resourcePath) {
  const resolved = resolveApiResourceUrl(resourcePath);
  if (typeof window === 'undefined') return resolved;
  if (resolved.startsWith('http://') || resolved.startsWith('https://')) return resolved;
  const path = resolved.startsWith('/') ? resolved : `/${String(resolved).replace(/^\/+/, '')}`;
  return new URL(path, window.location.origin).href;
}
export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  (typeof window === 'undefined'
    ? 'http://localhost:5000'
    : API_BASE_URL.startsWith('http')
      ? API_BASE_URL.replace(/\/api\/?$/, '')
      : window.location.origin);
