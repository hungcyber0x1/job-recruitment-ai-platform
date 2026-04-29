import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileX,
  Filter,
  Flag,
  FolderOpen,
  MapPin,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';

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

const DEFAULT_FILTERS = {
  riskLevel: 'all',
  company: '',
  dateRange: 'all',
};

const STATUS_CONFIG = {
  [JOB_STATUS.DRAFT]: {
    label: 'Bản nháp',
    description: 'Nhà tuyển dụng đang hoàn thiện nội dung.',
    color: 'bg-slate-500',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
  [JOB_STATUS.PENDING_REVIEW]: {
    label: 'Chờ duyệt',
    description: 'Cần admin phê duyệt trước khi hiển thị.',
    color: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  [JOB_STATUS.APPROVED]: {
    label: 'Đã duyệt',
    description: 'Sẵn sàng phát hành theo lịch vận hành.',
    color: 'bg-blue-500',
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  [JOB_STATUS.PUBLISHED]: {
    label: 'Đã đăng',
    description: 'Tin đang hiển thị công khai với ứng viên.',
    color: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  [JOB_STATUS.REJECTED]: {
    label: 'Từ chối',
    description: 'Tin không đạt yêu cầu kiểm duyệt.',
    color: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  [JOB_STATUS.CLOSED]: {
    label: 'Đã đóng',
    description: 'Tin đã dừng nhận hồ sơ mới.',
    color: 'bg-slate-500',
    text: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
  [JOB_STATUS.EXPIRED]: {
    label: 'Hết hạn',
    description: 'Tin đã quá thời hạn hiển thị.',
    color: 'bg-orange-500',
    text: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  [JOB_STATUS.SUSPENDED]: {
    label: 'Tạm ngưng',
    description: 'Tin đang bị tạm ngưng để rà soát.',
    color: 'bg-violet-500',
    text: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
};

const RISK_CONFIG = {
  low: {
    label: 'Thấp',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: Shield,
  },
  medium: {
    label: 'Trung bình',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
  },
  high: {
    label: 'Cao',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertTriangle,
  },
};

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày gần nhất' },
  { value: 'month', label: '30 ngày gần nhất' },
];

const SORT_OPTIONS = [
  { value: 'created_at-desc', label: 'Mới cập nhật trước' },
  { value: 'created_at-asc', label: 'Cũ nhất trước' },
  { value: 'title-asc', label: 'Tiêu đề A-Z' },
  { value: 'title-desc', label: 'Tiêu đề Z-A' },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

const isTruthyFlag = (value) =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

function formatSalary(jobOrMin, maxValue) {
  const isJobObject = typeof jobOrMin === 'object' && jobOrMin !== null;
  const min = isJobObject ? jobOrMin.salary_min : jobOrMin;
  const max = isJobObject ? jobOrMin.salary_max : maxValue;
  if (isJobObject && isTruthyFlag(jobOrMin.salary_negotiable)) return 'Thỏa thuận';
  if (!min && !max) return 'Thỏa thuận';

  const formatMoney = (amount) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);

  if (min && max) return `${formatMoney(min)} - ${formatMoney(max)}`;
  if (min) return `Từ ${formatMoney(min)}`;
  return `Đến ${formatMoney(max)}`;
}

function formatRelativeDate(value) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return date.toLocaleDateString('vi-VN');
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  return date.toLocaleDateString('vi-VN');
}

function resolveRiskScore(job) {
  const rawRisk = job?.ai_risk ?? job?.risk_score ?? (job?.flagged ? 0.45 : 0.05);
  return rawRisk > 1 ? rawRisk / 100 : rawRisk;
}

function buildPageNumbers(page, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) return [1, 2, 3, 4, 5];
  if (page >= totalPages - 2) {
    return Array.from({ length: 5 }, (_, index) => totalPages - 4 + index);
  }

  return [page - 2, page - 1, page, page + 1, page + 2];
}

function SectionCard({ icon: Icon, title, description, action, className = '', children, ...props }) {
  return (
    <section
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200/70 hover:shadow-md sm:p-6',
        className
      )}
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

function HeroMetricCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-normal text-slate-950">{item.value}</p>
          <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-inset',
            item.className
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

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
      <span className={cn('h-1.5 w-1.5 rounded-full', config.color)} />
      {config.label}
    </span>
  );
}

function RiskBadge({ risk, className = '' }) {
  const config = RISK_CONFIG[risk.level] || RISK_CONFIG.low;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
        config.bg,
        config.color,
        config.border,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {risk.label} ({risk.pct}%)
    </span>
  );
}

function TableActionMenu({ job, onOpenDelete }) {
  return (
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
        className="w-52 rounded-xl border-slate-200 bg-white p-2 shadow-xl"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          Thao tác tin
        </DropdownMenuLabel>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium">
          <Link to={`/admin/jobs/${job.id}`}>
            <Eye className="h-4 w-4 text-emerald-600" />
            Xem chi tiết
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium">
          <Link to={`/admin/jobs/${job.id}/edit`}>
            <Edit className="h-4 w-4 text-slate-600" />
            Chỉnh sửa
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem
          onClick={() => onOpenDelete(job)}
          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Xóa tin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        Hãy thử thay đổi bộ lọc, từ khóa hoặc quay lại danh sách mặc định để tiếp tục rà soát.
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

const AdminJobsPage = () => {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState(() => searchParams.get('search') || '');
  const [tabFilter, setTabFilter] = useState(() => searchParams.get('status') || 'all');
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [exporting, setExporting] = useState(false);

  const debouncedSearch = useDebounce(inputValue, 500);
  const limit = 10;

  const getDateRange = useCallback(() => {
    const now = new Date();

    if (filters.dateRange === 'today') {
      const today = now.toISOString().split('T')[0];
      return { startDate: today, endDate: today };
    }

    if (filters.dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    }

    if (filters.dateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        startDate: monthAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    }

    return { startDate: undefined, endDate: undefined };
  }, [filters.dateRange]);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      const params = {
        search: debouncedSearch.trim() || undefined,
        status: tabFilter !== 'all' && tabFilter !== 'flagged' ? tabFilter : undefined,
        flagged: tabFilter === 'flagged' ? 'true' : undefined,
        ai_risk: filters.riskLevel !== 'all' ? filters.riskLevel : undefined,
        company: filters.company.trim() || undefined,
        start_date: startDate,
        end_date: endDate,
        sort_by: sortBy,
        order: sortOrder,
        page,
        limit,
      };

      const response = await adminService.getJobs(params);
      const rawData = response.data;
      let jobsData = [];

      if (Array.isArray(rawData)) {
        jobsData = rawData;
      } else if (Array.isArray(rawData?.data)) {
        jobsData = rawData.data;
      }

      const sanitized = jobsData.map((job) => ({
        id: Number(job?.id ?? 0),
        title: String(job?.title ?? 'Tin chưa đặt tiêu đề'),
        company_name: String(job?.company_name ?? job?.company?.name ?? 'Chưa gắn doanh nghiệp'),
        employer_id: job?.employer_id ?? job?.company_id ?? null,
        status: String(job?.status ?? JOB_STATUS.DRAFT),
        flagged: Boolean(job?.flagged ?? job?.is_flagged ?? false),
        created_at: job?.created_at ?? new Date().toISOString(),
        updated_at: job?.updated_at ?? new Date().toISOString(),
        ai_risk: typeof job?.ai_risk === 'number' ? job.ai_risk : null,
        risk_score: typeof job?.risk_score === 'number' ? job.risk_score : null,
        salary_min: job?.salary_min ?? null,
        salary_max: job?.salary_max ?? null,
        location: String(job?.location ?? job?.location_name ?? 'Chưa cập nhật'),
        category: String(job?.category ?? job?.category_name ?? 'Chưa phân loại'),
        applicants: Number(
          job?.applicant_count ?? job?.applications_count ?? job?.applicants ?? 0
        ),
        views: Number(job?.views ?? job?.view_count ?? 0),
        moderation_note: String(job?.moderation_note ?? job?.rejection_reason ?? ''),
      }));

      setJobs(sanitized);
      setPagination(
        response.data?.pagination ?? {
          total: sanitized.length,
          pages: 1,
        }
      );
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      setPagination({ total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    filters.company,
    filters.riskLevel,
    getDateRange,
    page,
    sortBy,
    sortOrder,
    tabFilter,
  ]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (debouncedSearch.trim()) nextParams.set('search', debouncedSearch.trim());
    if (tabFilter !== 'all') nextParams.set('status', tabFilter);
    if (page > 1) nextParams.set('page', String(page));

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch, page, searchParams, setSearchParams, tabFilter]);

  useEffect(() => {
    setSelectedJobs((prev) => prev.filter((id) => jobs.some((job) => job.id === id)));
  }, [jobs]);

  const displayedJobs = jobs;
  const totalJobs = pagination.total || displayedJobs.length;
  const totalPages = Math.max(1, pagination.pages || 1);
  const visibleFrom = totalJobs === 0 ? 0 : (page - 1) * limit + 1;
  const visibleTo = totalJobs === 0 ? 0 : Math.min(page * limit, totalJobs);

  const stats = useMemo(
    () => ({
      total: totalJobs,
      pending: displayedJobs.filter((job) => job.status === JOB_STATUS.PENDING_REVIEW).length,
      published: displayedJobs.filter((job) => job.status === JOB_STATUS.PUBLISHED).length,
      flagged: displayedJobs.filter((job) => job.flagged).length,
      avgRisk:
        displayedJobs.length > 0
          ? (
              (displayedJobs.reduce((sum, job) => sum + resolveRiskScore(job), 0) /
                displayedJobs.length) *
              100
            ).toFixed(1)
          : '0.0',
    }),
    [displayedJobs, totalJobs]
  );

  const tabs = useMemo(
    () => [
      { id: 'all', label: 'Tất cả', count: stats.total },
      { id: JOB_STATUS.PENDING_REVIEW, label: 'Chờ duyệt', count: stats.pending },
      { id: JOB_STATUS.PUBLISHED, label: 'Đã đăng', count: stats.published },
      { id: 'flagged', label: 'Bị gắn cờ', count: stats.flagged },
    ],
    [stats]
  );

  const heroMetrics = useMemo(
    () => [
      {
        label: 'Tổng tin tuyển dụng',
        value: formatNumber(stats.total),
        helper: 'Toàn bộ kết quả theo truy vấn hiện tại',
        icon: Briefcase,
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      },
      {
        label: 'Chờ duyệt',
        value: formatNumber(stats.pending),
        helper: 'Ưu tiên cao trên trang đang xem',
        icon: FolderOpen,
        className: 'bg-amber-50 text-amber-700 ring-amber-100',
      },
      {
        label: 'Tin bị gắn cờ',
        value: formatNumber(stats.flagged),
        helper: 'Có cảnh báo cần kiểm tra kỹ hơn',
        icon: Flag,
        className: 'bg-red-50 text-red-700 ring-red-100',
      },
      {
        label: 'Rủi ro AI trung bình',
        value: `${stats.avgRisk}%`,
        helper: 'Mức rủi ro của danh sách đang hiển thị',
        icon: Shield,
        className: 'bg-sky-50 text-sky-700 ring-sky-100',
      },
    ],
    [stats]
  );

  const activeFilterCount = useMemo(
    () =>
      [
        inputValue.trim().length > 0,
        tabFilter !== 'all',
        filters.riskLevel !== 'all',
        filters.company.trim().length > 0,
        filters.dateRange !== 'all',
      ].filter(Boolean).length,
    [filters.company, filters.dateRange, filters.riskLevel, inputValue, tabFilter]
  );

  const activeFilterTags = useMemo(() => {
    const items = [];

    if (inputValue.trim()) items.push(`Từ khóa: ${inputValue.trim()}`);
    if (tabFilter !== 'all') {
      items.push(
        `Trạng thái: ${tabs.find((tab) => tab.id === tabFilter)?.label || 'Tuỳ chọn hiện tại'}`
      );
    }
    if (filters.riskLevel !== 'all') {
      items.push(`Rủi ro AI: ${RISK_CONFIG[filters.riskLevel]?.label || filters.riskLevel}`);
    }
    if (filters.company.trim()) items.push(`Doanh nghiệp: ${filters.company.trim()}`);
    if (filters.dateRange !== 'all') {
      items.push(
        `Thời gian: ${
          DATE_RANGE_OPTIONS.find((option) => option.value === filters.dateRange)?.label ||
          filters.dateRange
        }`
      );
    }

    return items;
  }, [filters.company, filters.dateRange, filters.riskLevel, inputValue, tabFilter, tabs]);

  const pageNumbers = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);

  const getAiRisk = useCallback((job) => {
    const pct = Math.round(resolveRiskScore(job) * 100);
    if (pct <= 20) return { level: 'low', pct };
    if (pct <= 60) return { level: 'medium', pct };
    return { level: 'high', pct };
  }, []);

  const openDeleteDialog = (job) => {
    setSelectedJob(job);
    setShowDeleteModal(true);
  };

  const handleRefresh = () => {
    setSelectedJobs([]);
    fetchJobs();
  };

  const handleResetAllFilters = () => {
    setInputValue('');
    setTabFilter('all');
    setFilters({ ...DEFAULT_FILTERS });
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
    setShowFilterPanel(false);
    setSelectedJobs([]);
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      await adminService.updateJobStatus(jobId, newStatus);
      showNotification(
        `Đã cập nhật trạng thái sang "${STATUS_CONFIG[newStatus]?.label || newStatus}"`,
        'success'
      );
      fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      showNotification('Không thể cập nhật trạng thái tin tuyển dụng.', 'error');
    }
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;

    try {
      await adminService.deleteJob(selectedJob.id);
      showNotification('Đã xóa tin tuyển dụng khỏi danh sách quản trị.', 'success');
      setShowDeleteModal(false);
      setSelectedJob(null);
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      showNotification('Không thể xóa tin tuyển dụng.', 'error');
    }
  };

  const handleExportJobs = async () => {
    try {
      setExporting(true);
      const { startDate, endDate } = getDateRange();
      const params = {
        search: inputValue.trim() || undefined,
        status: tabFilter !== 'all' && tabFilter !== 'flagged' ? tabFilter : undefined,
        flagged: tabFilter === 'flagged' ? 'true' : undefined,
        ai_risk: filters.riskLevel !== 'all' ? filters.riskLevel : undefined,
        company: filters.company.trim() || undefined,
        start_date: startDate,
        end_date: endDate,
        sort_by: sortBy,
        order: sortOrder,
      };

      const response = await adminService.exportJobs(params);
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
    } catch (error) {
      console.error('Error exporting jobs:', error);
      showNotification('Không thể xuất danh sách tin tuyển dụng.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === displayedJobs.length) {
      setSelectedJobs([]);
      return;
    }

    setSelectedJobs(displayedJobs.map((job) => job.id));
  };

  const handleSelectJob = (jobId) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

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
                <Sparkles className="h-3.5 w-3.5" />
                Admin workspace
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-bold text-slate-600 shadow-sm">
                Quản lý tin tuyển dụng
              </Badge>
            </div>

            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-emerald-600">Job operations</p>
              <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
                Quản lý tin tuyển dụng
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Tổ chức lại khu vực điều phối tin đăng theo cùng nền, nhịp layout và mức độ
                hoàn thiện như các trang hồ sơ hoặc tài khoản, đồng thời giữ nguyên luồng kiểm
                duyệt, lọc và theo dõi hiệu quả tuyển dụng.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {heroMetrics.map((metric) => (
                <HeroMetricCard key={metric.label} item={metric} />
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleRefresh}
                className="h-11 rounded-lg bg-slate-950 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                Làm mới
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportJobs}
                disabled={exporting}
                className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold shadow-sm hover:bg-white"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Đang xuất dữ liệu...' : 'Xuất CSV'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetAllFilters}
                className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold shadow-sm hover:bg-white"
              >
                <X className="h-4 w-4" />
                Làm sạch bộ lọc
              </Button>
              <Button
                asChild
                className="h-11 rounded-lg bg-emerald-600 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Link to="/admin/jobs/new">
                  <Plus className="h-4 w-4" />
                  Tạo tin mới
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <section className="space-y-6">
          <SectionCard
            icon={Filter}
            title="Bộ lọc & điều phối"
            description="Giữ phần kiểm duyệt gọn, rõ thứ tự và bám đúng logic nghiệp vụ hiện có."
            action={
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                {activeFilterCount > 0 ? `${activeFilterCount} bộ lọc đang dùng` : 'Không giới hạn'}
              </div>
            }
          >
            <div className="space-y-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm chức danh, doanh nghiệp hoặc mã tin..."
                    value={inputValue}
                    onChange={(event) => {
                      setInputValue(event.target.value);
                      setPage(1);
                    }}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(event) => {
                        const [nextSortBy, nextSortOrder] = event.target.value.split('-');
                        setSortBy(nextSortBy);
                        setSortOrder(nextSortOrder);
                        setPage(1);
                      }}
                      className="h-11 appearance-none rounded-lg border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  <Button
                    type="button"
                    variant={showFilterPanel ? 'primary' : 'outline'}
                    onClick={() => setShowFilterPanel((prev) => !prev)}
                    className="h-11 rounded-lg font-bold"
                  >
                    <Filter className="h-4 w-4" />
                    {showFilterPanel ? 'Ẩn lọc nâng cao' : 'Lọc nâng cao'}
                  </Button>
                </div>
              </div>

              {showFilterPanel ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        Mức độ rủi ro AI
                      </label>
                      <select
                        value={filters.riskLevel}
                        onChange={(event) => {
                          setFilters((prev) => ({ ...prev, riskLevel: event.target.value }));
                          setPage(1);
                        }}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                      >
                        <option value="all">Tất cả mức độ</option>
                        <option value="low">Rủi ro thấp</option>
                        <option value="medium">Rủi ro trung bình</option>
                        <option value="high">Rủi ro cao</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        Doanh nghiệp
                      </label>
                      <input
                        type="text"
                        placeholder="Lọc theo tên công ty..."
                        value={filters.company}
                        onChange={(event) => {
                          setFilters((prev) => ({ ...prev, company: event.target.value }));
                          setPage(1);
                        }}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        Khung thời gian
                      </label>
                      <select
                        value={filters.dateRange}
                        onChange={(event) => {
                          setFilters((prev) => ({ ...prev, dateRange: event.target.value }));
                          setPage(1);
                        }}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                      >
                        {DATE_RANGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setFilters({ ...DEFAULT_FILTERS });
                        setPage(1);
                      }}
                      className="rounded-lg"
                    >
                      Xóa lọc nâng cao
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeFilterTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeFilterTags.map((item) => (
                    <Badge
                      key={item}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600 shadow-sm"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const active = tabFilter === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setTabFilter(tab.id);
                        setPage(1);
                      }}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                        active
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                      )}
                    >
                      {tab.label}
                      <span
                        className={cn(
                          'inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-xs',
                          active ? 'bg-white text-emerald-700' : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {formatNumber(tab.count)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {selectedJobs.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 font-bold text-emerald-700 shadow-sm">
                  {formatNumber(selectedJobs.length)} tin đang được chọn
                </Badge>
                <p className="text-sm text-emerald-900">
                  Dùng chọn nhanh để đối chiếu trước khi phê duyệt hoặc mở chi tiết từng tin.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedJobs([])}
                className="rounded-lg text-emerald-700 hover:bg-white"
              >
                <X className="h-4 w-4" />
                Bỏ chọn
              </Button>
            </div>
          ) : null}

          <SectionCard
            icon={Briefcase}
            title="Danh sách tin tuyển dụng"
            description="Giữ cấu trúc thông tin đủ sâu để phê duyệt nhanh nhưng vẫn sạch và dễ quét."
            action={
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                {loading
                  ? 'Đang tải...'
                  : totalJobs > 0
                    ? `${visibleFrom}-${visibleTo} / ${formatNumber(totalJobs)} tin`
                    : '0 tin'}
              </div>
            }
          >
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-xl border border-slate-200 bg-slate-50/70 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-5 w-5 rounded bg-slate-200" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 w-2/3 rounded bg-slate-200" />
                        <div className="h-4 w-1/2 rounded bg-slate-200" />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="h-16 rounded-lg bg-white" />
                          <div className="h-16 rounded-lg bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedJobs.length === 0 ? (
              <EmptyState onReset={handleResetAllFilters} />
            ) : (
              <>
                <div className="space-y-4 lg:hidden">
                  {displayedJobs.map((job) => {
                    const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG[JOB_STATUS.DRAFT];
                    const risk = getAiRisk(job);
                    const isSelected = selectedJobs.includes(job.id);

                    return (
                      <article
                        key={job.id}
                        className={cn(
                          'rounded-xl border p-4 shadow-sm transition-all',
                          isSelected
                            ? 'border-emerald-200 bg-emerald-50/40'
                            : 'border-slate-200 bg-white'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectJob(job.id)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                            {job.title.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <Link
                                  to={`/admin/jobs/${job.id}`}
                                  className="line-clamp-2 text-base font-bold text-slate-950 transition-colors hover:text-emerald-700"
                                >
                                  {job.title}
                                </Link>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Badge className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
                                    JOB-{String(job.id).slice(-4).padStart(4, '0')}
                                  </Badge>
                                  {job.flagged ? (
                                    <Badge className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 font-semibold text-red-700">
                                      <Flag className="h-3 w-3" />
                                      Bị gắn cờ
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                              <StatusBadge status={job.status} />
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Doanh nghiệp
                                </p>
                                <p className="mt-2 text-sm font-bold text-slate-900">
                                  {job.company_name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">{job.category}</p>
                              </div>

                              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Lương & địa điểm
                                </p>
                                <p className="mt-2 text-sm font-bold text-emerald-700">
                                  {formatSalary(job)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">{job.location}</p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                                <Users className="h-3 w-3" />
                                {formatNumber(job.applicants)} ứng viên
                              </Badge>
                              {job.vacancies ? (
                                <Badge className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-semibold text-sky-700">
                                  <Users className="h-3 w-3" />
                                  Tuyển {formatNumber(job.vacancies)} người
                                </Badge>
                              ) : null}
                              <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                                <Eye className="h-3 w-3" />
                                {formatNumber(job.views)} lượt xem
                              </Badge>
                              <RiskBadge risk={risk} />
                            </div>

                            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                              <p className="text-xs text-slate-500">
                                {statusConfig.description} Cập nhật {formatRelativeDate(job.updated_at)}.
                              </p>
                              {job.moderation_note ? (
                                <p className="mt-2 text-xs leading-5 text-red-600">
                                  Ghi chú: {job.moderation_note}
                                </p>
                              ) : null}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button
                                asChild
                                variant="outline"
                                className="h-10 rounded-lg bg-white font-bold"
                              >
                                <Link to={`/admin/jobs/${job.id}`}>
                                  <Eye className="h-4 w-4" />
                                  Xem
                                </Link>
                              </Button>

                              {job.status === JOB_STATUS.PENDING_REVIEW ? (
                                <>
                                  <Button
                                    type="button"
                                    onClick={() => handleStatusUpdate(job.id, JOB_STATUS.PUBLISHED)}
                                    className="h-10 rounded-lg bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Duyệt
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleStatusUpdate(job.id, JOB_STATUS.REJECTED)}
                                    className="h-10 rounded-lg border-red-200 bg-white font-bold text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Từ chối
                                  </Button>
                                </>
                              ) : null}

                              <TableActionMenu job={job} onOpenDelete={openDeleteDialog} />
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="hidden overflow-hidden rounded-lg border border-slate-200 lg:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-[1120px] w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90">
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={
                                  displayedJobs.length > 0 &&
                                  selectedJobs.length === displayedJobs.length
                                }
                                onChange={handleSelectAll}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              Tin tuyển dụng
                            </div>
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Doanh nghiệp
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Lương & địa điểm
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Tín hiệu
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Trạng thái
                          </th>
                          <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedJobs.map((job) => {
                          const risk = getAiRisk(job);
                          const statusConfig =
                            STATUS_CONFIG[job.status] || STATUS_CONFIG[JOB_STATUS.DRAFT];
                          const isSelected = selectedJobs.includes(job.id);

                          return (
                            <tr
                              key={job.id}
                              className={cn(
                                'border-b border-slate-100 last:border-b-0 transition-colors',
                                isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50/70'
                              )}
                            >
                              <td className="px-5 py-4 align-top">
                                <div className="flex items-start gap-4">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectJob(job.id)}
                                    className="mt-2 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />

                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                                    {job.title.charAt(0).toUpperCase()}
                                  </div>

                                  <div className="min-w-0">
                                    <Link
                                      to={`/admin/jobs/${job.id}`}
                                      className="line-clamp-1 text-base font-bold text-slate-950 transition-colors hover:text-emerald-700"
                                    >
                                      {job.title}
                                    </Link>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <Badge className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
                                        JOB-{String(job.id).slice(-4).padStart(4, '0')}
                                      </Badge>
                                      <Badge className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
                                        <Clock3 className="h-3 w-3" />
                                        {formatRelativeDate(job.created_at)}
                                      </Badge>
                                      {job.flagged ? (
                                        <Badge className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 font-semibold text-red-700">
                                          <Flag className="h-3 w-3" />
                                          Bị gắn cờ
                                        </Badge>
                                      ) : null}
                                    </div>

                                    {job.moderation_note ? (
                                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-red-600">
                                        Ghi chú: {job.moderation_note}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 align-top">
                                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-slate-400" />
                                    {job.employer_id ? (
                                      <Link
                                        to={`/admin/companies/${job.employer_id}`}
                                        className="line-clamp-1 text-sm font-bold text-slate-900 transition-colors hover:text-emerald-700"
                                      >
                                        {job.company_name}
                                      </Link>
                                    ) : (
                                      <p className="line-clamp-1 text-sm font-bold text-slate-900">
                                        {job.company_name}
                                      </p>
                                    )}
                                  </div>
                                  <p className="mt-2 text-xs text-slate-500">{job.category}</p>
                                </div>
                              </td>

                              <td className="px-5 py-4 align-top">
                                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                                  <div className="flex items-start gap-2">
                                    <DollarSign className="mt-0.5 h-4 w-4 text-emerald-600" />
                                    <div>
                                      <p className="text-sm font-bold text-emerald-700">
                                        {formatSalary(job)}
                                      </p>
                                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {job.location}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 align-top">
                                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                                  <div className="flex flex-wrap gap-2">
                                    <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
                                      <Users className="h-3 w-3" />
                                      {formatNumber(job.applicants)} ứng viên
                                    </Badge>
                                    {job.vacancies ? (
                                      <Badge className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-semibold text-sky-700">
                                        <Users className="h-3 w-3" />
                                        Tuyển {formatNumber(job.vacancies)} người
                                      </Badge>
                                    ) : null}
                                    <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
                                      <Eye className="h-3 w-3" />
                                      {formatNumber(job.views)} lượt xem
                                    </Badge>
                                  </div>
                                  <RiskBadge risk={risk} />
                                </div>
                              </td>

                              <td className="px-5 py-4 align-top">
                                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                                  <StatusBadge status={job.status} />
                                  <p className="text-xs leading-5 text-slate-500">
                                    {statusConfig.description}
                                  </p>
                                </div>
                              </td>

                              <td className="px-5 py-4 align-top">
                                <div className="flex justify-end gap-2">
                                  {job.status === JOB_STATUS.PENDING_REVIEW ? (
                                    <>
                                      <Button
                                        type="button"
                                        size="icon"
                                        onClick={() =>
                                          handleStatusUpdate(job.id, JOB_STATUS.PUBLISHED)
                                        }
                                        className="h-10 w-10 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={() =>
                                          handleStatusUpdate(job.id, JOB_STATUS.REJECTED)
                                        }
                                        className="h-10 w-10 rounded-lg border-red-200 text-red-700 hover:bg-red-50"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : null}

                                  <TableActionMenu job={job} onOpenDelete={openDeleteDialog} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {totalJobs > 0 ? (
                  <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Hiển thị <span className="font-semibold text-slate-900">{visibleFrom}</span>-
                      <span className="font-semibold text-slate-900">{visibleTo}</span> trên{' '}
                      <span className="font-semibold text-slate-900">{formatNumber(totalJobs)}</span>{' '}
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

                      {pageNumbers.map((pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          className={cn(
                            'min-w-[40px] rounded-lg border px-3 py-2 text-sm font-semibold transition-all',
                            page === pageNumber
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                          )}
                        >
                          {pageNumber}
                        </button>
                      ))}

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
              </>
            )}
          </SectionCard>
        </section>
      </main>

      {showDeleteModal && selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
                <FileX className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Xóa tin tuyển dụng?</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Hành động này sẽ gỡ tin khỏi khu vực quản trị và không thể hoàn tác trực tiếp.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-950">{selectedJob.title}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedJob.company_name}</p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedJob(null);
                }}
                className="flex-1 rounded-lg bg-white font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteJob}
                className="flex-1 rounded-lg font-bold"
              >
                Xóa vĩnh viễn
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminJobsPage;
