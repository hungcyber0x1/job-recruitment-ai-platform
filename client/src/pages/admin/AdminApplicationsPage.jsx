import React, { useCallback, useEffect, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Hourglass,
  Loader2,
  MoreVertical,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  User,
  XCircle,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import AdminTable from '../../components/admin/AdminTable';
import StatusBadge from '../../components/common/StatusBadge';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useNotification } from '../../context/NotificationContext';
import useDebounce from '../../hooks/useDebounce';
import adminService from '../../services/adminService';
import { APPLICATION_STATUS } from '../../constants';
import { cn } from '../../utils';

const PAGE_SIZE = 10;

const PIPELINE_STATUSES = [
  { id: 'all', label: 'Tất cả', icon: FileText, accentClass: 'bg-slate-100 text-slate-600' },
  { id: APPLICATION_STATUS.SUBMITTED, label: 'Đã nộp', icon: Hourglass, accentClass: 'bg-amber-100 text-amber-700' },
  { id: APPLICATION_STATUS.SHORTLISTED, label: 'Rút gọn', icon: Star, accentClass: 'bg-amber-100 text-amber-700' },
  {
    id: APPLICATION_STATUS.INTERVIEW_SCHEDULED,
    label: 'Lịch phỏng vấn',
    icon: Calendar,
    accentClass: 'bg-sky-100 text-sky-700',
  },
  {
    id: APPLICATION_STATUS.INTERVIEWED,
    label: 'Đã phỏng vấn',
    icon: CheckCircle,
    accentClass: 'bg-blue-100 text-blue-700',
  },
  {
    id: APPLICATION_STATUS.OFFERED,
    label: 'Kiến nghị',
    icon: CheckCircle,
    accentClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: APPLICATION_STATUS.HIRED,
    label: 'Đã tuyển',
    icon: User,
    accentClass: 'bg-emerald-100 text-emerald-700',
  },
  { id: APPLICATION_STATUS.REJECTED, label: 'Từ chối', icon: XCircle, accentClass: 'bg-rose-100 text-rose-700' },
  { id: APPLICATION_STATUS.WITHDRAWN, label: 'Đã rút', icon: XCircle, accentClass: 'bg-slate-100 text-slate-600' },
];

function SectionCard({ icon: Icon, title, description, action, className = '', children, ...props }) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200/70 hover:shadow-md sm:p-6 ${className}`}
      {...props}
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


function getInitials(name = '') {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) return 'UV';

  const parts = normalizedName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return normalizedName.slice(0, 2).toUpperCase();
}

function formatAppliedDate(value) {
  if (!value) return 'Chưa có thời gian';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có thời gian';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getStatusLabel(status) {
  return PIPELINE_STATUSES.find((item) => item.id === status)?.label || 'Không xác định';
}


const AdminApplicationsPage = () => {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [inputValue, setInputValue] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebounce(inputValue, 500);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, pages: 1 });
  const [serverStats, setServerStats] = useState({
    total: 0,
    [APPLICATION_STATUS.SUBMITTED]: 0,
    [APPLICATION_STATUS.SHORTLISTED]: 0,
    [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: 0,
    [APPLICATION_STATUS.INTERVIEWED]: 0,
    [APPLICATION_STATUS.OFFERED]: 0,
    [APPLICATION_STATUS.HIRED]: 0,
    [APPLICATION_STATUS.REJECTED]: 0,
    [APPLICATION_STATUS.WITHDRAWN]: 0,
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [updatingBulk, setUpdatingBulk] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: PAGE_SIZE,
      };

      const response = await adminService.getApplications(params);
      const resData = response.data;

      if (resData?.success) {
        const appsData = Array.isArray(resData?.data) ? resData.data : [];

        setApplications(
          appsData.map((application) => ({
            id: application?.id ?? 0,
            candidate_name: String(application?.candidate_name ?? ''),
            candidate_email: String(application?.candidate_email ?? ''),
            job_title: String(application?.job_title ?? ''),
            company_name: String(application?.company_name ?? ''),
            status: String(application?.status ?? APPLICATION_STATUS.SUBMITTED),
            user_id: application?.user_id ?? null,
            job_id: application?.job_id ?? null,
            employer_id: application?.employer_id ?? null,
            applied_at: application?.applied_at ?? application?.created_at ?? null,
          }))
        );

        if (resData.pagination) {
          setPaginationMeta({
            total: Number(resData.pagination.total) || 0,
            pages: Number(resData.pagination.pages) || 1,
          });
        }

        if (resData.stats) {
          setServerStats({
            total: resData.stats.total || 0,
            [APPLICATION_STATUS.SUBMITTED]: resData.stats[APPLICATION_STATUS.SUBMITTED] || 0,
            [APPLICATION_STATUS.SHORTLISTED]: resData.stats[APPLICATION_STATUS.SHORTLISTED] || 0,
            [APPLICATION_STATUS.INTERVIEW_SCHEDULED]:
              resData.stats[APPLICATION_STATUS.INTERVIEW_SCHEDULED] || 0,
            [APPLICATION_STATUS.INTERVIEWED]: resData.stats[APPLICATION_STATUS.INTERVIEWED] || 0,
            [APPLICATION_STATUS.OFFERED]: resData.stats[APPLICATION_STATUS.OFFERED] || 0,
            [APPLICATION_STATUS.HIRED]: resData.stats[APPLICATION_STATUS.HIRED] || 0,
            [APPLICATION_STATUS.REJECTED]: resData.stats[APPLICATION_STATUS.REJECTED] || 0,
            [APPLICATION_STATUS.WITHDRAWN]: resData.stats[APPLICATION_STATUS.WITHDRAWN] || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showNotification('Không thể tải danh sách ứng tuyển.', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, showNotification, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);

    if (debouncedSearch.trim()) {
      nextParams.set('search', debouncedSearch.trim());
    } else {
      nextParams.delete('search');
    }

    if (statusFilter !== 'all') {
      nextParams.set('status', statusFilter);
    } else {
      nextParams.delete('status');
    }

    if (page > 1) {
      nextParams.set('page', String(page));
    } else {
      nextParams.delete('page');
    }

    setSearchParams(nextParams, { replace: true });
  }, [debouncedSearch, page, searchParams, setSearchParams, statusFilter]);

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await adminService.exportApplications({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `applications-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification('Đã xuất báo cáo ứng tuyển CSV.', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Lỗi xuất dữ liệu.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await adminService.updateApplicationStatus(id, status);
      showNotification(`Đã chuyển trạng thái đơn sang ${getStatusLabel(status)}.`, 'success');
      fetchApplications();
    } catch (error) {
      showNotification('Lỗi cập nhật trạng thái.', 'error');
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedIds.length === 0) return;

    try {
      setUpdatingBulk(true);
      await adminService.bulkUpdateApplicationsStatus(selectedIds, status);
      showNotification(
        `Đã cập nhật ${selectedIds.length} đơn sang trạng thái ${getStatusLabel(status)}.`,
        'success'
      );
      setSelectedIds([]);
      fetchApplications();
    } catch (error) {
      showNotification('Lỗi khi cập nhật hàng loạt.', 'error');
    } finally {
      setUpdatingBulk(false);
    }
  };

  const resetFilters = () => {
    setInputValue('');
    setStatusFilter('all');
    setPage(1);
    setSelectedIds([]);
  };

  const pageStart = paginationMeta.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = paginationMeta.total === 0 ? 0 : Math.min(page * PAGE_SIZE, paginationMeta.total);
  const activeStatusLabel = getStatusLabel(statusFilter);
  const selectedCount = selectedIds.length;

  const summaryCards = [
    {
      label: 'Tổng đơn',
      value: formatNumber(serverStats.total),
      helper: 'Hồ sơ đang được theo dõi',
      icon: FileText,
      className: 'bg-slate-50 text-slate-700 ring-slate-100',
    },
    {
      label: 'Đã nộp',
      value: formatNumber(serverStats[APPLICATION_STATUS.SUBMITTED]),
      helper: 'Nguồn đầu vào mới',
      icon: Hourglass,
      className: 'bg-amber-50 text-amber-700 ring-amber-100',
    },
    {
      label: 'Lịch phỏng vấn',
      value: formatNumber(serverStats[APPLICATION_STATUS.INTERVIEW_SCHEDULED]),
      helper: 'Đang chờ xử lý',
      icon: Calendar,
      className: 'bg-sky-50 text-sky-700 ring-sky-100',
    },
    {
      label: 'Đã tuyển',
      value: formatNumber(serverStats[APPLICATION_STATUS.HIRED]),
      helper: 'Kết quả đã chốt',
      icon: CheckCircle,
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    },
  ];

  const bulkActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-9 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50"
        onClick={() => handleBulkStatusUpdate(APPLICATION_STATUS.INTERVIEW_SCHEDULED)}
        disabled={updatingBulk}
      >
        <Calendar size={14} className="mr-2 text-sky-500" />
        Lên lịch phỏng vấn
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 rounded-xl border-red-200 bg-white font-bold text-red-600 hover:border-red-100 hover:bg-red-50"
        onClick={() => handleBulkStatusUpdate(APPLICATION_STATUS.REJECTED)}
        disabled={updatingBulk}
      >
        <XCircle size={14} className="mr-2" />
        Từ chối
      </Button>
    </div>
  );

  const columns = [
    {
      header: 'Ứng viên',
      width: '280px',
      render: (application) => (
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
            {getInitials(application.candidate_name)}
          </div>
          <div className="min-w-0">
            <Link
              to={`/admin/applications/${application.id}`}
              className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-emerald-700"
            >
              {application.candidate_name || 'Ứng viên chưa cập nhật tên'}
            </Link>
            <p className="mt-1 truncate text-sm text-slate-500">{application.candidate_email}</p>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Nộp hồ sơ: {formatAppliedDate(application.applied_at)}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Vị trí',
      width: '250px',
      render: (application) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {application.job_title || 'Tin tuyển dụng đã ẩn'}
          </p>
          <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <Briefcase className="h-3 w-3 shrink-0" />
            <span className="truncate">{application.company_name || 'Chưa có công ty'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Pipeline',
      width: '170px',
      render: (application) => (
        <div className="space-y-2">
          <StatusBadge entityType="application" status={application.status} />
          <p className="text-xs font-medium text-slate-400">{getStatusLabel(application.status)}</p>
        </div>
      ),
    },
    {
      header: 'Quản lý',
      width: '90px',
      align: 'right',
      render: (application) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl border border-slate-200 p-2 shadow-lg"
          >
            <DropdownMenuLabel className="px-2 text-xs font-bold uppercase tracking-normal text-slate-400">
              Thao tác
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
              <Link to={`/admin/applications/${application.id}`}>
                <Eye className="mr-2 h-4 w-4 text-emerald-500" />
                Xem chi tiết
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={() =>
                handleStatusUpdate(application.id, APPLICATION_STATUS.INTERVIEW_SCHEDULED)
              }
            >
              <Calendar className="mr-2 h-4 w-4 text-sky-500" />
              Lên lịch phỏng vấn
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg text-red-600 focus:text-red-600"
              onClick={() => handleStatusUpdate(application.id, APPLICATION_STATUS.REJECTED)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Từ chối ứng viên
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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
                Pipeline ứng tuyển
              </Badge>
            </div>

            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-emerald-600">Application operations</p>
              <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
                Quản lý ứng tuyển
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Theo dõi pipeline ứng viên, AI insights và quyết định tuyển dụng trong cùng một
                không gian vận hành rõ ràng, dễ quét và đồng nhất hơn với khu quản trị doanh
                nghiệp.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
                          {card.value}
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
                onClick={handleExport}
                disabled={exporting}
                variant="outline"
                className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold shadow-sm hover:bg-white"
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
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
        <section className="space-y-6">
          <SectionCard
            icon={Search}
            title="Bộ lọc pipeline"
            description="Tìm ứng viên theo tên, email hoặc vị trí, sau đó thu hẹp nhanh theo từng chặng xử lý để đội tuyển dụng vào việc ngay."
          >
            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm ứng viên, email hoặc vị trí..."
                  value={inputValue}
                  onChange={(event) => {
                    setInputValue(event.target.value);
                    setPage(1);
                  }}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {PIPELINE_STATUSES.map((status) => {
                  const Icon = status.icon;
                  const isActive = statusFilter === status.id;
                  const statKey = status.id === 'all' ? 'total' : status.id;
                  const count = serverStats[statKey] ?? 0;

                  return (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status.id);
                        setPage(1);
                      }}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                        isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          isActive ? 'bg-emerald-100 text-emerald-700' : status.accentClass
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {status.label}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                          isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <span>
                  Từ khóa:{' '}
                  <strong className="text-slate-700">
                    {debouncedSearch.trim() || 'Tất cả ứng viên'}
                  </strong>
                </span>
                <span>
                  Pipeline: <strong className="text-slate-700">{activeStatusLabel}</strong>
                </span>
                <span>
                  Đang hiển thị:{' '}
                  <strong className="text-slate-700">
                    {pageStart}-{pageEnd} / {formatNumber(paginationMeta.total)}
                  </strong>
                </span>
                <span>
                  Đã chọn: <strong className="text-slate-700">{formatNumber(selectedCount)}</strong>
                </span>
              </div>
            </div>
          </SectionCard>

          <AdminTable
            title="Danh sách ứng tuyển"
            subtitle="Giữ nguyên thao tác cập nhật pipeline, xem chi tiết và xử lý hàng loạt, nhưng trình bày lại để bảng dễ quét và có thứ bậc rõ hơn."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                  {pageStart}-{pageEnd} / {formatNumber(paginationMeta.total)}
                </Badge>
                {statusFilter !== 'all' ? (
                  <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                    {activeStatusLabel}
                  </Badge>
                ) : null}
              </div>
            }
            columns={columns}
            data={applications}
            loading={loading}
            pagination={{
              currentPage: page,
              totalPages: paginationMeta.pages,
              totalItems: paginationMeta.total,
              pageSize: PAGE_SIZE,
              onPageChange: setPage,
            }}
            selectable={{
              selectedIds,
              onSelectChange: setSelectedIds,
            }}
            bulkActions={bulkActions}
            emptyTitle="Không có hồ sơ phù hợp"
            emptyDescription="Hãy điều chỉnh lại bộ lọc hoặc mở rộng từ khóa để xem thêm các đơn ứng tuyển."
          />
        </section>
      </main>
    </div>
  );
};

export default AdminApplicationsPage;
