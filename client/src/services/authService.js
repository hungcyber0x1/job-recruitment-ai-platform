/**
 * Mapping thẳng tới /api/auth/* (JWT do axios instance `api` gắn vào header).
 * register/login trả { token, data }; getMe cần token — dùng sau đăng nhập / làm mới session.
 */
import api from './api';

const authService = {
  register: (data) => api.post('auth/register', data),
  login: (data) => api.post('auth/login', data),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getMe: () => api.get('auth/me'),
  updatePassword: (data) => api.put('auth/password', data),
  unlinkOAuth: () => api.post('auth/oauth/unlink'),
};

export default authService;
