import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import { cn } from '@/utils/cn';
import {
  APPLICATION_STATUS,
  normalizeApplicationStatus,
} from '../../constants/status';
import { useAuth } from '../../context/AuthContext';
import ChartSurface, {
  CHART_TICK_STYLE,
  CHART_TOOLTIP_STYLE,
} from '../../components/charts/ChartSurface';
import { applicationService, jobService } from '../../services';

const TIME_RANGE_OPTIONS = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
  { value: '365', label: '1 năm' },
];

const ACTIVE_JOB_STATUSES = new Set(['active', 'published']);
const PENDING_APPLICATION_STATUSES = new Set([
  APPLICATION_STATUS.SUBMITTED,
  APPLICATION_STATUS.SHORTLISTED,
]);
const INTERVIEWING_APPLICATION_STATUSES = new Set([
  APPLICATION_STATUS.INTERVIEW_SCHEDULED,
  APPLICATION_STATUS.INTERVIEWED,
]);
const OFFERED_APPLICATION_STATUSES = new Set([APPLICATION_STATUS.OFFERED]);
const HIRED_APPLICATION_STATUSES = new Set([APPLICATION_STATUS.HIRED]);
const REJECTED_APPLICATION_STATUSES = new Set([
  APPLICATION_STATUS.REJECTED,
  APPLICATION_STATUS.WITHDRAWN,
]);

const GRID_BACKGROUND = {
  backgroundImage:
    'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
};

const TONE_STYLES = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    subtle: 'border-emerald-200 bg-emerald-50/85 text-emerald-700',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    glow: 'bg-emerald-400/15',
    line: 'from-emerald-400/90 via-emerald-300/30 to-transparent',
  },
  blue: {
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
    subtle: 'border-sky-200 bg-sky-50/85 text-sky-700',
    dot: 'bg-sky-500',
    bar: 'bg-sky-500',
    glow: 'bg-sky-400/15',
    line: 'from-sky-400/90 via-sky-300/30 to-transparent',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    subtle: 'border-amber-200 bg-amber-50/90 text-amber-700',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    glow: 'bg-amber-400/15',
    line: 'from-amber-400/90 via-amber-300/30 to-transparent',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-700 ring-violet-100',
    subtle: 'border-violet-200 bg-violet-50/90 text-violet-700',
    dot: 'bg-violet-500',
    bar: 'bg-violet-500',
    glow: 'bg-violet-400/15',
    line: 'from-violet-400/90 via-violet-300/30 to-transparent',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    subtle: 'border-slate-200 bg-slate-100 text-slate-700',
    dot: 'bg-slate-400',
    bar: 'bg-slate-500',
    glow: 'bg-slate-400/10',
    line: 'from-slate-500/70 via-slate-300/30 to-transparent',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-700 ring-rose-100',
    subtle: 'border-rose-200 bg-rose-50/90 text-rose-700',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
    glow: 'bg-rose-400/15',
    line: 'from-rose-400/90 via-rose-300/30 to-transparent',
  },
};

const PIPELINE_STAGE_CONFIG = [
  {
    key: 'totalApplications',
    label: 'Đơn vào',
    helper: 'Tổng hồ sơ hệ thống ghi nhận',
    icon: FileText,
    tone: 'slate',
  },
  {
    key: 'pendingApplications',
    label: 'Đang xử lý',
    helper: 'Sàng lọc và rà soát ban đầu',
    icon: Clock3,
    tone: 'amber',
  },
  {
    key: 'interviewing',
    label: 'Phỏng vấn',
    helper: 'Đã đi tới vòng trao đổi trực tiếp',
    icon: Calendar,
    tone: 'blue',
  },
  {
    key: 'offered',
    label: 'Đề nghị',
    helper: 'Đã gửi đề nghị tuyển dụng',
    icon: Sparkles,
    tone: 'violet',
  },
  {
    key: 'hired',
    label: 'Đã tuyển',
    helper: 'Chốt thành công trong quy trình',
    icon: CheckCircle2,
    tone: 'emerald',
  },
];

const toneStyle = (tone) => TONE_STYLES[tone] || TONE_STYLES.emerald;

const formatNumber = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

const formatAverage = (value) =>
  new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);

const clamp = (value) => Math.max(0, Math.min(Number(value) || 0, 100));

const ratioToPercent = (numerator, denominator) =>
  denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

function getApplicationTimestamp(application) {
  const rawDate =
    application?.applied_at ||
    application?.appliedAt ||
    application?.created_at ||
    application?.createdAt ||
    null;

  if (!rawDate) return null;

  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTrendLabel(date, timeRangeDays) {
  if (timeRangeDays <= 7) {
    return new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date);
  }

  if (timeRangeDays <= 120) {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('vi-VN', { month: 'short' }).format(date);
}

function buildTrendData(applications, timeRange) {
  const totalDays = Number(timeRange) || 30;
  const bucketCount = 6;
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - totalDays + 1);

  const totalRangeMs = Math.max(endDate.getTime() - startDate.getTime() + 1, 1);
  const bucketSizeMs = Math.max(Math.floor(totalRangeMs / bucketCount), 1);

  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(startDate.getTime() + bucketSizeMs * index);

    return {
      label: getTrendLabel(bucketStart, totalDays),
      applications: 0,
      offers: 0,
      hired: 0,
    };
  });

  applications.forEach((application) => {
    const timestamp = getApplicationTimestamp(application);
    if (!timestamp) return;

    const time = timestamp.getTime();
    if (time < startDate.getTime() || time > endDate.getTime()) return;

    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor((time - startDate.getTime()) / bucketSizeMs))
    );

    buckets[bucketIndex].applications += 1;

    if (OFFERED_APPLICATION_STATUSES.has(application.status)) {
      buckets[bucketIndex].offers += 1;
    }

    if (HIRED_APPLICATION_STATUSES.has(application.status)) {
      buckets[bucketIndex].hired += 1;
    }
  });

  return buckets;
}

function SectionCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  meta,
  tone = 'emerald',
  className = '',
  children,
}) {
  const styles = toneStyle(tone);

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white/95 p-5 shadow-sm transition-all hover:border-emerald-200/70 hover:shadow-[0_28px_60px_-40px_rgba(15,23,42,0.25)] sm:p-6',
        className
      )}
    >
      <div className={cn('pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl', styles.glow)} />

      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            {Icon ? (
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset shadow-sm',
                  styles.icon
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
            ) : null}

            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  {eyebrow}
                </p>
              ) : null}
              <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                {title}
              </h2>
              {description ? (
                <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {meta ? <div className="flex shrink-0 flex-wrap items-center gap-2">{meta}</div> : null}
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

function HeroMetricCard({ icon: Icon, label, value, helper, tone = 'emerald', to }) {
  const styles = toneStyle(tone);

  const content = (
    <div className="group relative h-full overflow-hidden rounded-[24px] border border-white/85 bg-white/90 p-4 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_24px_48px_-32px_rgba(16,185,129,0.35)]">
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', styles.line)} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 tabular-nums">
            {value}
          </p>
        </div>

        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
            styles.icon
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">{helper}</p>

      {to ? (
        <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
          Xem chi tiết
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      ) : null}
    </div>
  );

  if (!to) return content;

  return (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  );
}

function QuickStatCard({ label, value, helper, tone = 'slate', emphasize = false }) {
  const styles = toneStyle(tone);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/92 p-3.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={cn('h-2 w-2 rounded-full', styles.dot)} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
      </div>

      <p
        className={cn(
          'mt-2 text-lg font-bold tracking-tight text-slate-950 tabular-nums',
          emphasize && 'text-emerald-600'
        )}
      >
        {value}
      </p>

      {helper ? <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{helper}</p> : null}
    </div>
  );
}

function SummaryMiniStat({ label, value, tone = 'slate' }) {
  const styles = toneStyle(tone);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={cn('h-2 w-2 rounded-full', styles.dot)} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-950 tabular-nums">{value}</p>
    </div>
  );
}

function QuickLinkCard({ icon: Icon, title, description, tone = 'emerald', to }) {
  const styles = toneStyle(tone);

  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm"
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
          styles.icon
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
        </div>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

function PriorityActionCard({
  icon: Icon,
  title,
  value,
  description,
  badge,
  ctaLabel,
  to,
  tone = 'amber',
}) {
  const styles = toneStyle(tone);

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
              styles.icon
            )}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {title}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
          </div>
        </div>

        <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', styles.subtle)}>
          {badge}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>

      <Button
        asChild
        variant="outline"
        className="mt-4 h-10 w-full justify-between rounded-2xl border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
      >
        <Link to={to}>
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function ProgressRow({ label, helper, value, tone = 'emerald' }) {
  const styles = toneStyle(tone);
  const width = clamp(value);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="text-xs text-slate-500">{helper}</p>
        </div>
        <span className="text-sm font-bold text-slate-950">{width}%</span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all duration-500', styles.bar)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function PipelineStageCard({ icon: Icon, label, value, helper, share, tone = 'slate' }) {
  const styles = toneStyle(tone);

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
            styles.icon
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', styles.subtle)}>
          {share}%
        </span>
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1.5 text-sm leading-6 text-slate-500">{helper}</p>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all duration-500', styles.bar)} style={{ width: `${clamp(share)}%` }} />
      </div>
    </div>
  );
}

function DistributionRow({ label, value, total, color, helper }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <p className="text-sm font-semibold text-slate-800">{label}</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-slate-950">{formatNumber(value)}</p>
          <p className="text-xs text-slate-400">{percentage}%</p>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${clamp(percentage)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function LegendPill({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

const RecruitmentReportPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const jobsRes = await jobService.getMyJobs().catch(() => ({ data: { data: [] } }));
        const myJobs = Array.isArray(jobsRes.data?.data) ? jobsRes.data.data : [];

        const appResponses = await Promise.all(
          myJobs.map((job) =>
            applicationService
              .getJobApplications(job.id)
              .catch(() => ({ data: { data: [] } }))
          )
        );

        const allApplications = appResponses.flatMap((response) =>
          (Array.isArray(response.data?.data) ? response.data.data : []).map((application) => ({
            ...application,
            status: normalizeApplicationStatus(application?.status),
          }))
        );

        if (!mounted) return;

        setJobs(myJobs);
        setApplications(allApplications);
      } catch (error) {
        console.error('Failed to fetch report data:', error);

        if (!mounted) return;

        setJobs([]);
        setApplications([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const companyName =
    user?.company_name || user?.companyName || user?.company?.name || 'doanh nghiệp của bạn';

  const stats = useMemo(() => {
    const summary = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((job) => ACTIVE_JOB_STATUSES.has(job.status)).length,
      totalApplications: applications.length,
      pendingApplications: 0,
      interviewing: 0,
      offered: 0,
      hired: 0,
      rejected: 0,
    };

    applications.forEach((application) => {
      const status = application?.status;

      if (PENDING_APPLICATION_STATUSES.has(status)) {
        summary.pendingApplications += 1;
        return;
      }

      if (INTERVIEWING_APPLICATION_STATUSES.has(status)) {
        summary.interviewing += 1;
        return;
      }

      if (OFFERED_APPLICATION_STATUSES.has(status)) {
        summary.offered += 1;
        return;
      }

      if (HIRED_APPLICATION_STATUSES.has(status)) {
        summary.hired += 1;
        return;
      }

      if (REJECTED_APPLICATION_STATUSES.has(status)) {
        summary.rejected += 1;
      }
    });

    return summary;
  }, [applications, jobs]);

  const selectedRange =
    TIME_RANGE_OPTIONS.find((option) => option.value === timeRange) || TIME_RANGE_OPTIONS[1];

  const conversionRate = ratioToPercent(stats.hired, stats.totalApplications);
  const offerRate = ratioToPercent(stats.offered, stats.totalApplications);
  const activeJobsRatio = ratioToPercent(stats.activeJobs, stats.totalJobs);
  const activePipelineCount =
    stats.pendingApplications + stats.interviewing + stats.offered;
  const pipelineShare = ratioToPercent(activePipelineCount, stats.totalApplications);
  const interviewRate = ratioToPercent(
    stats.interviewing + stats.offered + stats.hired,
    stats.totalApplications
  );
  const rejectionRate = ratioToPercent(stats.rejected, stats.totalApplications);
  const averageApplicationsPerJob =
    stats.totalJobs > 0 ? formatAverage(stats.totalApplications / stats.totalJobs) : '0.0';

  const trendData = useMemo(
    () => buildTrendData(applications, timeRange),
    [applications, timeRange]
  );

  const trendHasActivity = trendData.some(
    (item) => item.applications > 0 || item.offers > 0 || item.hired > 0
  );

  const latestTrend = trendData[trendData.length - 1] || {
    applications: 0,
    offers: 0,
    hired: 0,
  };

  const statusDistribution = [
    {
      name: 'Đang xử lý',
      value: stats.pendingApplications,
      color: '#f59e0b',
      helper: 'Lớp đầu vào',
    },
    {
      name: 'Phỏng vấn',
      value: stats.interviewing,
      color: '#0ea5e9',
      helper: 'Đang trao đổi trực tiếp',
    },
    {
      name: 'Đề nghị',
      value: stats.offered,
      color: '#8b5cf6',
      helper: 'Đã gửi đề nghị tuyển dụng',
    },
    {
      name: 'Đã tuyển',
      value: stats.hired,
      color: '#10b981',
      helper: 'Chốt thành công',
    },
    {
      name: 'Từ chối / rút',
      value: stats.rejected,
      color: '#f43f5e',
      helper: 'Kết thúc không thành công',
    },
  ];

  const activeDistributionData = statusDistribution.filter((item) => item.value > 0);
  const distributionChartData =
    activeDistributionData.length > 0
      ? activeDistributionData
      : [{ name: 'Chưa có dữ liệu', value: 1, color: '#e2e8f0' }];

  const focusTone =
    stats.pendingApplications > 0 || stats.offered > 0
      ? 'amber'
      : stats.activeJobs > 0
        ? 'emerald'
        : 'slate';

  const focusTitle =
    stats.pendingApplications > 0 || stats.offered > 0
      ? 'Có hồ sơ cần phản hồi để không làm chậm quy trình'
      : stats.activeJobs > 0
        ? 'Quy trình tuyển dụng đang giữ nhịp ổn định'
        : 'Không gian tuyển dụng đã sẵn sàng cho chiến dịch mới';

  const focusHelper =
    stats.pendingApplications > 0
      ? `Hiện có ${formatNumber(
        stats.pendingApplications
      )} hồ sơ ở lớp đầu vào và ${formatNumber(
        stats.offered
      )} đề nghị tuyển dụng cần theo dõi phản hồi từ ứng viên.`
      : stats.activeJobs > 0
        ? `Bạn đang có ${formatNumber(
          stats.activeJobs
        )} tin mở, ${formatNumber(activePipelineCount)} hồ sơ đang luân chuyển và ${formatNumber(
          stats.hired
        )} hồ sơ đã chốt thành công.`
        : 'Bắt đầu từ một tin tuyển dụng mới hoặc mở tìm kiếm chủ động để kích hoạt đầu vào ứng viên.';

  const heroMetrics = [
    {
      icon: Briefcase,
      label: 'Tin đang quản lý',
      value: formatNumber(stats.totalJobs),
      helper: 'Tổng số vị trí hiện có trong không gian tuyển dụng.',
      tone: 'emerald',
      to: '/employer/jobs',
    },
    {
      icon: TrendingUp,
      label: 'Tin đang mở',
      value: formatNumber(stats.activeJobs),
      helper: `${activeJobsRatio}% số tin đang ở trạng thái nhận hồ sơ.`,
      tone: 'blue',
      to: '/employer/jobs',
    },
    {
      icon: Users,
      label: 'Hồ sơ trong quy trình',
      value: formatNumber(stats.totalApplications),
      helper: `${formatNumber(activePipelineCount)} hồ sơ vẫn đang được xử lý tiếp.`,
      tone: 'slate',
      to: '/employer/applications',
    },
    {
      icon: Target,
      label: 'Tỷ lệ tuyển dụng',
      value: `${conversionRate}%`,
      helper: `${formatNumber(stats.hired)} ứng viên đã đi tới trạng thái tuyển dụng.`,
      tone: 'amber',
      to: '/employer/applications',
    },
  ];

  const quickLinks = [
    {
      icon: Plus,
      title: 'Đăng tin mới',
      description: 'Khởi tạo mô tả công việc mới và đưa vị trí vào quy trình tuyển dụng.',
      tone: 'emerald',
      to: '/employer/jobs/post',
    },
    {
      icon: FileText,
      title: 'Mở quy trình',
      description: 'Đi thẳng vào bảng ứng viên để xử lý các hồ sơ đang luân chuyển.',
      tone: 'blue',
      to: '/employer/applications',
    },
    {
      icon: Search,
      title: 'Tìm ứng viên',
      description: 'Mở kho ứng viên để chủ động bù đầu vào cho các vị trí cần gấp.',
      tone: 'violet',
      to: '/employer/search-candidates',
    },
    {
      icon: Briefcase,
      title: 'Quản lý tin',
      description: 'Rà soát hiệu suất từng tin và tối ưu lại mô tả công việc trong không gian tuyển dụng.',
      tone: 'slate',
      to: '/employer/jobs',
    },
  ];

  const priorityActions = [
    {
      icon: AlertCircle,
      title: 'Hồ sơ chờ phản hồi',
      value: formatNumber(stats.pendingApplications),
      description:
        stats.pendingApplications > 0
          ? 'Ưu tiên xử lý lớp đầu vào để không mất tốc độ chuyển đổi ngay từ đầu quy trình.'
          : 'Không có tồn đọng ở lớp đầu vào vào thời điểm hiện tại.',
      badge: stats.pendingApplications > 0 ? 'Ưu tiên cao' : 'Ổn định',
      ctaLabel: 'Mở quy trình',
      to: '/employer/applications',
      tone: 'amber',
    },
    {
      icon: Calendar,
      title: 'Lịch phỏng vấn đang chạy',
      value: formatNumber(stats.interviewing),
      description:
        stats.interviewing > 0
          ? 'Theo dõi các vòng trao đổi trực tiếp để không bỏ lỡ mốc đánh giá tiếp theo.'
          : 'Hiện chưa có hồ sơ ở giai đoạn phỏng vấn.',
      badge: stats.interviewing > 0 ? 'Đang theo dõi' : 'Chưa phát sinh',
      ctaLabel: 'Xem lịch',
      to: '/employer/interview-schedule',
      tone: 'blue',
    },
    {
      icon: Sparkles,
      title: 'Đề nghị cần theo dõi',
      value: formatNumber(stats.offered),
      description:
        stats.offered > 0
          ? 'Giữ nhịp phản hồi với ứng viên đã nhận đề nghị để tăng khả năng chốt tuyển.'
          : 'Chưa có đề nghị nào cần theo dõi phản hồi trong giai đoạn này.',
      badge: stats.offered > 0 ? 'Cần theo dõi' : 'Chưa phát sinh',
      ctaLabel: 'Xem ứng viên',
      to: '/employer/applications',
      tone: 'violet',
    },
  ];

  const pipelineCards = PIPELINE_STAGE_CONFIG.map((item) => ({
    ...item,
    value: stats[item.key],
    share: ratioToPercent(stats[item.key], stats.totalApplications),
  }));

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-slate-50/40">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={GRID_BACKGROUND} />

        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
          <div className="space-y-5">
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_340px]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 font-bold text-emerald-700 shadow-sm">
                    <Building2 className="h-3.5 w-3.5" />
                    Không gian nhà tuyển dụng
                  </Badge>
                  <Badge className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-bold text-slate-600 shadow-sm">
                    Báo cáo tuyển dụng
                  </Badge>
                  <Badge className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-bold text-slate-600 shadow-sm">
                    Theo dõi {selectedRange.label.toLowerCase()}
                  </Badge>
                </div>

                <div className="max-w-4xl">
                  <p className="text-sm font-semibold text-emerald-600">
                    Bảng điều phối hiệu suất tuyển dụng
                  </p>
                  <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
                    Nhìn toàn cảnh quy trình tuyển dụng cho{' '}
                    <span className="text-emerald-600">{companyName}</span>
                  </h1>
                  <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                    Gộp hiệu suất tin tuyển dụng, nhịp hồ sơ và hành động ưu tiên vào cùng một
                    không gian điều phối đồng nhất với trang quản lý tin của nhà tuyển dụng.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {heroMetrics.map((metric) => (
                    <EmployerStatCard key={metric.label} {...metric} />
                  ))}
                </div>

                <div className="rounded-[24px] border border-white/85 bg-white/88 p-4 shadow-sm backdrop-blur">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                          toneStyle(focusTone).icon
                        )}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">{focusTitle}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{focusHelper}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        Đang xử lý {formatNumber(activePipelineCount)}
                      </Badge>
                      <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        Đề nghị {formatNumber(stats.offered)}
                      </Badge>
                      <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        Phỏng vấn {formatNumber(stats.interviewing)}
                      </Badge>
                      <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        Đã tuyển {formatNumber(stats.hired)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    asChild
                    variant="primary"
                    className="h-11 rounded-lg bg-slate-950 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Link to="/employer/jobs">
                      <Briefcase className="h-4 w-4" />
                      Quản lý tin
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold text-slate-700 shadow-sm hover:bg-white"
                  >
                    <Link to="/employer/applications">
                      <FileText className="h-4 w-4" />
                      Xem quy trình
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold text-slate-700 shadow-sm hover:bg-white"
                  >
                    <Link to="/employer/jobs/post">
                      <Plus className="h-4 w-4" />
                      Đăng tin mới
                    </Link>
                  </Button>
                </div>
              </div>

              <aside className="rounded-[28px] border border-white/85 bg-white/92 p-5 shadow-sm backdrop-blur sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      Điều phối hiệu suất
                    </p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                      Tổng quan vận hành
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Những chỉ số cốt lõi cần nắm ngay để quyết định hành động tiếp theo.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-emerald-50/70" />
                      <svg width="112" height="112" className="-rotate-90">
                        <circle cx="56" cy="56" r="42" fill="none" stroke="#e2e8f0" strokeWidth="9" />
                        <circle
                          cx="56"
                          cy="56"
                          r="42"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="9"
                          strokeLinecap="round"
                          strokeDasharray={`${(clamp(conversionRate) / 100) * 264} 264`}
                        />
                      </svg>

                      <div className="absolute text-center">
                        <p className="text-3xl font-bold tracking-tight text-slate-950">
                          {conversionRate}%
                        </p>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Đã tuyển
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Tóm tắt nhanh
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                        {formatNumber(activePipelineCount)} hồ sơ đang còn chuyển động trong quy trình.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Theo dõi nhanh các tín hiệu cốt lõi để quyết định bước xử lý tiếp theo.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <SummaryMiniStat
                      label="Đang xử lý"
                      value={formatNumber(activePipelineCount)}
                      tone="amber"
                    />
                    <SummaryMiniStat
                      label="Đề nghị"
                      value={formatNumber(stats.offered)}
                      tone="violet"
                    />
                    <SummaryMiniStat
                      label="TB / tin"
                      value={averageApplicationsPerJob}
                      tone="slate"
                    />
                    <SummaryMiniStat
                      label="Đã tuyển"
                      value={formatNumber(stats.hired)}
                      tone="emerald"
                    />
                  </div>
                </div>

              </aside>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_340px]">
              <div className="rounded-[24px] border border-white/85 bg-white/88 p-4 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                      Hiệu suất vận hành
                    </p>
                    <h3 className="mt-1.5 text-lg font-bold tracking-tight text-slate-950">
                      Sức khỏe quy trình trong kỳ {selectedRange.label.toLowerCase()}
                    </h3>
                  </div>

                  <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    Theo dõi {selectedRange.label.toLowerCase()}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <ProgressRow
                    label="Độ phủ tin đang mở"
                    helper={`${formatNumber(stats.activeJobs)} trong ${formatNumber(stats.totalJobs)} tin đang nhận hồ sơ`}
                    value={activeJobsRatio}
                    tone="emerald"
                  />
                  <ProgressRow
                    label="Nhịp xử lý quy trình"
                    helper={`${formatNumber(activePipelineCount)} hồ sơ đang còn chuyển động trong hệ thống`}
                    value={pipelineShare}
                    tone="blue"
                  />
                  <ProgressRow
                    label="Tỷ lệ đề nghị"
                    helper={`${formatNumber(stats.offered)} hồ sơ đã nhận đề nghị tuyển dụng`}
                    value={offerRate}
                    tone="violet"
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-white/85 bg-white/88 p-4 shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Phạm vi theo dõi
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTimeRange(option.value)}
                      className={cn(
                        'rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-all',
                        timeRange === option.value
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link
                    to="/employer/company-profile"
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Hồ sơ công ty
                  </Link>
                  <Link
                    to="/employer/jobs"
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Quản lý tin
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <div className="space-y-6">
            <SectionCard
              icon={TrendingUp}
              eyebrow="Hiệu suất"
              title="Xu hướng hồ sơ theo thời gian"
              description={`Theo dõi hồ sơ mới, đề nghị tuyển dụng và kết quả tuyển dụng phát sinh trong ${selectedRange.label.toLowerCase()}.`}
              tone="emerald"
              meta={
                <>
                  <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {selectedRange.label}
                  </Badge>
                  <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {formatNumber(stats.totalApplications)} hồ sơ
                  </Badge>
                  <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {conversionRate}% tuyển dụng
                  </Badge>
                </>
              }
            >
              <div className="flex flex-wrap gap-2">
                <LegendPill color="#10b981" label="Hồ sơ mới" />
                <LegendPill color="#8b5cf6" label="Đề nghị" />
                <LegendPill color="#0ea5e9" label="Đã tuyển" />
              </div>

              <div className="relative mt-5 h-[320px] w-full">
                <ChartSurface className="h-full" minChartHeight={300}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportApplications" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="reportOffers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="reportHired" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="label" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
                    <YAxis tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />

                    <Area
                      type="monotone"
                      dataKey="applications"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#reportApplications)"
                      name="Hồ sơ mới"
                      dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: '#10b981' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="offers"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fill="url(#reportOffers)"
                      name="Đề nghị"
                      dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 3.5 }}
                      activeDot={{ r: 5, fill: '#8b5cf6' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hired"
                      stroke="#0ea5e9"
                      strokeWidth={2.5}
                      fill="url(#reportHired)"
                      name="Đã tuyển"
                      dot={{ fill: '#0ea5e9', strokeWidth: 0, r: 3.5 }}
                      activeDot={{ r: 5, fill: '#0ea5e9' }}
                    />
                  </AreaChart>
                </ChartSurface>

                {!trendHasActivity ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
                      Chưa có biến động hồ sơ trong {selectedRange.label.toLowerCase()}.
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <QuickStatCard
                  label="Kỳ gần nhất"
                  value={formatNumber(latestTrend.applications)}
                  helper="hồ sơ mới ở nhịp gần nhất"
                  tone="emerald"
                />
                <QuickStatCard
                  label="Đề nghị phát sinh"
                  value={formatNumber(latestTrend.offers)}
                  helper="đề nghị tuyển dụng trong kỳ gần nhất"
                  tone="violet"
                />
                <QuickStatCard
                  label="Đã tuyển"
                  value={formatNumber(latestTrend.hired)}
                  helper="hồ sơ chốt thành công trong kỳ gần nhất"
                  tone="blue"
                />
              </div>
            </SectionCard>

            <SectionCard
              icon={Workflow}
              eyebrow="Quy trình"
              title="Sức khỏe quy trình tuyển dụng"
              description="Phân rã từng bước từ đơn vào đến tuyển dụng để nhìn nhanh điểm nghẽn và tỷ trọng chuyển đổi."
              tone="slate"
              meta={
                <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {pipelineShare}% quy trình đang vận hành
                </Badge>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {pipelineCards.map((item) => (
                  <PipelineStageCard
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    value={formatNumber(item.value)}
                    helper={item.helper}
                    share={item.share}
                    tone={item.tone}
                  />
                ))}
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <QuickStatCard
                    label="Tỷ lệ vào phỏng vấn"
                    value={`${interviewRate}%`}
                    helper="hồ sơ đi tới trao đổi trực tiếp"
                    tone="blue"
                  />
                  <QuickStatCard
                    label="Tỷ lệ đề nghị"
                    value={`${offerRate}%`}
                    helper="hồ sơ nhận đề nghị tuyển dụng"
                    tone="violet"
                  />
                  <QuickStatCard
                    label="Tỷ lệ rơi rụng"
                    value={`${rejectionRate}%`}
                    helper={`${formatNumber(stats.rejected)} hồ sơ kết thúc không thành công`}
                    tone="rose"
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <SectionCard
              icon={Sparkles}
              eyebrow="Điều hướng"
              title="Thao tác nhanh"
              description="Các đường tắt ưu tiên để tiếp tục xử lý công việc mà không rời khỏi khu báo cáo."
              tone="emerald"
            >
              <div className="grid gap-3">
                {quickLinks.map((item) => (
                  <QuickLinkCard key={item.title} {...item} />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={AlertCircle}
              eyebrow="Ưu tiên"
              title="Điểm cần xử lý"
              description="Những luồng công việc nên hành động ngay để giữ nhịp tuyển dụng ổn định."
              tone="amber"
            >
              <div className="space-y-3">
                {priorityActions.map((item) => (
                  <PriorityActionCard key={item.title} {...item} />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={Target}
              eyebrow="Phân bổ"
              title="Trạng thái hồ sơ hiện tại"
              description="Tỷ trọng hồ sơ theo nhóm xử lý chính trong quy trình tuyển dụng."
              tone="slate"
            >
              <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
                <div className="relative h-[240px] w-full">
                  <ChartSurface className="h-full" minChartHeight={220}>
                    <PieChart>
                      <Pie
                        data={distributionChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={84}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {distributionChartData.map((entry, index) => (
                          <Cell key={`distribution-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ChartSurface>

                  {stats.totalApplications === 0 ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
                        Chưa có hồ sơ để phân tích.
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {statusDistribution.map((item) => (
                  <DistributionRow
                    key={item.name}
                    label={item.name}
                    value={item.value}
                    total={stats.totalApplications}
                    color={item.color}
                    helper={item.helper}
                  />
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecruitmentReportPage;
