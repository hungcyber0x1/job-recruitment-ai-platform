import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import ManageJobsWorkspace from '../../components/employer/ManageJobsWorkspace';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import jobService from '../../services/jobService';
import {
  calendarDaysLeftUntilDeadline,
  isJobApplicationDeadlinePassed,
} from '../../utils/jobDeadline';
import { cn } from '../../utils/cn';

const STATUS_TABS = [
  { key: 'published', label: 'Đang đăng', countKey: 'published' },
  { key: 'pending_review', label: 'Chờ duyệt', countKey: 'pendingReview' },
  { key: 'closed', label: 'Đã đóng', countKey: 'closed' },
  { key: 'draft', label: 'Bản nháp', countKey: 'draft' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả loại hình' },
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' },
  { value: 'internship', label: 'Thực tập' },
  { value: 'remote', label: 'Từ xa' },
];

const LOCATION_OPTIONS = [
  { value: 'all', label: 'Tất cả địa điểm' },
  { value: 'Hồ Chí Minh', label: 'TP. HCM' },
  { value: 'Hà Nội', label: 'Hà Nội' },
  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
  { value: 'Remote', label: 'Từ xa' },
];

const ITEMS_PER_PAGE = 5;

function formatShortDate(value) {
  if (!value) return '--';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat('vi-VN', {
    notation: Number(value) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}

function formatRelativeAge(value) {
  if (!value) return 'vừa đăng';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'vừa đăng';

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays <= 0) return 'hôm nay';
  if (diffDays === 1) return '1 ngày trước';
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return formatShortDate(value);
}

function getStatusMeta(status) {
  const map = {
    published: {
      label: 'Đang mở',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dotClass: 'bg-emerald-500',
    },
    pending_review: {
      label: 'Chờ duyệt',
      badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
      dotClass: 'bg-sky-500',
    },
    draft: {
      label: 'Bản nháp',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
      dotClass: 'bg-amber-500',
    },
    closed: {
      label: 'Đã đóng',
      badgeClass: 'border-slate-200 bg-slate-100 text-slate-600',
      dotClass: 'bg-slate-400',
    },
  };

  return map[status] || map.closed;
}

function getJobTypeLabel(type) {
  switch (type) {
    case 'full_time':
      return 'Toàn thời gian';
    case 'part_time':
      return 'Bán thời gian';
    case 'contract':
      return 'Hợp đồng';
    case 'internship':
      return 'Thực tập';
    case 'remote':
      return 'Từ xa';
    default:
      return type || 'Chưa cập nhật loại hình';
  }
}

function getTopJob(jobs, field) {
  return [...jobs].sort((a, b) => Number(b?.[field] || 0) - Number(a?.[field] || 0))[0] || null;
}

function getApplyRate(applicants, views) {
  if (!views) return 0;
  return Math.round((applicants / views) * 100);
}

function getVacancies(job) {
  const rawValue = job?.vacancies;
  if (rawValue === undefined || rawValue === null || rawValue === '') return null;

  const numericValue = Number.parseInt(rawValue, 10);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

function getDeadlineMeta(job) {
  if (job.status === 'pending_review') {
    return {
      label: 'Chờ duyệt để mở nhận hồ sơ',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
      iconClass: 'text-sky-500',
    };
  }

  if (job.status === 'draft') {
    return {
      label: 'Chưa mở nhận hồ sơ',
      className: 'border-slate-200 bg-slate-100 text-slate-600',
      iconClass: 'text-slate-400',
    };
  }

  if (job.status === 'closed') {
    return {
      label: 'Tin đã đóng',
      className: 'border-slate-200 bg-slate-100 text-slate-600',
      iconClass: 'text-slate-400',
    };
  }

  if (!job.deadline) {
    return {
      label: 'Không đặt hạn ứng tuyển',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
      iconClass: 'text-slate-400',
    };
  }

  if (isJobApplicationDeadlinePassed(job.deadline)) {
    return {
      label: 'Đã quá hạn nhận hồ sơ',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
      iconClass: 'text-rose-500',
    };
  }

  const daysLeft = calendarDaysLeftUntilDeadline(job.deadline);

  if (daysLeft === 0) {
    return {
      label: 'Hết hạn hôm nay',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      iconClass: 'text-amber-500',
    };
  }

  if (daysLeft != null && daysLeft <= 7) {
    return {
      label: `Còn ${daysLeft} ngày để nhận hồ sơ`,
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      iconClass: 'text-amber-500',
    };
  }

  if (daysLeft != null) {
    return {
      label: `Còn ${daysLeft} ngày để nhận hồ sơ`,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      iconClass: 'text-emerald-500',
    };
  }

  return {
    label: 'Không rõ hạn ứng tuyển',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
    iconClass: 'text-slate-400',
  };
}

const JobMetric = ({ label, value, helper, highlight = false }) => (
  <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm shadow-slate-950/[0.04]">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p
      className={cn(
        'mt-2 text-lg font-bold tracking-tight',
        highlight ? 'text-emerald-600' : 'text-slate-950'
      )}
    >
      {value}
    </p>
    <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{helper}</p>
  </div>
);

const ActionMiniStat = ({ label, value, helper, highlight = false }) => (
  <div className="rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-3 shadow-sm shadow-slate-950/[0.04]">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p
      className={cn(
        'mt-2 text-sm font-bold tracking-tight',
        highlight ? 'text-emerald-600' : 'text-slate-950'
      )}
    >
      {value}
    </p>
    <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{helper}</p>
  </div>
);

const FocusMetric = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3 shadow-sm shadow-slate-950/[0.03]">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] leading-4 text-slate-400">{label}</p>
    <p className="mt-1.5 text-base font-bold tracking-tight text-slate-950">{value}</p>
  </div>
);

const SidebarInsight = () => null;

const SectionHeader = ({ icon: Icon, eyebrow, title, description, meta }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex items-start gap-3.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-950 sm:text-[1.35rem]">{title}</h2>
        {description ? <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
    </div>
    {meta}
  </div>
);

const QuickActionLink = () => null;

const ManageJobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const initialStatus = searchParams.get('status');

  const [activeTab, setActiveTab] = useState(() =>
    STATUS_TABS.some((tab) => tab.key === initialStatus) ? initialStatus : 'published'
  );
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');

  useEffect(() => {
    let mounted = true;

    const fetchJobs = async () => {
      try {
        const response = await jobService.getMyJobs();
        const rawJobs = response?.data?.data;

        if (mounted) {
          setJobs(Array.isArray(rawJobs) ? rawJobs : []);
        }
      } catch (error) {
        console.error('Failed to fetch jobs', error);
        if (mounted) {
          showNotification('Không thể tải danh sách tin tuyển dụng.', 'error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      mounted = false;
    };
  }, [showNotification]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (activeTab !== 'published') nextParams.set('status', activeTab);
    if (searchQuery.trim()) nextParams.set('search', searchQuery.trim());

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeTab, searchParams, searchQuery, setSearchParams]);

  const tabCounts = useMemo(
    () => ({
      published: jobs.filter((job) => job.status === 'published').length,
      pendingReview: jobs.filter((job) => job.status === 'pending_review').length,
      closed: jobs.filter((job) => job.status === 'closed').length,
      draft: jobs.filter((job) => job.status === 'draft').length,
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    let result = [...jobs].filter((job) => job.status === activeTab);

    if (filterType !== 'all') {
      result = result.filter((job) => (job.type || job.job_type) === filterType);
    }

    if (filterLocation !== 'all') {
      result = result.filter((job) =>
        job.location?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (job) =>
          job.title?.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [activeTab, filterLocation, filterType, jobs, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedJobs = filteredJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const publishedJobs = useMemo(() => jobs.filter((job) => job.status === 'published'), [jobs]);
  const pendingReviewCount = tabCounts.pendingReview;
  const totalApplicants = jobs.reduce((sum, job) => sum + Number(job.applicant_count || 0), 0);
  const totalViews = jobs.reduce((sum, job) => sum + Number(job.views || 0), 0);
  const totalVacancies = jobs.reduce((sum, job) => sum + (getVacancies(job) || 0), 0);
  const visibleApplicants = filteredJobs.reduce(
    (sum, job) => sum + Number(job.applicant_count || 0),
    0
  );
  const visibleViews = filteredJobs.reduce((sum, job) => sum + Number(job.views || 0), 0);
  const visibleVacancies = filteredJobs.reduce((sum, job) => sum + (getVacancies(job) || 0), 0);
  const averageApplyRate = getApplyRate(totalApplicants, totalViews);

  const closingSoonJobs = useMemo(
    () =>
      publishedJobs.filter((job) => {
        if (!job.deadline) return false;
        if (isJobApplicationDeadlinePassed(job.deadline)) return false;
        const daysLeft = calendarDaysLeftUntilDeadline(job.deadline);
        return daysLeft != null && daysLeft <= 7;
      }),
    [publishedJobs]
  );
  const jobsWithoutApplicants = useMemo(
    () => publishedJobs.filter((job) => Number(job.applicant_count || 0) === 0),
    [publishedJobs]
  );

  const jobsNeedingAttention = useMemo(
    () =>
      publishedJobs.filter((job) => {
        if (Number(job.applicant_count || 0) === 0) return true;
        if (!job.deadline) return false;
        if (isJobApplicationDeadlinePassed(job.deadline)) return false;
        const daysLeft = calendarDaysLeftUntilDeadline(job.deadline);
        return daysLeft != null && daysLeft <= 7;
      }),
    [publishedJobs]
  );

  const attentionCount = jobsNeedingAttention.length + pendingReviewCount;
  const topViewedJob = useMemo(() => getTopJob(jobs, 'views'), [jobs]);
  const topApplicantJob = useMemo(() => getTopJob(jobs, 'applicant_count'), [jobs]);
  const newestJob = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null,
    [jobs]
  );
  const focusJob = topApplicantJob || topViewedJob || newestJob;

  const focusTitle = attentionCount > 0
    ? 'Ưu tiên vận hành trong ngày'
    : jobs.length > 0
      ? 'Quy trình đang giữ nhịp tốt'
      : 'Sẵn sàng mở chiến dịch mới';

  const focusHelper = attentionCount > 0
    ? pendingReviewCount > 0
      ? `${pendingReviewCount} tin đang chờ duyệt và ${jobsNeedingAttention.length} tin cần theo dõi để không làm chậm quy trình.`
      : `${jobsNeedingAttention.length} tin cần theo dõi thêm để giữ đầu vào ứng viên ổn định.`
    : focusJob
      ? `Tin "${focusJob.title}" hiện tạo tín hiệu nổi bật nhất trong không gian tuyển dụng của bạn.`
      : 'Không gian đang sẵn sàng để khởi tạo tin mới và bắt đầu quy trình ứng viên đầu tiên.';

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || filterType !== 'all' || filterLocation !== 'all';

  const activeTabLabel =
    STATUS_TABS.find((tab) => tab.key === activeTab)?.label || 'Đang đăng';

  const activeFilterBadges = useMemo(() => {
    const badges = [];

    if (searchQuery.trim()) {
      badges.push(`Từ khóa: ${searchQuery.trim()}`);
    }

    if (filterType !== 'all') {
      badges.push(TYPE_OPTIONS.find((option) => option.value === filterType)?.label || filterType);
    }

    if (filterLocation !== 'all') {
      badges.push(filterLocation);
    }

    return badges;
  }, [filterLocation, filterType, searchQuery]);
  const activeFilterCount = activeFilterBadges.length;

  const companyName =
    user?.company_name || user?.companyName || user?.company?.name || 'doanh nghiệp của bạn';
  const openCoverage = jobs.length ? Math.round((tabCounts.published / jobs.length) * 100) : 0;
  const heroPills = [
    {
      icon: Briefcase,
      label: 'Chiến dịch đang quản lý',
      value: formatCompactNumber(jobs.length),
      tone: 'emerald',
    },
    {
      icon: Users,
      label: 'Hồ sơ toàn không gian',
      value: formatCompactNumber(totalApplicants),
      tone: 'blue',
    },
  ];

  const overviewCards = [
    {
      icon: Briefcase,
      label: 'Tin đang mở',
      value: formatCompactNumber(tabCounts.published),
      helper: `${formatCompactNumber(jobs.length)} tin đang được quản lý, ${formatCompactNumber(totalVacancies)} người cần tuyển`,
      tone: 'emerald',
    },
    {
      icon: Users,
      label: 'Hồ sơ trong quy trình',
      value: formatCompactNumber(totalApplicants),
      helper: `${formatCompactNumber(visibleApplicants)} hồ sơ theo bộ lọc hiện tại`,
      tone: 'blue',
    },
    {
      icon: Target,
      label: 'Cần xử lý hôm nay',
      value: formatCompactNumber(attentionCount),
      helper:
        attentionCount > 0
          ? `${pendingReviewCount} tin chờ duyệt, ${jobsNeedingAttention.length} tin cần theo dõi`
          : 'Không có tác vụ tuyển dụng nào cần can thiệp gấp',
      tone: 'amber',
    },
  ];

  const quickActions = [
    {
      icon: Plus,
      title: 'Đăng tin mới',
      helper: 'Tạo mô tả công việc mới và đưa vị trí mới vào quy trình tuyển dụng.',
      to: '/employer/jobs/post',
      tone: 'emerald',
    },
    {
      icon: Search,
      title: 'Tìm ứng viên',
      helper: 'Mở trang tìm ứng viên để bù đắp các tin đang thiếu đầu vào.',
      to: '/employer/search-candidates',
      tone: 'sky',
    },
    {
      icon: BarChart3,
      title: 'Báo cáo tuyển dụng',
      helper: 'Theo dõi chất lượng nguồn ứng viên và hiệu suất chuyển đổi.',
      to: '/employer/reports',
      tone: 'slate',
    },
  ];

  const jobsView = useMemo(
    () =>
      pagedJobs.map((job) => {
        const statusMeta = getStatusMeta(job.status);
        const deadlineMeta = getDeadlineMeta(job);
        const applicants = Number(job.applicant_count || 0);
        const views = Number(job.views || 0);
        const vacancies = getVacancies(job);
        const applyRate = getApplyRate(applicants, views);
        const typeLabel = getJobTypeLabel(job.type || job.job_type);
        const isClosed = job.status === 'closed';
        const deadlinePassed =
          job.status === 'published' &&
          job.deadline &&
          isJobApplicationDeadlinePassed(job.deadline);

        const signalTitle =
          applicants > 0
            ? 'Tin đang tạo đầu vào'
            : job.status === 'published'
              ? 'Tin cần thêm lực đẩy đầu vào'
              : 'Tin đang ở trạng thái chờ kích hoạt';

        const signalHelper =
          applicants > 0
            ? `Tín hiệu hiện tại cho thấy có ${formatCompactNumber(applicants)} hồ sơ trong quy trình và ${formatCompactNumber(views)} lượt xem tích lũy.`
            : job.status === 'published'
              ? 'Nên rà lại tiêu đề, mức lương, địa điểm hoặc nguồn truy cập để tăng tỷ lệ chuyển đổi.'
              : 'Hoàn thiện bước duyệt hoặc chỉnh sửa để chiến dịch sớm quay lại nhịp nhận hồ sơ.';

        return {
          job,
          statusMeta,
          deadlineMeta,
          applicants,
          views,
          vacancies,
          applyRate,
          typeLabel,
          isClosed,
          deadlinePassed,
          signalTitle,
          signalHelper,
        };
      }),
    [pagedJobs]
  );

  const handleDelete = async (jobId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tin tuyển dụng này không?')) return;

    setDeletingId(jobId);

    try {
      await jobService.deleteJob(jobId);
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      showNotification('Đã xóa tin tuyển dụng.', 'success');
    } catch (error) {
      console.error('Failed to delete job', error);
      showNotification('Không thể xóa tin tuyển dụng.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterLocation('all');
    setCurrentPage(1);
  };

  return (
    <ManageJobsWorkspace
      loading={loading}
      jobsCount={jobs.length}
      filteredJobsCount={filteredJobs.length}
      jobsView={jobsView}
      totalPages={totalPages}
      currentPage={currentPage}
      deletingId={deletingId}
      searchQuery={searchQuery}
      filterType={filterType}
      filterLocation={filterLocation}
      activeTab={activeTab}
      activeTabLabel={activeTabLabel}
      tabCounts={tabCounts}
      statusTabs={STATUS_TABS}
      typeOptions={TYPE_OPTIONS}
      locationOptions={LOCATION_OPTIONS}
      hasActiveFilters={hasActiveFilters}
      activeFilterBadges={activeFilterBadges}
      activeFilterCount={activeFilterCount}
      companyName={companyName}
      overviewCards={overviewCards}
      quickActions={quickActions}
      attentionCount={attentionCount}
      visibleApplicants={visibleApplicants}
      visibleVacancies={visibleVacancies}
      visibleViews={visibleViews}
      topApplicantJob={topApplicantJob}
      topViewedJob={topViewedJob}
      newestJob={newestJob}
      jobsWithoutApplicants={jobsWithoutApplicants}
      pendingReviewCount={pendingReviewCount}
      setActiveTab={setActiveTab}
      setCurrentPage={setCurrentPage}
      setSearchQuery={setSearchQuery}
      setFilterType={setFilterType}
      setFilterLocation={setFilterLocation}
      resetFilters={resetFilters}
      handleDelete={handleDelete}
      formatCompactNumber={formatCompactNumber}
      formatRelativeAge={formatRelativeAge}
      formatShortDate={formatShortDate}
    />
  );

  /*
  return (
    <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_78%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.1),transparent_40%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.05),transparent_32%)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative mx-auto grid max-w-7xl gap-5 px-4 pb-6 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:px-8 xl:grid-cols-[minmax(0,1fr)_332px]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                  <Building2 className="h-3.5 w-3.5" />
                  Không gian nhà tuyển dụng
                </Badge>
                <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                  {formatCompactNumber(filteredJobs.length)} tin đang hiển thị
                </Badge>
              </div>

              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Không gian điều phối tuyển dụng
                </p>
                <h1 className="mt-2 text-[2rem] font-bold tracking-tight text-slate-950 sm:text-[2.55rem] sm:leading-[1.08]">
                  Trung tâm điều phối tin tuyển dụng cho{' '}
                  <span className="text-emerald-600">{companyName}</span>
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-6 text-slate-600">
                  Giữ phần điều hành chiến dịch, trạng thái đang hiển thị, chất lượng mô tả công việc và chuyển đổi ứng viên trong
                  cùng một màn hình sáng sủa, dễ rà nhanh và đồng bộ với bố cục nhà tuyển dụng hiện tại.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  <Link to="/employer/jobs/post">
                    <Plus className="h-4 w-4" />
                    Đăng tin mới
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-lg border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-white hover:text-emerald-700"
                >
                  <Link to="/employer/reports">
                    <BarChart3 className="h-4 w-4" />
                    Báo cáo tuyển dụng
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-lg border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-white hover:text-emerald-700"
                >
                  <Link to="/employer/search-candidates">
                    <Search className="h-4 w-4" />
                    Tìm ứng viên
                  </Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {overviewCards.map((card) => (
                  <EmployerStatCard key={card.label} {...card} />
                ))}
              </div>
            </div>

            <aside className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                    Bảng điều phối
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{focusTitle}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 shadow-sm">
                  <Target className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">{focusHelper}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <FocusMetric label="Đang mở" value={`${openCoverage}%`} />
                <FocusMetric label="Sắp hết hạn" value={formatCompactNumber(closingSoonJobs.length)} />
                <FocusMetric label="Chuyển đổi" value={`${averageApplyRate}%`} />
              </div>

              {focusJob ? (
                <div className="mt-5 rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm shadow-slate-950/[0.04]">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Tiêu điểm hiện tại
                      </p>
                      <p className="mt-2 text-base font-bold text-slate-950">
                        {focusJob.title || 'Vị trí tuyển dụng'}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        {focusJob.location ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-emerald-500" />
                            {focusJob.location}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-slate-400" />
                          {formatCompactNumber(focusJob.applicant_count || 0)} hồ sơ
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-slate-400" />
                          {focusJobApplyRate}% chuyển đổi
                        </span>
                      </div>
                    </div>

                    {focusJobStatusMeta ? (
                      <Badge
                        className={cn(
                          'rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm',
                          focusJobStatusMeta.badgeClass
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', focusJobStatusMeta.dotClass)} />
                        {focusJobStatusMeta.label}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {heroPills.map((item) => {
                  const styles = OVERVIEW_TONES[item.tone] || OVERVIEW_TONES.emerald;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-white/92 px-4 py-3 shadow-sm shadow-slate-950/[0.04]"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
                            styles.icon
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            {item.label}
                          </p>
                          <p className="mt-1.5 text-sm font-bold text-slate-950">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="space-y-6">
            <Card className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="space-y-4">
                    <SectionHeader
                      icon={Workflow}
                      eyebrow="Điều phối danh sách"
                      title="Lọc và điều phối tin đăng"
                      description="Gom trạng thái, tìm kiếm và bộ lọc vào một bảng điều khiển gọn hơn để nhà tuyển dụng xử lý nhanh mà không mất nhịp."
                    />

                    <div className="flex flex-wrap gap-2">
                      {STATUS_TABS.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab.key);
                            setCurrentPage(1);
                          }}
                          className={cn(
                            'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                            activeTab === tab.key
                              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                          )}
                        >
                          {tab.label}
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                              activeTab === tab.key
                                ? 'bg-white/15 text-white'
                                : 'bg-white text-slate-500 ring-1 ring-slate-200'
                            )}
                          >
                            {tabCounts[tab.countKey]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid w-full gap-2 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_auto] xl:max-w-[780px]">
                    <div className="relative md:col-span-2 xl:col-span-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => {
                          setSearchQuery(event.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Tìm theo tiêu đề hoặc địa điểm"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>

                    <div className="w-full">
                      <Select
                        value={filterType}
                        onValueChange={(value) => {
                          setFilterType(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 shadow-none">
                          <SelectValue placeholder="Loại hình" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          {TYPE_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="text-sm font-medium"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full">
                      <Select
                        value={filterLocation}
                        onValueChange={(value) => {
                          setFilterLocation(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 shadow-none">
                          <SelectValue placeholder="Địa điểm" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          {LOCATION_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="text-sm font-medium"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {hasActiveFilters ? (
                      <Button
                        variant="ghost"
                        onClick={resetFilters}
                        className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        Xóa lọc
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <SlidersHorizontal className="h-4 w-4 text-emerald-500" />
                      Hiển thị {filteredJobs.length} tin ở trạng thái {activeTabLabel.toLowerCase()}
                    </div>

                    <div className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                    <p className="text-sm text-slate-500">
                      {formatCompactNumber(visibleApplicants)} hồ sơ và {formatCompactNumber(visibleViews)} lượt xem trong tập hiện tại
                    </p>

                    <Badge className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                      {visibleApplyRate}% tỉ lệ ứng tuyển
                    </Badge>

                    {activeFilterCount > 0 ? (
                      <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {activeFilterCount} bộ lọc
                      </Badge>
                    ) : null}
                  </div>

                  {activeFilterBadges.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeFilterBadges.map((item) => (
                        <Badge
                          key={item}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-sm sm:p-6">
              <SectionHeader
                icon={Briefcase}
                eyebrow="Danh sách chiến dịch"
                title="Danh sách tin tuyển dụng"
                description="Mỗi card gom trạng thái, timeline, tín hiệu vận hành, chỉ số nhanh và hành động chính trong cùng một cụm rõ thứ bậc hơn."
                meta={
                  <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    Trang {currentPage}/{totalPages}
                  </Badge>
                }
              />

              {loading ? (
                <div className="mt-6 space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-48 animate-pulse rounded-[22px] border border-slate-200 bg-slate-50"
                    />
                  ))}
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    variant="robotSearch"
                    title={jobs.length === 0 ? 'Chưa có tin tuyển dụng nào' : 'Không tìm thấy tin phù hợp'}
                    description={
                      jobs.length === 0
                        ? 'Bắt đầu bằng một tin tuyển dụng mới để mở quy trình ứng viên đầu tiên.'
                        : 'Thử mở rộng bộ lọc hoặc thay đổi từ khóa để xem thêm kết quả liên quan.'
                    }
                    className="rounded-[22px] border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-10"
                    action={
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {hasActiveFilters ? (
                          <Button
                            variant="outline"
                            onClick={resetFilters}
                            className="h-10 rounded-xl border-slate-200 px-4 text-sm font-semibold"
                          >
                            Xóa bộ lọc
                          </Button>
                        ) : null}
                        <Button
                          asChild
                          className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
                        >
                          <Link to="/employer/jobs/post">
                            <Plus className="h-4 w-4" />
                            {jobs.length === 0 ? 'Đăng tin ngay' : 'Tạo tin mới'}
                          </Link>
                        </Button>
                      </div>
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="mt-6 space-y-4">
                    {pagedJobs.map((job) => {
                      const statusMeta = getStatusMeta(job.status);
                      const deadlineMeta = getDeadlineMeta(job);
                      const fitScore = getFitScore(job);
                      const fitMeta = getFitMeta(fitScore);
                      const applicants = Number(job.applicant_count || 0);
                      const views = Number(job.views || 0);
                      const applyRate = getApplyRate(applicants, views);
                      const typeLabel = getJobTypeLabel(job.type || job.job_type);
                      const isClosed = job.status === 'closed';
                      const deadlinePassed =
                        job.status === 'published' &&
                        job.deadline &&
                        isJobApplicationDeadlinePassed(job.deadline);

                      const signalTitle = applicants > 0
                        ? 'Tin đang tạo đầu vào'
                        : job.status === 'published'
                          ? 'Tin cần thêm lực đẩy đầu vào'
                          : 'Tin đang ở trạng thái chờ kích hoạt';

                      const signalHelper = applicants > 0
                        ? `Tín hiệu hiện tại cho thấy có ${formatCompactNumber(applicants)} hồ sơ trong quy trình và ${formatCompactNumber(views)} lượt xem tích lũy.`
                        : job.status === 'published'
                          ? 'Nên rà lại tiêu đề, mức lương, địa điểm hoặc nguồn truy cập để tăng tỷ lệ chuyển đổi.'
                          : 'Hoàn thiện bước duyệt hoặc chỉnh sửa để chiến dịch sớm quay lại nhịp nhận hồ sơ.';

                      return (
                        <article
                          key={job.id}
                          className={cn(
                            'overflow-hidden rounded-[22px] border border-slate-200 bg-white transition-all duration-200',
                            isClosed
                              ? 'opacity-80'
                              : 'shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/60'
                          )}
                        >
                          <div className={cn('h-1.5 w-full', statusMeta.dotClass)} />

                          <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_290px] xl:items-start">
                            <div className="space-y-4">
                              <div className="flex items-start gap-4">
                                <div
                                  className={cn(
                                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                                    isClosed ? 'bg-slate-100 text-slate-400' : 'bg-slate-950 text-white'
                                  )}
                                >
                                  <Briefcase className="h-5 w-5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <h3 className="break-words text-lg font-bold tracking-tight text-slate-950">
                                      {job.title || 'Vị trí tuyển dụng'}
                                    </h3>

                                    <Badge
                                      className={cn(
                                        'rounded-full border px-3 py-1 text-[11px] font-semibold',
                                        statusMeta.badgeClass
                                      )}
                                    >
                                      <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dotClass)} />
                                      {statusMeta.label}
                                    </Badge>

                                    <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                                      {typeLabel}
                                    </Badge>

                                    <Badge
                                      className={cn(
                                        'rounded-full border px-3 py-1 text-[11px] font-semibold',
                                        fitMeta.badgeClass
                                      )}
                                    >
                                      <Sparkles className="h-3.5 w-3.5" />
                                      {fitMeta.label}
                                    </Badge>
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                    {job.location ? (
                                      <span className="inline-flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-emerald-500" />
                                        {job.location}
                                      </span>
                                    ) : null}

                                    <span className="inline-flex items-center gap-1.5">
                                      <Calendar className="h-4 w-4 text-slate-400" />
                                      Đăng {formatRelativeAge(job.created_at)}
                                    </span>

                                    <span className="inline-flex items-center gap-1.5">
                                      <Clock3 className={cn('h-4 w-4', deadlineMeta.iconClass)} />
                                      {deadlineMeta.label}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.18fr)_minmax(260px,0.82fr)]">
                                <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Tín hiệu vận hành
                                      </p>
                                      <h4 className="mt-2 text-sm font-bold text-slate-950">{signalTitle}</h4>
                                    </div>

                                    <div
                                      className={cn(
                                        'flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset',
                                        fitMeta.iconClass
                                      )}
                                    >
                                      <Sparkles className="h-4 w-4" />
                                    </div>
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span
                                      className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                                        deadlineMeta.className
                                      )}
                                    >
                                      <Clock3 className="h-3.5 w-3.5" />
                                      {deadlineMeta.label}
                                    </span>

                                    {applicants === 0 && job.status === 'published' ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Chưa có hồ sơ
                                      </span>
                                    ) : null}

                                    {deadlinePassed ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Đã quá hạn, cần đóng hoặc gia hạn
                                      </span>
                                    ) : null}

                                    {views > 0 && applicants > 0 ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                        {applyRate}% chuyển đổi từ lượt xem sang hồ sơ
                                      </span>
                                    ) : null}
                                  </div>

                                  <p className="mt-3 text-sm leading-6 text-slate-500">{signalHelper}</p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Chỉ số nhanh
                                  </p>

                                  <div className="mt-3 grid grid-cols-3 gap-3">
                                    <JobMetric
                                      label="Hồ sơ"
                                      value={formatCompactNumber(applicants)}
                                      helper={applicants > 0 ? 'đang trong quy trình' : 'chưa phát sinh'}
                                    />
                                    <JobMetric
                                      label="Lượt xem"
                                      value={formatCompactNumber(views)}
                                      helper="mức quan tâm hiện tại"
                                    />
                                    <JobMetric
                                      label="Độ phù hợp"
                                      value={`${fitScore}%`}
                                      helper="độ phù hợp của mô tả"
                                      highlight={fitScore >= 85}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Hành động chính
                                  </p>
                                  <p className="mt-2 text-lg font-bold tracking-tight text-slate-950">
                                    {applicants > 0
                                      ? `${formatCompactNumber(applicants)} hồ sơ đang nằm trong quy trình`
                                      : 'Tin hiện chưa phát sinh hồ sơ mới'}
                                  </p>
                                  <p className="mt-1 text-sm leading-6 text-slate-500">
                                    {applicants > 0
                                      ? 'Mở quy trình để sàng lọc nhanh và cập nhật trạng thái hồ sơ.'
                                      : 'Nên tăng nguồn truy cập hoặc rà lại mô tả công việc để cải thiện đầu vào ứng viên.'}
                                  </p>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                                  <Users className="h-4 w-4" />
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-2">
                                <ActionMiniStat
                                  label="Lượt xem"
                                  value={formatCompactNumber(views)}
                                  helper="mức quan tâm"
                                />
                                <ActionMiniStat
                                  label="Fit"
                                  value={`${fitScore}%`}
                                  helper={fitMeta.label.toLowerCase()}
                                  highlight={fitScore >= 85}
                                />
                                <ActionMiniStat
                                  label="Hạn hồ sơ"
                                  value={job.deadline ? formatShortDate(job.deadline) : '--'}
                                  helper={job.deadline ? 'mốc nhận hồ sơ' : 'chưa đặt hạn'}
                                />
                              </div>

                              <div className="mt-4 space-y-2">
                                <Button
                                  asChild
                                  className="h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-emerald-600"
                                >
                                  <Link to={`/employer/applications?jobId=${job.id}`}>
                                    Xem quy trình
                                    <ArrowRight className="h-4 w-4" />
                                  </Link>
                                </Button>

                                <div className="grid grid-cols-[minmax(0,1fr)_48px] gap-2">
                                  <Button
                                    asChild
                                    variant="outline"
                                    className="h-11 rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                  >
                                    <Link to={`/employer/jobs/${job.id}/edit`}>
                                      <Edit className="h-4 w-4" />
                                      Sửa tin
                                    </Link>
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    isLoading={deletingId === job.id}
                                    onClick={() => handleDelete(job.id)}
                                    disabled={deletingId === job.id}
                                    className="h-11 w-12 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {totalPages > 1 ? (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            'flex h-10 min-w-[40px] items-center justify-center rounded-xl px-3 text-sm font-bold transition-all',
                            page === currentPage
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-600'
                          )}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </Card>
          </div>

          <aside className="hidden space-y-6 self-start xl:sticky xl:top-24">
            <Card className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-sm">
              <SectionHeader
                icon={Target}
                eyebrow="Ưu tiên và cơ hội"
                title="Những điểm cần nhìn trước"
                description="Gom các tín hiệu phụ thành một cột điều phối để recruiter biết nên xử lý gì trước trong ngày."
              />

              <div className="mt-6 space-y-3">
                {pendingReviewCount > 0 ? (
                  <SidebarInsight
                    icon={Workflow}
                    tone="sky"
                    label="Tin chờ duyệt"
                    value={formatCompactNumber(pendingReviewCount)}
                    helper="Duyệt sớm để tin được mở nhận hồ sơ và không làm chậm quy trình đầu vào."
                  />
                ) : null}

                {closingSoonJobs.length > 0 ? (
                  <SidebarInsight
                    icon={AlertTriangle}
                    tone="amber"
                    label="Sắp hết hạn"
                    value={formatCompactNumber(closingSoonJobs.length)}
                    helper="Nên rà lại nhu cầu hoặc gia hạn nếu doanh nghiệp vẫn đang cần thêm hồ sơ."
                  />
                ) : null}

                {jobsWithoutApplicants.length > 0 ? (
                  <SidebarInsight
                    icon={Users}
                    tone="slate"
                    label="Tin chưa có hồ sơ"
                    value={formatCompactNumber(jobsWithoutApplicants.length)}
                    helper="Ưu tiên rà tiêu đề, mức lương, địa điểm hoặc nguồn truy cập để tăng chuyển đổi."
                  />
                ) : null}

                <SidebarInsight
                  icon={Sparkles}
                  tone={averageFitScore >= 80 ? 'emerald' : 'slate'}
                  label={averageFitScore >= 80 ? 'Độ phù hợp đang ổn định' : 'Độ phù hợp có thể tối ưu'}
                  value={`${averageFitScore}%`}
                  helper={
                    averageFitScore >= 80
                      ? 'Chất lượng mô tả công việc đang giữ mức phù hợp tốt với đầu vào ứng viên.'
                      : 'Có thể tối ưu lại mô tả công việc để cải thiện chất lượng hồ sơ.'
                  }
                />

                {pendingReviewCount === 0 && closingSoonJobs.length === 0 && jobsWithoutApplicants.length === 0 ? (
                  <SidebarInsight
                    icon={Sparkles}
                    tone="emerald"
                    label="Không có hạng mục khẩn"
                    helper="Nhịp tuyển dụng hiện khá ổn định và chưa có tác vụ tuyển dụng nào cần can thiệp gấp."
                  />
                ) : null}
              </div>
            </Card>

            <Card className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-sm">
              <SectionHeader
                icon={TrendingUp}
                eyebrow="Tín hiệu nổi bật"
                title="Hiệu suất đang dẫn đầu"
                description="Theo dõi nhanh các chiến dịch đang tạo lực kéo tốt nhất để ưu tiên quyết định tiếp theo."
              />

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Nhiều hồ sơ nhất
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-950">
                    {topApplicantJob?.title || 'Chưa có dữ liệu'}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {topApplicantJob
                      ? `${formatCompactNumber(topApplicantJob.applicant_count || 0)} hồ sơ đang ở trong quy trình`
                      : 'Danh sách hồ sơ sẽ hiển thị khi tin bắt đầu nhận ứng tuyển.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Nhiều lượt xem nhất
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-950">
                    {topViewedJob?.title || 'Chưa có dữ liệu'}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {topViewedJob
                      ? `${formatCompactNumber(topViewedJob.views || 0)} lượt xem và ${getApplyRate(
                          Number(topViewedJob.applicant_count || 0),
                          Number(topViewedJob.views || 0)
                        )}% chuyển đổi`
                      : 'Lưu lượng xem tin sẽ hiển thị khi có ứng viên truy cập.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Tin mới nhất
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-950">
                    {newestJob?.title || 'Chưa có dữ liệu'}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {newestJob
                      ? `Đăng ${formatRelativeAge(newestJob.created_at)} và hiện có ${formatCompactNumber(
                          newestJob.applicant_count || 0
                        )} hồ sơ`
                      : 'Tin đăng mới sẽ xuất hiện ở đây để bạn theo dõi nhịp tuyển dụng.'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-sm">
              <SectionHeader
                icon={Zap}
                eyebrow="Hành động nhanh"
                title="Các luồng liên quan"
                description="Đi thẳng đến các tác vụ tiếp theo thường đi cùng màn quản lý tin tuyển dụng."
              />

              <div className="mt-6 space-y-3">
                {quickActions.map((item) => (
                  <QuickActionLink key={item.title} {...item} />
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
  */
};

export default ManageJobsPage;
