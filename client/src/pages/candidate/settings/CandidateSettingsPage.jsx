import React, { useEffect, useMemo, useState } from 'react';
import {
  AtSign,
  BadgeCheck,
  Bell,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Fingerprint,
  Info,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Settings,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import StatCard from '@/components/common/StatCard';
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
  {
    key: 'application_update',
    label: 'Cập nhật đơn ứng tuyển',
    desc: 'Thông báo khi hồ sơ thay đổi trạng thái.',
    icon: CalendarCheck2,
  },
  {
    key: 'interview_invite',
    label: 'Lời mời phỏng vấn',
    desc: 'Thông báo khi nhà tuyển dụng gửi lịch phỏng vấn.',
    icon: UserCheck,
  },
];

const SETTING_SECTIONS = [
  { id: 'security', label: 'Bảo mật', desc: 'Email, mật khẩu', icon: Lock },
  { id: 'notifications', label: 'Thông báo', desc: 'Email, ứng tuyển', icon: Bell },
  { id: 'privacy', label: 'Quyền riêng tư', desc: 'Hiển thị hồ sơ', icon: Eye },
];

const PASSWORD_RULES = [
  { label: 'Tối thiểu 8 ký tự', test: (value) => value.length >= 8 },
  {
    label: 'Có chữ hoa và chữ thường',
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  { label: 'Có số hoặc ký tự đặc biệt', test: (value) => /[0-9\W_]/.test(value) },
];

function formatPasswordHint(iso) {
  if (!iso) return 'Chưa có dữ liệu';
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return 'Chưa có dữ liệu';
  }
}

function getPasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: 'Chưa nhập mật khẩu mới',
      barClass: 'bg-slate-200',
      textClass: 'text-slate-500',
      width: '0%',
    };
  }

  const score = PASSWORD_RULES.reduce((total, rule) => total + (rule.test(password) ? 1 : 0), 0);

  if (score >= 3) {
    return {
      score,
      label: 'Mạnh',
      barClass: 'bg-emerald-500',
      textClass: 'text-emerald-700',
      width: '100%',
    };
  }

  if (score === 2) {
    return {
      score,
      label: 'Khá',
      barClass: 'bg-amber-500',
      textClass: 'text-amber-700',
      width: '66%',
    };
  }

  return {
    score,
    label: 'Yếu',
    barClass: 'bg-rose-500',
    textClass: 'text-rose-700',
    width: '33%',
  };
}

const Toggle = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      checked
        ? 'border-emerald-500 bg-emerald-600 shadow-sm shadow-emerald-900/20'
        : 'border-slate-300 bg-slate-200'
    )}
  >
    <span
      className={cn(
        'inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0.5'
      )}
    />
  </button>
);

const StatusBadge = ({ children, tone = 'emerald', icon: Icon = CheckCircle2 }) => {
  const toneClass = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold',
        toneClass
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
};

const SettingsCard = ({ icon: Icon, title, subtitle, badge, children, action }) => (
  <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70">
    <CardContent className="p-0">
      <div className="border-b border-slate-100 bg-gradient-to-r from-white via-emerald-50/40 to-white px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-900/20">
              <Icon className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">
                  {title}
                </h2>
                {badge}
              </div>
              <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                {subtitle}
              </p>
            </div>
          </div>
          {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </CardContent>
  </Card>
);

const SettingRow = ({ icon: Icon, title, description, meta, action, badge, tone = 'emerald' }) => {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    blue: 'bg-sky-50 text-sky-700 ring-sky-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    slate: 'bg-slate-50 text-slate-600 ring-slate-100',
  }[tone];

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3.5">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
              toneClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-extrabold text-slate-950">{title}</p>
              {badge}
            </div>
            {meta ? (
              <p className="mt-1 break-words text-sm font-bold text-slate-700">{meta}</p>
            ) : null}
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {action ? <div className="flex shrink-0 items-center justify-end">{action}</div> : null}
      </div>
    </div>
  );
};

const InfoStrip = ({ icon: Icon = Info, title, children, tone = 'emerald' }) => {
  const toneClass = {
    emerald: 'border-emerald-100 bg-emerald-50/70 text-emerald-800',
    sky: 'border-sky-100 bg-sky-50/70 text-sky-800',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-800',
  }[tone];

  return (
    <div className={cn('rounded-2xl border px-4 py-3', toneClass)}>
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-extrabold">{title}</p>
          <p className="mt-1 text-sm leading-6 opacity-85">{children}</p>
        </div>
      </div>
    </div>
  );
};

const PrivacyOption = ({ active, icon: Icon, title, description, onClick, disabled, note }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'relative rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
      active
        ? 'border-emerald-300 bg-emerald-50 shadow-sm shadow-emerald-100/70 ring-1 ring-emerald-100'
        : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-md hover:shadow-emerald-50'
    )}
  >
    <div className="flex gap-3 pr-8">
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
          active
            ? 'bg-white text-emerald-700 ring-emerald-100'
            : 'bg-slate-50 text-slate-500 ring-slate-100'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-base font-extrabold text-slate-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        {note ? (
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {note}
          </p>
        ) : null}
      </div>
    </div>
    {active ? (
      <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm shadow-emerald-900/20">
        <CheckCircle2 className="h-4 w-4" />
      </span>
    ) : null}
  </button>
);

const SettingsTabs = ({ activeSection, onChange }) => (
  <div className="overflow-x-auto">
    <div className="flex min-w-max gap-2 p-1">
      {SETTING_SECTIONS.map(({ id, label, desc, icon: Icon }) => {
        const active = activeSection === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex min-h-12 items-center gap-2.5 rounded-xl border px-4 text-sm font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
              active
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-900/20'
                : 'border-transparent bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <span
              className={cn(
                'hidden rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline-flex',
                active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
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
  <Card
    className={cn(
      'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70',
      className
    )}
  >
    <CardContent className="p-5">
      <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-950">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h3>
      {children}
    </CardContent>
  </Card>
);

const SummaryItem = ({ label, value, helper, icon: Icon, tone = 'emerald' }) => {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
            toneClass
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {helper ? <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p> : null}
    </div>
  );
};

const CandidateSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const [activeSection, setActiveSection] = useState('security');
  const [pageLoading, setPageLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [alertSavingKey, setAlertSavingKey] = useState(null);
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
          setEmailNotif(
            !(meData.email_notifications === 0 || meData.email_notifications === false)
          );
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
  const accountEmail = me?.email || user?.email || 'Chưa cập nhật email';
  const passwordUpdatedAt = formatPasswordHint(
    me?.password_updated_at || user?.password_updated_at
  );
  const passwordStrength = useMemo(() => getPasswordStrength(pwdNew), [pwdNew]);
  const passwordMatched = pwdConfirm.length === 0 || pwdNew === pwdConfirm;

  const summaryCards = [
    {
      id: 'security',
      label: 'Bảo mật',
      value: hasLocalPassword ? 'Đã thiết lập' : 'OAuth',
      helper: accountEmail,
      icon: ShieldCheck,
      tone: 'emerald',
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      value: emailNotif ? 'Đang bật' : 'Đang tắt',
      helper: `${enabledAlertCount}/${ALERT_TYPES.length} sự kiện chính đang bật`,
      icon: Bell,
      tone: 'sky',
    },
    {
      id: 'privacy',
      label: 'Hồ sơ',
      value: profileVisibility === 'public' ? 'Công khai' : 'Riêng tư',
      helper: 'Kiểm soát khả năng nhà tuyển dụng tìm thấy bạn',
      icon: Eye,
      tone: 'amber',
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
    if (privacySaving || vis === profileVisibility) return;
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
    if (alertSavingKey) return;

    const next = { ...alertTypes, [key]: value };
    setAlertTypes(next);
    setAlertSavingKey(key);
    try {
      await userService.updatePreferences({ notification_preferences: next });
      showNotification('Đã lưu loại thông báo.', 'success');
    } catch {
      setAlertTypes((prev) => ({ ...prev, [key]: !value }));
      showNotification('Không lưu được loại thông báo này.', 'error');
    } finally {
      setAlertSavingKey(null);
    }
  };

  const renderActiveSection = () => {
    if (activeSection === 'security') {
      return (
        <SettingsCard
          icon={ShieldCheck}
          title="Đăng nhập & bảo mật"
          subtitle="Kiểm soát thông tin đăng nhập và lớp bảo vệ cốt lõi cho tài khoản ứng viên."
          badge={<StatusBadge tone="emerald">Đang bảo vệ</StatusBadge>}
        >
          <div className="space-y-4">
            <InfoStrip title="Nguyên tắc bảo mật" icon={Fingerprint}>
              Email là định danh chính để đăng nhập, nhận thông báo hệ thống và khôi phục tài khoản
              khi cần.
            </InfoStrip>

            <SettingRow
              icon={AtSign}
              title="Email đăng nhập"
              meta={accountEmail}
              description="Dùng để đăng nhập, nhận thông báo hệ thống và đồng bộ các cập nhật trong quá trình ứng tuyển."
              tone="emerald"
              badge={
                <StatusBadge tone="sky" icon={BadgeCheck}>
                  Định danh chính
                </StatusBadge>
              }
            />

            <SettingRow
              icon={KeyRound}
              title="Mật khẩu"
              meta={
                hasLocalPassword
                  ? `Cập nhật lần cuối: ${passwordUpdatedAt}`
                  : 'Tài khoản đang đăng nhập bằng mạng xã hội'
              }
              description={
                hasLocalPassword
                  ? 'Nên dùng mật khẩu mạnh, không trùng với email hoặc các dịch vụ khác.'
                  : 'Bạn có thể tiếp tục dùng phương thức đăng nhập mạng xã hội đã liên kết.'
              }
              tone="blue"
              badge={
                <StatusBadge tone={hasLocalPassword ? 'emerald' : 'slate'}>
                  {hasLocalPassword ? 'Cục bộ' : 'OAuth'}
                </StatusBadge>
              }
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasLocalPassword}
                  onClick={() => setPwdOpen(true)}
                  className="h-10 rounded-xl border-slate-200 bg-white px-4 text-sm font-extrabold shadow-sm hover:border-emerald-200 hover:bg-emerald-50"
                >
                  Đổi mật khẩu
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              }
            />

            <div className="grid gap-3 md:grid-cols-2">
              {[
                'Không chia sẻ mật khẩu hoặc mã xác thực cho bất kỳ ai.',
                'Đăng xuất khỏi thiết bị lạ sau khi hoàn tất phiên làm việc.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="text-sm font-semibold leading-6 text-slate-600">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SettingsCard>
      );
    }

    if (activeSection === 'notifications') {
      return (
        <SettingsCard
          icon={Bell}
          title="Thông báo tuyển dụng"
          subtitle="Cấu hình email và các sự kiện quan trọng để không bỏ lỡ cập nhật ứng tuyển."
          badge={
            <StatusBadge tone={emailNotif ? 'emerald' : 'slate'}>
              {emailNotif ? 'Email đang bật' : 'Email đang tắt'}
            </StatusBadge>
          }
          action={
            prefsSaving ? <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> : null
          }
        >
          <div className="space-y-4">
            <SettingRow
              icon={Mail}
              title="Email thông báo"
              description="Nhận cập nhật đơn ứng tuyển, lịch phỏng vấn và các thông báo hệ thống cần thiết qua email."
              tone="emerald"
              badge={
                <StatusBadge tone={emailNotif ? 'emerald' : 'slate'}>
                  {emailNotif ? 'Đang nhận' : 'Tạm tắt'}
                </StatusBadge>
              }
              action={
                <Toggle
                  label="Bật hoặc tắt email thông báo"
                  checked={emailNotif}
                  disabled={prefsSaving}
                  onChange={(value) => persistNotifications(value)}
                />
              }
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">
                    Sự kiện chính
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Chọn loại cập nhật nghiệp vụ bạn muốn theo dõi trong hành trình ứng tuyển.
                  </p>
                </div>
                <StatusBadge tone="sky" icon={Bell}>
                  {enabledAlertCount}/{ALERT_TYPES.length} đang bật
                </StatusBadge>
              </div>

              <div className="space-y-3">
                {ALERT_TYPES.map((item) => {
                  const Icon = item.icon;
                  const checked = Boolean(alertTypes[item.key]);
                  const saving = alertSavingKey === item.key;

                  return (
                    <div
                      key={item.key}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-extrabold text-slate-900">{item.label}</p>
                            <StatusBadge tone={checked ? 'emerald' : 'slate'}>
                              {checked ? 'Bật' : 'Tắt'}
                            </StatusBadge>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        ) : null}
                        <Toggle
                          label={`Bật hoặc tắt ${item.label}`}
                          checked={checked}
                          disabled={Boolean(alertSavingKey) || prefsSaving}
                          onChange={(value) => handleAlertToggle(item.key, value)}
                        />
                      </div>
                    </div>
                  );
                })}
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
        subtitle="Quyết định cách hồ sơ ứng viên được hiển thị với nhà tuyển dụng trên nền tảng."
        badge={
          <StatusBadge tone={profileVisibility === 'public' ? 'emerald' : 'amber'}>
            {profileVisibility === 'public' ? 'Đang công khai' : 'Đang riêng tư'}
          </StatusBadge>
        }
        action={
          privacySaving ? <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> : null
        }
      >
        <div className="space-y-4">
          <InfoStrip title="Luồng nghiệp vụ vẫn được giữ nguyên" icon={Info} tone="amber">
            Khi bạn ứng tuyển vào một vị trí, hồ sơ vẫn được gửi cho nhà tuyển dụng tương ứng dù
            đang chọn chế độ riêng tư.
          </InfoStrip>

          <div className="grid gap-3 md:grid-cols-2">
            <PrivacyOption
              active={profileVisibility === 'public'}
              disabled={privacySaving}
              icon={Eye}
              title="Công khai"
              description="Nhà tuyển dụng có thể tìm thấy hồ sơ trong khu vực tìm kiếm ứng viên và chủ động liên hệ khi phù hợp."
              note="Tăng cơ hội được tiếp cận"
              onClick={() => persistPrivacy('public')}
            />
            <PrivacyOption
              active={profileVisibility === 'private'}
              disabled={privacySaving}
              icon={EyeOff}
              title="Riêng tư"
              description="Hạn chế hiển thị công khai, chỉ chia sẻ hồ sơ theo các đơn ứng tuyển bạn chủ động gửi."
              note="Kiểm soát hiển thị hồ sơ"
              onClick={() => persistPrivacy('private')}
            />
          </div>
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
    <div className="min-h-screen bg-transparent pb-16">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
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
                  Quản lý bảo mật đăng nhập, kênh thông báo và quyền riêng tư hồ sơ trong một nơi.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaryCards.map(({ id, ...card }) => (
              <StatCard
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
              <div className="mt-4 space-y-3">
                <SummaryItem
                  label="Email"
                  value={emailNotif ? 'Đang bật' : 'Đang tắt'}
                  helper={
                    emailNotif
                      ? 'Sẵn sàng gửi cập nhật nghiệp vụ.'
                      : 'Email thông báo đang tạm ngưng.'
                  }
                  icon={Mail}
                  tone="emerald"
                />
                <SummaryItem
                  label="Sự kiện"
                  value={`${enabledAlertCount}/${ALERT_TYPES.length} đang bật`}
                  helper="Theo dõi trạng thái đơn và lịch phỏng vấn."
                  icon={Bell}
                  tone="sky"
                />
                <SummaryItem
                  label="Hồ sơ"
                  value={profileVisibility === 'public' ? 'Công khai' : 'Riêng tư'}
                  helper={
                    profileVisibility === 'public'
                      ? 'Nhà tuyển dụng có thể tìm thấy bạn.'
                      : 'Chỉ chia sẻ khi bạn ứng tuyển.'
                  }
                  icon={Eye}
                  tone="amber"
                />
              </div>
            </SidebarCard>

            <SidebarCard title="Gợi ý vận hành" icon={ShieldCheck}>
              <div className="mt-4 space-y-3">
                {[
                  'Duy trì email thông báo để nhận lịch phỏng vấn đúng hạn.',
                  'Cập nhật mật khẩu định kỳ nếu tài khoản dùng đăng nhập cục bộ.',
                  'Chọn riêng tư khi chưa muốn hồ sơ xuất hiện trong tìm kiếm.',
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm font-medium leading-6 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </SidebarCard>
          </aside>
        </div>
      </main>

      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent className="overflow-hidden rounded-3xl border-slate-200 p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-left text-xl font-black text-white">
                  Đổi mật khẩu
                </DialogTitle>
                <p className="mt-1 text-left text-sm text-slate-300">
                  Cập nhật mật khẩu đăng nhập cục bộ của tài khoản.
                </p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-5 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="cur-pwd" className="text-sm font-extrabold text-slate-700">
                Mật khẩu hiện tại
              </Label>
              <Input
                id="cur-pwd"
                type="password"
                autoComplete="current-password"
                value={pwdCurrent}
                onChange={(event) => setPwdCurrent(event.target.value)}
                disabled={pwdSubmitting}
                required
                className="h-11 rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pwd" className="text-sm font-extrabold text-slate-700">
                Mật khẩu mới
              </Label>
              <Input
                id="new-pwd"
                type="password"
                autoComplete="new-password"
                value={pwdNew}
                onChange={(event) => setPwdNew(event.target.value)}
                disabled={pwdSubmitting}
                required
                minLength={8}
                className="h-11 rounded-xl border-slate-200"
              />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Độ mạnh mật khẩu
                  </p>
                  <p className={cn('text-xs font-extrabold', passwordStrength.textClass)}>
                    {passwordStrength.label}
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      passwordStrength.barClass
                    )}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(pwdNew);
                    return (
                      <div
                        key={rule.label}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"
                      >
                        <CheckCircle2
                          className={cn(
                            'h-3.5 w-3.5',
                            passed ? 'text-emerald-600' : 'text-slate-300'
                          )}
                        />
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-pwd" className="text-sm font-extrabold text-slate-700">
                Xác nhận mật khẩu mới
              </Label>
              <Input
                id="cf-pwd"
                type="password"
                autoComplete="new-password"
                value={pwdConfirm}
                onChange={(event) => setPwdConfirm(event.target.value)}
                disabled={pwdSubmitting}
                required
                className={cn(
                  'h-11 rounded-xl border-slate-200',
                  !passwordMatched && 'border-rose-300 focus-visible:ring-rose-500'
                )}
              />
              {!passwordMatched ? (
                <p className="text-sm font-semibold text-rose-600">Mật khẩu xác nhận chưa khớp.</p>
              ) : null}
            </div>
            <DialogFooter className="gap-2 border-t border-slate-100 pt-5 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPwdOpen(false)}
                disabled={pwdSubmitting}
                className="rounded-xl border-slate-200 font-extrabold"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={pwdSubmitting}
                className="rounded-xl bg-emerald-600 font-extrabold hover:bg-emerald-700"
              >
                {pwdSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Cập nhật mật khẩu'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateSettingsPage;
