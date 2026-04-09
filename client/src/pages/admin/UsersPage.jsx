import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Users,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Zap,
  UserPlus2,
  Download,
  TrendingUp,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import adminService from '../../services/adminService';
import AdminLayout from '../../layouts/AdminLayout';
import { useNotification } from '../../context/NotificationContext';
import useDebounce from '../../hooks/useDebounce';

const AVATAR_COLORS = ['bg-emerald-500', 'bg-amber-500', 'bg-slate-500', 'bg-emerald-600'];

const UsersPage = () => {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [inputValue, setInputValue] = useState(
    () => searchParams.get('search') || searchParams.get('q') || ''
  );
  const debouncedSearch = useDebounce(inputValue, 500);
  const [roleFilter, setRoleFilter] = useState(() => searchParams.get('role') || 'all');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 10,
      };
      const response = await adminService.getUsers(params);
      const rawData = response.data;
      if (response.data.success) {
        const usersData = Array.isArray(rawData?.data)
          ? rawData.data
          : Array.isArray(rawData)
            ? rawData
            : [];
        // Sanitize to ensure primitives
        const sanitized = usersData.map((u) => ({
          id: u?.id ?? 0,
          email: String(u?.email ?? ''),
          first_name: String(u?.first_name ?? ''),
          last_name: String(u?.last_name ?? ''),
          full_name: String(u?.full_name ?? ''),
          role: String(u?.role ?? ''),
          status: String(u?.status ?? ''),
          created_at: u?.created_at ?? new Date().toISOString(),
        }));
        setUsers(sanitized);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedSearch.trim()) nextParams.set('search', debouncedSearch.trim());
    if (roleFilter !== 'all') nextParams.set('role', roleFilter);
    if (statusFilter !== 'all') nextParams.set('status', statusFilter);
    if (page > 1) nextParams.set('page', String(page));
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [page, roleFilter, debouncedSearch, searchParams, setSearchParams, statusFilter]);

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      showNotification(`Đã cập nhật trạng thái người dùng thành công!`, 'success');
      fetchUsers();
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
      showNotification('Đã xuất danh sách người dùng thành công!', 'success');
    } catch (error) {
      console.error('Error exporting users:', error);
      showNotification('Không thể xuất danh sách người dùng.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'admin') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (role === 'employer') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    return 'bg-slate-500/20 text-slate-500 border-slate-500/30';
  };

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'ADMIN';
    if (role === 'employer') return 'NHÀ TUYỂN DỤNG';
    return 'ỨNG VIÊN';
  };

  const getStatusLabel = (status) => {
    if (status === 'active') return 'Hoạt động';
    if (status === 'banned' || status === 'inactive') return 'Bị khóa';
    return 'Chờ duyệt';
  };

  const getStatusDotClass = (status) => {
    if (status === 'active') return 'bg-emerald-400';
    if (status === 'banned' || status === 'inactive') return 'bg-red-400';
    return 'bg-amber-400';
  };

  const getInitials = (user) => {
    const name = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    return (user.email || 'U').slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];

  const totalUsers = pagination.total || users.length || 0;
  const activeCount = users.filter((u) => u.status === 'active').length;
  const newToday = users.filter((u) => {
    const d = new Date(u.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const statsCards = [
    {
      label: 'Tổng người dùng',
      value: totalUsers.toLocaleString('vi-VN'),
      change: totalUsers > 0 ? '+12.5%' : '0%',
      icon: Users,
      iconClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
    },
    {
      label: 'Đang hoạt động',
      value: activeCount.toLocaleString('vi-VN'),
      change: activeCount > 0 ? '+5.2%' : '0%',
      icon: Zap,
      iconClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
    },
    {
      label: 'Đăng ký mới hôm nay',
      value: newToday.toLocaleString('vi-VN'),
      change: newToday > 0 ? '+24%' : '0%',
      icon: UserPlus2,
      iconClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
    },
  ];

  const start = (page - 1) * 10 + 1;
  const end = Math.min(page * 10, pagination.total || 1254);

  return (
    <AdminLayout>
      <div className="space-y-6 text-slate-900">
        {/* Tiêu đề + Nút Thêm người dùng */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi và quản trị thông tin người dùng trên hệ thống RecruitAI
            </p>
          </div>
          <Link
            to="/admin/users/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 transition-colors shrink-0"
          >
            <UserPlus size={18} />+ Thêm người dùng
          </Link>
        </div>

        {/* 3 thẻ thống kê */}
        <div className="grid gap-4 sm:grid-cols-3">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="p-5 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-400">
                      <TrendingUp size={14} />
                      {card.change}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${card.bgClass} ${card.iconClass}`}>
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thanh tìm kiếm + bộ lọc */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setPage(1);
              }}
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="h-12 px-4 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="employer">Nhà tuyển dụng</option>
              <option value="candidate">Ứng viên</option>
            </select>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`h-12 px-4 rounded-xl border text-sm font-medium transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('employer')}
              className={`h-12 px-4 rounded-xl border text-sm font-medium transition-colors ${
                roleFilter === 'employer'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Nhà tuyển dụng
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('candidate')}
              className={`h-12 px-4 rounded-xl border text-sm font-medium transition-colors ${
                roleFilter === 'candidate'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Ứng viên
            </button>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-12 px-4 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="banned">Bị khóa</option>
              <option value="pending">Chờ duyệt</option>
            </select>
            <button
              type="button"
              onClick={handleExportUsers}
              disabled={exporting}
              className="h-12 w-12 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-foreground hover:border-slate-300 flex items-center justify-center transition-colors disabled:opacity-50"
              aria-label="Tải xuống"
              title="Xuất CSV"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* Bảng người dùng */}
        <div className="data-table-shell">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
            </div>
          ) : (
            <>
              <div className="data-table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="px-6 py-4">Người dùng</th>
                      <th className="px-6 py-4">Vai trò</th>
                      <th className="px-6 py-4">Ngày tham gia</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-end">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                          Không tìm thấy người dùng
                        </td>
                      </tr>
                    ) : (
                      users.map((user, index) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-slate-900 shrink-0 ${getAvatarColor(index)}`}
                              >
                                {getInitials(user)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {user.full_name ||
                                    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                                    'N/A'}
                                </p>
                                <p className="text-sm text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-lg border text-xs font-semibold ${getRoleBadgeClass(user.role)}`}
                            >
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString('vi-VN')
                              : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotClass(user.status)}`}
                              />
                              <span className="text-slate-600">{getStatusLabel(user.status)}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {user.status === 'active' ? (
                                <button
                                  onClick={() => handleStatusUpdate(user.id, 'banned')}
                                  className="p-2 rounded-lg text-red-400 hover:bg-destructive/100/10 transition-colors"
                                  title="Khóa tài khoản"
                                >
                                  <Ban size={18} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusUpdate(user.id, 'active')}
                                  className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                  title="Kích hoạt"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              {pagination.pages > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border bg-muted/25 px-6 py-4">
                  <p className="text-sm text-slate-500">
                    Hiển thị {start}-{end} trong {pagination.total.toLocaleString('vi-VN')} người
                    dùng
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-muted/55 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold transition-colors ${
                            page === p
                              ? 'bg-emerald-500 text-white'
                              : 'border border-slate-200 text-slate-500 hover:bg-muted/55 hover:text-foreground'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    {pagination.pages > 5 && (
                      <>
                        <span className="px-2 text-slate-500">...</span>
                        <button
                          type="button"
                          onClick={() => setPage(pagination.pages)}
                          className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold border border-slate-200 text-slate-500 hover:bg-muted/55 hover:text-foreground ${
                            page === pagination.pages
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : ''
                          }`}
                        >
                          {pagination.pages}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-muted/55 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UsersPage;
