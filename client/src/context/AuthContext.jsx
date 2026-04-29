/**
 * Quan ly phien dang nhap (JWT + user toi gian trong localStorage).
 *
 * Luong chinh:
 * 1. Mo app: co token + user JSON -> hydrate user tu cache, sau do goi GET /auth/me de xac thuc lai.
 * 2. login(email, password): POST /auth/login -> luu token + user.
 * 3. register(payload): tuong tu khi server tra du token + data.role.
 * 4. loginWithToken(jwt): dung sau OAuth / deep link -> set token roi getMe.
 * 5. logout: xoa storage + state.
 *
 * `sanitizeUser` chuan hoa field de UI khong phu thuoc shape raw tu API.
 */
import PropTypes from 'prop-types';
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService';
import { extractAuthResponse, normalizeUserEntity, shouldPersistAuthSession } from '../utils';

const defaultAuthValue = {
  user: null,
  loading: true,
  login: async () => {},
  loginWithToken: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => {},
  isAuthenticated: false,
};

const AUTH_INVALIDATION_EVENT = 'app:auth-invalidated';

/** Export de hooks/useAuth.js dung cung mot Context instance */
export const AuthContext = createContext(defaultAuthValue);

const toBool = (v, defaultVal) => {
  if (v === undefined || v === null) return defaultVal;
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  return defaultVal;
};

const PENDING_RECRUITER_APPROVAL_MESSAGE = 'Tai khoan nha tuyen dung dang cho quan tri vien phe duyet';

function isPendingRecruiterApproval(user) {
  const role = String(user?.role ?? '').trim().toLowerCase();
  const normalizedRole = role === 'employer' ? 'recruiter' : role;
  const status = String(user?.status ?? '').trim().toLowerCase();
  return normalizedRole === 'recruiter' && ['pending', 'pending_verification'].includes(status);
}

/** Chuan hoa object user cho Context + localStorage. */
const sanitizeUser = (data) => {
  if (!data || typeof data !== 'object') return null;
  const normalized = normalizeUserEntity(data);
  return {
    ...normalized,
    email_notifications: toBool(normalized?.email_notifications, true),
    push_notifications: toBool(normalized?.push_notifications, false),
    has_local_password: toBool(normalized?.has_local_password, true),
  };
};

/** Dat o cap module de luon co hop le khi Provider tham chieu (OAuth / hash #token=). */
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
  if (isPendingRecruiterApproval(sanitized)) {
    clearAuth();
    throw new Error(PENDING_RECRUITER_APPROVAL_MESSAGE);
  }
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

        if (!cancelled) {
          setUser(sanitizeUser(parsedUser));
        }

        try {
          const response = await authService.getMe();
          if (cancelled) return;

          const freshUser = response?.data?.data || response?.data?.user || response?.data;

          if (freshUser?.role) {
            const sanitizedFresh = sanitizeUser(freshUser);
            if (isPendingRecruiterApproval(sanitizedFresh)) {
              clearAuth();
              return;
            }
            localStorage.setItem('user', JSON.stringify(sanitizedFresh));
            setUser(sanitizedFresh);
          }
        } catch (error) {
          if (cancelled) return;

          const status = error?.response?.status;
          // Chi huy phien khi server tu choi that su. Loi mang / 5xx giu cache de UX on dinh.
          if (status === 401 || status === 403) {
            clearAuth();
            return;
          }

          console.error('Failed to refresh session:', error);
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
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

  useEffect(() => {
    const handleAuthInvalidated = () => {
      clearAuth();
      setLoading(false);
    };

    window.addEventListener(AUTH_INVALIDATION_EVENT, handleAuthInvalidated);
    return () => {
      window.removeEventListener(AUTH_INVALIDATION_EVENT, handleAuthInvalidated);
    };
  }, [clearAuth]);

  const login = useCallback(async (email, password) => {
    const response = await authService.login({ email, password });
    const body = response.data;
    const { token, userData } = extractAuthResponse(body);

    if (!token || !userData?.role) {
      const msg = body?.message || 'Đăng nhập thất bại — phản hồi không hợp lệ';
      throw new Error(msg);
    }

    if (!shouldPersistAuthSession(body)) {
      clearAuth();
      throw new Error(body?.message || PENDING_RECRUITER_APPROVAL_MESSAGE);
    }

    const sanitizedUser = sanitizeUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(sanitizedUser));
    setUser(sanitizedUser);

    return body;
  }, [clearAuth]);

  const register = useCallback(async (userData) => {
    const response = await authService.register(userData);
    const body = response.data;
    const { token, userData: authUser } = extractAuthResponse(body);

    if (body?.success && authUser?.role) {
      if (shouldPersistAuthSession(body, 'register')) {
        const sanitizedUser = sanitizeUser(authUser);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(sanitizedUser));
        setUser(sanitizedUser);
      }
      return body;
    }

    const msg = body?.message || 'Đăng ký không hoàn tất';
    throw new Error(msg);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('apply_job_id');
    // Dispatch event so other listeners (ChatContext, other tabs) clean up
    window.dispatchEvent(new CustomEvent(AUTH_INVALIDATION_EVENT));
    authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((newData) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = sanitizeUser({ ...prev, ...newData });
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await authService.getMe();
    const freshUser = response?.data?.data || response?.data?.user || response?.data;

    if (!freshUser?.role) {
      clearAuth();
      throw new Error('Invalid user data');
    }

    const sanitizedFresh = sanitizeUser(freshUser);
    if (isPendingRecruiterApproval(sanitizedFresh)) {
      clearAuth();
      throw new Error(PENDING_RECRUITER_APPROVAL_MESSAGE);
    }
    localStorage.setItem('user', JSON.stringify(sanitizedFresh));
    setUser(sanitizedFresh);
    return sanitizedFresh;
  }, [clearAuth]);

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
      refreshUser,
      isAuthenticated: !!user,
    }),
    [user, login, oauthSessionHandler, register, logout, loading, updateUser, refreshUser]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
