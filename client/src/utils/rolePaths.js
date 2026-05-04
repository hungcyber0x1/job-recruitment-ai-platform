/**
 * Điều hướng theo vai trò (admin / recruiter / candidate) để tránh lẫn khu vực.
 */

/** Lưu trước khi redirect OAuth; OAuthCallback đọc để quay lại đúng trang. */
export const OAUTH_POST_LOGIN_REDIRECT_KEY = 'oauth_post_login_redirect';

export function normalizeAuthRole(role) {
  return String(role ?? '')
    .trim()
    .toLowerCase();
}

/** URL dashboard mặc định theo role sau đăng nhập. */
export function getDashboardPath(role) {
  const normalizedRole = normalizeAuthRole(role);
  if (normalizedRole === 'admin') return '/admin/dashboard';
  if (normalizedRole === 'recruiter') return '/employer/dashboard';
  if (normalizedRole === 'candidate') return '/candidate/dashboard';
  return '/';
}

/** URL hồ sơ mặc định theo role. */
export function getProfilePath(role) {
  const normalizedRole = normalizeAuthRole(role);
  if (normalizedRole === 'admin') return '/admin/profile';
  if (normalizedRole === 'recruiter') return '/employer/profile';
  if (normalizedRole === 'candidate') return '/candidate/profile';
  return '/';
}

/** URL cài đặt mặc định theo role. */
export function getSettingsPath(role) {
  const normalizedRole = normalizeAuthRole(role);
  if (normalizedRole === 'admin') return '/admin/settings';
  if (normalizedRole === 'recruiter') return '/employer/settings';
  if (normalizedRole === 'candidate') return '/candidate/settings';
  return '/';
}

/**
 * Kiểm tra pathname có thuộc khu vực chỉ dành cho một role hay không.
 * Trả true nếu path là public hoặc khớp role hiện tại.
 */
export function isPathAllowedForRole(role, pathname) {
  const normalizedRole = normalizeAuthRole(role);
  if (!pathname || pathname === '/') return true;
  if (pathname.startsWith('/admin')) return normalizedRole === 'admin';
  if (pathname.startsWith('/employer')) return normalizedRole === 'recruiter';
  if (pathname.startsWith('/candidate')) return normalizedRole === 'candidate';
  return true;
}

const AUTH_LOOP_PATHS = ['/login', '/register', '/oauth/callback'];

/**
 * URL nội bộ hợp lệ (một dấu / đầu, không open-redirect).
 * Dùng trước khi biết role (ví dụ lưu trước OAuth từ trang đăng nhập).
 */
export function getSafeRedirectShapeOnly(raw) {
  if (raw == null || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || /[\s\r\n]/.test(trimmed)) {
    return null;
  }
  if (trimmed.includes('://')) return null;
  if (trimmed.length > 2048) return null;

  const pathname = trimmed.split('?')[0].split('#')[0];
  if (AUTH_LOOP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return trimmed;
}

/**
 * Chuẩn hóa URL sau đăng nhập (kèm kiểm tra khu vực theo role).
 */
export function getSafePostAuthRedirect(raw, role) {
  const trimmed = getSafeRedirectShapeOnly(raw);
  if (!trimmed) return null;
  const pathname = trimmed.split('?')[0].split('#')[0];
  if (!isPathAllowedForRole(role, pathname)) return null;
  return trimmed;
}
