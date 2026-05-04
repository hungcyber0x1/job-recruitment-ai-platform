import { API_BASE_URL, API_ORIGIN } from '../config';

/**
 * Chuẩn hóa URL ảnh từ API (/uploads/...) để hiển thị đúng khi frontend và backend khác origin.
 */
export function resolveMediaUrl(url) {
  if (url == null || typeof url !== 'string') return '';
  const u = url.trim();
  if (u === '') return '';
  if (u.startsWith('http://') || u.startsWith('blob:') || u.startsWith('data:')) {
    try {
      const parsed = new URL(u);
      const isLoopback = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(parsed.hostname);
      if (import.meta.env.DEV && isLoopback && parsed.pathname.startsWith('/uploads/')) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      // Fall through to the original URL if parsing fails.
    }
    return u;
  }
  if (u.startsWith('https://')) {
    return u;
  }
  if (u.startsWith('/')) {
    if (import.meta.env.DEV && !API_BASE_URL.startsWith('http')) {
      return u;
    }
    return `${API_ORIGIN.replace(/\/+$/, '')}${u}`;
  }
  return u;
}
