import React, { useEffect, useState } from 'react';
import { getOAuthStartUrl } from '@/utils/oauthUrls';
import { resolveBrowserApiUrl } from '@/config';
import { OAUTH_POST_LOGIN_REDIRECT_KEY } from '@/utils/rolePaths';

const GoogleIcon = () => (
  <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.3-.9 2.4-1.9 3.1l3 2.3c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-2H12z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.7 0 4.9-.9 6.5-2.4l-3-2.3c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H3.1v2.4C4.7 19.9 8.1 22 12 22z"
    />
    <path
      fill="#4A90E2"
      d="M6.2 14.1c-.2-.6-.4-1.3-.4-2.1s.2-1.5.4-2.1V7.5H3.1C2.4 9 2 10.7 2 12s.4 3 .9 4.5l3.3-2.4z"
    />
    <path
      fill="#FBBC05"
      d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 2.9 14.7 2 12 2 8.1 2 4.7 4.1 3.1 7.5l3.1 2.4C7 7.6 9.3 5.8 12 5.8z"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.005 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
    />
  </svg>
);

const GithubIcon = () => (
  <svg className="size-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

/**
 * @param {{ intent?: 'login'|'register', role?: 'candidate'|'employer', className?: string, returnTo?: string|null }} props
 */
const defaultProviders = { google: true, facebook: true, github: true };

const SocialAuthButtons = ({ intent = 'login', role, className = '', returnTo = null }) => {
  const [enabled, setEnabled] = useState(defaultProviders);
  const [statusLoaded, setStatusLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = resolveBrowserApiUrl('auth/oauth/status');
    fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.providers) return;
        setEnabled({
          google: !!data.providers.google,
          facebook: !!data.providers.facebook,
          github: !!data.providers.github,
        });
      })
      .catch(() => {
        /* giữ mặc định — server cũ không có /oauth/status vẫn dùng được */
      })
      .finally(() => {
        if (!cancelled) setStatusLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const go = (provider) => {
    if (!enabled[provider]) return;
    if (
      returnTo &&
      typeof returnTo === 'string' &&
      returnTo.startsWith('/') &&
      !returnTo.startsWith('//')
    ) {
      try {
        sessionStorage.setItem(OAUTH_POST_LOGIN_REDIRECT_KEY, returnTo);
      } catch {
        /* private mode / quota */
      }
    } else {
      try {
        sessionStorage.removeItem(OAUTH_POST_LOGIN_REDIRECT_KEY);
      } catch {
        /* ignore */
      }
    }
    window.location.assign(getOAuthStartUrl(provider, { intent, role }));
  };

  const anyEnabled = enabled.google || enabled.facebook || enabled.github;

  return (
    <div className={className}>
      {!statusLoaded ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-hidden>
          <div className="h-11 animate-pulse rounded-xl bg-muted/60" />
          <div className="h-11 animate-pulse rounded-xl bg-muted/60" />
          <div className="h-11 animate-pulse rounded-xl bg-muted/60" />
        </div>
      ) : !anyEnabled ? (
        <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground">
          Đăng nhập mạng xã hội chưa được cấu hình trên server (GOOGLE / FACEBOOK / GITHUB). Dùng
          email và mật khẩu hoặc liên hệ quản trị.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            disabled={!enabled.google}
            title={!enabled.google ? 'Chưa cấu hình Google OAuth trên server' : undefined}
            onClick={() => go('google')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/90 bg-white px-3 text-sm font-semibold text-foreground shadow-sm transition hover:border-border hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40"
          >
            <GoogleIcon />
            Google
          </button>
          <button
            type="button"
            disabled={!enabled.facebook}
            title={!enabled.facebook ? 'Chưa cấu hình Facebook OAuth trên server' : undefined}
            onClick={() => go('facebook')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1877F2]/25 bg-[#1877F2] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#166fe5] disabled:pointer-events-none disabled:opacity-40"
          >
            <FacebookIcon />
            Facebook
          </button>
          <button
            type="button"
            disabled={!enabled.github}
            title={!enabled.github ? 'Chưa cấu hình GitHub OAuth trên server' : undefined}
            onClick={() => go('github')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-40"
          >
            <GithubIcon />
            GitHub
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialAuthButtons;
