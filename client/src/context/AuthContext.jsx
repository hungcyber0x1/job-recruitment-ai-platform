/**
 * Quản lý phiên đăng nhập (JWT + user tối giản trong localStorage).
 *
 * Luồng chính:
 * 1. Mở app: có token + user JSON → hiển thị user ngay; song song gọi GET /auth/me để đồng bộ.
 * 2. login(email, password): POST /auth/login → lưu token + user.
 * 3. register(payload): POST /auth/register → tương tự khi server trả đủ token + data.role.
 * 4. loginWithToken(jwt): dùng sau OAuth / deep link — set token rồi getMe.
 * 5. logout: xóa storage + state.
 *
 * `sanitizeUser` chuẩn hóa field để UI không phụ thuộc shape raw từ API.
 */
import PropTypes from 'prop-types';
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService';

const defaultAuthValue = {
  user: null,
  loading: true,
  login: async () => {},
  loginWithToken: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
  isAuthenticated: false,
};

/** Export để hooks/useAuth.js dùng cùng một Context instance */
export const AuthContext = createContext(defaultAuthValue);

const toBool = (v, defaultVal) => {
  if (v === undefined || v === null) return defaultVal;
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  return defaultVal;
};

/** Chuẩn hóa object user cho Context + localStorage (string an toàn, tránh undefined lẫn lộn) */
const sanitizeUser = (data) => {
  if (!data || typeof data !== 'object') return null;
  return {
    id: data?.id ?? null,
    email: String(data?.email ?? ''),
    first_name: String(data?.first_name ?? ''),
    last_name: String(data?.last_name ?? ''),
    name: String(data?.name ?? ''),
    full_name: String(data?.full_name ?? ''),
    role: String(data?.role ?? ''),
    avatar_url: String(data?.avatar_url ?? ''),
    company_logo: String(data?.company_logo ?? ''),
    company_name: String(data?.company_name ?? ''),
    status: String(data?.status ?? ''),
    oauth_provider: data?.oauth_provider != null ? String(data.oauth_provider) : '',
    email_notifications: toBool(data?.email_notifications, true),
    push_notifications: toBool(data?.push_notifications, false),
    has_local_password: toBool(data?.has_local_password, true),
    password_updated_at: data?.password_updated_at != null ? String(data.password_updated_at) : '',
  };
};

/** Đặt ở cấp module để luôn có hợp lệ khi Provider tham chiếu (OAuth / hash #token=) */
async function applySessionFromToken(token, clearAuth, setUser) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token');
  }
  localStorage.setItem('token', token);
  const response = await authService.getMe();
  const freshUser = response?.data?.data || response?.data?.user || response?.data;
  if (!freshUser?.role) {
    clearAuth();
    throw new Error('Invalid user data');
  }
  const sanitized = sanitizeUser(freshUser);
  localStorage.setItem('user', JSON.stringify(sanitized));
  setUser(sanitized);
  return sanitized;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!storedUser || storedUser === 'undefined' || storedUser === 'null' || !token) {
        if (!cancelled) {
          clearAuth();
          setLoading(false);
        }
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);

        if (!parsedUser?.role) {
          throw new Error('Invalid user data');
        }

        // Bước A: hiển thị nhanh từ cache (không chặn UI chờ mạng)
        if (!cancelled) {
          setUser(sanitizeUser(parsedUser));
          setLoading(false);
        }

        // Bước B: làm mới từ server — token hết hạn / user đổi role → clearAuth
        (async () => {
          try {
            const response = await authService.getMe();
            if (cancelled) return;

            const freshUser = response?.data?.data || response?.data?.user || response?.data;

            if (freshUser?.role) {
              const sanitizedFresh = sanitizeUser(freshUser);
              localStorage.setItem('user', JSON.stringify(sanitizedFresh));
              setUser(sanitizedFresh);
            }
          } catch (error) {
            if (cancelled) return;
            const status = error?.response?.status;
            // Chỉ hủy phiên khi server từ chối thật sự — lỗi mạng / 5xx giữ cache để UX ổn định.
            if (status === 401 || status === 403) {
              clearAuth();
              return;
            }
            console.error('Failed to refresh session:', error);
          }
        })();
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to restore auth state:', error);
          clearAuth();
          setLoading(false);
        }
      }
    };

    initAuth();
    return () => {
      cancelled = true;
    };
  }, [clearAuth]);

  const login = useCallback(async (email, password) => {
    const response = await authService.login({ email, password });
    const body = response.data;
    const { token, data: userData } = body || {};

    if (!token || !userData?.role) {
      const msg = body?.message || 'Đăng nhập thất bại — phản hồi không hợp lệ';
      throw new Error(msg);
    }

    const sanitizedUser = sanitizeUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(sanitizedUser));
    setUser(sanitizedUser);

    return body;
  }, []);

  const register = useCallback(async (userData) => {
    const response = await authService.register(userData);
    const body = response.data;

    if (body?.success && body.token && body.data?.role) {
      const sanitizedUser = sanitizeUser(body.data);
      localStorage.setItem('token', body.token);
      localStorage.setItem('user', JSON.stringify(sanitizedUser));
      setUser(sanitizedUser);
      return body;
    }

    const msg = body?.message || 'Đăng ký không hoàn tất';
    throw new Error(msg);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((newData) => {
    setUser((prev) => {
      const updated = sanitizeUser({ ...prev, ...newData });
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const oauthSessionHandler = useCallback(
    (token) => applySessionFromToken(token, clearAuth, setUser),
    [clearAuth]
  );

  const contextValue = useMemo(
    () => ({
      user,
      login,
      loginWithToken: oauthSessionHandler,
      register,
      logout,
      loading,
      updateUser,
      isAuthenticated: !!user,
    }),
    [user, login, oauthSessionHandler, register, logout, loading, updateUser]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
