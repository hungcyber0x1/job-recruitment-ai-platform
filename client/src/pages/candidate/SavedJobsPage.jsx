import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Briefcase,
  Building2,
  Check,
  Clock,
  Flag,
  Loader2,
  MapPin,
  Search,
  Star,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common';
import { Input } from '@/components/ui/input';
import candidateService from '../../services/candidateService';
import { useNotification } from '../../context/NotificationContext';
import {
  calendarDaysLeftUntilDeadline,
  isJobApplicationDeadlinePassed,
} from '../../utils/jobDeadline';
import { cn } from '../../utils/cn';
import { isHandledAuthError } from '../../utils/authErrors';
import { getJobSalaryCardLabel, hasConcreteJobSalary } from '../../utils/jobSalary';

const AVATAR_PALETTE = ['0d9488', '0f766e', '115e59', '047857', '059669', '134e4a', '0e7490', '155e75'];

const TYPE_LABELS = {
  'full-time': 'Toàn thời gian',
  'part-time': 'Bán thời gian',
  'contract': 'Hợp đồng',
  'internship': 'Thực tập',
  'freelance': 'Tự do',
};

const WORK_MODE_CONFIG = {
  remote: {
    label: 'Từ xa',
    icon: () => (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    ),
    className: 'bg-violet-50 text-violet-700 ring-violet-200/80',
    iconClass: 'text-violet-500',
  },
  hybrid: {
    label: 'Kết hợp',
    icon: () => (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    className: 'bg-sky-50 text-sky-700 ring-sky-200/80',
    iconClass: 'text-sky-500',
  },
  onsite: {
    label: 'Tại văn phòng',
    icon: () => <Building2 size={11} />,
    className: 'bg-amber-50 text-amber-700 ring-amber-200/80',
    iconClass: 'text-amber-500',
  },
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'salary_high', label: 'Lương cao nhất' },
  { value: 'salary_low', label: 'Lương thấp nhất' },
  { value: 'deadline', label: 'Hạn nộp gần nhất' },
];

const FILTER_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang tuyển' },
  { value: 'expiring', label: 'Sắp hết hạn' },
];

const OPEN_SAVED_JOB_STATUSES = new Set(['published', 'active', 'open']);

function avatarBackgroundHex(companyName) {
  const s = String(companyName || 'C');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function isTransientNetworkError(error) {
  return (
    !error.response &&
    (error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error' ||
      error.request?.status === 0)
  );
}

function getCompanyLogoSrc(job) {
  if (job.company_logo) return job.company_logo;
  const name = encodeURIComponent(job.company_name || 'Company');
  const bg = avatarBackgroundHex(job.company_name);
  return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=ffffff&size=128&font-size=0.42&bold=true`;
}

function getDeadlineConfig(deadline, daysLeft, openForApplications = true) {
  if (!openForApplications) {
    return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500', icon: 'text-slate-400', label: 'Ngừng tuyển', dot: 'bg-slate-400' };
  }

  const passed = isJobApplicationDeadlinePassed(deadline);
  if (passed || daysLeft === 0) {
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', icon: 'text-red-500', label: 'Hết hạn', dot: 'bg-red-500' };
  }
  if (daysLeft !== null && daysLeft <= 3) {
    return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: 'text-amber-500', label: `${daysLeft} ngày nữa`, dot: 'bg-amber-500' };
  }
  return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'text-emerald-500', label: daysLeft !== null ? `${daysLeft} ngày nữa` : 'Không giới hạn', dot: 'bg-emerald-500' };
}

function formatJobType(type) {
  if (!type || typeof type !== 'string') return null;
  const key = type.trim().toLowerCase().replace(/\s+/g, '-');
  return TYPE_LABELS[key] || null;
}

function getSavedJobStatus(job) {
  return String(job?.status || job?.job_status || job?.job?.status || '').trim().toLowerCase();
}

function isSavedJobOpenForApplications(job) {
  const status = getSavedJobStatus(job);
  const statusAllowsApply = !status || OPEN_SAVED_JOB_STATUSES.has(status);
  return statusAllowsApply && !isJobApplicationDeadlinePassed(job?.deadline);
}

function isSavedJobExpiringSoon(job) {
  if (!isSavedJobOpenForApplications(job)) return false;
  const daysLeft = calendarDaysLeftUntilDeadline(job?.deadline);
  return daysLeft !== null && daysLeft <= 3 && daysLeft > 0;
}

function getJobSalarySortValue(job, mode = 'max') {
  const salaryMin = Number(job?.salary_min);
  const salaryMax = Number(job?.salary_max);
  const values = [salaryMin, salaryMax].filter((value) => Number.isFinite(value) && value > 0);

  if (!values.length) return null;
  return mode === 'min' ? Math.min(...values) : Math.max(...values);
}

const WorkModeBadge = ({ mode }) => {
  if (!mode || !WORK_MODE_CONFIG[mode]) return null;
  const config = WORK_MODE_CONFIG[mode];
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1', config.className)}>
      <Icon />
      {config.label}
    </span>
  );
};

const StatCard = ({ label, value, helper, icon: Icon, tone }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-3xl font-bold leading-none text-slate-950">{value ?? '—'}</div>
        <div className="mt-1 text-sm font-bold text-slate-700">{label}</div>
        {helper && <div className="mt-0.5 text-xs font-medium text-slate-500">{helper}</div>}
      </div>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1', tone)}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

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

const SavedJobCard = ({ job, onUnsave }) => {
  const [unsaving, setUnsaving] = useState(false);
  const [justUnsaved, setJustUnsaved] = useState(false);
  const { showNotification } = useNotification();

  const daysLeft = calendarDaysLeftUntilDeadline(job.deadline);
  const typeDisplay = formatJobType(job.type);
  const hasConcreteSalary = hasConcreteJobSalary(job);
  const detailPath = `/candidate/jobs/${job.id || job.job_id}`;

  const handleUnsave = useCallback(async () => {
    if (unsaving || justUnsaved) return;
    const jobId = job.id || job.job_id;
    setUnsaving(true);
    try {
      await candidateService.unsaveJob(jobId);
      setJustUnsaved(true);
      showNotification('Đã bỏ lưu việc làm', 'info');
      setTimeout(() => onUnsave(jobId), 400);
    } catch {
      setUnsaving(false);
      showNotification('Không thể bỏ lưu việc làm', 'error');
    }
  }, [job, unsaving, justUnsaved, onUnsave, showNotification]);

  const deadlineCfg = getDeadlineConfig(job.deadline, daysLeft, isSavedJobOpenForApplications(job));

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40',
        justUnsaved && 'pointer-events-none opacity-50'
      )}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />

      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
            <img src={getCompanyLogoSrc(job)} alt={job.company_name || 'Công ty'} className="h-full w-full object-cover" />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={detailPath}>
                  <h3 className="line-clamp-2 text-sm font-bold leading-tight text-slate-950 group-hover:text-emerald-700">
                    {job.title || job.job?.title || 'Vị trí đang cập nhật'}
                  </h3>
                </Link>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {job.company_name || job.company?.name || 'Công ty đang cập nhật'}
                </p>

                {/* Tags row */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {job.location && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-100">
                      <MapPin size={10} />
                      {job.location}
                    </span>
                  )}
                  {job.work_mode && <WorkModeBadge mode={job.work_mode} />}
                  {typeDisplay && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-100">
                      <Briefcase size={10} />
                      {typeDisplay}
                    </span>
                  )}
                  <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset', deadlineCfg.bg, deadlineCfg.border, deadlineCfg.text)}>
                    <span className={cn('h-1 w-1 rounded-full', deadlineCfg.dot)} />
                    {deadlineCfg.label}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <button
                  type="button"
                  onClick={handleUnsave}
                  disabled={unsaving}
                  className={cn(
                    'inline-flex h-8 items-center gap-1 overflow-hidden rounded-md border px-2.5 text-[11px] font-bold transition-colors',
                    justUnsaved
                      ? 'border-green-200 bg-green-50 text-green-600'
                      : 'border-slate-200 bg-white text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500',
                    unsaving && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {unsaving ? <Loader2 size={10} className="animate-spin" /> : justUnsaved ? <Check size={10} /> : <Bookmark size={10} className="fill-current" />}
                  {justUnsaved ? 'Đã bỏ' : 'Bỏ lưu'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer row */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset', hasConcreteSalary ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-slate-50 text-slate-500 ring-slate-100')}>
              {getJobSalaryCardLabel(job)}
            </span>
            {job.vacancies && (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-inset ring-sky-100">
                <Users size={10} />
                {job.vacancies} người
              </span>
            )}
          </div>
          <Link
            to={detailPath}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Chi tiết
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};

const SavedJobsPage = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { showNotification } = useNotification();

  const fetchSavedJobs = useCallback(async ({ silent = false } = {}) => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await candidateService.getSavedJobs();
      setSavedJobs(response.data?.data || []);
    } catch (error) {
      if (isHandledAuthError(error)) {
        setSavedJobs([]);
        return;
      }

      const transientNetworkError = isTransientNetworkError(error);
      setLoadError(
        transientNetworkError
          ? 'Máy chủ phát triển đang quá tải kết nối. Vui lòng thử tải lại sau vài giây.'
          : 'Không thể tải danh sách việc đã lưu.'
      );
      setSavedJobs([]);
      console.warn('SavedJobsPage fetch error:', error?.message || error);

      if (!silent) {
        showNotification(
          transientNetworkError
            ? 'Kết nối tạm thời bị gián đoạn, vui lòng thử lại.'
            : 'Không thể tải danh sách việc đã lưu',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSavedJobs({ silent: true });
  }, [fetchSavedJobs]);

  const handleUnsave = useCallback((jobId) => {
    setSavedJobs((prev) => prev.filter((j) => (j.id || j.job_id) !== jobId));
  }, []);

  const filterCounts = useMemo(() => {
    const all = savedJobs.length;
    const active = savedJobs.filter(isSavedJobOpenForApplications).length;
    const expiring = savedJobs.filter(isSavedJobExpiringSoon).length;
    return { all, active, expiring };
  }, [savedJobs]);

  const processedJobs = useMemo(() => {
    let result = [...savedJobs];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          (j.title || j.job?.title || '').toLowerCase().includes(query) ||
          (j.company_name || j.company?.name || '').toLowerCase().includes(query)
      );
    }

    if (activeFilter === 'active') {
      result = result.filter(isSavedJobOpenForApplications);
    } else if (activeFilter === 'expiring') {
      result = result.filter(isSavedJobExpiringSoon);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'salary_high': return (getJobSalarySortValue(b, 'max') || 0) - (getJobSalarySortValue(a, 'max') || 0);
        case 'salary_low': {
          const salaryA = getJobSalarySortValue(a, 'min');
          const salaryB = getJobSalarySortValue(b, 'min');
          if (salaryA === null && salaryB === null) return 0;
          if (salaryA === null) return 1;
          if (salaryB === null) return -1;
          return salaryA - salaryB;
        }
        case 'deadline': {
          const dlA = calendarDaysLeftUntilDeadline(a.deadline) ?? Infinity;
          const dlB = calendarDaysLeftUntilDeadline(b.deadline) ?? Infinity;
          return dlA - dlB;
        }
        default: return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

    return result;
  }, [savedJobs, searchQuery, activeFilter, sortBy]);

  const activeCount = filterCounts.active;
  const expiringCount = filterCounts.expiring;

  const summaryCards = [
    {
      label: 'Đã lưu',
      value: savedJobs.length,
      helper: 'Tổng cơ hội',
      icon: Bookmark,
      tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    },
    {
      label: 'Còn nhận hồ sơ',
      value: activeCount,
      helper: `${Math.round((activeCount / Math.max(savedJobs.length, 1)) * 100)}% còn mở`,
      icon: Clock,
      tone: 'bg-sky-50 text-sky-600 ring-sky-100',
    },
    {
      label: 'Sắp hết hạn',
      value: expiringCount,
      helper: 'Cần theo dõi',
      icon: Flag,
      tone: 'bg-amber-50 text-amber-600 ring-amber-100',
    },
    {
      label: 'Không còn mở',
      value: savedJobs.length - activeCount,
      helper: 'Hết hạn hoặc ngừng tuyển',
      icon: Star,
      tone: 'bg-slate-50 text-slate-500 ring-slate-200',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16">
      {/* Header */}
      <div className="border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-8 sm:px-6 lg:px-8">
          {/* Title row */}
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                <Bookmark className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  Bộ sưu tập việc làm
                </span>
                <h1 className="mt-2 text-xl font-bold tracking-normal text-slate-950 sm:text-2xl">
                  Việc đã lưu
                </h1>
                <p className="mt-0.5 max-w-2xl text-sm font-medium text-slate-600">
                  Theo dõi, so sánh và quay lại các vị trí bạn quan tâm.
                </p>
              </div>
            </div>

          </div>

          {/* Stats row */}
          {!loading && savedJobs.length > 0 && (
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
        {savedJobs.length > 0 && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm việc đã lưu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium shadow-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {FILTER_TABS.map((tab) => {
                    const count = filterCounts[tab.value];
                    const isActive = activeFilter === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setActiveFilter(tab.value)}
                        className={cn(
                          'inline-flex min-h-9 items-center gap-1.5 rounded-md px-3.5 text-sm font-semibold transition-colors',
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
                            : 'text-slate-500 hover:bg-white hover:text-slate-900'
                        )}
                      >
                        {tab.label}
                        {count > 0 && (
                          <span className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold', isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500')}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-11 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {(activeFilter !== 'all' || searchQuery) && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">
                  <b className="text-slate-800">{processedJobs.length}</b> kết quả
                  {searchQuery && <> cho "<b className="text-emerald-700">{searchQuery}</b>"</>}
                  {activeFilter !== 'all' && <> trong tab <b className="text-emerald-700">{FILTER_TABS.find(t => t.value === activeFilter)?.label}</b></>}
                </span>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                  className="inline-flex h-7 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2-column layout */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Jobs list */}
          <section className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white" />
                ))}
              </div>
            ) : loadError ? (
              <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/70 px-6 py-12 text-center shadow-sm">
                <Bookmark className="mx-auto h-9 w-9 text-amber-500" />
                <p className="mt-4 text-base font-bold text-amber-900">Chưa tải được việc đã lưu</p>
                <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-amber-700">{loadError}</p>
                <Button
                  onClick={() => fetchSavedJobs()}
                  className="mt-5 rounded-lg bg-amber-600 font-semibold text-white shadow-sm hover:bg-amber-700"
                >
                  Thử tải lại
                </Button>
              </div>
            ) : savedJobs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white shadow-sm">
                <EmptyState
                  variant="robotReading"
                  title="Chưa có việc đã lưu"
                  description="Lưu các vị trí bạn quan tâm để so sánh và ứng tuyển khi sẵn sàng."
                  action={
                    <Button asChild className="rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
                      <Link to="/candidate/jobs">Khám phá việc làm</Link>
                    </Button>
                  }
                />
              </div>
            ) : processedJobs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
                <Search className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-4 text-base font-bold text-slate-800">Không tìm thấy kết quả</p>
                <p className="mt-2 text-sm text-slate-500">
                  Thử thay đổi từ khóa hoặc bộ lọc.
                </p>
                <Button
                  variant="outline"
                  onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                  className="mt-4 rounded-lg border-slate-300 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {processedJobs.map((job) => (
                    <SavedJobCard key={job.id || job.job_id} job={job} onUnsave={handleUnsave} />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <SidebarCard title="Tổng quan" icon={Star}>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Đã lưu', value: savedJobs.length, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                  { label: 'Còn tuyển', value: activeCount, tone: 'bg-sky-50 text-sky-700 border-sky-100' },
                  { label: 'Sắp hết hạn', value: expiringCount, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
                ].map((item) => (
                  <div key={item.label} className={cn('flex items-center justify-between rounded-lg border px-3 py-2.5', item.tone)}>
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-xl font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </SidebarCard>

          </aside>
        </div>
      </main>
    </div>
  );
};

export default SavedJobsPage;
