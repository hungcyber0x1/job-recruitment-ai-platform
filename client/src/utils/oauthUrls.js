import { resolveBrowserApiUrl } from '@/config';

/**
 * URL bắt đầu OAuth (gateway → proxy auth-service).
 * Dùng cùng base với axios (`API_BASE_URL`), không dùng `API_ORIGIN` + `/api/auth/...`:
 * nếu VITE_API_ORIGIN trỏ frontend (3000) mà VITE_API_URL trỏ gateway (5000) thì full navigation OAuth sẽ 404.
 * @param {'google'|'facebook'|'github'} provider
 * @param {{ intent: 'login'|'register', role?: 'candidate'|'recruiter' }} options
 */
export function getOAuthStartUrl(provider, { intent, role } = {}) {
  const qs = new URLSearchParams();
  qs.set('intent', intent === 'register' ? 'register' : 'login');
  if (role === 'recruiter' || role === 'candidate') {
    qs.set('role', role);
  }
  const baseUrl = resolveBrowserApiUrl(`auth/oauth/${provider}`);
  const qsStr = qs.toString();
  return qsStr ? `${baseUrl}?${qsStr}` : baseUrl;
}
