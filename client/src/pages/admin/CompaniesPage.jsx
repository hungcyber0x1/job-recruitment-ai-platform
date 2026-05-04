import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Globe,
  LockKeyhole,
  MapPin,
  MoreVertical,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
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
import useDebounce from '../../hooks/useDebounce';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';

const PAGE_SIZE = 10;
const LOGO_COLORS = [
  'bg-emerald-500/15 text-emerald-700 ring-emerald-100',
  'bg-sky-500/15 text-sky-700 ring-sky-100',
  'bg-amber-500/15 text-amber-700 ring-amber-100',
  'bg-violet-500/15 text-violet-700 ring-violet-100',
];

const COMPANY_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
  { value: 'flagged', label: 'Đang cảnh báo' },
  { value: 'locked', label: 'Đã khóa' },
];

const LOCKED_USER_STATUSES = new Set(['banned', 'suspended', 'locked']);

const SectionCard = ContentCard;

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
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

function getInitials(name = '') {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) return 'CT';

  const parts = normalizedName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return normalizedName.slice(0, 2).toUpperCase();
}

function getLogoColor(index) {
  return LOGO_COLORS[index % LOGO_COLORS.length];
}

function getCompanyLocation(company) {
  return company.location || company.city || 'Chưa cập nhật địa điểm';
}

function getCompanyWebsite(company) {
  const value = String(company.company_website || '').trim();
  if (!value) return '';
  return value.startsWith('http') ? value : `https://${value}`;
}

function resolveCompanyStatus(company = {}) {
  const userStatus = String(company.user_status || company.owner_status || '')
    .trim()
    .toLowerCase();
  if (LOCKED_USER_STATUSES.has(userStatus)) return 'locked';
  if (company.flagged) return 'flagged';
  if (company.is_verified) return 'approved';
  if (
    String(company.verification_status || '')
      .trim()
      .toLowerCase() === 'rejected'
  )
    return 'rejected';
  return 'pending';
}

function getStatusMeta(company) {
  const status = resolveCompanyStatus(company);

  if (status === 'locked') {
    return {
      label: 'Đã khóa',
      description: 'Tài khoản tuyển dụng bị khóa',
      icon: LockKeyhole,
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }

  if (status === 'flagged') {
    return {
      label: 'Đang cảnh báo',
      description: 'Hồ sơ cần admin rà soát thêm',
      icon: ShieldAlert,
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  if (status === 'rejected') {
    return {
      label: 'Đã từ chối',
      description: 'Cần bổ sung hồ sơ trước khi duyệt',
      icon: XCircle,
      badgeClass: 'border-red-200 bg-red-50 text-red-700',
    };
  }

  if (status === 'approved') {
    return {
      label: 'Đã duyệt',
      description: 'Được phép đăng tin',
      icon: ShieldCheck,
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  return {
    label: 'Chờ duyệt',
    description: 'Chưa được đăng tin',
    icon: Clock3,
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
  };
}

const CompaniesPage = () => {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [inputValue, setInputValue] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebounce(inputValue, 500);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialog, setRejectDialog] = useState({ open: false, company: null, reason: '' });
  const [lockDialog, setLockDialog] = useState({ open: false, company: null });

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        search: debouncedSearch.trim() || undefined,
        moderation_status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: PAGE_SIZE,
      };

      const response = await adminService.getCompanies(params);
      const payload = response?.data;

      if (payload?.success) {
        const list = Array.isArray(payload?.data) ? payload.data : [];
        const sanitizedCompanies = list.map((company) => ({
          id: company?.id ?? 0,
          company_name: String(company?.company_name ?? ''),
          email: String(company?.email ?? company?.user_email ?? company?.owner_email ?? ''),
          company_logo: String(company?.company_logo ?? ''),
          company_website: String(company?.company_website ?? ''),
          company_description: String(company?.company_description ?? ''),
          location: String(company?.location ?? ''),
          city: String(company?.city ?? ''),
          moderation_note: String(company?.moderation_note ?? company?.rejection_reason ?? ''),
          verification_status: String(company?.verification_status ?? '')
            .trim()
            .toLowerCase(),
          user_status: String(company?.user_status ?? company?.owner_status ?? '')
            .trim()
            .toLowerCase(),
          is_verified: Boolean(company?.is_verified ?? false),
          flagged: Boolean(company?.flagged ?? false),
          job_count: Number(company?.job_count ?? company?.open_jobs_count ?? 0),
          created_at: company?.created_at ?? null,
        }));

        const nextPagination = payload?.pagination ?? {
          total: sanitizedCompanies.length,
          pages: 1,
        };
        const nextPages = Math.max(1, Number(nextPagination?.pages ?? 1));
        const nextTotal = Math.max(0, Number(nextPagination?.total ?? sanitizedCompanies.length));

        setCompanies(sanitizedCompanies);
        setPagination({
          total: nextTotal,
          pages: nextPages,
        });
        setStats({
          total: Number(payload?.stats?.total ?? nextTotal),
          approved: Number(
            payload?.stats?.approved ??
              sanitizedCompanies.filter((company) => resolveCompanyStatus(company) === 'approved')
                .length
          ),
          pending: Number(
            payload?.stats?.pending ??
              sanitizedCompanies.filter((company) => resolveCompanyStatus(company) === 'pending')
                .length
          ),
          rejected: Number(
            payload?.stats?.rejected ??
              sanitizedCompanies.filter((company) => resolveCompanyStatus(company) === 'rejected')
                .length
          ),
          flagged: Number(
            payload?.stats?.flagged ??
              sanitizedCompanies.filter((company) => resolveCompanyStatus(company) === 'flagged')
                .length
          ),
          locked: Number(
            payload?.stats?.locked ??
              sanitizedCompanies.filter((company) => resolveCompanyStatus(company) === 'locked')
                .length
          ),
        });

        if (nextTotal > 0 && page > nextPages) {
          setPage(nextPages);
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedSearch.trim()) nextParams.set('search', debouncedSearch.trim());
    if (statusFilter !== 'all') nextParams.set('status', statusFilter);
    if (page > 1) nextParams.set('page', String(page));

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch, page, searchParams, setSearchParams, statusFilter]);

  const refreshCompanies = useCallback(async () => {
    await fetchCompanies();
  }, [fetchCompanies]);

  const handleApproveCompany = async (company) => {
    try {
      setActionLoading(true);
      await adminService.verifyCompany(company.id, true, null);
      showNotification(
        'Đã duyệt công ty. Nhà tuyển dụng có thể đăng tin sau khi đáp ứng điều kiện hệ thống.',
        'success'
      );
      await refreshCompanies();
    } catch (error) {
      console.error('Error approving company:', error);
      showNotification(
        error?.response?.data?.message || 'Có lỗi xảy ra khi duyệt công ty.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (company) => {
    setRejectDialog({ open: true, company, reason: '' });
  };

  const closeRejectDialog = () => {
    if (actionLoading) return;
    setRejectDialog({ open: false, company: null, reason: '' });
  };

  const handleRejectCompany = async () => {
    const company = rejectDialog.company;
    const reason = rejectDialog.reason.trim();

    if (!company) return;
    if (!reason) {
      showNotification('Vui lòng nhập lý do từ chối công ty.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.verifyCompany(company.id, false, reason);
      showNotification('Đã từ chối công ty và lưu lý do kiểm duyệt.', 'success');
      setRejectDialog({ open: false, company: null, reason: '' });
      await refreshCompanies();
    } catch (error) {
      console.error('Error rejecting company:', error);
      showNotification(
        error?.response?.data?.message || 'Có lỗi xảy ra khi từ chối công ty.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openLockDialog = (company) => {
    setLockDialog({ open: true, company });
  };

  const closeLockDialog = () => {
    if (actionLoading) return;
    setLockDialog({ open: false, company: null });
  };

  const handleLockCompany = async () => {
    const company = lockDialog.company;
    if (!company) return;

    try {
      setActionLoading(true);
      await adminService.banCompany(company.id);
      showNotification(
        'Đã khóa công ty, khóa tài khoản nhà tuyển dụng và đóng các tin liên quan.',
        'success'
      );
      setLockDialog({ open: false, company: null });
      await refreshCompanies();
    } catch (error) {
      console.error('Error locking company:', error);
      showNotification(
        error?.response?.data?.message || 'Có lỗi xảy ra khi khóa công ty.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const resetFilters = () => {
    setInputValue('');
    setStatusFilter('all');
    setPage(1);
  };

  const safeStats = stats ?? {
    total: pagination.total || companies.length,
    approved: companies.filter((company) => resolveCompanyStatus(company) === 'approved').length,
    pending: companies.filter((company) => resolveCompanyStatus(company) === 'pending').length,
    rejected: companies.filter((company) => resolveCompanyStatus(company) === 'rejected').length,
    flagged: companies.filter((company) => resolveCompanyStatus(company) === 'flagged').length,
    locked: companies.filter((company) => resolveCompanyStatus(company) === 'locked').length,
  };

  const approvedCount = Number(safeStats.approved || 0);
  const pageStart = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = pagination.total === 0 ? 0 : Math.min(page * PAGE_SIZE, pagination.total);
  const pageItems = useMemo(
    () => buildPaginationItems(page, Math.max(1, pagination.pages || 1)),
    [page, pagination.pages]
  );

  const summaryCards = [
    {
      label: 'Tổng công ty',
      value: formatNumber(safeStats.total),
      helper: 'Hồ sơ doanh nghiệp',
      icon: Building2,
      className: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
    },
    {
      label: 'Đã duyệt',
      value: formatNumber(approvedCount),
      helper: 'Được phép đăng tin',
      icon: ShieldCheck,
      className: 'text-sky-700 bg-sky-50 ring-sky-100',
    },
    {
      label: 'Chờ duyệt',
      value: formatNumber(safeStats.pending),
      helper: 'Cần rà soát',
      icon: Clock3,
      className: 'text-amber-700 bg-amber-50 ring-amber-100',
    },
    {
      label: 'Đã từ chối',
      value: formatNumber(safeStats.rejected),
      helper: 'Cần bổ sung hồ sơ',
      icon: XCircle,
      className: 'text-red-700 bg-red-50 ring-red-100',
    },
    {
      label: 'Đang cảnh báo',
      value: formatNumber(safeStats.flagged),
      helper: 'Cần kiểm tra thêm',
      icon: AlertTriangle,
      className: 'text-orange-700 bg-orange-50 ring-orange-100',
    },
    {
      label: 'Đã khóa',
      value: formatNumber(safeStats.locked),
      helper: 'Bị chặn đăng tuyển',
      icon: ShieldAlert,
      className: 'text-rose-700 bg-rose-50 ring-rose-100',
    },
  ];

  const statusLabel =
    COMPANY_STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label ||
    'Tất cả trạng thái';

  return (
    <div className="space-y-7 pb-10 animate-fade-in">
      <PageHeader
        icon={Building2}
        eyebrow="Kiểm duyệt doanh nghiệp"
        badge="Kiểm duyệt hồ sơ doanh nghiệp"
        title="Quản lý công ty"
        description="Theo dõi hồ sơ doanh nghiệp, xác thực thông tin công ty và xử lý cảnh báo kiểm duyệt trong cùng một không gian vận hành rõ ràng hơn."
        actions={
          <>
            <Button
              type="button"
              onClick={() => {
                setStatusFilter('pending');
                setPage(1);
              }}
              className="h-11 rounded-xl bg-slate-950 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <Clock3 className="mr-2 h-4 w-4" />
              Xem chờ duyệt
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="h-11 rounded-xl bg-white px-5 font-bold shadow-sm"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Làm sạch bộ lọc
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {summaryCards.map((card) => (
            <StatCard
              key={card.label}
              title={card.label}
              value={card.value}
              subtitle={card.helper}
              icon={card.icon}
              type={card.className}
            />
          ))}
        </div>
      </PageHeader>

      <section className="space-y-6">
        <SectionCard
          icon={Search}
          title="Bộ lọc danh sách"
          description="Tìm theo tên công ty hoặc email, lọc theo trạng thái duyệt/khóa để xử lý đúng quy trình kiểm duyệt."
        >
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm công ty hoặc email..."
                  value={inputValue}
                  onChange={(event) => {
                    setInputValue(event.target.value);
                    setPage(1);
                  }}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              >
                {COMPANY_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <span>
                Từ khóa:{' '}
                <strong className="text-slate-700">
                  {debouncedSearch.trim() || 'Tất cả công ty'}
                </strong>
              </span>
              <span>
                Trạng thái: <strong className="text-slate-700">{statusLabel}</strong>
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={Building2}
          title="Danh sách công ty"
          description="Các thao tác thông thường chỉ gồm xem chi tiết, duyệt, từ chối kèm lý do và khóa công ty; không hiển thị xóa cứng trong luồng vận hành."
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
                        Tên công ty
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Email
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Trạng thái
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Số tin tuyển dụng
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Ngày tạo
                      </th>
                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {companies.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-16">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                              <Building2 className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-base font-bold text-slate-900">
                              Không tìm thấy công ty phù hợp
                            </h3>
                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                              Hãy điều chỉnh lại bộ lọc hoặc mở rộng từ khóa để xem thêm hồ sơ doanh
                              nghiệp.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      companies.map((company, index) => {
                        const statusMeta = getStatusMeta(company);
                        const StatusIcon = statusMeta.icon;
                        const website = getCompanyWebsite(company);

                        return (
                          <tr key={company.id} className="transition-colors hover:bg-emerald-50/30">
                            <td className="px-5 py-4 align-top">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold ring-1 ring-inset ${getLogoColor(index)}`}
                                >
                                  {company.company_logo ? (
                                    <img
                                      src={company.company_logo}
                                      alt={company.company_name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    getInitials(company.company_name)
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    to={`/admin/companies/${company.id}`}
                                    className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-emerald-700"
                                  >
                                    {company.company_name || 'Công ty chưa đặt tên'}
                                  </Link>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                                    <span className="inline-flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5" />
                                      {getCompanyLocation(company)}
                                    </span>
                                    {website ? (
                                      <a
                                        href={website}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 hover:text-emerald-700"
                                      >
                                        <Globe className="h-3.5 w-3.5" />
                                        Website
                                      </a>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="max-w-[220px] truncate text-sm font-semibold text-slate-700">
                                {company.email || 'Chưa cập nhật email'}
                              </p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <Badge
                                className={`rounded-full border px-3 py-1 font-semibold ${statusMeta.badgeClass}`}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusMeta.label}
                              </Badge>
                              <p className="mt-2 text-xs font-medium text-slate-500">
                                {statusMeta.description}
                              </p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="inline-flex rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-100">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                                    Tin tuyển dụng
                                  </p>
                                  <p className="mt-1 text-lg font-bold text-slate-950">
                                    {formatNumber(company.job_count)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="text-sm font-semibold text-slate-700">
                                {formatDate(company.created_at)}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-center align-top">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-52 rounded-xl border-slate-200 p-2 shadow-lg"
                                >
                                  <DropdownMenuLabel className="px-2 text-xs font-bold text-slate-400">
                                    Thao tác
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                                    <Link to={`/admin/companies/${company.id}`}>
                                      <ExternalLink className="mr-2 h-4 w-4 text-emerald-500" />
                                      Xem chi tiết
                                    </Link>
                                  </DropdownMenuItem>
                                  {!company.is_verified && !company.flagged ? (
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-lg"
                                      onClick={() => handleApproveCompany(company)}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                      Duyệt công ty
                                    </DropdownMenuItem>
                                  ) : null}
                                  {resolveCompanyStatus(company) !== 'locked' ? (
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-lg text-rose-700 focus:bg-rose-50 focus:text-rose-800"
                                      onClick={() => openRejectDialog(company)}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Từ chối
                                    </DropdownMenuItem>
                                  ) : null}
                                  {resolveCompanyStatus(company) !== 'locked' ? (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="cursor-pointer rounded-lg text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                                        onClick={() => openLockDialog(company)}
                                      >
                                        <LockKeyhole className="mr-2 h-4 w-4" />
                                        Khóa công ty
                                      </DropdownMenuItem>
                                    </>
                                  ) : null}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {pagination.total > 0 ? (
                <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm text-slate-500">
                    Hiển thị {pageStart}-{pageEnd} trong {formatNumber(pagination.total)} công ty
                  </p>

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

      {rejectDialog.open && rejectDialog.company ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Từ chối công ty?</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Lý do từ chối là bắt buộc để nhà tuyển dụng biết cần chỉnh sửa hồ sơ trước khi gửi
                  duyệt lại.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-950">{rejectDialog.company.company_name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {rejectDialog.company.email || 'Chưa cập nhật email'}
              </p>
            </div>

            <label
              className="mt-5 block text-sm font-bold text-slate-700"
              htmlFor="company-reject-reason"
            >
              Lý do từ chối
            </label>
            <textarea
              id="company-reject-reason"
              rows={4}
              value={rejectDialog.reason}
              onChange={(event) =>
                setRejectDialog((previous) => ({ ...previous, reason: event.target.value }))
              }
              placeholder="Ví dụ: Hồ sơ công ty thiếu giấy phép kinh doanh hoặc thông tin liên hệ chưa xác thực."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            />

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeRejectDialog}
                disabled={actionLoading}
                className="rounded-lg bg-white font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleRejectCompany}
                disabled={actionLoading || !rejectDialog.reason.trim()}
                className="rounded-lg font-bold"
              >
                {actionLoading ? 'Đang xử lý...' : 'Từ chối công ty'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {lockDialog.open && lockDialog.company ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Khóa công ty?</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Hành động này khóa tài khoản nhà tuyển dụng liên quan và đóng các tin tuyển dụng
                  đang mở theo logic backend.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-950">{lockDialog.company.company_name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {formatNumber(lockDialog.company.job_count)} tin tuyển dụng liên quan
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeLockDialog}
                disabled={actionLoading}
                className="rounded-lg bg-white font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleLockCompany}
                disabled={actionLoading}
                className="rounded-lg font-bold"
              >
                {actionLoading ? 'Đang xử lý...' : 'Khóa công ty'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CompaniesPage;
