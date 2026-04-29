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
  return path === 'blog/posts' || path.startsWith('blog/posts/');
}

function isPublicAuthPath(path) {
  return path === 'auth/login' || path === 'auth/register' || path.startsWith('auth/oauth');
}

const KNOWN_FORBIDDEN_NON_LOGOUT_ENDPOINTS = [
  'messages/',
];

const KNOWN_MISSING_ENDPOINTS = [
  'candidates/privacy',
  'candidates/cv-access-logs',
  'candidates/recruiter-views',
  'notifications/me',
  'notifications/recruiter',
  'notifications/admin',
  'candidates/data-export',
  'candidates/account-deletion',
  'applications/notes',
];

const AUTH_INVALIDATION_EVENT = 'app:auth-invalidated';

function shouldForceLogoutOn403(path) {
  if (path === 'auth/me') return true;
  if (KNOWN_FORBIDDEN_NON_LOGOUT_ENDPOINTS.some((prefix) => path.startsWith(prefix))) return false;
  const protectedPrefixes = [
    'admin/',
    'candidates/',
    'notifications/',
    'applications/',
    'users/',
    'employers/',
    'chat/',
  ];
  return protectedPrefixes.some((prefix) => path.startsWith(prefix));
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
    const isPublicAuth = isPublicAuthPath(path);
    if (token && !isPublicBlogRead && !isPublicAuth) {
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
      rawUrl.includes('auth/login') ||
      rawUrl.includes('auth/register') ||
      rawUrl.includes('auth/oauth');
    const isPublicBlogRead = isPublicBlogReadPath(path);

    if (error.response?.status === 401 && !isAuthAttempt && !isPublicBlogRead) {
      invalidateAuthSession(401, path);
      return Promise.reject({ ...error, _authHandled: true });
    }

    if (error.response?.status === 403 && !isAuthAttempt && !isPublicBlogRead) {
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
