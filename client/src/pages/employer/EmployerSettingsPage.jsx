import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  Camera,
  Cpu,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import authService from '../../services/authService';
import employerService from '../../services/employerService';
import userService from '../../services/userService';

const STORAGE_AI = 'employer_settings_ai';
const STORAGE_NOTIF = 'employer_settings_notifications';
const STORAGE_TEAM = 'employer_settings_team';
const STORAGE_JOB_TITLE = 'employer_settings_job_title';

const TABS = [
  { id: 'account', label: 'Tài khoản', icon: User },
  { id: 'team', label: 'Đội ngũ tuyển dụng', icon: UserPlus },
  { id: 'ai', label: 'Tích hợp AI', icon: Sparkles },
  { id: 'security', label: 'Bảo mật', icon: Shield },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
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

  const [aiConfig, setAiConfig] = useState(() =>
    loadJson(STORAGE_AI, { autoScoring: true, aiChatbot: false })
  );
  const [aiSnapshot, setAiSnapshot] = useState(null);

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
    if (team.some((m) => m.email.toLowerCase() === email)) {
      showNotification('Email đã có trong đội ngũ.', 'error');
      return;
    }
    const initials = name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const id = Math.max(0, ...team.map((m) => m.id)) + 1;
    setTeam((prev) => [
      ...prev,
      {
        id,
        name,
        email,
        role: inviteForm.role,
        status: 'Mời',
        avatar: initials || '?',
      },
    ]);
    setInviteForm({ name: '', email: '', role: 'Recruiter' });
    setInviteOpen(false);
    showNotification('Đã thêm thành viên (demo). Nhấn Lưu để giữ lại.', 'success');
  };

  const handleRemoveMember = (id) => {
    if (!window.confirm('Xóa thành viên này khỏi danh sách?')) return;
    setTeam((prev) => prev.filter((m) => m.id !== id));
    showNotification('Đã xóa khỏi danh sách (nhấn Lưu để áp dụng).', 'info');
  };

  const handleSaveAi = () => {
    localStorage.setItem(STORAGE_AI, JSON.stringify(aiConfig));
    setAiSnapshot({ ...aiConfig });
    showNotification('Đã lưu cấu hình AI.', 'success');
  };

  const handleResetAi = () => {
    const base = aiSnapshot || loadJson(STORAGE_AI, { autoScoring: true, aiChatbot: false });
    setAiConfig(base);
    showNotification('Đã hoàn tác cấu hình AI.', 'info');
  };

  useEffect(() => {
    setAiSnapshot({ ...loadJson(STORAGE_AI, { autoScoring: true, aiChatbot: false }) });
    setNotifSnapshot({ ...loadJson(STORAGE_NOTIF, DEFAULT_NOTIF) });
  }, []);

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

  const showTabFooter = ['account', 'team', 'ai', 'notifications'].includes(activeTab);

  const teamCountLabel = `${team.length} thành viên`;

  return (
    <div className="pb-24 max-w-7xl mx-auto px-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Thêm thành viên</h3>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-muted/55 hover:text-foreground"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-2">
                <label className="text-base font-black uppercase tracking-widest text-slate-400">
                  Họ và tên
                </label>
                <input
                  value={inviteForm.name}
                  onChange={(ev) => setInviteForm((p) => ({ ...p, name: ev.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <label className="text-base font-black uppercase tracking-widest text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(ev) => setInviteForm((p) => ({ ...p, email: ev.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="a@congty.vn"
                />
              </div>
              <div className="space-y-2">
                <label className="text-base font-black uppercase tracking-widest text-slate-400">
                  Vai trò
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(ev) => setInviteForm((p) => ({ ...p, role: ev.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="Admin">Admin</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-base font-bold text-slate-600 hover:bg-muted/35"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-base font-bold text-white hover:bg-emerald-700"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-base font-medium text-slate-500 mt-1">
          Quản lý cấu hình tài khoản, đội ngũ và các tính năng AI bổ trợ.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
        <div className="h-fit space-y-1.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group flex w-full items-center gap-3.5 rounded-full px-4 py-3.5 text-left text-base font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                    : 'text-slate-600 hover:bg-muted/35 hover:text-foreground'
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.25 : 2}
                  className={
                    isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                  }
                />
                {tab.label}
              </button>
            );
          })}

          <div className="mt-6 space-y-1.5 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-full items-center gap-3.5 rounded-full px-4 py-3.5 text-left text-base font-bold text-red-500/80 transition-all hover:bg-destructive/10 hover:text-red-600"
            >
              <LogOut size={18} className="transition-transform group-hover:-translate-x-0.5" />
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-right-4 space-y-8 duration-500">
          {activeTab === 'account' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-8 py-6">
                <h2 className="text-xl font-bold leading-none tracking-tight text-slate-900">
                  Thông tin tài khoản
                </h2>
                <p className="mt-2 text-base font-medium text-slate-500">
                  Quản lý thông tin cá nhân và định danh công ty
                </p>
              </div>
              <div className="p-8">
                {profileLoading ? (
                  <p className="text-base text-slate-500">Đang tải hồ sơ…</p>
                ) : (
                  <div className="flex flex-col items-start gap-10 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      disabled={loading}
                      className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 shadow-sm disabled:opacity-50"
                    >
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Sparkles size={38} className="text-emerald-500/80" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/60 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100">
                        <Camera size={20} className="text-white" />
                      </div>
                    </button>
                    <div className="grid flex-grow grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="pl-1 text-base font-black uppercase tracking-widest text-slate-400">
                          Họ và tên
                        </label>
                        <input
                          type="text"
                          value={accountForm.fullName}
                          onChange={(e) =>
                            setAccountForm((p) => ({ ...p, fullName: e.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="pl-1 text-base font-black uppercase tracking-widest text-slate-400">
                          Chức vụ
                        </label>
                        <input
                          type="text"
                          value={accountForm.jobTitle}
                          onChange={(e) =>
                            setAccountForm((p) => ({ ...p, jobTitle: e.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                          placeholder="Trưởng phòng Tuyển dụng"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="pl-1 text-base font-black uppercase tracking-widest text-slate-400">
                          Tên công ty
                        </label>
                        <input
                          type="text"
                          value={accountForm.companyName}
                          onChange={(e) =>
                            setAccountForm((p) => ({ ...p, companyName: e.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="data-table-shell">
              <div className="flex flex-col gap-4 border-b border-border px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold leading-none tracking-tight text-slate-900">
                    Đội ngũ (Recruiter Team)
                  </h2>
                  <p className="mt-2 text-base font-medium text-slate-500">{teamCountLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-base font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:bg-emerald-700 active:scale-[0.98]"
                >
                  <Plus size={16} /> Thêm thành viên
                </button>
              </div>
              <div className="data-table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="px-8 py-4 text-base font-bold uppercase tracking-widest">
                        Thành viên
                      </th>
                      <th className="px-8 py-4 text-base font-bold uppercase tracking-widest">
                        Vai trò
                      </th>
                      <th className="px-8 py-4 text-base font-bold uppercase tracking-widest">
                        Trạng thái
                      </th>
                      <th className="px-8 py-4 pr-12 text-end text-base font-bold uppercase tracking-widest">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((member) => (
                      <tr key={member.id} className="group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-base font-bold text-slate-700 shadow-sm transition-all group-hover:border-emerald-300">
                              {member.avatar}
                            </div>
                            <div>
                              <p className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-600">
                                {member.name}
                              </p>
                              <p className="text-base font-medium text-slate-400">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-base font-bold uppercase tracking-tight text-slate-600">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-2 w-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] ${member.status === 'Mời' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            />
                            <span className="text-base font-bold text-slate-600">
                              {member.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 pr-10 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-muted/55 hover:text-red-600"
                            title="Xóa"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900">
                    <Sparkles size={22} className="text-emerald-500" /> Cấu hình AI Recruiter
                  </h2>
                  <p className="mt-2 text-base font-medium text-slate-500">
                    Tối ưu hóa quy trình sàng lọc ứng viên bằng trí tuệ nhân tạo
                  </p>
                </div>
                <span className="w-fit rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-base font-black uppercase tracking-widest text-emerald-600">
                  GÓI PRO
                </span>
              </div>
              <div className="space-y-4 p-8">
                <div className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-emerald-200 hover:bg-card">
                  <div className="flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-500 transition-all group-hover:shadow-sm">
                      <Cpu size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-slate-900">Tự động chấm điểm CV</p>
                      <p className="text-base font-medium leading-relaxed text-slate-500">
                        AI sẽ tự động phân tích và chấm điểm độ phù hợp của CV với JD.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={aiConfig.autoScoring}
                    onClick={() =>
                      setAiConfig((prev) => ({ ...prev, autoScoring: !prev.autoScoring }))
                    }
                    className={`relative h-6 w-12 rounded-full p-1 transition-all duration-300 ${aiConfig.autoScoring ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300 ${aiConfig.autoScoring ? 'translate-x-[24px]' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                <div className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-emerald-200 hover:bg-card">
                  <div className="flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-500 transition-all group-hover:shadow-sm">
                      <MessageSquare size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-slate-900">AI Chatbot Sơ loại</p>
                      <p className="text-base font-medium leading-relaxed text-slate-500">
                        Tự động trả lời câu hỏi cơ bản và đặt lịch hẹn phỏng vấn.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={aiConfig.aiChatbot}
                    onClick={() => setAiConfig((prev) => ({ ...prev, aiChatbot: !prev.aiChatbot }))}
                    className={`relative h-6 w-12 rounded-full p-1 transition-all duration-300 ${aiConfig.aiChatbot ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300 ${aiConfig.aiChatbot ? 'translate-x-[24px]' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-8 py-6">
                <h2 className="text-xl font-bold leading-none tracking-tight text-slate-900">
                  Bảo mật & Mật khẩu
                </h2>
                <p className="mt-2 text-base font-medium text-slate-500">
                  Cập nhật mật khẩu và xác thực 2 lớp để bảo vệ tài khoản
                </p>
              </div>
              <div className="grid grid-cols-1 gap-10 p-8 lg:grid-cols-2">
                <form className="space-y-6" onSubmit={handleUpdatePassword}>
                  <div className="space-y-2">
                    <label className="pl-1 text-base font-black uppercase tracking-widest text-slate-400">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={passwords.current}
                      onChange={(e) =>
                        setPasswords((prev) => ({ ...prev, current: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="pl-1 text-base font-black uppercase tracking-widest text-slate-400">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords((prev) => ({ ...prev, new: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="pl-1 text-base font-black uppercase tracking-widest text-slate-400">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) =>
                        setPasswords((prev) => ({ ...prev, confirm: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !passwords.new || !passwords.current}
                    className="w-full uppercase tracking-widest"
                  >
                    {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                  </Button>
                </form>

                <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/10 bg-emerald-50/30 p-8 text-center shadow-inner transition-all group">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-500 shadow-sm transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
                    <ShieldCheck size={32} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-base font-bold uppercase tracking-tighter text-slate-900">
                    Xác thực 2 lớp (2FA)
                  </h3>
                  <p className="mt-3 px-4 text-base font-semibold leading-relaxed text-slate-500">
                    Tăng cường bảo mật bằng cách yêu cầu mã xác thực từ điện thoại mỗi khi bạn đăng
                    nhập từ thiết bị lạ.
                  </p>
                  <button
                    type="button"
                    onClick={handleEnable2FA}
                    className="mt-7 rounded-xl bg-emerald-600 px-8 py-3 text-base font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.05] hover:bg-emerald-700 active:scale-95"
                  >
                    Kích hoạt ngay
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-8 py-6">
                <h2 className="text-xl font-bold leading-none tracking-tight text-slate-900">
                  Thông báo
                </h2>
                <p className="mt-2 text-base font-medium text-slate-500">
                  Chọn kênh và loại thông báo bạn muốn nhận
                </p>
              </div>
              <div className="space-y-3 p-8">
                {[
                  {
                    key: 'emailNewApplications',
                    title: 'Ứng viên nộp đơn mới',
                    desc: 'Email khi có hồ sơ mới cho tin đăng của bạn.',
                  },
                  {
                    key: 'emailDigest',
                    title: 'Tóm tắt hằng tuần',
                    desc: 'Bản tin tổng hợp hiệu suất tuyển dụng qua email.',
                  },
                  {
                    key: 'pushMessages',
                    title: 'Tin nhắn trên trình duyệt',
                    desc: 'Thông báo nhanh khi có tin nhắn từ ứng viên.',
                  },
                  {
                    key: 'interviewReminders',
                    title: 'Nhắc lịch phỏng vấn',
                    desc: 'Nhắc trước giờ phỏng vấn (email + trong app).',
                  },
                  {
                    key: 'marketingTips',
                    title: 'Mẹo tuyển dụng & sản phẩm',
                    desc: 'Nội dung gợi ý từ nền tảng (có thể tắt bất cứ lúc nào).',
                  },
                ].map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-emerald-100 hover:bg-card"
                  >
                    <div>
                      <p className="text-base font-bold text-slate-900">{row.title}</p>
                      <p className="mt-1 text-base font-medium text-slate-500">{row.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifPrefs[row.key]}
                      onClick={() =>
                        setNotifPrefs((prev) => ({
                          ...prev,
                          [row.key]: !prev[row.key],
                        }))
                      }
                      className={`relative h-6 w-12 shrink-0 rounded-full p-1 transition-all duration-300 ${notifPrefs[row.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300 ${notifPrefs[row.key] ? 'translate-x-[24px]' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showTabFooter && (
            <div className="flex flex-col items-stretch justify-end gap-3 pt-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'account') handleResetAccount();
                  else if (activeTab === 'team') handleResetTeam();
                  else if (activeTab === 'ai') handleResetAi();
                  else if (activeTab === 'notifications') handleResetNotif();
                }}
                className="rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-bold uppercase tracking-widest text-slate-500 transition-all hover:bg-muted/35 hover:text-foreground active:scale-[0.98]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={loading || (activeTab === 'account' && profileLoading)}
                onClick={() => {
                  if (activeTab === 'account') handleSaveAccount();
                  else if (activeTab === 'team') handleSaveTeam();
                  else if (activeTab === 'ai') handleSaveAi();
                  else if (activeTab === 'notifications') handleSaveNotif();
                }}
                className="rounded-xl bg-emerald-600 px-12 py-3.5 text-base font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-40"
              >
                Lưu thay đổi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerSettingsPage;
