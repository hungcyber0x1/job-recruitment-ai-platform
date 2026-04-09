import React, { useState, useEffect } from 'react';
import { Bell, Eye, Lock, Share2, User, Loader2, Github, Facebook } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/utils';
import authService from '../../../services/authService';
import userService from '../../../services/userService';
import candidateService from '../../../services/candidateService';
import { resolveBrowserApiUrl } from '../../../config';
import api from '../../../services/api';

const SECTIONS = [
  { id: 'login', label: 'Đăng nhập & Bảo mật', icon: Lock },
  { id: 'notifications', label: 'Cài đặt thông báo', icon: Bell },
  { id: 'privacy', label: 'Quyền riêng tư', icon: Eye },
  { id: 'social', label: 'Kết nối mạng xã hội', icon: Share2 },
];

const PROVIDER_META = {
  google: { label: 'Google' },
  facebook: { label: 'Facebook', Icon: Facebook },
  github: { label: 'GitHub', Icon: Github },
};

function oauthConnectUrl(provider) {
  const token = localStorage.getItem('token');
  if (!token) return '';
  const base = resolveBrowserApiUrl(`auth/oauth/${provider}`);
  return `${base}?link_token=${encodeURIComponent(token)}`;
}

function formatPasswordHint(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return '—';
  }
}

const CandidateSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const [activeSection, setActiveSection] = useState('login');
  const [pageLoading, setPageLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [oauthProviders, setOauthProviders] = useState({
    google: false,
    facebook: false,
    github: false,
  });
  const [unlinking, setUnlinking] = useState(false);

  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState('public');

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  const [me, setMe] = useState(null);
  const [candidate, setCandidate] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPageLoading(true);
      try {
        const [meRes, candRes, oauthRes] = await Promise.all([
          authService.getMe(),
          candidateService.getProfile().catch(() => null),
          api.get('auth/oauth/status').catch(() => ({ data: {} })),
        ]);

        if (cancelled) return;

        if (oauthRes?.data?.providers) {
          setOauthProviders(oauthRes.data.providers);
        }

        const meData = meRes?.data?.data;
        if (meData) {
          setMe(meData);
          setEmailNotif(
            meData.email_notifications === 0 || meData.email_notifications === false ? false : true
          );
          setPushNotif(meData.push_notifications === 1 || meData.push_notifications === true);
          updateUser(meData);
        }
        const candData = candRes?.data?.data;
        if (candData) {
          setCandidate(candData);
          setProfileVisibility(candData.profile_visibility === 'private' ? 'private' : 'public');
        }
      } catch (e) {
        console.error(e);
        showNotification('Không tải được cài đặt. Thử làm mới trang.', 'error');
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showNotification, updateUser]);

  const displayName =
    user?.fullName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Ứng viên';

  const jobTitle = candidate?.current_job_title || candidate?.title || 'Ứng viên';

  const persistNotifications = async (nextEmail, nextPush) => {
    setPrefsSaving(true);
    try {
      await userService.updatePreferences({
        email_notifications: nextEmail,
        push_notifications: nextPush,
      });
      setEmailNotif(nextEmail);
      setPushNotif(nextPush);
      const fresh = await authService.getMe();
      const u = fresh?.data?.data;
      if (u) {
        setMe(u);
        updateUser(u);
      }
      showNotification('Đã lưu cài đặt thông báo.', 'success');
    } catch (err) {
      console.error(err);
      showNotification(
        err.response?.data?.message || 'Không lưu được. Kiểm tra kết nối hoặc chạy migration DB.',
        'error'
      );
    } finally {
      setPrefsSaving(false);
    }
  };

  const persistPrivacy = async (vis) => {
    setPrivacySaving(true);
    try {
      await candidateService.updateProfile({ profile_visibility: vis });
      setProfileVisibility(vis);
      showNotification('Đã cập nhật quyền riêng tư hồ sơ.', 'success');
    } catch (err) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Không lưu được quyền riêng tư.', 'error');
    } finally {
      setPrivacySaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwdNew.length < 8) {
      showNotification('Mật khẩu mới cần ít nhất 8 ký tự.', 'error');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      showNotification('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }
    setPwdSubmitting(true);
    try {
      await authService.updatePassword({
        currentPassword: pwdCurrent,
        newPassword: pwdNew,
      });
      showNotification('Đổi mật khẩu thành công.', 'success');
      setPwdOpen(false);
      setPwdCurrent('');
      setPwdNew('');
      setPwdConfirm('');
      const fresh = await authService.getMe();
      const u = fresh?.data?.data;
      if (u) {
        setMe(u);
        updateUser(u);
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Đổi mật khẩu thất bại.', 'error');
    } finally {
      setPwdSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await authService.unlinkOAuth();
      showNotification('Đã hủy liên kết mạng xã hội.', 'success');
      const fresh = await authService.getMe();
      const u = fresh?.data?.data;
      if (u) {
        setMe(u);
        updateUser(u);
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Không hủy được liên kết.', 'error');
    } finally {
      setUnlinking(false);
    }
  };

  const Toggle = ({ checked, onChange, disabled }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-emerald-600' : 'bg-muted'
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );

  if (pageLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const hasLocalPassword =
    me?.has_local_password !== undefined
      ? !!me.has_local_password
      : user?.has_local_password !== false;

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Cài đặt tài khoản ứng viên</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bảo mật đăng nhập, thông báo và hiển thị hồ sơ.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="space-y-6">
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 rounded-full border-2 border-muted">
                  <AvatarImage src={user?.avatar_url} alt={displayName} />
                  <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">
                    {displayName.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-3 font-semibold text-foreground">{displayName}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{jobTitle}</p>
              </div>
            </CardContent>
          </Card>
          <nav className="space-y-0.5" aria-label="Mục cài đặt">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors',
                  activeSection === id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-6">
          {activeSection === 'login' && (
            <Card className="rounded-xl border bg-card shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground">Đăng nhập & bảo mật</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Email đăng nhập và mật khẩu cục bộ (nếu có).
                </p>
                <div className="mt-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Email đăng nhập</p>
                        <p className="font-medium text-foreground">{user?.email || '—'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Đổi email cần xác minh — liên hệ hỗ trợ nếu bạn cần cập nhật.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Mật khẩu</p>
                        <p className="text-sm text-muted-foreground">
                          {hasLocalPassword
                            ? `Cập nhật lần cuối: ${formatPasswordHint(me?.password_updated_at || user?.password_updated_at)}`
                            : 'Bạn đang đăng nhập bằng mạng xã hội — không có mật khẩu cục bộ.'}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg border-slate-300 text-foreground hover:bg-slate-50"
                      disabled={!hasLocalPassword}
                      onClick={() => setPwdOpen(true)}
                    >
                      Đổi mật khẩu
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="rounded-xl border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Cài đặt thông báo</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Chọn kênh nhận tin từ nền tảng (lưu ngay khi bật/tắt).
                    </p>
                  </div>
                  {prefsSaving && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
                </div>
                <div className="mt-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <span className="text-sm font-semibold">@</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Thông báo qua email</p>
                        <p className="text-sm text-muted-foreground">
                          Việc làm phù hợp, cập nhật đơn ứng tuyển và lời mời phỏng vấn
                        </p>
                      </div>
                    </div>
                    <Toggle
                      checked={emailNotif}
                      disabled={prefsSaving}
                      onChange={(v) => persistNotifications(v, pushNotif)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Thông báo đẩy (Push)</p>
                        <p className="text-sm text-muted-foreground">
                          Chuẩn bị cho Web Push — bật sẵn tùy chọn; triển khai gửi push sau.
                        </p>
                      </div>
                    </div>
                    <Toggle
                      checked={pushNotif}
                      disabled={prefsSaving}
                      onChange={(v) => persistNotifications(emailNotif, v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'privacy' && (
            <Card className="rounded-xl border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Quyền riêng tư hồ sơ</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Kiểm soát mức độ nhà tuyển dụng có thể khám phá hồ sơ của bạn.
                    </p>
                  </div>
                  {privacySaving && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={privacySaving}
                    onClick={() => persistPrivacy('public')}
                    className={cn(
                      'relative rounded-xl border-2 p-5 text-left transition-colors disabled:opacity-60',
                      profileVisibility === 'public'
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-muted bg-card hover:border-muted-foreground/30'
                    )}
                  >
                    {profileVisibility === 'public' && (
                      <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                        ✓
                      </span>
                    )}
                    <h3 className="font-semibold text-foreground">Công khai</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nhà tuyển dụng có thể tìm thấy và xem hồ sơ trong tìm kiếm ứng viên (khi tính
                      năng được bật).
                    </p>
                  </button>
                  <button
                    type="button"
                    disabled={privacySaving}
                    onClick={() => persistPrivacy('private')}
                    className={cn(
                      'relative rounded-xl border-2 p-5 text-left transition-colors disabled:opacity-60',
                      profileVisibility === 'private'
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-muted bg-card hover:border-muted-foreground/30'
                    )}
                  >
                    <span className="absolute right-4 top-4">
                      {profileVisibility === 'private' ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                          ✓
                        </span>
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </span>
                    <h3 className="font-semibold text-foreground">Riêng tư hơn</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Hạn chế hiển thị công khai; thông tin vẫn gửi kèm khi bạn nộp đơn ứng tuyển.
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'social' && (
            <Card className="rounded-xl border bg-card shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground">Kết nối mạng xã hội</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Đăng nhập nhanh bằng Google, Facebook hoặc GitHub (theo cấu hình server).
                </p>
                <div className="mt-6 space-y-4">
                  {['google', 'facebook', 'github'].map((key) => {
                    const meta = PROVIDER_META[key];
                    if (!meta || !oauthProviders[key]) return null;
                    const linked =
                      String(me?.oauth_provider || user?.oauth_provider || '').toLowerCase() ===
                      key;
                    return (
                      <div
                        key={key}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
                            {key === 'google' ? (
                              <span className="text-lg font-bold text-red-500">G</span>
                            ) : (
                              <meta.Icon
                                className={cn(
                                  'h-5 w-5',
                                  key === 'facebook' ? 'text-[#1877f2]' : 'text-foreground'
                                )}
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{meta.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {linked ? 'Đã liên kết với tài khoản này' : 'Chưa liên kết'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!linked ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-slate-300 text-foreground hover:bg-slate-50"
                              onClick={() => {
                                const url = oauthConnectUrl(key);
                                if (url) window.location.href = url;
                              }}
                            >
                              Liên kết
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-slate-300 text-foreground hover:bg-slate-50"
                              disabled={unlinking || !hasLocalPassword}
                              onClick={handleUnlink}
                            >
                              {unlinking ? 'Đang xử lý…' : 'Hủy liên kết'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {!oauthProviders.google && !oauthProviders.facebook && !oauthProviders.github && (
                    <p className="text-sm text-muted-foreground">
                      Chưa bật OAuth trên server. Thêm biến môi trường Google / Facebook / GitHub để
                      hiện nút liên kết.
                    </p>
                  )}
                  {me?.oauth_provider && !hasLocalPassword && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      Bạn chỉ đăng nhập qua mạng xã hội. Để hủy liên kết, trước tiên cần đặt mật
                      khẩu cục bộ (liên hệ hỗ trợ hoặc dùng luồng đặt mật khẩu khi có).
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cur-pwd">Mật khẩu hiện tại</Label>
              <Input
                id="cur-pwd"
                type="password"
                autoComplete="current-password"
                value={pwdCurrent}
                onChange={(e) => setPwdCurrent(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pwd">Mật khẩu mới (tối thiểu 8 ký tự)</Label>
              <Input
                id="new-pwd"
                type="password"
                autoComplete="new-password"
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-pwd">Xác nhận mật khẩu mới</Label>
              <Input
                id="cf-pwd"
                type="password"
                autoComplete="new-password"
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setPwdOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white"
                disabled={pwdSubmitting}
              >
                {pwdSubmitting ? 'Đang lưu…' : 'Cập nhật'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateSettingsPage;
