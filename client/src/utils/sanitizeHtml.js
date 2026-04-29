import DOMPurify from 'dompurify';

/**
 * HTML an toàn cho dangerouslySetInnerHTML (chặn script/on* từ nội dung do employer/admin nhập).
 *
 * Xử lý 3 trường hợp dữ liệu:
 * 1. Dữ liệu đã là HTML thực (backend trả <ul><li>...) → sanitize + cho phép cấu trúc HTML an toàn
 * 2. Dữ liệu là HTML entities đã encode (backend trả &lt;ul&gt;&lt;li&gt;...) → decode NHIỀU LẦN → sanitize
 * 3. Dữ liệu là plain text thuần → wrap trong <p> để hiển thị đúng (giữ whitespace/pre-line)
 *
 * Trường hợp 2 xảy ra khi backend dùng htmlspecialchars() hoặc khi dữ liệu bị encode
 * nhiều lần trong pipeline (double-encoding / triple-encoding).
 *
 * Trường hợp mixed xảy ra khi một trường trong DB có cả phần đúng HTML lẫn phần encode.
 */
export function sanitizeHtml(html) {
  if (html == null) return '';
  const s = String(html);
  if (typeof window === 'undefined') return s;

  // Bước 1: Decode HTML entities NHIỀU LẦN cho đến khi không còn entity nào
  // (xử lý double/triple encoding như &amp;lt; → &lt; → <)
  let decoded = s;
  for (let i = 0; i < 5; i++) {
    const next = decodeHtmlEntities(decoded);
    if (next === decoded) break; // không còn decode được nữa
    decoded = next;
  }

  // Bước 2: Nếu sau khi decode vẫn chỉ là plain text (không có thẻ HTML),
  // thì wrap trong <p> để hiển thị đúng (giữ whitespace/pre-line)
  const wrapped = /<[a-z][\s\S]*>/i.test(decoded)
    ? decoded
    : `<p>${decoded.replace(/\n/g, '<br>')}</p>`;

  // Bước 3: DOMPurify sanitize — loại bỏ script, event handlers, dangerous elements
  return DOMPurify.sanitize(wrapped, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'div', 'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'del', 'ins',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'title', 'alt'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}

/**
 * Decode HTML entities: &lt; → <, &gt; → >, &amp; → &, &quot; → ", &#39; → ', &nbsp; → space
 * Dùng document.createElement('textarea') thay vì regex để decode đầy đủ tất cả named/decimal/hex entities.
 */
function decodeHtmlEntities(str) {
  if (!str) return str;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
}

/**
 * Decode HTML entities (standalone utility — dùng cho text rendering thuần,
 * không dùng dangerouslySetInnerHTML).
 * Decode nhiều lần để xử lý nested/double encoding.
 */
export function decodeHtml(str) {
  if (str == null) return '';
  const s = String(str);
  let decoded = s;
  for (let i = 0; i < 5; i++) {
    const next = decodeHtmlEntities(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}
