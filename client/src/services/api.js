/**
 * HTTP client dung cho moi goi REST toi backend.
 *
 * - baseURL: tu `../config` (VITE_API_URL), luon co tien to /api khi can.
 * - Moi request: gan Bearer token neu co; URL path khong co leading slash (axios noi sau baseURL).
 * - FormData: bo Content-Type mac dinh de trinh duyet gui multipart co boundary.
 * - 401/403 o namespace dashboard bao ve: xoa session, dong bo AuthContext va chuyen /login.
 */
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config';

/** Chuan hoa path sau baseURL (axios ghep URL; bo leading slash va trailing slash). */
function normalizeApiPath(url) {
  return typeof url === 'string' ? url.replace(/^\/+/, '').replace(/\/+$/, '') : '';
}

/** Blog doc cong khai: khong gui JWT de tranh 401 tu token het han. */
function isPublicBlogReadPath(path) {
  return path === 'blog/taxonomy' || path === 'blog/posts' || path.startsWith('blog/posts/');
}

/** Newsletter công khai: không cần JWT, tránh token hết hạn làm hỏng đăng ký. */
function isPublicNewsletterPath(path) {
  return path === 'newsletter/subscribe';
}

function isPublicAuthPath(path) {
  if (path === 'auth/login' || path === 'auth/register' || path === 'auth/oauth/status') {
    return true;
  }

  return /^auth\/oauth\/(google|facebook|github)(\/callback)?$/.test(path);
}

const KNOWN_MISSING_ENDPOINTS = [
  'candidates/privacy',
  'candidates/cv-access-logs',
  'candidates/recruiter-views',
  'candidates/data-export',
  'candidates/account-deletion',
  'applications/notes',
];

const AUTH_INVALIDATION_EVENT = 'app:auth-invalidated';

function shouldForceLogoutOn403(path) {
  return path === 'auth/me' || path === 'admin' || path.startsWith('admin/');
}

function invalidateAuthSession(status, path) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(AUTH_INVALIDATION_EVENT, {
        detail: { status, path },
      })
    );

    if (!window.location.pathname.startsWith('/login')) {
      window.history.pushState(null, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }
}

const api = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/+$/, '')}/`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  silent404s: KNOWN_MISSING_ENDPOINTS,
});

// --- Request: chuan hoa URL + auth + multipart ---
api.interceptors.request.use(
  (config) => {
    if (typeof config.url === 'string') {
      config.url = normalizeApiPath(config.url);
    }

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const token = localStorage.getItem('token');
    const path = typeof config.url === 'string' ? config.url : '';
    const isPublicBlogRead = isPublicBlogReadPath(path);
    const isPublicNewsletter = isPublicNewsletterPath(path);
    const isPublicAuth = isPublicAuthPath(path);
    if (token && !isPublicBlogRead && !isPublicNewsletter && !isPublicAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response: phien het han hoac role khong hop le -> logout phia client ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const rawUrl = String(error.config?.url || '');
    const path = normalizeApiPath(error.config?.url);
    const isAuthAttempt =
      isPublicAuthPath(path) || rawUrl.includes('auth/login') || rawUrl.includes('auth/register');
    const isPublicBlogRead = isPublicBlogReadPath(path);
    const isPublicNewsletter = isPublicNewsletterPath(path);

    if (
      error.response?.status === 401 &&
      !isAuthAttempt &&
      !isPublicBlogRead &&
      !isPublicNewsletter
    ) {
      invalidateAuthSession(401, path);
      return Promise.reject({ ...error, _authHandled: true });
    }

    if (
      error.response?.status === 403 &&
      !isAuthAttempt &&
      !isPublicBlogRead &&
      !isPublicNewsletter
    ) {
      if (shouldForceLogoutOn403(path)) {
        invalidateAuthSession(403, path);
        return Promise.reject({ ...error, _authHandled: true });
      }
    }

    const isKnownMissing =
      error.response?.status === 404 &&
      KNOWN_MISSING_ENDPOINTS.some((ep) => path === ep || path.includes(ep));
    if (isKnownMissing) {
      return Promise.reject({ ...error, _suppressed: true });
    }

    return Promise.reject(error);
  }
);

export default api;
