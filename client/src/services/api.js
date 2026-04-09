/**
 * HTTP client dùng cho mọi gọi REST tới backend.
 *
 * - baseURL: từ `../config` (VITE_API_URL), luôn có tiền tố /api khi cần.
 * - Mỗi request: gắn Bearer token nếu có; URL path không có leading slash (axios nối sau baseURL).
 * - FormData: bỏ Content-Type mặc định để trình duyệt gửi multipart có boundary.
 * - 401: xóa session và chuyển /login (trừ khi đang gọi login/register/oauth — tránh vòng lặp).
 */
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config';

/** Chuẩn hóa path sau baseURL (axios ghép URL; bỏ leading slash). */
function normalizeApiPath(url) {
  return typeof url === 'string' ? url.replace(/^\/+/, '') : '';
}

/** Blog đọc công khai: không gửi JWT để tránh 401 từ token hết hạn. */
function isPublicBlogReadPath(path) {
  return path === 'blog/posts' || path.startsWith('blog/posts/');
}

const api = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/+$/, '')}/`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request: chuẩn hóa URL + auth + multipart ---
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
    if (token && !isPublicBlogRead) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response: phiên hết hạn → logout phía client ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const rawUrl = String(error.config?.url || '');
    const isAuthAttempt =
      rawUrl.includes('auth/login') ||
      rawUrl.includes('auth/register') ||
      rawUrl.includes('auth/oauth');
    const isPublicBlogRead = isPublicBlogReadPath(normalizeApiPath(error.config?.url));
    if (error.response?.status === 401 && !isAuthAttempt && !isPublicBlogRead) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
