import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Briefcase, Plus, Search, Target, Users } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import ManageJobsWorkspace from '../../components/employer/ManageJobsWorkspace';
import jobService from '../../services/jobService';
import {
  calendarDaysLeftUntilDeadline,
  isJobApplicationDeadlinePassed,
} from '../../utils/jobDeadline';

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
          const serverMsg = error?.response?.data?.message;
          showNotification(serverMsg || 'Không thể tải danh sách tin tuyển dụng.', 'error');
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
          job.title?.toLowerCase().includes(query) || job.location?.toLowerCase().includes(query)
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
  const totalVacancies = jobs.reduce((sum, job) => sum + (getVacancies(job) || 0), 0);
  const visibleApplicants = filteredJobs.reduce(
    (sum, job) => sum + Number(job.applicant_count || 0),
    0
  );
  const visibleViews = filteredJobs.reduce((sum, job) => sum + Number(job.views || 0), 0);

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

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || filterType !== 'all' || filterLocation !== 'all';

  const activeTabLabel = STATUS_TABS.find((tab) => tab.key === activeTab)?.label || 'Đang đăng';

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
      helper: 'Theo dõi nguồn ứng viên, trạng thái và kết quả tuyển dụng.',
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
              ? 'Nên rà lại tiêu đề, mức lương, địa điểm hoặc nguồn truy cập để cải thiện đầu vào ứng viên.'
              : 'Hoàn thiện bước duyệt hoặc chỉnh sửa để chiến dịch sớm quay lại nhịp nhận hồ sơ.';

        return {
          job,
          statusMeta,
          deadlineMeta,
          applicants,
          views,
          vacancies,
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
      visibleApplicants={visibleApplicants}
      visibleViews={visibleViews}
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
};

export default ManageJobsPage;
