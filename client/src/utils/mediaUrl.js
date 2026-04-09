import { API_ORIGIN } from '../config';

/**
 * Chuẩn hóa URL ảnh từ API (/uploads/...) để hiển thị đúng khi frontend và backend khác origin.
 */
export function resolveMediaUrl(url) {
  if (url == null || typeof url !== 'string') return '';
  const u = url.trim();
  if (u === '') return '';
  if (
    u.startsWith('http://') ||
    u.startsWith('https://') ||
    u.startsWith('blob:') ||
    u.startsWith('data:')
  ) {
    return u;
  }
  if (u.startsWith('/')) {
    return `${API_ORIGIN.replace(/\/+$/, '')}${u}`;
  }
  return u;
}
