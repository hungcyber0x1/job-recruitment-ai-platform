import React, { useEffect, useState } from 'react';
import {
  AtSign,
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import authService from '../../../services/authService';
import userService from '../../../services/userService';
import candidateService from '../../../services/candidateService';

const ALERT_TYPES = [
  { key: 'application_update', label: 'Cập nhật đơn ứng tuyển', desc: 'Thông báo khi hồ sơ thay đổi trạng thái.' },
  { key: 'interview_invite', label: 'Lời mời phỏng vấn', desc: 'Thông báo khi nhà tuyển dụng gửi lịch phỏng vấn.' },
];

const SETTING_SECTIONS = [
  { id: 'security', label: 'Bảo mật', desc: 'Email, mật khẩu', icon: Lock },
  { id: 'notifications', label: 'Thông báo', desc: 'Email, ứng tuyển', icon: Bell },
  { id: 'privacy', label: 'Quyền riêng tư', desc: 'Hiển thị hồ sơ', icon: Eye },
];

function formatPasswordHint(iso) {
  if (!iso) return 'Chưa có dữ liệu';
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return 'Chưa có dữ liệu';
  }
}

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      checked ? 'bg-emerald-600' : 'bg-slate-300'
    )}
  >
    <span
      className={cn(
        'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
        checked && 'translate-x-4'
      )}
    />
  </button>
);

const SettingsCard = ({ icon: Icon, title, subtitle, children, action }) => (
  <Card className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
    <CardContent className="p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </CardContent>
  </Card>
);

const SettingRow = ({ icon: Icon, title, description, meta, action, tone = 'emerald' }) => {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    slate: 'bg-slate-50 text-slate-600 ring-slate-100',
  }[tone];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset', toneClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-slate-950">{title}</p>
          {meta && <p className="mt-1 text-sm font-semibold text-slate-700">{meta}</p>}
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center">{action}</div>}
    </div>
  );
};

const PrivacyOption = ({ active, icon: Icon, title, description, onClick, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'relative rounded-lg border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60',
      active
        ? 'border-emerald-300 bg-emerald-50 shadow-sm shadow-emerald-100/50'
        : 'border-slate-200 bg-slate-50/60 hover:border-emerald-200 hover:bg-emerald-50/30'
    )}
  >
    <div className="flex gap-3 pr-7">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
          active ? 'bg-white text-emerald-700 ring-emerald-100' : 'bg-white text-slate-500 ring-slate-100'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-base font-bold text-slate-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
    {active && (
      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
    )}
  </button>
);

const SettingStatCard = ({ icon: Icon, label, value, helper, tone, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-lg border bg-white p-4 text-left shadow-sm transition-all duration-200',
      active
        ? 'border-emerald-300 bg-emerald-50/60 shadow-emerald-100/50'
        : 'border-slate-200 hover:border-emerald-200 hover:shadow-md'
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="truncate text-2xl font-bold leading-none text-slate-950">{value}</div>
        <div className="mt-1 text-sm font-bold text-slate-700">{label}</div>
        <div className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-500">{helper}</div>
      </div>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset', tone)}>
        <Icon size={18} />
      </div>
    </div>
  </button>
);

const SettingsTabs = ({ activeSection, onChange }) => (
  <div className="overflow-x-auto">
    <div className="flex min-w-max gap-2 pb-1">
      {SETTING_SECTIONS.map(({ id, label, desc, icon: Icon }) => {
        const active = activeSection === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors duration-200',
              active
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
            <span
              className={cn(
                'hidden rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline-flex',
                active ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500'
              )}
            >
              {desc}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const SidebarCard = ({ title, icon: Icon, children, className }) => (
  <Card className={cn('overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm', className)}>
    <CardContent className="p-5">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
        <Icon className="h-4 w-4 text-emerald-600" />
        {title}
      </h3>
      {children}
    </CardContent>
  </Card>
);

const CandidateSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const [activeSection, setActiveSection] = useState('security');
  const [pageLoading, setPageLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);

  const [emailNotif, setEmailNotif] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState('public');

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  const [me, setMe] = useState(null);
  const [alertTypes, setAlertTypes] = useState({
    application_update: true,
    interview_invite: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPageLoading(true);
      try {
        const [meRes, candRes] = await Promise.all([
          authService.getMe(),
          candidateService.getProfile().catch(() => null),
        ]);

        if (cancelled) return;

        const meData = meRes?.data?.data;
        if (meData) {
          setMe(meData);
          setEmailNotif(!(meData.email_notifications === 0 || meData.email_notifications === false));
          if (meData.notification_preferences) {
            setAlertTypes((prev) => ({ ...prev, ...meData.notification_preferences }));
          }
          updateUser(meData);
        }

        const candData = candRes?.data?.data;
        if (candData) {
          setProfileVisibility(candData.profile_visibility === 'private' ? 'private' : 'public');
        }
      } catch (e) {
        console.warn('CandidateSettingsPage fetch error:', e?.message);
        showNotification('Không tải được cài đặt. Thử làm mới trang.', 'error');
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showNotification, updateUser]);

  const hasLocalPassword =
    me?.has_local_password !== undefined
      ? !!me.has_local_password
      : user?.has_local_password !== false;
  const enabledAlertCount = ALERT_TYPES.filter((item) => alertTypes[item.key]).length;

  const summaryCards = [
    {
      id: 'security',
      label: 'Bảo mật',
      value: hasLocalPassword ? 'Đã có' : 'OAuth',
      helper: user?.email || 'Email đăng nhập',
      icon: Lock,
      tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      value: emailNotif ? 'Bật' : 'Tắt',
      helper: `${enabledAlertCount}/${ALERT_TYPES.length} sự kiện chính`,
      icon: Bell,
      tone: 'bg-sky-50 text-sky-600 ring-sky-100',
    },
    {
      id: 'privacy',
      label: 'Hồ sơ',
      value: profileVisibility === 'public' ? 'Công khai' : 'Riêng tư',
      helper: 'Khả năng nhà tuyển dụng tìm thấy bạn',
      icon: Eye,
      tone: 'bg-amber-50 text-amber-600 ring-amber-100',
    },
  ];

  const persistNotifications = async (nextEmail) => {
    setPrefsSaving(true);
    try {
      await userService.updatePreferences({
        email_notifications: nextEmail,
      });
      setEmailNotif(nextEmail);
      const fresh = await authService.getMe();
      const freshUser = fresh?.data?.data;
      if (freshUser) {
        setMe(freshUser);
        updateUser(freshUser);
      }
      showNotification('Đã lưu cài đặt thông báo.', 'success');
    } catch (err) {
      console.warn('CandidateSettingsPage notification save error:', err?.message);
      showNotification(err.response?.data?.message || 'Không lưu được cài đặt thông báo.', 'error');
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
      console.warn('CandidateSettingsPage privacy save error:', err?.message);
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
      const freshUser = fresh?.data?.data;
      if (freshUser) {
        setMe(freshUser);
        updateUser(freshUser);
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Đổi mật khẩu thất bại.', 'error');
    } finally {
      setPwdSubmitting(false);
    }
  };

  const handleAlertToggle = async (key, value) => {
    const next = { ...alertTypes, [key]: value };
    setAlertTypes(next);
    try {
      await userService.updatePreferences({ notification_preferences: next });
    } catch {
      setAlertTypes((prev) => ({ ...prev, [key]: !value }));
      showNotification('Không lưu được loại thông báo này.', 'error');
    }
  };

  const renderActiveSection = () => {
    if (activeSection === 'security') {
      return (
        <SettingsCard
          icon={Lock}
          title="Đăng nhập & bảo mật"
          subtitle="Thông tin đăng nhập cơ bản của ứng viên."
        >
          <div className="space-y-3">
            <SettingRow
              icon={AtSign}
              title="Email đăng nhập"
              meta={user?.email || 'Chưa cập nhật email'}
              description="Dùng để đăng nhập và nhận thông báo hệ thống."
              tone="emerald"
            />
            <SettingRow
              icon={KeyRound}
              title="Mật khẩu"
              description={
                hasLocalPassword
                  ? `Cập nhật lần cuối: ${formatPasswordHint(me?.password_updated_at || user?.password_updated_at)}`
                  : 'Tài khoản đang đăng nhập bằng mạng xã hội.'
              }
              tone="blue"
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasLocalPassword}
                  onClick={() => setPwdOpen(true)}
                  className="h-9 rounded-lg bg-white px-3 text-xs font-bold"
                >
                  Đổi mật khẩu
                </Button>
              }
            />
          </div>
        </SettingsCard>
      );
    }

    if (activeSection === 'notifications') {
      return (
        <SettingsCard
          icon={Bell}
          title="Thông báo tuyển dụng"
          subtitle="Chỉ giữ email và các sự kiện chính phục vụ luồng ứng tuyển."
          action={prefsSaving && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
        >
          <div className="space-y-3">
            <SettingRow
              icon={Mail}
              title="Email"
              description="Nhận cập nhật đơn ứng tuyển và lời mời phỏng vấn qua email."
              tone="emerald"
              action={
                <Toggle
                  checked={emailNotif}
                  disabled={prefsSaving}
                  onChange={(value) => persistNotifications(value)}
                />
              }
            />
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Sự kiện chính</p>
              <div className="space-y-3">
                {ALERT_TYPES.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-inset ring-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.label}</p>
                      <p className="text-xs leading-5 text-slate-500">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={Boolean(alertTypes[item.key])}
                      onChange={(value) => handleAlertToggle(item.key, value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SettingsCard>
      );
    }

    return (
      <SettingsCard
        icon={Eye}
        title="Quyền riêng tư hồ sơ"
        subtitle="Quyết định khả năng nhà tuyển dụng tìm thấy hồ sơ."
        action={privacySaving && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <PrivacyOption
            active={profileVisibility === 'public'}
            disabled={privacySaving}
            icon={Eye}
            title="Công khai"
            description="Nhà tuyển dụng có thể tìm thấy hồ sơ trong khu vực tìm kiếm ứng viên."
            onClick={() => persistPrivacy('public')}
          />
          <PrivacyOption
            active={profileVisibility === 'private'}
            disabled={privacySaving}
            icon={EyeOff}
            title="Riêng tư"
            description="Hạn chế hiển thị công khai, nhưng hồ sơ vẫn được gửi khi bạn ứng tuyển."
            onClick={() => persistPrivacy('private')}
          />
        </div>
      </SettingsCard>
    );
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-50">
        <div className="rounded-lg border border-emerald-100 bg-white px-6 py-5 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Đang tải cài đặt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                <Settings className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  Cài đặt ứng viên
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
                  Cài đặt tài khoản
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
                  Giao diện rút gọn cho báo cáo khóa luận: bảo mật, email thông báo và quyền riêng tư hồ sơ.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaryCards.map(({ id, ...card }) => (
              <SettingStatCard
                key={id}
                {...card}
                active={activeSection === id}
                onClick={() => setActiveSection(id)}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <SettingsTabs activeSection={activeSection} onChange={setActiveSection} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 space-y-4">{renderActiveSection()}</section>

          <aside className="space-y-4">
            <SidebarCard title="Tóm tắt cài đặt" icon={Settings}>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: 'Email', value: emailNotif ? 'Đang bật' : 'Đang tắt' },
                  { label: 'Sự kiện', value: `${enabledAlertCount}/${ALERT_TYPES.length} đang bật` },
                  { label: 'Hồ sơ', value: profileVisibility === 'public' ? 'Công khai' : 'Riêng tư' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{item.label}</span>
                    <span className="text-sm font-bold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </SidebarCard>

            <SidebarCard title="Phạm vi khóa luận" icon={CheckCircle2} className="bg-emerald-50/70">
              <ul className="mt-4 space-y-2.5">
                <li className="flex gap-2 text-sm font-medium text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  Chỉ giữ các chức năng cốt lõi, dễ thuyết minh trong luồng ứng viên.
                </li>
                <li className="flex gap-2 text-sm font-medium text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  Bỏ Push vì chưa cần thiết nếu chưa triển khai Web Push hoàn chỉnh.
                </li>
              </ul>
            </SidebarCard>
          </aside>
        </div>
      </main>

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
                onChange={(event) => setPwdCurrent(event.target.value)}
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
                onChange={(event) => setPwdNew(event.target.value)}
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
                onChange={(event) => setPwdConfirm(event.target.value)}
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setPwdOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={pwdSubmitting}>
                {pwdSubmitting ? 'Đang lưu...' : 'Cập nhật'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateSettingsPage;
