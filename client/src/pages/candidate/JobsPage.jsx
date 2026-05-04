import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpDown, Briefcase, MessageSquare, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import StatCard from '@/components/common/StatCard';
import JobCard from '../../components/candidate/jobs/JobCard';
import { applicationService, jobService } from '../../services';
import {
  APPLICATION_STATUS,
  getActiveStatuses,
  getInterviewStatuses,
  getSuccessStatuses,
  normalizeApplicationStatus,
} from '../../constants/status';
import { cn } from '../../utils/cn';
import { isJobApplicationDeadlinePassed } from '../../utils/jobDeadline';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'salary_high', label: 'Lương cao nhất' },
  { value: 'salary_low', label: 'Lương thấp nhất' },
  { value: 'deadline', label: 'Hạn nộp gần nhất' },
];

const FILTER_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'recent', label: 'Mới đăng' },
  { value: 'salary', label: 'Lương cao' },
];

const JOBS_PER_PAGE = 6;
const OPEN_JOB_STATUSES = new Set(['published', 'active', 'open']);
const ACTIVE_APPLICATION_STATUS_SET = new Set(getActiveStatuses());
const INTERVIEW_APPLICATION_STATUS_SET = new Set(getInterviewStatuses());
const SUCCESS_APPLICATION_STATUS_SET = new Set(getSuccessStatuses());
const RECRUITER_RESPONSE_STATUS_SET = new Set([
  APPLICATION_STATUS.SHORTLISTED,
  APPLICATION_STATUS.INTERVIEW_SCHEDULED,
  APPLICATION_STATUS.INTERVIEWED,
  APPLICATION_STATUS.OFFERED,
  APPLICATION_STATUS.HIRED,
  APPLICATION_STATUS.REJECTED,
]);

function getCompanyName(item) {
  return item?.company_name || item?.company?.name || item?.employer_name || 'Công ty';
}

function getJobTitle(job) {
  return job?.title || job?.job_title || job?.position || job?.role || 'Vị trí tuyển dụng';
}

function getJobStatus(job) {
  return String(job?.status || job?.job_status || '')
    .trim()
    .toLowerCase();
}

function isJobOpenForApplications(job) {
  const status = getJobStatus(job);
  const statusAllowsApply = !status || OPEN_JOB_STATUSES.has(status);
  return statusAllowsApply && !isJobApplicationDeadlinePassed(job?.deadline);
}

function sortJobsByOption(list, sortBy) {
  const sorted = [...list];

  if (sortBy === 'newest') {
    sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } else if (sortBy === 'salary_high') {
    sorted.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
  } else if (sortBy === 'salary_low') {
    sorted.sort(
      (a, b) =>
        (a.salary_min || a.salary_max || Number.POSITIVE_INFINITY) -
        (b.salary_min || b.salary_max || Number.POSITIVE_INFINITY)
    );
  } else if (sortBy === 'deadline') {
    sorted.sort((a, b) => {
      const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return deadlineA - deadlineB;
    });
  }

  return sorted;
}

function matchesSearch(job, query) {
  if (!query) return true;

  const haystack = [
    getJobTitle(job),
    getCompanyName(job),
    job.location,
    job.address,
    job.salary_range,
    ...(Array.isArray(job.skills)
      ? job.skills.map((skill) => (typeof skill === 'string' ? skill : skill?.name || ''))
      : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

const SidebarCard = ({ title, icon: Icon, children, className }) => (
  <Card className={cn('overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm', className)}>
    <CardContent className="p-5">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
        <Icon className="h-4 w-4 text-emerald-600" />
        {title}
      </h3>
      {children}
    </CardContent>
  </Card>
);

const JobsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qFromUrl = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(qFromUrl);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, applicationsRes] = await Promise.all([
          jobService.getJobs({ limit: 50 }).catch(() => ({ data: { data: [] } })),
          applicationService.getMyApplications().catch(() => ({ data: { data: [] } })),
        ]);

        setJobs(Array.isArray(jobsRes.data?.data) ? jobsRes.data.data : []);
        setApplications(Array.isArray(applicationsRes.data?.data) ? applicationsRes.data.data : []);
      } catch (error) {
        console.error('Jobs page fetch error', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setSearchQuery(qFromUrl);
  }, [qFromUrl]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const searchedJobs = useMemo(
    () => jobs.filter((job) => matchesSearch(job, normalizedQuery)),
    [jobs, normalizedQuery]
  );

  const openJobs = useMemo(() => jobs.filter(isJobOpenForApplications), [jobs]);

  const activeApplications = useMemo(
    () =>
      applications.filter((application) =>
        ACTIVE_APPLICATION_STATUS_SET.has(normalizeApplicationStatus(application?.status))
      ),
    [applications]
  );

  const interviewCount = useMemo(
    () =>
      applications.filter((application) =>
        INTERVIEW_APPLICATION_STATUS_SET.has(normalizeApplicationStatus(application?.status))
      ).length,
    [applications]
  );

  const respondedCount = useMemo(
    () =>
      applications.filter((application) =>
        RECRUITER_RESPONSE_STATUS_SET.has(normalizeApplicationStatus(application?.status))
      ).length,
    [applications]
  );

  const successCount = useMemo(
    () =>
      applications.filter((application) =>
        SUCCESS_APPLICATION_STATUS_SET.has(normalizeApplicationStatus(application?.status))
      ).length,
    [applications]
  );

  const visibleJobs = useMemo(() => {
    let result = [...searchedJobs];

    if (activeFilter === 'recent') {
      result = result.filter((job) => {
        const createdAt = new Date(job.created_at || 0).getTime();
        return createdAt && Date.now() - createdAt <= 1000 * 60 * 60 * 24 * 7;
      });
    } else if (activeFilter === 'salary') {
      result = result.filter((job) => job.salary_max || job.salary_range);
    }

    return sortJobsByOption(result, sortBy);
  }, [searchedJobs, activeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(visibleJobs.length / JOBS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedJobs = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * JOBS_PER_PAGE;
    return visibleJobs.slice(startIndex, startIndex + JOBS_PER_PAGE);
  }, [visibleJobs, safeCurrentPage]);
  const currentPageStart = visibleJobs.length === 0 ? 0 : (safeCurrentPage - 1) * JOBS_PER_PAGE + 1;
  const currentPageEnd = Math.min(safeCurrentPage * JOBS_PER_PAGE, visibleJobs.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery, activeFilter, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginationPages = useMemo(() => {
    const maxVisiblePages = 5;
    const halfWindow = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, safeCurrentPage - halfWindow);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    start = Math.max(1, end - maxVisiblePages + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safeCurrentPage, totalPages]);

  const summaryCards = [
    {
      label: 'Tin đang mở',
      value: loading ? null : openJobs.length,
      helper: `${jobs.length} tin tải về`,
      icon: Briefcase,
      tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    },
    {
      label: 'Kết quả hiển thị',
      value: loading ? null : visibleJobs.length,
      helper: normalizedQuery ? `Tìm "${searchQuery.trim()}"` : 'Theo bộ lọc hiện tại',
      icon: Search,
      tone: 'bg-blue-50 text-blue-600 ring-blue-100',
    },
    {
      label: 'Đơn đang xử lý',
      value: loading ? null : activeApplications.length,
      helper: 'Trong pipeline tuyển dụng',
      icon: Star,
      tone: 'bg-amber-50 text-amber-600 ring-amber-100',
    },
    {
      label: 'Phản hồi nhà tuyển dụng',
      value: loading ? null : respondedCount,
      helper:
        successCount > 0 ? `${successCount} kết quả tích cực` : 'Sơ tuyển, phỏng vấn hoặc kết quả',
      icon: MessageSquare,
      tone: 'bg-violet-50 text-violet-600 ring-violet-100',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent pb-16">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
          {/* Title row */}
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                <Briefcase className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  Trung tâm việc làm
                </span>
                <h1 className="mt-2 text-xl font-bold tracking-normal text-slate-950 sm:text-2xl">
                  Khám phá việc làm
                </h1>
                <p className="mt-0.5 max-w-2xl text-sm font-medium text-slate-600">
                  Theo dõi cơ hội phù hợp, trạng thái ứng tuyển và cơ hội mới trong một giao diện
                  gọn, rõ và đồng nhất.
                </p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          {!loading && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {summaryCards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </div>
          )}
          {loading && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-white shadow-sm" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        {/* Search + Filter row */}
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm công việc, kỹ năng, công ty..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/candidate/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium shadow-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    navigate('/candidate/jobs');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label="Xóa tìm kiếm"
                >
                  <span className="text-sm font-medium">Xóa</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveFilter(tab.value)}
                    className={cn(
                      'inline-flex min-h-9 items-center rounded-md px-4 text-sm font-semibold transition-colors',
                      activeFilter === tab.value
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-11 appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-8 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {normalizedQuery && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">
                Kết quả cho <b className="text-slate-800">"{normalizedQuery}"</b> —{' '}
                <b className="text-emerald-700">{searchedJobs.length}</b> việc làm
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-md px-2 text-xs font-bold text-slate-500 hover:text-emerald-700"
                onClick={() => {
                  setSearchQuery('');
                  navigate('/candidate/jobs');
                }}
              >
                Xóa tìm kiếm
              </Button>
            </div>
          )}
        </div>

        {/* 2-column layout */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Jobs list */}
          <section className="space-y-3">
            {/* Result count bar */}
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-semibold text-slate-700">
                {visibleJobs.length} <span className="font-medium text-slate-500">việc làm</span>
              </span>
              <span className="text-xs font-medium text-slate-500">
                {visibleJobs.length > 0
                  ? `Hiển thị ${currentPageStart}-${currentPageEnd} / ${visibleJobs.length} · Trang ${safeCurrentPage}/${totalPages}`
                  : `${jobs.length} tin đang tuyển`}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white"
                  />
                ))}
              </div>
            ) : visibleJobs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-4 text-base font-bold text-slate-800">
                  Không tìm thấy việc làm phù hợp
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Thử đổi từ khóa hoặc xóa bộ lọc để xem thêm cơ hội.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <Link to="/candidate/jobs">Quay về danh sách chung</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    aria-label="Phân trang việc làm"
                  >
                    <p className="text-sm font-semibold text-slate-600">
                      Đang xem{' '}
                      <span className="text-slate-950">
                        {currentPageStart}-{currentPageEnd}
                      </span>{' '}
                      trong <span className="text-slate-950">{visibleJobs.length}</span> việc làm
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={safeCurrentPage === 1}
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        className="h-9 rounded-lg border-slate-200 px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Trước
                      </Button>

                      <div className="flex items-center gap-1">
                        {paginationPages.map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              'flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-bold transition-colors',
                              page === safeCurrentPage
                                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                            )}
                            aria-current={page === safeCurrentPage ? 'page' : undefined}
                            aria-label={`Trang ${page}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={safeCurrentPage === totalPages}
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        className="h-9 rounded-lg border-slate-200 px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Sau
                      </Button>
                    </div>
                  </nav>
                )}
              </>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <SidebarCard title="Pipeline ứng tuyển" icon={Star}>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  {
                    label: 'Đã ứng tuyển',
                    count: applications.length,
                    tone: 'border-blue-100 bg-blue-50 text-blue-700',
                  },
                  {
                    label: 'Đang xử lý',
                    count: activeApplications.length,
                    tone: 'border-amber-100 bg-amber-50 text-amber-700',
                  },
                  {
                    label: 'Phỏng vấn',
                    count: interviewCount,
                    tone: 'border-violet-100 bg-violet-50 text-violet-700',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn('min-w-0 rounded-lg border px-2 py-3 text-center', item.tone)}
                  >
                    <p className="text-2xl font-bold leading-none">{item.count}</p>
                    <p className="mt-1 break-words text-xs font-semibold leading-tight">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
              <Button
                asChild
                className="mt-4 h-auto min-h-10 w-full rounded-lg bg-slate-950 px-2 py-2 text-xs leading-tight text-white hover:bg-slate-800 sm:px-3 sm:text-sm"
              >
                <Link to="/candidate/applications">
                  <span className="min-w-0 flex-1 whitespace-normal break-words text-center">
                    Xem pipeline ứng tuyển
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
            </SidebarCard>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default JobsPage;
