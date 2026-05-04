import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileX,
  Filter,
  MoreVertical,
  RefreshCw,
  Search,
  X,
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
import { cn } from '@/utils';
import { JOB_STATUS } from '../../constants/status';
import { useNotification } from '../../context/NotificationContext';
import useDebounce from '../../hooks/useDebounce';
import adminService from '../../services/adminService';

const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  [JOB_STATUS.DRAFT]: {
    label: 'Bản nháp',
    description: 'Nhà tuyển dụng đang hoàn thiện nội dung.',
    dot: 'bg-slate-500',
    text: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  [JOB_STATUS.PENDING_REVIEW]: {
    label: 'Chờ duyệt',
    description: 'Cần admin phê duyệt trước khi hiển thị.',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  [JOB_STATUS.APPROVED]: {
    label: 'Đã duyệt',
    description: 'Sẵn sàng phát hành theo lịch vận hành.',
    dot: 'bg-blue-500',
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  [JOB_STATUS.PUBLISHED]: {
    label: 'Đã đăng',
    description: 'Tin đang hiển thị công khai với ứng viên.',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  [JOB_STATUS.REJECTED]: {
    label: 'Từ chối',
    description: 'Tin không đạt yêu cầu kiểm duyệt.',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  [JOB_STATUS.SUSPENDED]: {
    label: 'Đã ẩn',
    description: 'Tin đang bị ẩn khỏi luồng công khai.',
    dot: 'bg-violet-500',
    text: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  [JOB_STATUS.CLOSED]: {
    label: 'Đã đóng',
    description: 'Tin đã dừng nhận hồ sơ mới.',
    dot: 'bg-slate-500',
    text: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
  [JOB_STATUS.EXPIRED]: {
    label: 'Hết hạn',
    description: 'Tin đã quá thời hạn hiển thị.',
    dot: 'bg-orange-500',
    text: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: JOB_STATUS.PENDING_REVIEW, label: 'Chờ duyệt' },
  { value: JOB_STATUS.PUBLISHED, label: 'Đã đăng' },
  { value: JOB_STATUS.REJECTED, label: 'Từ chối' },
  { value: JOB_STATUS.SUSPENDED, label: 'Đã ẩn' },
  { value: JOB_STATUS.CLOSED, label: 'Đã đóng' },
];

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

const SectionCard = ContentCard;

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[JOB_STATUS.DRAFT];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
        config.bg,
        config.text,
        config.border
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <Briefcase className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-950">Không tìm thấy tin tuyển dụng</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Hãy thử thay đổi từ khóa, trạng thái hoặc ngành để tiếp tục rà soát.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        className="mt-5 rounded-lg bg-white font-bold"
      >
        Xóa bộ lọc
      </Button>
    </div>
  );
}

function JobActionMenu({ job, onApprove, onReject, onHide }) {
  const canApprove = job.status === JOB_STATUS.PENDING_REVIEW;
  const canReject = job.status !== JOB_STATUS.REJECTED;
  const canHide = ![JOB_STATUS.SUSPENDED, JOB_STATUS.CLOSED].includes(job.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-xl border-slate-200 bg-white p-2 shadow-xl"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          Thao tác
        </DropdownMenuLabel>
        <DropdownMenuItem
          asChild
          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
        >
          <Link to={`/admin/jobs/${job.id}`}>
            <Eye className="h-4 w-4 text-emerald-600" />
            Xem chi tiết
          </Link>
        </DropdownMenuItem>
        {canApprove ? (
          <DropdownMenuItem
            onClick={() => onApprove(job)}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800"
          >
            <CheckCircle className="h-4 w-4" />
            Duyệt tin
          </DropdownMenuItem>
        ) : null}
        {canReject ? (
          <DropdownMenuItem
            onClick={() => onReject(job)}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-rose-700 focus:bg-rose-50 focus:text-rose-800"
          >
            <XCircle className="h-4 w-4" />
            Từ chối
          </DropdownMenuItem>
        ) : null}
        {canHide ? (
          <>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              onClick={() => onHide(job)}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:bg-slate-100 focus:text-slate-900"
            >
              <FileX className="h-4 w-4" />
              Ẩn tin
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const AdminJobsPage = () => {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputValue, setInputValue] = useState(() => searchParams.get('search') || '');
  const [industryValue, setIndustryValue] = useState(() => searchParams.get('industry') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [stats, setStats] = useState({ total: 0, pending: 0, published: 0, flagged: 0 });
  const [exporting, setExporting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialog, setRejectDialog] = useState({ open: false, job: null, reason: '' });
  const [hideDialog, setHideDialog] = useState({ open: false, job: null });

  const debouncedSearch = useDebounce(inputValue, 500);
  const debouncedIndustry = useDebounce(industryValue, 500);

  const requestParams = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      industry: debouncedIndustry.trim() || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [debouncedIndustry, debouncedSearch, page, statusFilter]
  );

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await adminService.getJobs(requestParams);
      const payload = response?.data;
      const rawJobs = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      const sanitizedJobs = rawJobs.map((job) => ({
        id: Number(job?.id ?? 0),
        title: String(job?.title ?? 'Tin chưa đặt tiêu đề'),
        company_id: job?.company_id ?? job?.employer_id ?? null,
        company_name: String(job?.company_name ?? job?.company?.name ?? 'Chưa gắn công ty'),
        industry: String(
          job?.company_industry ?? job?.category_name ?? job?.category ?? 'Chưa phân loại'
        ),
        status: String(job?.status ?? JOB_STATUS.DRAFT),
        created_at: job?.created_at ?? null,
        flagged: Boolean(job?.flagged ?? job?.is_flagged ?? false),
        moderation_note: String(job?.moderation_note ?? job?.rejection_reason ?? ''),
      }));

      const nextPagination = payload?.pagination ?? {
        total: sanitizedJobs.length,
        pages: 1,
      };
      const nextPages = Math.max(1, Number(nextPagination?.pages ?? 1));
      const nextTotal = Math.max(0, Number(nextPagination?.total ?? sanitizedJobs.length));

      setJobs(sanitizedJobs);
      setPagination({ total: nextTotal, pages: nextPages });
      setStats({
        total: Number(payload?.stats?.total ?? nextTotal),
        pending: Number(
          payload?.stats?.pending ??
            sanitizedJobs.filter((job) => job.status === JOB_STATUS.PENDING_REVIEW).length
        ),
        published: Number(
          payload?.stats?.published ??
            sanitizedJobs.filter((job) => job.status === JOB_STATUS.PUBLISHED).length
        ),
        flagged: Number(
          payload?.stats?.flagged ?? sanitizedJobs.filter((job) => job.flagged).length
        ),
      });

      if (nextTotal > 0 && page > nextPages) {
        setPage(nextPages);
      }
    } catch (fetchError) {
      const message =
        fetchError?.response?.data?.message || 'Không thể tải danh sách tin tuyển dụng.';
      setError(message);
      setJobs([]);
      setPagination({ total: 0, pages: 1 });
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, requestParams, showNotification]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedSearch.trim()) nextParams.set('search', debouncedSearch.trim());
    if (statusFilter !== 'all') nextParams.set('status', statusFilter);
    if (debouncedIndustry.trim()) nextParams.set('industry', debouncedIndustry.trim());
    if (page > 1) nextParams.set('page', String(page));

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedIndustry, debouncedSearch, page, searchParams, setSearchParams, statusFilter]);

  const totalPages = Math.max(1, pagination.pages || 1);
  const visibleFrom = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const visibleTo = pagination.total === 0 ? 0 : Math.min(page * PAGE_SIZE, pagination.total);
  const pageItems = useMemo(() => buildPaginationItems(page, totalPages), [page, totalPages]);

  const statusLabel =
    STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label || 'Tất cả trạng thái';

  const summaryCards = useMemo(
    () => [
      {
        label: 'Tổng tin',
        value: formatNumber(stats.total),
        helper: 'Toàn bộ tin tuyển dụng',
        icon: Briefcase,
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      },
      {
        label: 'Chờ duyệt',
        value: formatNumber(stats.pending),
        helper: 'Cần kiểm duyệt trước khi hiển thị',
        icon: Clock3,
        className: 'bg-amber-50 text-amber-700 ring-amber-100',
      },
      {
        label: 'Đã đăng',
        value: formatNumber(stats.published),
        helper: 'Đang hiển thị với ứng viên',
        icon: CheckCircle,
        className: 'bg-sky-50 text-sky-700 ring-sky-100',
      },
      {
        label: 'Cần rà soát',
        value: formatNumber(stats.flagged),
        helper: 'Tin bị gắn cờ hoặc có cảnh báo',
        icon: AlertTriangle,
        className: 'bg-rose-50 text-rose-700 ring-rose-100',
      },
    ],
    [stats]
  );

  const handleResetFilters = () => {
    setInputValue('');
    setIndustryValue('');
    setStatusFilter('all');
    setPage(1);
  };

  const handleRefresh = () => {
    fetchJobs();
  };

  const handleExportJobs = async () => {
    try {
      setExporting(true);
      const response = await adminService.exportJobs({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        industry: debouncedIndustry.trim() || undefined,
      });
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jobs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('Đã xuất danh sách tin tuyển dụng thành công.', 'success');
    } catch (exportError) {
      console.error('Error exporting jobs:', exportError);
      showNotification(
        exportError?.response?.data?.message || 'Không thể xuất danh sách tin tuyển dụng.',
        'error'
      );
    } finally {
      setExporting(false);
    }
  };

  const updateJobStatus = async (job, nextStatus, rejectionReason = null) => {
    try {
      setActionLoading(true);
      await adminService.updateJobStatus(job.id, nextStatus, rejectionReason);
      showNotification(
        `Đã cập nhật trạng thái tin sang "${STATUS_CONFIG[nextStatus]?.label || nextStatus}".`,
        'success'
      );
      await fetchJobs();
      return true;
    } catch (statusError) {
      console.error('Error updating job status:', statusError);
      showNotification(
        statusError?.response?.data?.message || 'Không thể cập nhật trạng thái tin tuyển dụng.',
        'error'
      );
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveJob = (job) => updateJobStatus(job, JOB_STATUS.PUBLISHED);

  const openRejectDialog = (job) => {
    setRejectDialog({ open: true, job, reason: '' });
  };

  const closeRejectDialog = () => {
    if (actionLoading) return;
    setRejectDialog({ open: false, job: null, reason: '' });
  };

  const handleRejectJob = async () => {
    const reason = rejectDialog.reason.trim();
    if (!rejectDialog.job) return;
    if (!reason) {
      showNotification('Vui lòng nhập lý do từ chối tin tuyển dụng.', 'error');
      return;
    }

    const succeeded = await updateJobStatus(rejectDialog.job, JOB_STATUS.REJECTED, reason);
    if (succeeded) {
      setRejectDialog({ open: false, job: null, reason: '' });
    }
  };

  const openHideDialog = (job) => {
    setHideDialog({ open: true, job });
  };

  const closeHideDialog = () => {
    if (actionLoading) return;
    setHideDialog({ open: false, job: null });
  };

  const handleHideJob = async () => {
    if (!hideDialog.job) return;

    const succeeded = await updateJobStatus(hideDialog.job, JOB_STATUS.SUSPENDED);
    if (succeeded) {
      setHideDialog({ open: false, job: null });
    }
  };

  return (
    <div className="space-y-7 pb-10 animate-fade-in">
      <PageHeader
        icon={Briefcase}
        eyebrow="Kiểm duyệt tin tuyển dụng"
        badge="Quản lý tin tuyển dụng"
        title="Quản lý tin tuyển dụng"
        description="Rà soát tin mới theo trạng thái chờ duyệt, duyệt để hiển thị công khai, từ chối kèm lý do hoặc ẩn tin khi cần kiểm tra thêm."
        actions={
          <>
            <Button
              type="button"
              onClick={handleRefresh}
              className="h-11 rounded-xl bg-slate-950 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Làm mới
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportJobs}
              disabled={exporting}
              className="h-11 rounded-xl bg-white px-5 font-bold shadow-sm"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Đang xuất dữ liệu...' : 'Xuất CSV'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="h-11 rounded-xl bg-white px-5 font-bold shadow-sm"
            >
              <X className="h-4 w-4" />
              Làm sạch bộ lọc
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((metric) => (
            <StatCard
              key={metric.label}
              title={metric.label}
              value={metric.value}
              subtitle={metric.helper}
              icon={metric.icon}
              type={metric.className}
            />
          ))}
        </div>
      </PageHeader>

      <section className="space-y-6">
        <SectionCard
          icon={Filter}
          title="Bộ lọc danh sách"
          description="Bộ lọc đúng nhu cầu vận hành: tìm kiếm, trạng thái và ngành nghề."
          action={
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
              {statusLabel}
            </div>
          }
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tiêu đề hoặc mô tả tin..."
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
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Lọc theo ngành..."
              value={industryValue}
              onChange={(event) => {
                setIndustryValue(event.target.value);
                setPage(1);
              }}
              className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <span>
              Từ khóa:{' '}
              <strong className="text-slate-700">{debouncedSearch.trim() || 'Tất cả tin'}</strong>
            </span>
            <span>
              Trạng thái: <strong className="text-slate-700">{statusLabel}</strong>
            </span>
            <span>
              Ngành:{' '}
              <strong className="text-slate-700">
                {debouncedIndustry.trim() || 'Tất cả ngành'}
              </strong>
            </span>
          </div>
        </SectionCard>

        <SectionCard
          icon={Briefcase}
          title="Danh sách tin tuyển dụng"
          description="Bảng vận hành gồm: Tiêu đề, Công ty, Ngành, Trạng thái và Ngày đăng."
          action={
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
              {loading
                ? 'Đang tải...'
                : `${visibleFrom}-${visibleTo} / ${formatNumber(pagination.total)} tin`}
            </div>
          }
        >
          {error ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState onReset={handleResetFilters} />
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-[1040px] w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/90">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Tiêu đề
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Công ty
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Ngành
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Trạng thái
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Ngày đăng
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {jobs.map((job) => (
                      <tr key={job.id} className="transition-colors hover:bg-emerald-50/30">
                        <td className="px-5 py-4 align-top">
                          <div className="min-w-0">
                            <Link
                              to={`/admin/jobs/${job.id}`}
                              className="line-clamp-2 text-sm font-bold text-slate-950 transition-colors hover:text-emerald-700"
                            >
                              {job.title}
                            </Link>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
                                JOB-{String(job.id).slice(-4).padStart(4, '0')}
                              </Badge>
                              {job.flagged ? (
                                <Badge className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">
                                  Cần rà soát
                                </Badge>
                              ) : null}
                            </div>
                            {job.moderation_note ? (
                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-rose-600">
                                Ghi chú: {job.moderation_note}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          {job.company_id ? (
                            <Link
                              to={`/admin/companies/${job.company_id}`}
                              className="line-clamp-2 text-sm font-semibold text-slate-800 transition-colors hover:text-emerald-700"
                            >
                              {job.company_name}
                            </Link>
                          ) : (
                            <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                              {job.company_name}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-700">
                            {job.industry}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <StatusBadge status={job.status} />
                          <p className="mt-2 max-w-[240px] text-xs leading-5 text-slate-500">
                            {
                              (STATUS_CONFIG[job.status] || STATUS_CONFIG[JOB_STATUS.DRAFT])
                                .description
                            }
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-700">
                            {formatDate(job.created_at)}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right align-top">
                          <div className="flex justify-end gap-2">
                            {job.status === JOB_STATUS.PENDING_REVIEW ? (
                              <Button
                                type="button"
                                size="icon"
                                onClick={() => handleApproveJob(job)}
                                disabled={actionLoading}
                                className="h-10 w-10 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <JobActionMenu
                              job={job}
                              onApprove={handleApproveJob}
                              onReject={openRejectDialog}
                              onHide={openHideDialog}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.total > 0 ? (
                <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Hiển thị <span className="font-semibold text-slate-900">{visibleFrom}</span>-
                    <span className="font-semibold text-slate-900">{visibleTo}</span> trên{' '}
                    <span className="font-semibold text-slate-900">
                      {formatNumber(pagination.total)}
                    </span>{' '}
                    tin tuyển dụng
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page <= 1}
                      className="h-10 rounded-lg bg-white px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

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
                          className={cn(
                            'min-w-[40px] rounded-lg border px-3 py-2 text-sm font-semibold transition-all',
                            page === item
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                          )}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={page >= totalPages}
                      className="h-10 rounded-lg bg-white px-3"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>
      </section>

      {rejectDialog.open && rejectDialog.job ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Từ chối tin tuyển dụng?</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Lý do từ chối là bắt buộc và sẽ được lưu để nhà tuyển dụng biết cần chỉnh sửa nội
                  dung nào.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-950">{rejectDialog.job.title}</p>
              <p className="mt-1 text-sm text-slate-500">{rejectDialog.job.company_name}</p>
            </div>

            <label
              className="mt-5 block text-sm font-bold text-slate-700"
              htmlFor="job-reject-reason"
            >
              Lý do từ chối
            </label>
            <textarea
              id="job-reject-reason"
              rows={4}
              value={rejectDialog.reason}
              onChange={(event) =>
                setRejectDialog((previous) => ({ ...previous, reason: event.target.value }))
              }
              placeholder="Ví dụ: Mô tả công việc thiếu thông tin bắt buộc hoặc nội dung chưa phù hợp chính sách đăng tuyển."
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
                onClick={handleRejectJob}
                disabled={actionLoading || !rejectDialog.reason.trim()}
                className="rounded-lg font-bold"
              >
                {actionLoading ? 'Đang xử lý...' : 'Từ chối tin'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {hideDialog.open && hideDialog.job ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
                <FileX className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Ẩn tin tuyển dụng?</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Tin sẽ chuyển sang trạng thái tạm ngưng và không được xem như tin đang hiển thị
                  công khai.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-950">{hideDialog.job.title}</p>
              <p className="mt-1 text-sm text-slate-500">{hideDialog.job.company_name}</p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeHideDialog}
                disabled={actionLoading}
                className="rounded-lg bg-white font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleHideJob}
                disabled={actionLoading}
                className="rounded-lg font-bold"
              >
                {actionLoading ? 'Đang xử lý...' : 'Ẩn tin'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminJobsPage;
