/**
 * Mapping thẳng tới /api/auth/* (JWT do axios instance `api` gắn vào header).
 * register/login trả { token, data }; getMe cần token — dùng sau đăng nhập / làm mới session.
 */
import api from './api';

const authService = {
  register: (data) => api.post('auth/register', data),
  login: (data) => api.post('auth/login', data),
  logout: () => {
    // Call backend to invalidate server-side session/token
    // (localStorage removal is handled by AuthContext.logout)
    return api.post('auth/logout').catch(() => {
      // Ignore network errors — logout should always succeed client-side
    });
  },
  getMe: () => api.get('auth/me'),
  updatePassword: (data) => api.put('auth/password', data),
  unlinkOAuth: () => api.post('auth/oauth/unlink'),
};

export default authService;
