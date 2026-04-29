import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserCircle2,
  UserPlus2,
  Users,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAdminPresetLabel, isSuperAdmin } from '@/utils/adminPermissions';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import useDebounce from '../../hooks/useDebounce';
import adminService from '../../services/adminService';
import { isHandledAuthError } from '../../utils/authErrors';

const AVATAR_COLORS = [
  'bg-emerald-500/15 text-emerald-700 ring-emerald-100',
  'bg-amber-500/15 text-amber-700 ring-amber-100',
  'bg-sky-500/15 text-sky-700 ring-sky-100',
  'bg-violet-500/15 text-violet-700 ring-violet-100',
];

const ROLE_OPTIONS = [
  { value: 'all', label: 'Tất cả vai trò' },
  { value: 'admin', label: 'Admin' },
  { value: 'recruiter', label: 'Nhà tuyển dụng' },
  { value: 'candidate', label: 'Ứng viên' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'pending_verification', label: 'Chờ xác minh' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'banned', label: 'Bị khóa' },
  { value: 'locked', label: 'Đã khóa' },
  { value: 'suspended', label: 'Tạm ngưng' },
];

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10 / trang' },
  { value: 25, label: '25 / trang' },
  { value: 50, label: '50 / trang' },
  { value: 100, label: '100 / trang' },
];

function SectionCard({ icon: Icon, title, description, action, className = '', children }) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200/70 hover:shadow-md sm:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-normal text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function normalizeRole(role) {
  const normalizedRole = String(role ?? '').trim().toLowerCase();
  return normalizedRole === 'employer' ? 'recruiter' : normalizedRole;
}

function getDisplayName(user) {
  return (
    user.full_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.email ||
    'Người dùng chưa cập nhật'
  );
}

function getInitials(user) {
  const displayName = getDisplayName(user);
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getRoleMeta(user) {
  if (isSuperAdmin(user)) {
    return {
      label: 'SUPER ADMIN',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      icon: Shield,
    };
  }

  const role = normalizeRole(user?.role);
  if (role === 'admin') {
    return {
      label: getAdminPresetLabel(user) || 'ADMIN VẬN HÀNH',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
      icon: Shield,
    };
  }

  if (role === 'recruiter') {
    return {
      label: 'NHÀ TUYỂN DỤNG',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: Briefcase,
    };
  }

  return {
    label: 'ỨNG VIÊN',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
    icon: UserCircle2,
  };
}

function getStatusMeta(status) {
  const normalizedStatus = String(status ?? '').trim().toLowerCase();

  switch (normalizedStatus) {
    case 'active':
      return {
        label: 'Hoạt động',
        dotClass: 'bg-emerald-500',
        badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      };
    case 'banned':
      return {
        label: 'Bị khóa',
        dotClass: 'bg-rose-500',
        badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
      };
    case 'inactive':
      return {
        label: 'Không hoạt động',
        dotClass: 'bg-slate-400',
        badgeClass: 'border-slate-200 bg-slate-100 text-slate-600',
      };
    case 'locked':
      return {
        label: 'Đã khóa',
        dotClass: 'bg-amber-500',
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
      };
    case 'suspended':
      return {
        label: 'Tạm ngưng',
        dotClass: 'bg-orange-500',
        badgeClass: 'border-orange-200 bg-orange-50 text-orange-700',
      };
    case 'pending':
    case 'pending_verification':
    default:
      return {
        label: 'Chờ xác minh',
        dotClass: 'bg-amber-500',
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
      };
  }
}

function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 1) return [1];

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return sortedPages.reduce((items, page, index) => {
    if (index > 0 && page - sortedPages[index - 1] > 1) {
      items.push(`ellipsis-${page}`);
    }
    items.push(page);
    return items;
  }, []);
}

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loadIssues, setLoadIssues] = useState({ users: null, stats: null });
  const [exporting, setExporting] = useState(false);
  const [inputValue, setInputValue] = useState(
    () => searchParams.get('search') || searchParams.get('q') || ''
  );
  const debouncedSearch = useDebounce(inputValue, 500);
  const [roleFilter, setRoleFilter] = useState(() => searchParams.get('role') || 'all');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [skillFilter, setSkillFilter] = useState(() => searchParams.get('skills') || '');
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('pageSize')) || 10);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const currentIsSuperAdmin = isSuperAdmin(currentUser);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadIssues((previous) => ({ ...previous, users: null }));
      const params = {
        search: debouncedSearch.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        skills: skillFilter.trim() || undefined,
        page,
        limit: pageSize,
      };

      const response = await adminService.getUsers(params);
      const payload = response?.data;
      const rawUsers = payload?.success
        ? payload?.data
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

      const sanitizedUsers = (Array.isArray(rawUsers) ? rawUsers : []).map((item) => ({
        id: item?.id ?? 0,
        email: String(item?.email ?? ''),
        first_name: String(item?.first_name ?? ''),
        last_name: String(item?.last_name ?? ''),
        full_name: String(item?.full_name ?? ''),
        role: normalizeRole(item?.role),
        status: String(item?.status ?? '').trim().toLowerCase(),
        permissions: item?.permissions ?? [],
        admin_preset: String(item?.admin_preset ?? ''),
        created_at: item?.created_at ?? new Date().toISOString(),
      }));

      const nextPagination = payload?.pagination ?? {
        total: sanitizedUsers.length,
        pages: 1,
      };
      const nextPages = Math.max(1, Number(nextPagination?.pages ?? 1));
      const nextTotal = Math.max(0, Number(nextPagination?.total ?? sanitizedUsers.length));

      setUsers(sanitizedUsers);
      setPagination({
        total: nextTotal,
        pages: nextPages,
      });

      if (nextTotal > 0 && page > nextPages) {
        setPage(nextPages);
      }
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      const message =
        status === 403
          ? 'Bạn không có quyền xem danh sách người dùng.'
          : error?.response?.data?.message || 'Không thể tải danh sách người dùng.';

      setUsers([]);
      setPagination({ total: 0, pages: 1 });
      setLoadIssues((previous) => ({
        ...previous,
        users: {
          tone: 'error',
          message,
          detail:
            status === 403
              ? 'Phiên quản trị hiện tại không còn quyền hợp lệ hoặc đã được thay đổi.'
              : 'Hãy thử tải lại trang hoặc kiểm tra backend nếu lỗi vẫn lặp lại.',
        },
      }));

      if (isHandledAuthError(error)) {
        return;
      }

      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, roleFilter, skillFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setLoadIssues((previous) => ({ ...previous, stats: null }));
      const response = await adminService.getUsersStats();
      const payload = response?.data;
      const statsData = payload?.success ? payload?.data : payload?.data ?? payload;

      setStats({
        total: Number(statsData?.total ?? 0),
        active: Number(statsData?.active ?? 0),
        pending: Number(statsData?.pending ?? 0),
        newToday: Number(statsData?.newToday ?? 0),
      });
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      const message =
        status === 403
          ? 'Bạn không có quyền xem thống kê người dùng.'
          : error?.response?.data?.message || 'Không thể tải thống kê người dùng.';

      setStats(null);
      setLoadIssues((previous) => ({
        ...previous,
        stats: {
          tone: status === 403 ? 'error' : 'warning',
          message,
          detail:
            status === 403
              ? 'Phần thống kê sẽ được ẩn cho đến khi phiên quản trị được xác thực lại.'
              : 'Bảng thống kê sẽ dùng dữ liệu hiện có để giữ trải nghiệm không bị ngắt quãng.',
        },
      }));

      if (isHandledAuthError(error)) {
        return;
      }

      console.error('Error fetching user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedSearch.trim()) nextParams.set('search', debouncedSearch.trim());
    if (roleFilter !== 'all') nextParams.set('role', roleFilter);
    if (statusFilter !== 'all') nextParams.set('status', statusFilter);
    if (skillFilter.trim()) nextParams.set('skills', skillFilter.trim());
    if (page > 1) nextParams.set('page', String(page));
    if (pageSize !== 10) nextParams.set('pageSize', String(pageSize));

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    debouncedSearch,
    page,
    pageSize,
    roleFilter,
    searchParams,
    setSearchParams,
    skillFilter,
    statusFilter,
  ]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchUsers(), fetchStats()]);
  }, [fetchStats, fetchUsers]);

  const handleStatusUpdate = async (userId, nextStatus) => {
    try {
      await adminService.updateUserStatus(userId, nextStatus);
      showNotification('Đã cập nhật trạng thái người dùng thành công.', 'success');
      await refreshAll();
    } catch (error) {
      console.error('Error updating user status:', error);
      showNotification('Không thể cập nhật trạng thái người dùng.', 'error');
    }
  };

  const handleExportUsers = async () => {
    try {
      setExporting(true);
      const params = {
        search: debouncedSearch.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        skills: skillFilter.trim() || undefined,
        pageSize,
      };
      const response = await adminService.exportUsers(params);
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('Đã xuất danh sách người dùng thành công.', 'success');
    } catch (error) {
      console.error('Error exporting users:', error);
      showNotification('Không thể xuất danh sách người dùng.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!currentIsSuperAdmin) {
      showNotification('Chỉ Super Admin mới có thể xóa tài khoản.', 'error');
      return;
    }

    if (isSuperAdmin(targetUser)) {
      showNotification('Không thể xóa tài khoản Super Admin.', 'error');
      return;
    }

    if (currentUser?.id != null && targetUser.id === currentUser.id) {
      showNotification('Không thể xóa chính tài khoản đang đăng nhập.', 'error');
      return;
    }

    const displayName = getDisplayName(targetUser);
    const confirmed = window.confirm(
      `Xóa tài khoản "${displayName}"? Quyền, phiên chat, thông báo và dữ liệu liên quan của tài khoản này sẽ bị xóa hoặc ẩn theo quy tắc hệ thống.`
    );
    if (!confirmed) return;

    try {
      await adminService.deleteUser(targetUser.id);
      showNotification('Đã xóa tài khoản và dữ liệu liên quan.', 'success');

      if (users.length === 1 && page > 1) {
        setPage((currentPage) => Math.max(1, currentPage - 1));
        await fetchStats();
        return;
      }

      await refreshAll();
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification(
        error?.response?.data?.message || 'Không thể xóa tài khoản người dùng.',
        'error'
      );
    }
  };

  const resetFilters = () => {
    setInputValue('');
    setRoleFilter('all');
    setStatusFilter('all');
    setSkillFilter('');
    setPage(1);
    setPageSize(10);
  };

  const safeStats = stats ?? {
    total: pagination.total || users.length,
    active: users.filter((user) => user.status === 'active').length,
    pending: users.filter((user) =>
      ['pending', 'pending_verification'].includes(user.status)
    ).length,
    newToday: users.filter((user) => {
      const createdAt = new Date(user.created_at);
      const today = new Date();
      return createdAt.toDateString() === today.toDateString();
    }).length,
  };

  const roleBreakdown = useMemo(
    () =>
      users.reduce(
        (summary, user) => {
          const role = normalizeRole(user.role);
          if (role === 'admin') summary.admin += 1;
          else if (role === 'recruiter') summary.recruiter += 1;
          else summary.candidate += 1;
          return summary;
        },
        { admin: 0, recruiter: 0, candidate: 0 }
      ),
    [users]
  );

  const statusBreakdown = useMemo(
    () =>
      users.reduce(
        (summary, user) => {
          if (user.status === 'active') summary.active += 1;
          else if (['pending', 'pending_verification'].includes(user.status)) summary.pending += 1;
          else if (user.status === 'locked') summary.locked += 1;
          else summary.other += 1;
          return summary;
        },
        { active: 0, pending: 0, locked: 0, other: 0 }
      ),
    [users]
  );

  const activeFilterCount = useMemo(
    () =>
      [
        debouncedSearch.trim().length > 0,
        roleFilter !== 'all',
        statusFilter !== 'all',
        skillFilter.trim().length > 0,
      ].filter(Boolean).length,
    [debouncedSearch, roleFilter, skillFilter, statusFilter]
  );

  const pageStart = pagination.total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = pagination.total === 0 ? 0 : Math.min(page * pageSize, pagination.total);
  const pageItems = useMemo(
    () => buildPaginationItems(page, Math.max(1, pagination.pages || 1)),
    [page, pagination.pages]
  );

  const summaryCards = [
    {
      label: 'Tổng người dùng',
      value: formatNumber(safeStats.total),
      helper: 'Toàn hệ thống',
      icon: Users,
      className: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
    },
    {
      label: 'Đang hoạt động',
      value: formatNumber(safeStats.active),
      helper: 'Tài khoản đang dùng',
      icon: Zap,
      className: 'text-sky-700 bg-sky-50 ring-sky-100',
    },
    {
      label: 'Chờ xác minh',
      value: formatNumber(safeStats.pending),
      helper: 'Cần rà soát',
      icon: Clock3,
      className: 'text-amber-700 bg-amber-50 ring-amber-100',
    },
    {
      label: 'Mới hôm nay',
      value: formatNumber(safeStats.newToday),
      helper: 'Đăng ký trong ngày',
      icon: UserPlus2,
      className: 'text-violet-700 bg-violet-50 ring-violet-100',
    },
  ];

  const quickViewMetrics = [
    {
      label: 'Admin',
      value: roleBreakdown.admin,
      icon: Shield,
      className: 'text-rose-700 bg-rose-50 ring-rose-100',
    },
    {
      label: 'Nhà tuyển dụng',
      value: roleBreakdown.recruiter,
      icon: Briefcase,
      className: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
    },
    {
      label: 'Ứng viên',
      value: roleBreakdown.candidate,
      icon: UserCircle2,
      className: 'text-sky-700 bg-sky-50 ring-sky-100',
    },
    {
      label: 'Hoạt động',
      value: statusBreakdown.active,
      icon: CheckCircle2,
      className: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
    },
  ];

  const currentRoleLabel = currentIsSuperAdmin
    ? 'SUPER ADMIN'
    : getAdminPresetLabel(currentUser) || 'ADMIN VẬN HÀNH';

  const roleFilterLabel =
    ROLE_OPTIONS.find((option) => option.value === roleFilter)?.label || 'Tất cả vai trò';
  const statusFilterLabel =
    STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label || 'Tất cả trạng thái';

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 font-bold text-emerald-700 shadow-sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Admin workspace
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-bold text-slate-600 shadow-sm">
                Quản lý tài khoản hệ thống
              </Badge>
            </div>

            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-emerald-600">User operations</p>
              <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
                Quản lý người dùng
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Theo dõi vòng đời tài khoản, rà soát trạng thái hoạt động và xử lý khóa, kích
                hoạt hoặc xóa người dùng mà vẫn giữ nguyên quy tắc quyền hạn của hệ thống.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.label}
                    className="rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                          {card.label}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-normal text-slate-950">
                          {statsLoading ? '...' : card.value}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
                      </div>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-inset ${card.className}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleExportUsers}
                disabled={exporting}
                className="h-11 rounded-lg bg-slate-950 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting ? 'Đang xuất dữ liệu...' : 'Xuất CSV'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold shadow-sm hover:bg-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Làm sạch bộ lọc
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {(() => {
          const issues = [loadIssues.users, loadIssues.stats].filter(Boolean);
          if (issues.length === 0) return null;

          const uniqueMessages = Array.from(new Set(issues.map((item) => item.message)));
          const uniqueDetails = Array.from(new Set(issues.map((item) => item.detail).filter(Boolean)));
          const hasError = issues.some((item) => item.tone === 'error');
          const issueTone = hasError ? 'error' : 'warning';

          return (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 shadow-sm ${
                issueTone === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{uniqueMessages.join(' ')}</p>
                  {uniqueDetails.length > 0 ? (
                    <p className="mt-1 text-sm leading-6 opacity-90">{uniqueDetails.join(' ')}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })()}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="space-y-6">
            <SectionCard
              icon={Search}
              title="Bộ lọc danh sách"
              description="Kết hợp tìm kiếm, vai trò, trạng thái và kỹ năng để rà soát người dùng theo đúng ngữ cảnh vận hành."
            >
              <div className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={inputValue}
                    onChange={(event) => {
                      setInputValue(event.target.value);
                      setPage(1);
                    }}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <select
                    value={roleFilter}
                    onChange={(event) => {
                      setRoleFilter(event.target.value);
                      setPage(1);
                    }}
                    className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(1);
                    }}
                    className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={skillFilter}
                    onChange={(event) => {
                      setSkillFilter(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Lọc theo kỹ năng..."
                    className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setRoleFilter(option.value);
                        setPage(1);
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                        roleFilter === option.value
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <span>
                    Vai trò: <strong className="text-slate-700">{roleFilterLabel}</strong>
                  </span>
                  <span>
                    Trạng thái: <strong className="text-slate-700">{statusFilterLabel}</strong>
                  </span>
                  <span>
                    Kỹ năng:{' '}
                    <strong className="text-slate-700">
                      {skillFilter.trim() || 'Không giới hạn'}
                    </strong>
                  </span>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Users}
              title="Danh sách người dùng"
              description="Giữ nguyên luồng thao tác hiện tại, nhưng trình bày lại rõ ràng hơn để rà soát và xử lý nhanh trong vận hành."
              action={
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                  {pageStart}-{pageEnd} / {formatNumber(pagination.total)}
                </div>
              }
            >
              {loading ? (
                <div className="flex h-72 items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50/90">
                        <tr>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                            Người dùng
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                            Vai trò
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                            Ngày tham gia
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                            Trạng thái
                          </th>
                          <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-normal text-slate-500">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-5 py-16">
                              <div className="flex flex-col items-center justify-center text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                  <Users className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-base font-bold text-slate-900">
                                  Không tìm thấy người dùng phù hợp
                                </h3>
                                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                  Hãy thử nới lỏng từ khóa hoặc đặt lại bộ lọc để mở rộng phạm vi rà
                                  soát.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          users.map((user, index) => {
                            const roleMeta = getRoleMeta(user);
                            const statusMeta = getStatusMeta(user.status);
                            const RoleIcon = roleMeta.icon;
                            const isCurrentUser =
                              currentUser?.id != null && user.id === currentUser.id;
                            const isAdminTarget = normalizeRole(user.role) === 'admin';
                            const canUpdateStatus =
                              !isCurrentUser && (currentIsSuperAdmin || !isAdminTarget);
                            const canDelete =
                              currentIsSuperAdmin && !isCurrentUser && !isSuperAdmin(user);

                            return (
                              <tr
                                key={user.id}
                                className="transition-colors hover:bg-emerald-50/40"
                              >
                                <td className="px-5 py-4 align-top">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ring-inset ${getAvatarColor(index)}`}
                                    >
                                      {getInitials(user)}
                                    </div>
                                    <div className="min-w-0">
                                      <Link
                                        to={`/admin/users/${user.id}`}
                                        className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-emerald-700"
                                      >
                                        {getDisplayName(user)}
                                      </Link>
                                      <p className="mt-1 truncate text-sm text-slate-500">
                                        {user.email || 'Chưa cập nhật email'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 align-top">
                                  <Badge
                                    className={`rounded-full border px-3 py-1 font-semibold ${roleMeta.className}`}
                                  >
                                    <RoleIcon className="h-3.5 w-3.5" />
                                    {roleMeta.label}
                                  </Badge>
                                </td>
                                <td className="px-5 py-4 align-top text-sm text-slate-600">
                                  <p className="font-medium text-slate-700">
                                    {formatDate(user.created_at)}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">Tham gia hệ thống</p>
                                </td>
                                <td className="px-5 py-4 align-top">
                                  <Badge
                                    className={`rounded-full border px-3 py-1 font-semibold ${statusMeta.badgeClass}`}
                                  >
                                    <span
                                      className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`}
                                    />
                                    {statusMeta.label}
                                  </Badge>
                                </td>
                                <td className="px-5 py-4 align-top">
                                  <div className="flex items-center justify-center gap-2">
                                    {user.status === 'active' ? (
                                      <button
                                        type="button"
                                        onClick={() => handleStatusUpdate(user.id, 'banned')}
                                        disabled={!canUpdateStatus}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300"
                                        title={
                                          isCurrentUser
                                            ? 'Không thể khóa chính tài khoản đang đăng nhập'
                                            : 'Khóa tài khoản'
                                        }
                                      >
                                        <Ban className="h-4 w-4" />
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleStatusUpdate(user.id, 'active')}
                                        disabled={!canUpdateStatus}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300"
                                        title="Kích hoạt tài khoản"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(user)}
                                      disabled={!canDelete}
                                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition-all hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300"
                                      title={
                                        isCurrentUser
                                          ? 'Không thể xóa chính tài khoản đang đăng nhập'
                                          : 'Xóa tài khoản'
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {pagination.pages > 0 ? (
                    <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <p className="text-sm text-slate-500">
                          Hiển thị {pageStart}-{pageEnd} trong {formatNumber(pagination.total)} người dùng
                        </p>
                        <select
                          value={pageSize}
                          onChange={(event) => {
                            setPageSize(Number(event.target.value));
                            setPage(1);
                          }}
                          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        >
                          {PAGE_SIZE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                          disabled={page === 1}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        {pageItems.map((item) =>
                          typeof item === 'string' ? (
                            <span key={item} className="px-1 text-sm font-semibold text-slate-400">
                              ...
                            </span>
                          ) : (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setPage(item)}
                              className={`flex h-10 min-w-[40px] items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                                page === item
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                              }`}
                            >
                              {item}
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setPage((currentPage) =>
                              Math.min(Math.max(1, pagination.pages), currentPage + 1)
                            )
                          }
                          disabled={page === Math.max(1, pagination.pages)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard
            icon={Shield}
            title="Tổng quan kết quả"
            description="Tóm tắt nhanh kết quả đang hiển thị, bộ lọc áp dụng và các quy tắc vận hành quan trọng."
            className="self-start xl:sticky xl:top-24"
          >
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Góc nhìn hiện tại
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {formatNumber(pagination.total)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Kết quả khớp bộ lọc đang áp dụng</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  <Users className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-lg bg-white p-4 ring-1 ring-inset ring-slate-100">
                  <p className="text-xs font-semibold text-slate-500">Người thao tác</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{currentRoleLabel}</p>
                </div>
                <div className="rounded-lg bg-white p-4 ring-1 ring-inset ring-slate-100">
                  <p className="text-xs font-semibold text-slate-500">Bộ lọc đang bật</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {activeFilterCount > 0 ? `${activeFilterCount} bộ lọc` : 'Không có'}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4 ring-1 ring-inset ring-slate-100">
                  <p className="text-xs font-semibold text-slate-500">Từ khóa</p>
                  <p className="mt-2 truncate text-sm font-bold text-slate-900">
                    {debouncedSearch.trim() || 'Tất cả người dùng'}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4 ring-1 ring-inset ring-slate-100">
                  <p className="text-xs font-semibold text-slate-500">Trang hiện tại</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {page} / {Math.max(1, pagination.pages)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {quickViewMetrics.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-100"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">
                        {formatNumber(item.value)}
                      </p>
                    </div>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-inset ${item.className}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                Chờ xác minh: {formatNumber(statusBreakdown.pending)}
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                Đã khóa: {formatNumber(statusBreakdown.locked)}
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
                Khác: {formatNumber(statusBreakdown.other)}
              </Badge>
            </div>

            <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
                Quy tắc nghiệp vụ
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>Admin vận hành không thể khóa hoặc chỉnh sửa tài khoản admin khác.</li>
                <li>Chỉ Super Admin mới có quyền xóa tài khoản khỏi hệ thống.</li>
                <li>Không thể tự khóa hoặc tự xóa chính tài khoản đang đăng nhập.</li>
              </ul>
            </div>
          </SectionCard>
        </section>
      </main>
    </div>
  );
};

export default UsersPage;
