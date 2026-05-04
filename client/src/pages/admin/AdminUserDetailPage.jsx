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
  Shield,
  Star,
  Trash2,
  UserCircle2,
  Workflow,
} from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '@/components/admin';
import Card from '../../components/common/Card';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import IdentityFormFields from '../../components/profile/IdentityFormFields';
import { normalizeUserEntity, cn } from '../../utils';
import { getUserStatusConfig, getUserStatusLabel } from '../../constants';
const roleBadgeClass = {
  admin: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
  recruiter: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  candidate: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
};

const roleLabels = {
  admin: 'Admin',
  recruiter: 'Nhà tuyển dụng',
  candidate: 'Ứng viên',
};

const CANONICAL_ROLES = new Set(['admin', 'recruiter', 'candidate']);

function normalizeRole(role) {
  const normalizedRole = String(role ?? '')
    .trim()
    .toLowerCase();
  return CANONICAL_ROLES.has(normalizedRole) ? normalizedRole : 'candidate';
}

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const normalizedId = String(id || '')
    .trim()
    .toLowerCase();
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
  const normalizedRole = normalizeRole(user.role);
  const roleClass = roleBadgeClass[normalizedRole] || roleBadgeClass.candidate;
  const roleLabel = roleLabels[normalizedRole] || roleLabels.candidate;
  const statusCfg = getUserStatusConfig(user.status);
  const statusLabel = getUserStatusLabel(user.status);
  const statusClass = cn(statusCfg.bg, statusCfg.text, statusCfg.border);
  const isLocked = user.status === 'locked';
  const isCurrentUser = currentUser?.id != null && Number(user.id) === Number(currentUser.id);

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

  const handleDeleteUser = async () => {
    if (!user?.id) return;

    if (isCurrentUser) {
      showNotification('Không thể xóa chính tài khoản đang đăng nhập.', 'error');
      return;
    }

    const confirmed = window.confirm(
      `Xóa người dùng "${fullName}" khỏi hệ thống?\n\nTài khoản sẽ bị xóa mềm, bị khóa đăng nhập và dữ liệu liên quan sẽ được dọn theo quy trình hệ thống.`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      await adminService.deleteUser(user.id);
      showNotification('Đã xóa người dùng khỏi hệ thống.', 'success');
      navigate('/admin/users', { replace: true });
    } catch (error) {
      console.error('Failed to delete user', error);
      showNotification(
        error?.response?.data?.message || 'Không thể xóa người dùng. Vui lòng thử lại.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7 pb-10 animate-fade-in">
      <PageHeader
        icon={UserCircle2}
        eyebrow="Vận hành người dùng"
        badge={roleLabel + ' · ' + statusLabel}
        title={fullName}
        description={
          'Email: ' +
          user.email +
          ' · Điện thoại: ' +
          (user.phone || 'Chưa cập nhật') +
          ' · Khu vực: ' +
          (user.candidate_location || user.company_location || 'Chưa cập nhật')
        }
        actions={
          <>
            <Link
              to="/admin/users"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-emerald-200 hover:text-emerald-700"
            >
              <ChevronLeft size={18} />
              Quay lại danh sách
            </Link>
            {user.status !== 'active' ? (
              <button
                type="button"
                onClick={() => handleStatusUpdate('active')}
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60"
              >
                <BadgeCheck size={16} />
                Hoạt động
              </button>
            ) : null}
            {!['pending', 'pending_verification'].includes(user.status) ? (
              <button
                type="button"
                onClick={() => handleStatusUpdate('pending_verification')}
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-600 disabled:opacity-60"
              >
                <Clock3 size={16} />
                Chờ xác minh
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleLockToggle}
              disabled={saving}
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-60',
                isLocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'
              )}
            >
              <Ban size={16} />
              {isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
            </button>
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={saving || isCurrentUser}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              title={
                isCurrentUser
                  ? 'Không thể xóa chính tài khoản đang đăng nhập'
                  : 'Xóa người dùng khỏi hệ thống'
              }
            >
              <Trash2 size={16} />
              Xóa người dùng
            </button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Trạng thái</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{statusLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tham gia</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{formatDate(user.created_at)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ứng tuyển</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{user.application_count || 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Việc làm</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{user.job_count || 0}</p>
          </div>
        </div>
      </PageHeader>

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
                <span className="text-sm font-bold uppercase tracking-normal text-muted-foreground">
                  Hồ sơ chuyên môn
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-normal text-foreground">
                Thông tin ứng viên
              </h2>
            </div>

            <IdentityFormFields
              formData={{
                phone: user.phone,
                [user.candidate_location ? 'location' : 'address']:
                  user.candidate_location || user.address,
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
                  <p className="text-sm font-bold uppercase tracking-normal text-muted-foreground">
                    Vị trí hiện tại
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {user.current_job_title || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
                <Building2 size={18} className="text-primary/60 shrink-0" />
                <div>
                  <p className="text-sm font-bold uppercase tracking-normal text-muted-foreground">
                    Công ty
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {user.company_name || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
                <Edit3 size={18} className="text-primary/60 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold uppercase tracking-normal text-muted-foreground">
                    Giới thiệu bản thân
                  </p>
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
                <span className="text-sm font-bold uppercase tracking-normal text-muted-foreground">
                  Điều hướng nhanh
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-normal text-foreground">
                Liên kết hệ thống
              </h2>
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
                      Tài liệu CV của ứng viên
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
              <h3 className="text-lg font-bold tracking-normal text-foreground">
                Tổng quan quản trị
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-600">Vai trò hệ thống</p>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold uppercase tracking-normal ${roleClass}`}
                >
                  {roleLabel}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-600">Trạng thái hoạt động</p>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold uppercase tracking-normal',
                    statusClass
                  )}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-600">Ngày tham gia</p>
                <span className="text-sm font-bold text-foreground">
                  {formatDate(user.created_at)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminUserDetailPage;
