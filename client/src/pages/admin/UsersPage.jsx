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
  Eye,
  Filter,
  MoreVertical,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCircle2,
  UserPlus2,
  Users,
  X,
  Zap,
} from 'lucide-react';

import { ContentCard, PageHeader } from '@/components/admin';
import StatCard from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const CHANGEABLE_ROLE_OPTIONS = [
  { value: 'candidate', label: 'Ứng viên' },
  { value: 'recruiter', label: 'Nhà tuyển dụng' },
  { value: 'admin', label: 'Admin' },
];

const LOCKED_USER_STATUSES = new Set(['banned', 'locked', 'suspended']);

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

const SectionCard = ContentCard;

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatDate(value) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

const CANONICAL_ROLES = new Set(['admin', 'recruiter', 'candidate']);

function normalizeRole(role) {
  const normalizedRole = String(role ?? '')
    .trim()
    .toLowerCase();
  return CANONICAL_ROLES.has(normalizedRole) ? normalizedRole : 'candidate';
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
  const role = normalizeRole(user?.role);
  if (role === 'admin') {
    return {
      label: 'Admin',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
      icon: Shield,
    };
  }

  if (role === 'recruiter') {
    return {
      label: 'Nhà tuyển dụng',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: Briefcase,
    };
  }

  return {
    label: 'Ứng viên',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
    icon: UserCircle2,
  };
}

function getStatusMeta(status) {
  const normalizedStatus = String(status ?? '')
    .trim()
    .toLowerCase();

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

function UserActionMenu({
  user,
  isCurrentUser,
  isLocked,
  isStatusBusy,
  isDeleteBusy,
  onToggleLock,
  onDelete,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-xl border-slate-200 bg-white p-2 shadow-xl"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          Thao tác
        </DropdownMenuLabel>
        <DropdownMenuItem
          asChild
          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
        >
          <Link to={`/admin/users/${user.id}`}>
            <Eye className="h-4 w-4 text-emerald-600" />
            Xem chi tiết
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem
          onClick={() => onToggleLock(user)}
          disabled={isCurrentUser || isStatusBusy}
          className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium ${
            isLocked
              ? 'text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800'
              : 'text-rose-700 focus:bg-rose-50 focus:text-rose-800'
          }`}
        >
          {isLocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          {isStatusBusy ? 'Đang xử lý' : isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(user)}
          disabled={isCurrentUser || isDeleteBusy}
          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-rose-700 focus:bg-rose-50 focus:text-rose-800"
        >
          <Trash2 className="h-4 w-4" />
          {isDeleteBusy ? 'Đang xóa' : 'Xóa người dùng'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
  const [actionLoadingId, setActionLoadingId] = useState(null);
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
        status: String(item?.status ?? '')
          .trim()
          .toLowerCase(),
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
      const statsData = payload?.success ? payload?.data : (payload?.data ?? payload);

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

  const handleToggleUserLock = async (targetUser) => {
    const isCurrentUser = currentUser?.id != null && targetUser.id === currentUser.id;
    const locked = LOCKED_USER_STATUSES.has(targetUser.status);

    if (isCurrentUser) {
      showNotification('Không thể khóa hoặc mở khóa chính tài khoản đang đăng nhập.', 'error');
      return;
    }

    try {
      setActionLoadingId(`status-${targetUser.id}`);
      if (locked) {
        await adminService.unlockUser(targetUser.id);
        showNotification('Đã mở khóa tài khoản người dùng.', 'success');
      } else {
        await adminService.lockUser(targetUser.id);
        showNotification('Đã khóa tài khoản người dùng.', 'success');
      }
      await refreshAll();
    } catch (error) {
      console.error('Error toggling user lock:', error);
      showNotification(
        error?.response?.data?.message || 'Không thể cập nhật trạng thái khóa người dùng.',
        'error'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleChange = async (targetUser, nextRole) => {
    const normalizedNextRole = normalizeRole(nextRole);
    const currentRole = normalizeRole(targetUser.role);
    const isCurrentUser = currentUser?.id != null && targetUser.id === currentUser.id;

    if (!normalizedNextRole || normalizedNextRole === currentRole) return;

    if (isCurrentUser) {
      showNotification('Không thể đổi vai trò chính tài khoản đang đăng nhập.', 'error');
      return;
    }

    try {
      setActionLoadingId(`role-${targetUser.id}`);
      await adminService.updateUser(targetUser.id, { role: normalizedNextRole });
      showNotification('Đã cập nhật vai trò người dùng.', 'success');
      await refreshAll();
    } catch (error) {
      console.error('Error updating user role:', error);
      showNotification(
        error?.response?.data?.message || 'Không thể cập nhật vai trò người dùng.',
        'error'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const isCurrentUser = currentUser?.id != null && targetUser.id === currentUser.id;

    if (isCurrentUser) {
      showNotification('Không thể xóa chính tài khoản đang đăng nhập.', 'error');
      return;
    }

    const displayName = getDisplayName(targetUser);
    const confirmed = window.confirm(
      `Xóa người dùng "${displayName}" khỏi hệ thống?\n\nTài khoản sẽ bị xóa mềm, bị khóa đăng nhập và dữ liệu liên quan sẽ được dọn theo quy trình hệ thống.`
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(`delete-${targetUser.id}`);
      await adminService.deleteUser(targetUser.id);
      showNotification('Đã xóa người dùng khỏi hệ thống.', 'success');
      await refreshAll();
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification(
        error?.response?.data?.message || 'Không thể xóa người dùng. Vui lòng thử lại.',
        'error'
      );
    } finally {
      setActionLoadingId(null);
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
    pending: users.filter((user) => ['pending', 'pending_verification'].includes(user.status))
      .length,
    newToday: users.filter((user) => {
      const createdAt = new Date(user.created_at);
      const today = new Date();
      return createdAt.toDateString() === today.toDateString();
    }).length,
  };

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

  const roleFilterLabel =
    ROLE_OPTIONS.find((option) => option.value === roleFilter)?.label || 'Tất cả vai trò';
  const statusFilterLabel =
    STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label || 'Tất cả trạng thái';

  return (
    <div className="space-y-7 pb-10 animate-fade-in">
      <PageHeader
        icon={Users}
        eyebrow="Vận hành người dùng"
        badge="Quản lý tài khoản hệ thống"
        title="Quản lý người dùng"
        description="Theo dõi vòng đời tài khoản, rà soát trạng thái hoạt động, khóa hoặc mở khóa người dùng mà vẫn giữ nguyên quy tắc quyền hạn của hệ thống."
        actions={
          <>
            <Button
              type="button"
              onClick={refreshAll}
              disabled={loading || statsLoading}
              className="h-11 rounded-xl bg-slate-950 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading || statsLoading ? 'animate-spin' : ''}`}
              />
              Làm mới
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportUsers}
              disabled={exporting}
              className="h-11 rounded-xl bg-white px-5 font-bold shadow-sm"
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Đang xuất dữ liệu...' : 'Xuất CSV'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="h-11 rounded-xl bg-white px-5 font-bold shadow-sm"
            >
              <X className="mr-2 h-4 w-4" />
              Làm sạch bộ lọc
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <StatCard
              key={card.label}
              title={card.label}
              value={statsLoading ? '...' : card.value}
              subtitle={card.helper}
              icon={card.icon}
              type={card.className}
            />
          ))}
        </div>
      </PageHeader>

      {(() => {
        const issues = [loadIssues.users, loadIssues.stats].filter(Boolean);
        if (issues.length === 0) return null;

        const uniqueMessages = Array.from(new Set(issues.map((item) => item.message)));
        const uniqueDetails = Array.from(
          new Set(issues.map((item) => item.detail).filter(Boolean))
        );
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

      <section className="space-y-6">
        <SectionCard
          icon={Filter}
          title="Bộ lọc danh sách"
          description="Bộ lọc đúng nhu cầu vận hành: tìm kiếm, vai trò, trạng thái và kỹ năng."
          action={
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
              {activeFilterCount > 0 ? `${activeFilterCount} bộ lọc đang bật` : 'Tất cả người dùng'}
            </div>
          }
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
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

            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
              className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
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
              className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
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
              className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <span>
              Từ khóa:{' '}
              <strong className="text-slate-700">
                {debouncedSearch.trim() || 'Tất cả người dùng'}
              </strong>
            </span>
            <span>
              Vai trò: <strong className="text-slate-700">{roleFilterLabel}</strong>
            </span>
            <span>
              Trạng thái: <strong className="text-slate-700">{statusFilterLabel}</strong>
            </span>
            <span>
              Kỹ năng:{' '}
              <strong className="text-slate-700">{skillFilter.trim() || 'Không giới hạn'}</strong>
            </span>
          </div>
        </SectionCard>

        <SectionCard
          icon={Users}
          title="Danh sách người dùng"
          description="Bảng vận hành gồm: Người dùng, Email, Vai trò, Trạng thái và Ngày tạo."
          action={
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
              {loading
                ? 'Đang tải...'
                : `${pageStart}-${pageEnd} / ${formatNumber(pagination.total)} người`}
            </div>
          }
        >
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full min-w-[1160px] table-fixed divide-y divide-slate-200">
                  <colgroup>
                    <col className="w-[240px]" />
                    <col className="w-[270px]" />
                    <col className="w-[150px]" />
                    <col className="w-[150px]" />
                    <col className="w-[130px]" />
                    <col className="w-[220px]" />
                  </colgroup>
                  <thead className="bg-slate-50/90">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Tên
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Email
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Vai trò
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Trạng thái
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Ngày tạo
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-16">
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
                        const isCurrentUser = currentUser?.id != null && user.id === currentUser.id;
                        const normalizedUserRole = normalizeRole(user.role) || 'candidate';
                        const canChangeRole = !isCurrentUser;
                        const isLocked = LOCKED_USER_STATUSES.has(user.status);
                        const statusActionKey = `status-${user.id}`;
                        const roleActionKey = `role-${user.id}`;
                        const deleteActionKey = `delete-${user.id}`;
                        const isStatusBusy = actionLoadingId === statusActionKey;
                        const isRoleBusy = actionLoadingId === roleActionKey;
                        const isDeleteBusy = actionLoadingId === deleteActionKey;

                        return (
                          <tr key={user.id} className="transition-colors hover:bg-emerald-50/40">
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
                                  <p className="mt-1 text-xs text-slate-400">ID #{user.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top text-sm font-medium text-slate-700">
                              <span
                                className="block truncate"
                                title={user.email || 'Chưa cập nhật email'}
                              >
                                {user.email || 'Chưa cập nhật email'}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <Badge
                                className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 font-semibold ${roleMeta.className}`}
                              >
                                <RoleIcon className="h-3.5 w-3.5" />
                                {roleMeta.label}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <Badge
                                className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 font-semibold ${statusMeta.badgeClass}`}
                              >
                                <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
                                {statusMeta.label}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="text-sm font-semibold text-slate-700">
                                {formatDate(user.created_at)}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-right align-top whitespace-nowrap">
                              <div className="flex min-w-[212px] flex-nowrap items-center justify-end gap-2">
                                <select
                                  value={normalizedUserRole}
                                  onChange={(event) => handleRoleChange(user, event.target.value)}
                                  disabled={!canChangeRole || isRoleBusy}
                                  className="h-10 w-[170px] shrink-0 rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                  title="Đổi vai trò"
                                >
                                  {CHANGEABLE_ROLE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>

                                <UserActionMenu
                                  user={user}
                                  isCurrentUser={isCurrentUser}
                                  isLocked={isLocked}
                                  isStatusBusy={isStatusBusy}
                                  isDeleteBusy={isDeleteBusy}
                                  onToggleLock={handleToggleUserLock}
                                  onDelete={handleDeleteUser}
                                />
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
                      Hiển thị {pageStart}-{pageEnd} trong {formatNumber(pagination.total)} người
                      dùng
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
      </section>
    </div>
  );
};

export default UsersPage;
