import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import {
  getDashboardPath,
  getSafePostAuthRedirect,
  OAUTH_POST_LOGIN_REDIRECT_KEY,
} from '@/utils/rolePaths';
import Loading from '@/components/common/Loading.jsx';

/**
 * Nhận token từ hash (#token=...) hoặc lỗi từ query (?error=...) sau redirect OAuth.
 */
const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { showNotification } = useNotification();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const finish = async () => {
      const err = searchParams.get('error');
      if (err) {
        showNotification(decodeURIComponent(err), 'error');
        navigate('/login', { replace: true });
        return;
      }

      const hash = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hash);
      const token = hashParams.get('token');

      if (!token) {
        showNotification('Không nhận được mã đăng nhập từ nhà cung cấp.', 'error');
        navigate('/login', { replace: true });
        return;
      }

      try {
        const user = await loginWithToken(token);
        showNotification('Đăng nhập thành công!', 'success');
        let stored = null;
        try {
          stored = sessionStorage.getItem(OAUTH_POST_LOGIN_REDIRECT_KEY);
          sessionStorage.removeItem(OAUTH_POST_LOGIN_REDIRECT_KEY);
        } catch {
          /* ignore */
        }
        const next = getSafePostAuthRedirect(stored, user.role) || getDashboardPath(user.role);
        navigate(next, { replace: true });
      } catch (e) {
        showNotification(e?.response?.data?.message || 'Không thể hoàn tất đăng nhập.', 'error');
        navigate('/login', { replace: true });
      }
    };

    finish();
  }, [loginWithToken, navigate, searchParams, showNotification]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 pt-32">
      <Loading />
      <p className="text-sm text-muted-foreground">Đang hoàn tất đăng nhập…</p>
    </div>
  );
};

export default OAuthCallbackPage;
