import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AtSign,
  Bell,
  Building2,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Settings,
  User,
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
import { cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import authService from '../../services/authService';
import employerService from '../../services/employerService';
import userService from '../../services/userService';
import { getUserFullName, normalizeCompanyEntity } from '../../utils/domain';

const STORAGE_JOB_TITLE = 'employer_settings_job_title';

const ALERT_TYPES = [
  {
    key: 'new_application',
    label: 'Hồ sơ ứng tuyển mới',
    desc: 'Báo khi có ứng viên mới nộp vào tin tuyển dụng.',
  },
  {
    key: 'interview_reminder',
    label: 'Lịch phỏng vấn',
    desc: 'Nhắc các mốc phỏng vấn và phản hồi quan trọng.',
  },
];

const SETTING_SECTIONS = [
  {
    id: 'account',
    label: 'Tài khoản',
    desc: 'Doanh nghiệp',
    icon: Building2,
  },
  {
    id: 'security',
    label: 'Bảo mật',
    desc: 'Email, mật khẩu',
    icon: Lock,
  },
  {
    id: 'notifications',
    label: 'Thông báo',
    desc: 'Ứng tuyển',
    icon: Bell,
  },
];

const TONE_CLASSES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  slate: 'bg-slate-50 text-slate-600 ring-slate-100',
};

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100';

const LABEL_CLASS = 'text-xs font-bold uppercase tracking-[0.14em] text-slate-400';

function toBool(value, fallback = true) {
  if (value === undefined || value === null) return fallback;
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return fallback;
}

function formatPasswordHint(iso) {
  if (!iso) return 'Chưa có dữ liệu';
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return 'Chưa có dữ liệu';
  }
}

function buildAccountForm(profile, user) {
  const normalizedProfile = normalizeCompanyEntity(profile || {});
  return {
    first_name: normalizedProfile.first_name || user?.first_name || '',
    last_name: normalizedProfile.last_name || user?.last_name || '',
    company_name: normalizedProfile.company_name || user?.company_name || '',
    job_title: localStorage.getItem(STORAGE_JOB_TITLE) || user?.job_title || '',
  };
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

const SettingRow = ({ icon: Icon, title, description, meta, action, tone = 'emerald' }) => (
  <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 gap-3">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
          TONE_CLASSES[tone] || TONE_CLASSES.emerald
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold text-slate-950">{title}</p>
        {meta && <p className="mt-1 break-words text-sm font-semibold text-slate-700">{meta}</p>}
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
    {action && <div className="flex shrink-0 items-center">{action}</div>}
  </div>
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

const SummaryItem = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
    <span className="shrink-0 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
    <span className="min-w-0 truncate text-right text-sm font-bold text-slate-800">{value}</span>
  </div>
);

const EmployerSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const initialUserRef = useRef(user);

  const [activeSection, setActiveSection] = useState('account');
  const [pageLoading, setPageLoading] = useState(true);
  const [accountSaving, setAccountSaving] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);

  const [me, setMe] = useState(null);
  const [accountForm, setAccountForm] = useState(() => buildAccountForm(null, user));
  const [accountSnapshot, setAccountSnapshot] = useState(null);
  const [emailNotif, setEmailNotif] = useState(true);
  const [alertTypes, setAlertTypes] = useState({
    new_application: true,
    interview_reminder: true,
  });

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setPageLoading(true);
      try {
        const [meRes, profileRes, prefRes] = await Promise.all([
          authService.getMe(),
          employerService.getProfile().catch(() => null),
          userService.getPreferences().catch(() => null),
        ]);

        if (cancelled) return;

        const fallbackUser = initialUserRef.current;
        const meData = meRes?.data?.data || fallbackUser;
        const profileData = profileRes?.data?.data || null;
        const preferences = prefRes?.data?.data || {};
        const mergedUser = {
          ...meData,
          notification_preferences:
            preferences.notification_preferences || meData?.notification_preferences,
          email_notifications:
            preferences.email_notifications ?? meData?.email_notifications,
        };

        if (mergedUser) {
          setMe(mergedUser);
          updateUser(mergedUser);
          setEmailNotif(toBool(mergedUser.email_notifications, true));
          if (mergedUser.notification_preferences) {
            setAlertTypes((previous) => ({
              ...previous,
              ...mergedUser.notification_preferences,
            }));
          }
        }

        const nextForm = buildAccountForm(profileData, mergedUser || fallbackUser);
        setAccountForm(nextForm);
        setAccountSnapshot(nextForm);
      } catch (error) {
        console.warn('EmployerSettingsPage fetch error:', error?.message);
        showNotification('Không tải được cài đặt nhà tuyển dụng. Thử làm mới trang.', 'error');
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
      ? Boolean(me.has_local_password)
      : user?.has_local_password !== false;
  const enabledAlertCount = ALERT_TYPES.filter((item) => alertTypes[item.key]).length;
  const recruiterName = getUserFullName(accountForm) || getUserFullName(user) || 'Nhà tuyển dụng';
  const companyName = accountForm.company_name || user?.company_name || 'Chưa cập nhật';
  const jobTitle = accountForm.job_title || 'Phụ trách tuyển dụng';

  const summaryCards = useMemo(
    () => [
      {
        id: 'account',
        label: 'Tài khoản',
        value: accountForm.company_name ? 'Đã cập nhật' : 'Cần bổ sung',
        helper: `${recruiterName} - ${companyName}`,
        icon: Building2,
        tone: 'emerald',
      },
      {
        id: 'security',
        label: 'Bảo mật',
        value: hasLocalPassword ? 'Đã có' : 'OAuth',
        helper: user?.email || me?.email || 'Email đăng nhập',
        icon: Lock,
        tone: 'blue',
      },
      {
        id: 'notifications',
        label: 'Thông báo',
        value: emailNotif ? 'Bật' : 'Tắt',
        helper: `${enabledAlertCount}/${ALERT_TYPES.length} sự kiện chính`,
        icon: Bell,
        tone: 'amber',
      },
    ],
    [accountForm.company_name, companyName, emailNotif, enabledAlertCount, hasLocalPassword, me?.email, recruiterName, user?.email]
  );

  const handleAccountChange = (field, value) => {
    setAccountForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSaveAccount = async (event) => {
    event.preventDefault();
    setAccountSaving(true);
    try {
      const fullName = getUserFullName(accountForm);
      await employerService.updateProfile({
        first_name: accountForm.first_name,
        last_name: accountForm.last_name,
        company_name: accountForm.company_name,
      });
      localStorage.setItem(STORAGE_JOB_TITLE, accountForm.job_title);
      updateUser({
        first_name: accountForm.first_name,
        last_name: accountForm.last_name,
        name: fullName,
        full_name: fullName,
        company_name: accountForm.company_name,
      });
      setAccountSnapshot({ ...accountForm });
      showNotification('Đã lưu cài đặt tài khoản.', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Không lưu được cài đặt tài khoản.', 'error');
    } finally {
      setAccountSaving(false);
    }
  };

  const handleResetAccount = () => {
    if (accountSnapshot) {
      setAccountForm({ ...accountSnapshot });
      showNotification('Đã hoàn tác thay đổi chưa lưu.', 'info');
    }
  };

  const persistEmailNotification = async (nextEmail) => {
    setPrefsSaving(true);
    try {
      await userService.updatePreferences({ email_notifications: nextEmail });
      setEmailNotif(nextEmail);
      const fresh = await authService.getMe();
      const freshUser = fresh?.data?.data;
      if (freshUser) {
        setMe(freshUser);
        updateUser(freshUser);
      }
      showNotification('Đã lưu cài đặt thông báo.', 'success');
    } catch (error) {
      console.warn('EmployerSettingsPage notification save error:', error?.message);
      showNotification(error.response?.data?.message || 'Không lưu được cài đặt thông báo.', 'error');
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleAlertToggle = async (key, value) => {
    const next = { ...alertTypes, [key]: value };
    setAlertTypes(next);
    setPrefsSaving(true);
    try {
      await userService.updatePreferences({ notification_preferences: next });
      showNotification('Đã cập nhật loại thông báo.', 'success');
    } catch (error) {
      setAlertTypes((previous) => ({ ...previous, [key]: !value }));
      showNotification(error.response?.data?.message || 'Không lưu được loại thông báo này.', 'error');
    } finally {
      setPrefsSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
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
    } catch (error) {
      showNotification(error.response?.data?.message || 'Đổi mật khẩu thất bại.', 'error');
    } finally {
      setPwdSubmitting(false);
    }
  };

  const renderAccountSection = () => (
    <SettingsCard
      icon={Building2}
      title="Tài khoản & doanh nghiệp"
      subtitle="Những thông tin nhận diện chính cho không gian tuyển dụng."
      action={accountSaving && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
    >
      <form onSubmit={handleSaveAccount} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={LABEL_CLASS} htmlFor="employer-first-name">
              Họ
            </label>
            <input
              id="employer-first-name"
              value={accountForm.first_name}
              onChange={(event) => handleAccountChange('first_name', event.target.value)}
              className={INPUT_CLASS}
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS} htmlFor="employer-last-name">
              Tên
            </label>
            <input
              id="employer-last-name"
              value={accountForm.last_name}
              onChange={(event) => handleAccountChange('last_name', event.target.value)}
              className={INPUT_CLASS}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={LABEL_CLASS} htmlFor="employer-company-name">
              Tên công ty
            </label>
            <input
              id="employer-company-name"
              value={accountForm.company_name}
              onChange={(event) => handleAccountChange('company_name', event.target.value)}
              className={INPUT_CLASS}
              autoComplete="organization"
            />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS} htmlFor="employer-job-title">
              Chức vụ
            </label>
            <input
              id="employer-job-title"
              value={accountForm.job_title}
              onChange={(event) => handleAccountChange('job_title', event.target.value)}
              className={INPUT_CLASS}
              placeholder="Phụ trách tuyển dụng"
              autoComplete="organization-title"
            />
          </div>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-950">{recruiterName}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {companyName} - {jobTitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={accountSaving}
            onClick={handleResetAccount}
            className="h-10 rounded-lg px-4 text-sm font-bold"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={accountSaving}
            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
          >
            {accountSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </SettingsCard>
  );

  const renderSecuritySection = () => (
    <SettingsCard
      icon={Lock}
      title="Đăng nhập & bảo mật"
      subtitle="Giữ lại email đăng nhập và thao tác đổi mật khẩu cần thiết."
    >
      <div className="space-y-3">
        <SettingRow
          icon={AtSign}
          title="Email đăng nhập"
          meta={user?.email || me?.email || 'Chưa cập nhật email'}
          description="Dùng để đăng nhập và nhận các cập nhật quan trọng của hệ thống."
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

  const renderNotificationsSection = () => (
    <SettingsCard
      icon={Bell}
      title="Thông báo tuyển dụng"
      subtitle="Chỉ giữ email và các sự kiện ảnh hưởng trực tiếp đến quy trình ứng tuyển."
      action={prefsSaving && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
    >
      <div className="space-y-3">
        <SettingRow
          icon={Mail}
          title="Email"
          description="Nhận hồ sơ mới, nhắc lịch phỏng vấn và thay đổi quan trọng qua email."
          tone="emerald"
          action={
            <Toggle
              checked={emailNotif}
              disabled={prefsSaving}
              onChange={(value) => persistEmailNotification(value)}
            />
          }
        />

        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Sự kiện chính
          </p>
          <div className="space-y-3">
            {ALERT_TYPES.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-inset ring-slate-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">{item.label}</p>
                  <p className="text-xs leading-5 text-slate-500">{item.desc}</p>
                </div>
                <Toggle
                  checked={Boolean(alertTypes[item.key])}
                  disabled={prefsSaving}
                  onChange={(value) => handleAlertToggle(item.key, value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SettingsCard>
  );

  const renderActiveSection = () => {
    if (activeSection === 'security') return renderSecuritySection();
    if (activeSection === 'notifications') return renderNotificationsSection();
    return renderAccountSection();
  };

  if (pageLoading) {
    return (
    <div className="flex min-h-[50vh] items-center justify-center bg-slate-50/40">
        <div className="rounded-lg border border-emerald-100 bg-white px-6 py-5 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Đang tải cài đặt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
      <div className="relative overflow-hidden border-b border-slate-200/70 bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_78%)]">
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
                  Cài đặt nhà tuyển dụng
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
                  Cài đặt tài khoản
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
                  Quản lý thông tin doanh nghiệp, bảo mật đăng nhập và thông báo tuyển dụng trong một khu vực gọn hơn.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaryCards.map(({ id, ...card }) => (
              <EmployerStatCard
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
            <SidebarCard title="Tóm tắt tài khoản" icon={Building2}>
              <div className="mt-4 space-y-2.5">
                <SummaryItem label="Doanh nghiệp" value={companyName} />
                <SummaryItem label="Người phụ trách" value={recruiterName} />
                <SummaryItem label="Chức vụ" value={jobTitle} />
              </div>
            </SidebarCard>

            <SidebarCard title="Trạng thái cài đặt" icon={CheckCircle2} className="bg-emerald-50/70">
              <div className="mt-4 space-y-2.5">
                <SummaryItem label="Email" value={emailNotif ? 'Đang bật' : 'Đang tắt'} />
                <SummaryItem label="Sự kiện" value={`${enabledAlertCount}/${ALERT_TYPES.length} đang bật`} />
                <SummaryItem label="Bảo mật" value={hasLocalPassword ? 'Mật khẩu nội bộ' : 'OAuth'} />
              </div>
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
              <Label htmlFor="employer-current-password">Mật khẩu hiện tại</Label>
              <Input
                id="employer-current-password"
                type="password"
                autoComplete="current-password"
                value={pwdCurrent}
                onChange={(event) => setPwdCurrent(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employer-new-password">Mật khẩu mới (tối thiểu 8 ký tự)</Label>
              <Input
                id="employer-new-password"
                type="password"
                autoComplete="new-password"
                value={pwdNew}
                onChange={(event) => setPwdNew(event.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employer-confirm-password">Xác nhận mật khẩu mới</Label>
              <Input
                id="employer-confirm-password"
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

export default EmployerSettingsPage;
