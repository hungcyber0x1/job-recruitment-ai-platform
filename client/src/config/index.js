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

const DEFAULT_API_ORIGIN = 'http://127.0.0.1:5000';

function normalizeApiOrigin(raw, fallback = DEFAULT_API_ORIGIN) {
  const value = String(raw || '').trim();
  if (!value) return fallback;
  if (!value.startsWith('http://') && !value.startsWith('https://')) return fallback;
  return value.replace(/\/api\/?$/, '').replace(/\/+$/, '');
}

function isLoopbackHostname(hostname) {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(String(hostname || '').trim());
}

function resolveApiOrigin() {
  const explicitOrigin = normalizeApiOrigin(import.meta.env.VITE_API_ORIGIN, '');
  if (explicitOrigin) return explicitOrigin;

  if (API_BASE_URL.startsWith('http')) {
    return normalizeApiOrigin(API_BASE_URL);
  }

  const proxyOrigin = normalizeApiOrigin(import.meta.env.VITE_DEV_PROXY_TARGET, '');

  if (typeof window === 'undefined') {
    return proxyOrigin || DEFAULT_API_ORIGIN;
  }

  /**
   * Local preview/prod-like builds vẫn phải trỏ Socket.IO/API origin về gateway thật.
   * Nếu rơi về window.location.origin ở port 3000, polling /socket.io đi qua Vite proxy
   * và có thể trả HTTP 500 khi proxy target bị lệch hoặc backend đang restart.
   */
  if (proxyOrigin && (import.meta.env.DEV || isLoopbackHostname(window.location.hostname))) {
    return proxyOrigin;
  }

  return window.location.origin;
}

export const API_ORIGIN = resolveApiOrigin();

/**
 * Socket.IO đi thẳng tới gateway thay vì đi qua Vite same-origin proxy.
 * Nếu dùng `window.location.origin` ở dev, polling `/socket.io` có thể nhận HTTP 500 từ proxy
 * khi gateway restart hoặc proxy target lệch cổng, dù Socket.IO server thật vẫn ổn.
 */
export const SOCKET_ORIGIN = normalizeApiOrigin(import.meta.env.VITE_SOCKET_ORIGIN, API_ORIGIN);

// Navigation configurations
export {
  ADMIN_NAV_GROUPS,
  flattenNavItems,
  findNavItem,
  getAdminBadgeCount,
} from './adminNavigation.js';
export {
  CANDIDATE_NAV_GROUPS,
  flattenCandidateNavItems,
  findCandidateNavItem,
  getNavItemBadgeCount,
  CANDIDATE_COMMAND_ITEMS,
} from './candidateNavigation.js';
export {
  EMPLOYER_NAV_GROUPS,
  flattenEmployerNavItems,
  findEmployerNavItem,
  getEmployerBadgeCount,
} from './employerNavigation.js';
