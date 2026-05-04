import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cpu,
  KeyRound,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/common/Button';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import authService from '../../services/authService';
import employerService from '../../services/employerService';
import userService from '../../services/userService';
import { cn } from '../../utils/cn';

const STORAGE_AUTOMATION = 'employer_settings_automation';
const STORAGE_NOTIF = 'employer_settings_notifications';
const STORAGE_TEAM = 'employer_settings_team';
const STORAGE_JOB_TITLE = 'employer_settings_job_title';

const GRID_BACKGROUND = {
  backgroundImage:
    'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
};

const TABS = [
  {
    id: 'account',
    label: 'Tài khoản',
    description: 'Hồ sơ đại diện và công ty',
    icon: User,
  },
  {
    id: 'team',
    label: 'Đội ngũ tuyển dụng',
    description: 'Thành viên, vai trò và quyền truy cập',
    icon: UserPlus,
  },
  {
    id: 'automation',
    label: 'Tự động hóa',
    description: 'AI screening và quy trình tự động',
    icon: Sparkles,
  },
  {
    id: 'security',
    label: 'Bảo mật',
    description: 'Mật khẩu và xác thực nâng cao',
    icon: Shield,
  },
  {
    id: 'notifications',
    label: 'Thông báo',
    description: 'Email, trình duyệt và nhắc lịch',
    icon: Bell,
  },
];

const DEFAULT_TEAM = [
  {
    id: 1,
    name: 'Nguyễn Linh',
    email: 'linh.n@techx.vn',
    role: 'Admin',
    status: 'Hoạt động',
    avatar: 'NL',
  },
  {
    id: 2,
    name: 'Trần Duy',
    email: 'duy.t@techx.vn',
    role: 'Recruiter',
    status: 'Hoạt động',
    avatar: 'TD',
  },
];

const DEFAULT_NOTIF = {
  emailNewApplications: true,
  emailDigest: false,
  pushMessages: true,
  interviewReminders: true,
  marketingTips: false,
};

const ROLE_OPTIONS = ['Admin', 'Recruiter', 'Viewer'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_META = {
  Admin: {
    label: 'Admin',
    description: 'Toàn quyền quản trị đội ngũ',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  Recruiter: {
    label: 'Recruiter',
    description: 'Vận hành tin tuyển dụng và ứng viên',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  Viewer: {
    label: 'Viewer',
    description: 'Chỉ xem dữ liệu tuyển dụng',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  },
};

const NOTIFICATION_ROWS = [
  {
    key: 'emailNewApplications',
    title: 'Ứng viên nộp đơn mới',
    desc: 'Email khi có hồ sơ mới cho tin đăng của bạn.',
    channel: 'Email',
  },
  {
    key: 'emailDigest',
    title: 'Tóm tắt hằng tuần',
    desc: 'Bản tin tổng hợp hiệu suất tuyển dụng qua email.',
    channel: 'Email',
  },
  {
    key: 'pushMessages',
    title: 'Tin nhắn trên trình duyệt',
    desc: 'Thông báo nhanh khi có tin nhắn từ ứng viên.',
    channel: 'In-app',
  },
  {
    key: 'interviewReminders',
    title: 'Nhắc lịch phỏng vấn',
    desc: 'Nhắc trước giờ phỏng vấn qua email và trong ứng dụng.',
    channel: 'Lịch',
  },
  {
    key: 'marketingTips',
    title: 'Mẹo tuyển dụng & sản phẩm',
    desc: 'Nội dung gợi ý từ nền tảng, có thể tắt bất cứ lúc nào.',
    channel: 'Growth',
  },
];

const AUTOMATION_ITEMS = [
  {
    key: 'autoReview',
    icon: Cpu,
    title: 'Tự động rà soát CV',
    desc: 'Hệ thống phân tích CV theo yêu cầu trong JD, gợi ý điểm phù hợp và lý do xếp hạng.',
    metric: 'Tiết kiệm 35% thời gian sàng lọc',
  },
  {
    key: 'screeningChatbot',
    icon: MessageSquare,
    title: 'Chatbot sơ loại',
    desc: 'Tự động trả lời câu hỏi cơ bản, thu thập thông tin ban đầu và hỗ trợ đặt lịch phỏng vấn.',
    metric: 'Phản hồi ứng viên 24/7',
  },
];

const FIELD_LABEL_CLASS = 'text-xs font-black uppercase tracking-[0.18em] text-slate-400';
const INPUT_CLASS =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';
const SELECT_CLASS =
  'h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10';

const TONE_STYLES = {
  emerald: {
    shell: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
    icon: 'bg-emerald-600 text-white shadow-emerald-600/20',
  },
  sky: {
    shell: 'border-sky-100 bg-sky-50/70 text-sky-700',
    icon: 'bg-sky-600 text-white shadow-sky-600/20',
  },
  amber: {
    shell: 'border-amber-100 bg-amber-50/70 text-amber-700',
    icon: 'bg-amber-500 text-white shadow-amber-500/20',
  },
  slate: {
    shell: 'border-slate-200 bg-slate-50 text-slate-700',
    icon: 'bg-slate-900 text-white shadow-slate-900/20',
  },
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function loadTeam() {
  try {
    const raw = localStorage.getItem(STORAGE_TEAM);
    if (!raw) return DEFAULT_TEAM;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_TEAM;
  } catch {
    return DEFAULT_TEAM;
  }
}

function getInitials(value) {
  const words = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return 'HR';
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function Field({ label, hint, className, children }) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <label className={FIELD_LABEL_CLASS}>{label}</label>
        {hint ? <span className="text-xs font-semibold text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function SectionShell({
  icon: Icon,
  title,
  description,
  badge,
  action,
  children,
  className,
  contentClassName,
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]',
        className
      )}
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-7">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-inner">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
              {badge ? <span>{badge}</span> : null}
            </div>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn('p-5 lg:p-7', contentClassName)}>{children}</div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone = 'emerald' }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.emerald;
  return (
    <div className={cn('rounded-2xl border p-4', styles.shell)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg',
            styles.icon
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {helper ? (
        <p className="mt-3 text-sm font-semibold leading-5 text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative h-7 w-14 shrink-0 rounded-full p-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10',
        checked ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300'
      )}
    >
      <span
        className={cn(
          'block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300',
          checked ? 'translate-x-7' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function StatusBadge({ status }) {
  const invited = status === 'Mời';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black',
        invited
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', invited ? 'bg-amber-500' : 'bg-emerald-500')} />
      {status}
    </span>
  );
}

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || ROLE_META.Viewer;
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase',
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

const EmployerSettingsPage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [accountForm, setAccountForm] = useState({
    fullName: '',
    jobTitle: '',
    companyName: '',
  });
  const [accountSnapshot, setAccountSnapshot] = useState(null);

  const [team, setTeam] = useState(() => loadTeam());
  const [teamSnapshot, setTeamSnapshot] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Recruiter' });

  const [automationConfig, setAutomationConfig] = useState(() =>
    loadJson(STORAGE_AUTOMATION, { autoReview: true, screeningChatbot: false })
  );
  const [automationSnapshot, setAutomationSnapshot] = useState(null);

  const [notifPrefs, setNotifPrefs] = useState(() => loadJson(STORAGE_NOTIF, DEFAULT_NOTIF));
  const [notifSnapshot, setNotifSnapshot] = useState(null);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const applyProfileToForm = useCallback(
    (p) => {
      const full = `${p?.first_name || ''} ${p?.last_name || ''}`.trim();
      const jobTitle = localStorage.getItem(STORAGE_JOB_TITLE) || '';
      const next = {
        fullName: full || user?.full_name || user?.name || '',
        jobTitle,
        companyName: p?.company_name || user?.company_name || '',
      };
      setAccountForm(next);
      setAccountSnapshot(next);
    },
    [user]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      try {
        const res = await employerService.getProfile();
        const p = res.data?.data;
        if (!cancelled && p) applyProfileToForm(p);
      } catch {
        if (!cancelled) {
          const full = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
          const next = {
            fullName: full || user?.name || user?.full_name || '',
            jobTitle: localStorage.getItem(STORAGE_JOB_TITLE) || '',
            companyName: user?.company_name || '',
          };
          setAccountForm(next);
          setAccountSnapshot(next);
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyProfileToForm, user]);

  useEffect(() => {
    setTeamSnapshot(JSON.stringify(loadTeam()));
  }, []);

  useEffect(() => {
    setAutomationSnapshot({
      ...loadJson(STORAGE_AUTOMATION, { autoReview: true, screeningChatbot: false }),
    });
    setNotifSnapshot({ ...loadJson(STORAGE_NOTIF, DEFAULT_NOTIF) });
  }, []);

  const persistTeam = (list) => {
    setTeam(list);
    localStorage.setItem(STORAGE_TEAM, JSON.stringify(list));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    showNotification('Đã đăng xuất thành công', 'info');
  };

  const splitFullName = (fullName) => {
    const t = fullName.trim();
    if (!t) return { first_name: '', last_name: '' };
    const parts = t.split(/\s+/);
    if (parts.length === 1) return { first_name: parts[0], last_name: '' };
    return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
  };

  const handleSaveAccount = async () => {
    setLoading(true);
    try {
      const { first_name, last_name } = splitFullName(accountForm.fullName);
      await employerService.updateProfile({
        first_name,
        last_name,
        company_name: accountForm.companyName,
      });
      localStorage.setItem(STORAGE_JOB_TITLE, accountForm.jobTitle);
      updateUser({
        first_name,
        last_name,
        name: accountForm.fullName,
        full_name: accountForm.fullName,
        company_name: accountForm.companyName,
      });
      setAccountSnapshot({ ...accountForm });
      showNotification('Đã lưu thông tin tài khoản.', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Không thể lưu thông tin.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAccount = () => {
    if (accountSnapshot) setAccountForm({ ...accountSnapshot });
    else {
      const jobTitle = localStorage.getItem(STORAGE_JOB_TITLE) || '';
      setAccountForm((prev) => ({ ...prev, jobTitle }));
    }
    showNotification('Đã hoàn tác thay đổi chưa lưu.', 'info');
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      showNotification('Vui lòng chọn file ảnh.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await userService.uploadAvatar(file);
      const url = res.data?.data?.avatar_url || res.data?.avatar_url;
      if (url) updateUser({ avatar_url: url });
      showNotification('Đã cập nhật ảnh đại diện.', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Tải ảnh thất bại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeam = () => {
    persistTeam(team);
    setTeamSnapshot(JSON.stringify(team));
    showNotification('Đã lưu đội ngũ tuyển dụng.', 'success');
  };

  const handleResetTeam = () => {
    try {
      const parsed = teamSnapshot ? JSON.parse(teamSnapshot) : loadTeam();
      setTeam(Array.isArray(parsed) ? parsed : loadTeam());
    } catch {
      setTeam(loadTeam());
    }
    showNotification('Đã hoàn tác thay đổi đội ngũ.', 'info');
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    const name = inviteForm.name.trim();
    const email = inviteForm.email.trim().toLowerCase();
    if (!name || !email) {
      showNotification('Nhập đủ họ tên và email.', 'error');
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      showNotification('Email không hợp lệ.', 'error');
      return;
    }
    if (!ROLE_OPTIONS.includes(inviteForm.role)) {
      showNotification('Vai trò không hợp lệ.', 'error');
      return;
    }
    if (team.some((m) => m.email.toLowerCase() === email)) {
      showNotification('Email đã có trong đội ngũ.', 'error');
      return;
    }
    const id = Math.max(0, ...team.map((m) => Number(m.id) || 0)) + 1;
    setTeam((prev) => [
      ...prev,
      {
        id,
        name,
        email,
        role: inviteForm.role,
        status: 'Mời',
        avatar: getInitials(name),
      },
    ]);
    setInviteForm({ name: '', email: '', role: 'Recruiter' });
    setInviteOpen(false);
    showNotification('Đã thêm thành viên (demo). Nhấn Lưu để giữ lại.', 'success');
  };

  const handleUpdateMemberRole = (id, nextRole) => {
    if (!ROLE_OPTIONS.includes(nextRole)) return;
    const currentMember = team.find((member) => member.id === id);
    if (!currentMember) return;
    const adminCount = team.filter((member) => member.role === 'Admin').length;
    if (currentMember.role === 'Admin' && nextRole !== 'Admin' && adminCount <= 1) {
      showNotification('Cần giữ lại ít nhất một Admin trong đội ngũ.', 'error');
      return;
    }
    setTeam((prev) =>
      prev.map((member) => (member.id === id ? { ...member, role: nextRole } : member))
    );
  };

  const handleRemoveMember = (id) => {
    const target = team.find((member) => member.id === id);
    if (!target) return;
    if (target.role === 'Admin' && team.filter((member) => member.role === 'Admin').length <= 1) {
      showNotification('Không thể xóa Admin cuối cùng của đội ngũ.', 'error');
      return;
    }
    if (!window.confirm('Xóa thành viên này khỏi danh sách?')) return;
    setTeam((prev) => prev.filter((m) => m.id !== id));
    showNotification('Đã xóa khỏi danh sách (nhấn Lưu để áp dụng).', 'info');
  };

  const handleSaveAutomation = () => {
    localStorage.setItem(STORAGE_AUTOMATION, JSON.stringify(automationConfig));
    setAutomationSnapshot({ ...automationConfig });
    showNotification('Đã lưu cấu hình tự động hóa.', 'success');
  };

  const handleResetAutomation = () => {
    const base =
      automationSnapshot ||
      loadJson(STORAGE_AUTOMATION, { autoReview: true, screeningChatbot: false });
    setAutomationConfig({ ...base });
    showNotification('Đã hoàn tác cấu hình tự động hóa.', 'info');
  };

  const handleSaveNotif = () => {
    localStorage.setItem(STORAGE_NOTIF, JSON.stringify(notifPrefs));
    setNotifSnapshot({ ...notifPrefs });
    showNotification('Đã lưu tùy chọn thông báo.', 'success');
  };

  const handleResetNotif = () => {
    const base = notifSnapshot || DEFAULT_NOTIF;
    setNotifPrefs({ ...base });
    showNotification('Đã hoàn tác thông báo.', 'info');
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwords.current) {
      showNotification('Vui lòng nhập mật khẩu hiện tại.', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showNotification('Mật khẩu mới và xác nhận không khớp.', 'error');
      return;
    }
    if (passwords.new.length < 8) {
      showNotification('Mật khẩu mới cần ít nhất 8 ký tự.', 'error');
      return;
    }
    setLoading(true);
    try {
      await authService.updatePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      showNotification('Đổi mật khẩu thành công!', 'success');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      showNotification(error.response?.data?.message || 'Không thể đổi mật khẩu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = () => {
    showNotification('Tính năng 2FA sẽ được kích hoạt sau khi tích hợp OTP (demo).', 'info');
  };

  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const teamCountLabel = `${team.length} thành viên`;
  const activeMembers = team.filter((member) => member.status !== 'Mời').length;
  const invitedMembers = team.length - activeMembers;
  const enabledNotifications = NOTIFICATION_ROWS.filter((row) => notifPrefs[row.key]).length;
  const enabledAutomation = AUTOMATION_ITEMS.filter((item) => automationConfig[item.key]).length;
  const accountInitials = getInitials(accountForm.fullName || user?.name || user?.full_name);
  const accountEmail = user?.email || 'Chưa cập nhật';
  const companyLabel = accountForm.companyName || user?.company_name || 'Doanh nghiệp của bạn';
  const profileFields = [
    accountForm.fullName,
    accountForm.jobTitle,
    accountForm.companyName,
    user?.avatar_url,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  const accountDirty = accountSnapshot
    ? JSON.stringify(accountForm) !== JSON.stringify(accountSnapshot)
    : false;
  const teamDirty = teamSnapshot ? JSON.stringify(team) !== teamSnapshot : false;
  const automationDirty = automationSnapshot
    ? JSON.stringify(automationConfig) !== JSON.stringify(automationSnapshot)
    : false;
  const notifDirty = notifSnapshot
    ? JSON.stringify(notifPrefs) !== JSON.stringify(notifSnapshot)
    : false;

  const dirtyMap = useMemo(
    () => ({
      account: accountDirty,
      team: teamDirty,
      automation: automationDirty,
      notifications: notifDirty,
    }),
    [accountDirty, automationDirty, notifDirty, teamDirty]
  );
  const hasUnsavedChanges = Boolean(dirtyMap[activeTab]);
  const showTabFooter = ['account', 'team', 'automation', 'notifications'].includes(activeTab);

  const footerHandlers = {
    account: { reset: handleResetAccount, save: handleSaveAccount },
    team: { reset: handleResetTeam, save: handleSaveTeam },
    automation: { reset: handleResetAutomation, save: handleSaveAutomation },
    notifications: { reset: handleResetNotif, save: handleSaveNotif },
  };

  return (
    <div className="min-h-screen bg-transparent pb-16 animate-fade-in">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-2xl shadow-slate-950/20">
            <div className="relative border-b border-slate-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_55%,#f8fafc_100%)] px-6 py-5">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-950">
                    Thêm thành viên
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Thành viên mới sẽ ở trạng thái mời cho đến khi bạn lưu cấu hình.
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleAddMember} className="space-y-5 p-6">
              <Field label="Họ và tên">
                <input
                  value={inviteForm.name}
                  onChange={(ev) => setInviteForm((p) => ({ ...p, name: ev.target.value }))}
                  className={INPUT_CLASS}
                  placeholder="Nguyễn Văn A"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(ev) => setInviteForm((p) => ({ ...p, email: ev.target.value }))}
                  className={INPUT_CLASS}
                  placeholder="a@congty.vn"
                />
              </Field>
              <Field label="Vai trò" hint={ROLE_META[inviteForm.role]?.description}>
                <select
                  value={inviteForm.role}
                  onChange={(ev) => setInviteForm((p) => ({ ...p, role: ev.target.value }))}
                  className={cn(INPUT_CLASS, 'cursor-pointer')}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setInviteOpen(false)}
                  className="rounded-xl"
                >
                  Hủy
                </Button>
                <Button type="submit" size="lg" leftIcon={Plus} className="rounded-xl">
                  Thêm thành viên
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={GRID_BACKGROUND}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
          <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-border/70 bg-card p-6 shadow-premium sm:p-8 lg:p-10">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_8%_100%,rgba(16,185,129,0.08),transparent_28%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.04)_1px,transparent_0)] bg-[length:28px_28px] opacity-60"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-8 top-0 h-px w-56 bg-gradient-to-r from-primary/50 to-transparent"
              aria-hidden
            />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-normal text-primary">
                    <Sparkles className="h-4 w-4" /> Trung tâm nhà tuyển dụng
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-2 text-xs font-bold text-foreground-soft shadow-sm backdrop-blur-sm">
                    <ChevronRight className="h-4 w-4 text-primary" /> {activeTabMeta.label}
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Cài đặt hệ thống <span className="text-primary">tuyển dụng</span>
                </h1>
                <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-muted-foreground">
                  Quản lý cấu hình tài khoản, đội ngũ, bảo mật và các tính năng hỗ trợ tuyển dụng
                  trong một giao diện đồng nhất với toàn bộ khu vực nhà tuyển dụng.
                </p>
              </div>

              <div className="w-full rounded-2xl border border-border bg-white/85 p-4 shadow-sm backdrop-blur-sm sm:max-w-[320px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary text-sm font-black text-white shadow-lg shadow-primary/20">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      accountInitials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-foreground">
                      {accountForm.fullName || user?.name || 'Nhà tuyển dụng'}
                    </p>
                    <p className="truncate text-xs font-semibold text-muted-foreground">
                      {companyLabel}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
                    <p className="text-lg font-bold text-foreground">{profileCompletion}%</p>
                    <p className="text-[11px] font-bold text-muted-foreground">Hồ sơ</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
                    <p className="text-lg font-bold text-foreground">{team.length}</p>
                    <p className="text-[11px] font-bold text-muted-foreground">Thành viên</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
                    <p className="text-lg font-bold text-foreground">{enabledAutomation}/2</p>
                    <p className="text-[11px] font-bold text-muted-foreground">Tự động</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <EmployerStatCard
              icon={Building2}
              label="Doanh nghiệp"
              value={companyLabel}
              helper={accountEmail}
              tone="emerald"
            />
            <EmployerStatCard
              icon={Users}
              label="Đội ngũ"
              value={teamCountLabel}
              helper={`${activeMembers} đang hoạt động${invitedMembers ? `, ${invitedMembers} đang mời` : ''}`}
              tone="sky"
            />
            <EmployerStatCard
              icon={Zap}
              label="Tự động hóa"
              value={`${enabledAutomation}/${AUTOMATION_ITEMS.length} bật`}
              helper="Kiểm soát các luồng AI hỗ trợ recruiter"
              tone="amber"
            />
            <EmployerStatCard
              icon={Mail}
              label="Thông báo"
              value={`${enabledNotifications}/${NOTIFICATION_ROWS.length} kênh`}
              helper="Đồng bộ email, lịch và in-app"
              tone="slate"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-6">
            <div className="px-3 py-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Cấu hình
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Chọn nhóm thiết lập cần quản trị
              </p>
            </div>
            <nav className="space-y-1.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDirty = dirtyMap[tab.id];
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'group flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-all',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all',
                        isActive
                          ? 'border-emerald-200 bg-white text-emerald-600 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-400 group-hover:text-slate-600'
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-black">
                        {tab.label}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">
                        {tab.description}
                      </span>
                    </span>
                    {isDirty ? (
                      <span className="mt-2 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.18)]" />
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black text-red-500 transition-all hover:bg-red-50 hover:text-red-600"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition-transform group-hover:-translate-x-0.5">
                  <LogOut className="h-4.5 w-4.5" />
                </span>
                Đăng xuất
              </button>
            </div>
          </aside>

          <main className="min-w-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {activeTab === 'account' && (
              <SectionShell
                icon={User}
                title="Thông tin tài khoản"
                description="Quản lý thông tin cá nhân, chức danh và định danh công ty hiển thị trong khu vực nhà tuyển dụng."
                badge={
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    Hoàn thiện {profileCompletion}%
                  </span>
                }
              >
                {profileLoading ? (
                  <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                    <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 text-center">
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={loading}
                        className="group relative mx-auto flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border-4 border-white bg-emerald-600 text-3xl font-black text-white shadow-xl shadow-emerald-600/20 disabled:opacity-50"
                      >
                        {user?.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          accountInitials
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                          <Camera className="h-6 w-6 text-white" />
                        </span>
                      </button>
                      <h3 className="mt-4 text-lg font-black text-slate-950">
                        {accountForm.fullName || 'Chưa cập nhật tên'}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{accountEmail}</p>
                      <div className="mt-5 rounded-2xl border border-white bg-white/80 p-4 text-left shadow-sm">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          <span>Tiến độ hồ sơ</span>
                          <span>{profileCompletion}%</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${profileCompletion}%` }}
                          />
                        </div>
                        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                          Hồ sơ đầy đủ giúp ứng viên nhận diện doanh nghiệp rõ ràng hơn.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Họ và tên">
                        <input
                          type="text"
                          value={accountForm.fullName}
                          onChange={(e) =>
                            setAccountForm((p) => ({ ...p, fullName: e.target.value }))
                          }
                          className={INPUT_CLASS}
                          placeholder="Nguyễn Văn A"
                        />
                      </Field>
                      <Field label="Chức vụ">
                        <input
                          type="text"
                          value={accountForm.jobTitle}
                          onChange={(e) =>
                            setAccountForm((p) => ({ ...p, jobTitle: e.target.value }))
                          }
                          className={INPUT_CLASS}
                          placeholder="Trưởng phòng Tuyển dụng"
                        />
                      </Field>
                      <Field label="Tên công ty" className="sm:col-span-2">
                        <input
                          type="text"
                          value={accountForm.companyName}
                          onChange={(e) =>
                            setAccountForm((p) => ({ ...p, companyName: e.target.value }))
                          }
                          className={INPUT_CLASS}
                          placeholder="Công ty TNHH TechX"
                        />
                      </Field>
                      <Field label="Email đăng nhập" hint="Chỉ đọc" className="sm:col-span-2">
                        <input type="email" value={accountEmail} disabled className={INPUT_CLASS} />
                      </Field>
                      <div className="sm:col-span-2 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                            Vai trò
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-900">Employer</p>
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                            Công ty
                          </p>
                          <p className="mt-1 truncate text-sm font-black text-slate-900">
                            {companyLabel}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                            Trạng thái
                          </p>
                          <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" /> Đang hoạt động
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </SectionShell>
            )}

            {activeTab === 'team' && (
              <SectionShell
                icon={Users}
                title="Đội ngũ tuyển dụng"
                description="Quản lý thành viên phụ trách tuyển dụng, vai trò truy cập và danh sách đang chờ mời."
                badge={
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                    {teamCountLabel}
                  </span>
                }
                action={
                  <Button
                    type="button"
                    size="lg"
                    leftIcon={Plus}
                    onClick={() => setInviteOpen(true)}
                  >
                    Thêm thành viên
                  </Button>
                }
                contentClassName="p-0"
              >
                <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-3 lg:p-7">
                  <MetricCard
                    icon={Users}
                    label="Tổng thành viên"
                    value={team.length}
                    helper="Được lưu cục bộ trong demo"
                    tone="emerald"
                  />
                  <MetricCard
                    icon={CheckCircle2}
                    label="Hoạt động"
                    value={activeMembers}
                    helper="Có quyền truy cập hiện tại"
                    tone="sky"
                  />
                  <MetricCard
                    icon={Clock3}
                    label="Đang mời"
                    value={invitedMembers}
                    helper="Cần lưu thay đổi để giữ lại"
                    tone="amber"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        <th className="px-7 py-4">Thành viên</th>
                        <th className="px-7 py-4">Vai trò</th>
                        <th className="px-7 py-4">Trạng thái</th>
                        <th className="px-7 py-4">Quyền hạn</th>
                        <th className="px-7 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {team.map((member) => {
                        const roleMeta = ROLE_META[member.role] || ROLE_META.Viewer;
                        return (
                          <tr
                            key={member.id}
                            className="group transition-colors hover:bg-emerald-50/30"
                          >
                            <td className="px-7 py-5">
                              <div className="flex items-center gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 shadow-sm transition group-hover:border-emerald-200 group-hover:text-emerald-700">
                                  {member.avatar || getInitials(member.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-slate-950">
                                    {member.name}
                                  </p>
                                  <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-7 py-5">
                              <div className="flex flex-col gap-2">
                                <RoleBadge role={member.role} />
                                <select
                                  value={member.role}
                                  onChange={(e) =>
                                    handleUpdateMemberRole(member.id, e.target.value)
                                  }
                                  className={SELECT_CLASS}
                                  aria-label={`Vai trò của ${member.name}`}
                                >
                                  {ROLE_OPTIONS.map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td className="px-7 py-5">
                              <StatusBadge status={member.status} />
                            </td>
                            <td className="max-w-[260px] px-7 py-5 text-sm font-semibold leading-6 text-slate-500">
                              {roleMeta.description}
                            </td>
                            <td className="px-7 py-5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member.id)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" /> Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </SectionShell>
            )}

            {activeTab === 'automation' && (
              <SectionShell
                icon={Sparkles}
                title="Cấu hình Recruiter AI"
                description="Tối ưu hóa quy trình sàng lọc và phản hồi ứng viên bằng các thiết lập tự động."
                badge={
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    Gói Pro
                  </span>
                }
              >
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="space-y-4">
                    {AUTOMATION_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const checked = Boolean(automationConfig[item.key]);
                      return (
                        <div
                          key={item.key}
                          className="group rounded-2xl border border-slate-100 bg-slate-50/60 p-5 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-sm"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-600 shadow-sm">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-base font-black text-slate-950">
                                    {item.title}
                                  </p>
                                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">
                                    {item.metric}
                                  </span>
                                </div>
                                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                            <ToggleSwitch
                              checked={checked}
                              label={item.title}
                              onChange={() =>
                                setAutomationConfig((prev) => ({
                                  ...prev,
                                  [item.key]: !prev[item.key],
                                }))
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-black text-slate-950">
                      Tự động hóa có kiểm soát
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Các thay đổi chỉ được áp dụng sau khi bạn bấm lưu, giúp tránh bật nhầm những
                      luồng tự động đang ảnh hưởng tới ứng viên.
                    </p>
                    <div className="mt-5 space-y-3">
                      {[
                        'Không ghi đè dữ liệu ứng viên',
                        'Có thể hoàn tác trước khi lưu',
                        'Đồng bộ cùng cấu hình thông báo',
                      ].map((text) => (
                        <div
                          key={text}
                          className="flex items-center gap-2 text-sm font-bold text-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4" /> {text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionShell>
            )}

            {activeTab === 'security' && (
              <SectionShell
                icon={Shield}
                title="Bảo mật & Mật khẩu"
                description="Cập nhật mật khẩu và xác thực 2 lớp để bảo vệ tài khoản tuyển dụng."
              >
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <form className="space-y-5" onSubmit={handleUpdatePassword}>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Mật khẩu hiện tại" className="sm:col-span-2">
                        <input
                          type="password"
                          value={passwords.current}
                          onChange={(e) =>
                            setPasswords((prev) => ({ ...prev, current: e.target.value }))
                          }
                          className={INPUT_CLASS}
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                      </Field>
                      <Field label="Mật khẩu mới">
                        <input
                          type="password"
                          value={passwords.new}
                          onChange={(e) =>
                            setPasswords((prev) => ({ ...prev, new: e.target.value }))
                          }
                          className={INPUT_CLASS}
                          placeholder="Tối thiểu 8 ký tự"
                          autoComplete="new-password"
                        />
                      </Field>
                      <Field label="Xác nhận mật khẩu mới">
                        <input
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) =>
                            setPasswords((prev) => ({ ...prev, confirm: e.target.value }))
                          }
                          className={INPUT_CLASS}
                          placeholder="Nhập lại mật khẩu mới"
                          autoComplete="new-password"
                        />
                      </Field>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="text-sm font-black text-slate-950">Gợi ý mật khẩu an toàn</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {['Ít nhất 8 ký tự', 'Có chữ hoa và số', 'Không dùng lại mật khẩu cũ'].map(
                          (item) => (
                            <div
                              key={item}
                              className="flex items-center gap-2 text-sm font-semibold text-slate-500"
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading || !passwords.new || !passwords.current}
                      leftIcon={KeyRound}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                    </Button>
                  </form>

                  <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 text-center">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white bg-white text-emerald-600 shadow-lg shadow-emerald-950/10">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h3 className="relative mt-5 text-lg font-black text-slate-950">
                      Xác thực 2 lớp (2FA)
                    </h3>
                    <p className="relative mt-3 text-sm font-semibold leading-6 text-slate-600">
                      Tăng cường bảo mật bằng cách yêu cầu mã xác thực khi đăng nhập từ thiết bị lạ.
                    </p>
                    <Button
                      type="button"
                      onClick={handleEnable2FA}
                      leftIcon={ShieldCheck}
                      size="lg"
                      className="relative mt-6"
                    >
                      Kích hoạt ngay
                    </Button>
                  </div>
                </div>
              </SectionShell>
            )}

            {activeTab === 'notifications' && (
              <SectionShell
                icon={Bell}
                title="Thông báo"
                description="Chọn kênh và loại thông báo bạn muốn nhận để không bỏ lỡ hoạt động quan trọng."
                badge={
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                    {enabledNotifications} đang bật
                  </span>
                }
              >
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="space-y-3">
                    {NOTIFICATION_ROWS.map((row) => (
                      <div
                        key={row.key}
                        className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 transition-all hover:border-emerald-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-black text-slate-950">{row.title}</p>
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">
                              {row.channel}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                            {row.desc}
                          </p>
                        </div>
                        <ToggleSwitch
                          checked={Boolean(notifPrefs[row.key])}
                          label={row.title}
                          onChange={() =>
                            setNotifPrefs((prev) => ({
                              ...prev,
                              [row.key]: !prev[row.key],
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                      <Bell className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-black text-slate-950">Trung tâm thông báo</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                      Cấu hình này được lưu cục bộ theo tài khoản demo. Nhấn lưu để giữ lại lựa chọn
                      sau khi tải lại trang.
                    </p>
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between text-sm font-black text-slate-700">
                        <span>Kênh đang bật</span>
                        <span>
                          {enabledNotifications}/{NOTIFICATION_ROWS.length}
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{
                            width: `${(enabledNotifications / NOTIFICATION_ROWS.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionShell>
            )}

            {showTabFooter && (
              <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/92 p-3 shadow-xl shadow-slate-950/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <div className="px-2">
                  <p className="text-sm font-black text-slate-950">{activeTabMeta.label}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {hasUnsavedChanges
                      ? 'Có thay đổi chưa lưu trong nhóm thiết lập hiện tại.'
                      : 'Chưa có thay đổi mới trong nhóm thiết lập hiện tại.'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    leftIcon={RotateCcw}
                    onClick={footerHandlers[activeTab]?.reset}
                    disabled={loading || (activeTab === 'account' && profileLoading)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    leftIcon={Save}
                    disabled={loading || (activeTab === 'account' && profileLoading)}
                    onClick={footerHandlers[activeTab]?.save}
                    className="shadow-lg shadow-emerald-600/20"
                  >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default EmployerSettingsPage;
