import React, { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  Ban,
  Briefcase,
  Building2,
  ChevronLeft,
  Clock3,
  Edit3,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Shield,
  Star,
  UserCircle2,
  Workflow,
} from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';

import Card from '../../components/common/Card';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import IdentityFormFields from '../../components/profile/IdentityFormFields';
import { normalizeUserEntity, cn } from '../../utils';
import {
  getUserStatusConfig,
  getUserStatusLabel,
} from '../../constants';
import { getAdminPresetLabel, isSuperAdmin } from '@/utils/adminPermissions';

const roleBadgeClass = {
  admin: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
  employer: 'bg-primary/10 text-primary border-primary/20',
  candidate: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
};

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const { showNotification } = useNotification();
  const normalizedId = String(id || '').trim().toLowerCase();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!id || normalizedId === 'new') {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.getUser(id);
      if (response.data?.success) {
        const rawUser = response.data.data;
        if (rawUser && typeof rawUser === 'object') {
          const normalized = normalizeUserEntity(rawUser);
          setUser({
            ...normalized,
            employer_id: rawUser.employer_id ?? null,
            created_at: rawUser.created_at ?? new Date().toISOString(),
            application_count: Number(rawUser.application_count ?? 0),
            job_count: Number(rawUser.job_count ?? 0),
            current_job_title: String(rawUser.current_job_title ?? ''),
            bio: String(rawUser.bio ?? ''),
            resume_url: String(rawUser.resume_url ?? ''),
            candidate_location: String(rawUser.candidate_location ?? ''),
            company_location: String(rawUser.company_location ?? ''),
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin user detail', error);
    } finally {
      setLoading(false);
    }
  }, [id, normalizedId]);

  useEffect(() => {
    if (!id || normalizedId === 'new') {
      setLoading(false);
      setUser(null);
      return undefined;
    }
    fetchUser();
  }, [fetchUser, id, normalizedId]);

  const handleStatusUpdate = async (nextStatus) => {
    if (!user?.id) return;
    try {
      setSaving(true);
      await adminService.updateUserStatus(user.id, nextStatus);
      showNotification('Đã cập nhật trạng thái người dùng.', 'success');
      await fetchUser();
    } catch (error) {
      console.error('Failed to update user status', error);
      showNotification('Không thể cập nhật trạng thái người dùng.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (normalizedId === 'new') {
    return <Navigate to="/admin/users" replace />;
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
        <p className="text-lg font-bold text-slate-500">Đang đồng bộ hóa dữ liệu...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-10 text-center font-medium text-muted-foreground">
        Không tìm thấy người dùng.
      </div>
    );
  }

  const fullName = user.full_name || 'Không rõ';
  const roleClass = isSuperAdmin(user)
    ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
    : roleBadgeClass[user.role] || roleBadgeClass.candidate;
  const roleLabel = user.role === 'admin' ? getAdminPresetLabel(user) : user.role;
  const statusCfg = getUserStatusConfig(user.status);
  const statusLabel = getUserStatusLabel(user.status);
  const statusClass = cn(statusCfg.bg, statusCfg.text, statusCfg.border);
  const isLocked = user.status === 'locked';

  const handleLockToggle = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      if (isLocked) {
        await adminService.unlockUser(user.id);
        showNotification('Đã mở khóa người dùng.', 'success');
      } else {
        await adminService.lockUser(user.id);
        showNotification('Đã khóa người dùng.', 'success');
      }
      await fetchUser();
    } catch (error) {
      console.error('Failed to toggle user lock', error);
      showNotification('Không thể thay đổi trạng thái khóa của người dùng.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-in">

      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
            to="/admin/users"
            className="group inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-base font-bold text-slate-700 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
          >
            <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-1" />
            Quay lại danh sách
          </Link>

          <div className="inline-flex items-center gap-3 rounded-xl border border-border/60 bg-white/50 px-6 py-3 text-sm font-bold tracking-normal text-slate-500 backdrop-blur-sm shadow-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Workflow size={14} />
            </div>
            KHÔNG GIAN LÀM VIỆC ADMIN
          </div>
        </div>

        {/* Hero Profile Section */}
        <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-super">
          <div className="flex flex-col gap-8 p-8 md:flex-row md:items-start md:justify-between lg:p-10">
            {/* Left: Avatar + Identity */}
            <div className="flex items-start gap-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-primary to-accent text-4xl font-bold text-white shadow-xl shadow-primary/25">
                {fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold uppercase tracking-normal ${roleClass}`}>
                    <Shield size={14} strokeWidth={2.5} />
                    {roleLabel}
                  </span>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold uppercase tracking-normal", statusClass)}>
                    {user.status === 'active' ? <BadgeCheck size={14} strokeWidth={2.5} /> : <Clock3 size={14} strokeWidth={2.5} />}
                    {statusLabel}
                  </span>
                </div>
                <h1 className="mt-4 text-4xl font-bold tracking-normal text-foreground lg:text-5xl">
                  {fullName}
                </h1>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-base font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Mail size={16} className="text-primary/60" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone size={16} className="text-primary/60" />
                    {user.phone || 'Chưa cập nhật'}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary/60" />
                    {user.candidate_location || user.company_location || 'Chưa cập nhật'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Stats */}
            <div className="grid min-w-[280px] grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-muted/60 p-4 text-center">
                <p className="text-sm font-bold uppercase tracking-normal text-muted-foreground">Trạng thái</p>
                <p className="mt-2 text-xl font-bold text-foreground">{statusLabel}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/60 p-4 text-center">
                <p className="text-sm font-bold uppercase tracking-normal text-muted-foreground">Tham gia</p>
                <p className="mt-2 text-lg font-bold text-foreground leading-tight">{formatDate(user.created_at)}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/60 p-4 text-center">
                <p className="text-sm font-bold uppercase tracking-normal text-muted-foreground">Ứng tuyển</p>
                <p className="mt-2 text-xl font-bold text-foreground">{user.application_count || 0}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/60 p-4 text-center">
                <p className="text-sm font-bold uppercase tracking-normal text-muted-foreground">Việc làm</p>
                <p className="mt-2 text-xl font-bold text-foreground">{user.job_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Status Action Bar */}
          <div className="flex flex-wrap gap-3 border-t border-border px-8 py-6 lg:px-10">
            {user.status !== 'active' ? (
              <button
                type="button"
                onClick={() => handleStatusUpdate('active')}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-base font-bold text-white hover:bg-emerald-700 disabled:opacity-60 active:scale-[0.98] transition-all"
              >
                <BadgeCheck size={16} />
                Chuyển sang hoạt động
              </button>
            ) : null}
            {!['pending', 'pending_verification'].includes(user.status) ? (
              <button
                type="button"
                onClick={() => handleStatusUpdate('pending_verification')}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-base font-bold text-white hover:bg-amber-600 disabled:opacity-60 active:scale-[0.98] transition-all"
              >
                <Clock3 size={16} />
                Chuyển sang chờ xác minh
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleLockToggle}
              disabled={saving}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-base font-bold text-white disabled:opacity-60 active:scale-[0.98] transition-all',
                isLocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'
              )}
            >
              <Ban size={16} />
              {isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
            </button>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_0.65fr]">

          {/* Left Column: Profile Info + Identity Fields */}
          <div className="space-y-8 animate-slide-up">
            {/* Identity Form Fields — đồng bộ với Candidate EditProfile */}
            <Card className="overflow-hidden border-border/40 p-8 shadow-super">
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserCircle2 size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-normal text-muted-foreground">Hồ sơ chuyên môn</span>
                </div>
                <h2 className="text-2xl font-bold tracking-normal text-foreground">Thông tin ứng viên</h2>
              </div>

              <IdentityFormFields
                formData={{
                  phone: user.phone,
                  [user.candidate_location ? 'location' : 'address']: user.candidate_location || user.address,
                  gender: user.gender,
                  region: user.region,
                }}
                handleChange={() => {}}
                handleSelectChange={() => {}}
                addressFieldName={user.candidate_location ? 'location' : 'address'}
              />

              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
                  <Star size={18} className="text-primary/60 shrink-0" />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-normal text-muted-foreground">Vị trí hiện tại</p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {user.current_job_title || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
                  <Building2 size={18} className="text-primary/60 shrink-0" />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-normal text-muted-foreground">Công ty</p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {user.company_name || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
                  <Edit3 size={18} className="text-primary/60 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-normal text-muted-foreground">Giới thiệu bản thân</p>
                    <p className="mt-1 text-base font-medium leading-relaxed text-foreground">
                      {user.bio || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Quick Links + Info */}
          <aside className="space-y-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {/* Quick Navigation */}
            <Card className="overflow-hidden border-border/40 p-8 shadow-super">
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Workflow size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-normal text-muted-foreground">Điều hướng nhanh</span>
                </div>
                <h2 className="text-2xl font-bold tracking-normal text-foreground">Liên kết hệ thống</h2>
              </div>

              <div className="space-y-4">
                <Link
                  to={`/admin/applications?search=${encodeURIComponent(fullName || user.email || '')}`}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 shadow-sm transition-all group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110">
                    <FileText size={20} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold tracking-normal text-slate-950 transition-colors group-hover:text-primary">
                      Xem ứng tuyển
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-500">
                      Tất cả hồ sơ liên quan
                    </p>
                  </div>
                </Link>

                {user.employer_id ? (
                  <Link
                    to={`/admin/companies/${user.employer_id}`}
                    className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 shadow-sm transition-all group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110">
                      <Briefcase size={20} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold tracking-normal text-slate-950 transition-colors group-hover:text-primary">
                        Xem công ty
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-500">
                        {user.company_name || 'Hồ sơ công ty'}
                      </p>
                    </div>
                  </Link>
                ) : null}

                {user.resume_url ? (
                  <a
                    href={user.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 shadow-sm transition-all group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110">
                      <Globe size={20} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold tracking-normal text-slate-950 transition-colors group-hover:text-primary">
                        Mở CV
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-500">
                        Tài liệu CV của candidate
                      </p>
                    </div>
                  </a>
                ) : null}
              </div>
            </Card>

            {/* Role Governance Card */}
            <div className="rounded-[1.5rem] border border-border/40 bg-gradient-to-br from-white to-primary/[0.02] p-8 shadow-super">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Shield size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold tracking-normal text-foreground">Tổng quan quản trị</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-600">Vai trò hệ thống</p>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold uppercase tracking-normal ${roleClass}`}>
                    {roleLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-600">Trạng thái hoạt động</p>
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold uppercase tracking-normal', statusClass)}>
                    {statusLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-600">Ngày tham gia</p>
                  <span className="text-sm font-bold text-foreground">{formatDate(user.created_at)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
};

export default AdminUserDetailPage;
