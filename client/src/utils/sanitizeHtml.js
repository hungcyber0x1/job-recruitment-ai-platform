import DOMPurify from 'dompurify';

/**
 * HTML an toàn cho dangerouslySetInnerHTML (chặn script/on* từ nội dung do employer/admin nhập).
 */
export function sanitizeHtml(html) {
  if (html == null) return '';
  const s = String(html);
  if (typeof window === 'undefined') return s;
  return DOMPurify.sanitize(s, { USE_PROFILES: { html: true } });
}
