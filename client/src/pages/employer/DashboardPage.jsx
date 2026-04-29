import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Calendar,
  ChevronRight,
  Clock3,
  Megaphone,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

import ChartSurface, {
  CHART_MUTED_TICK_STYLE,
  CHART_TOOLTIP_STYLE,
} from '@/components/charts/ChartSurface';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  APPLICATION_STATUS,
  INTERVIEW_APPLICATION_STATUSES,
  normalizeApplicationStatus,
} from '../../constants/status';
import { useAuth } from '../../context/AuthContext';
import { applicationService, jobService } from '../../services';

const FUNNEL_LABELS = {
  pending: 'Ứng tuyển',
  shortlisted: 'Rút gọn',
  interviewing: 'Phỏng vấn',
  offered: 'Đề nghị',
  hired: 'Nhận việc',
  rejected: 'Từ chối',
};

const FUNNEL_COLORS = {
  pending: '#0f766e',
  shortlisted: '#6366f1',
  interviewing: '#3b82f6',
  offered: '#f59e0b',
  hired: '#22c55e',
  rejected: '#f43f5e',
};

const FUNNEL_STAGES = [
  { key: APPLICATION_STATUS.SUBMITTED, label: 'Đã nộp', fill: '#0f766e' },
  { key: APPLICATION_STATUS.SHORTLISTED, label: 'Rút gọn', fill: '#6366f1' },
  { key: APPLICATION_STATUS.INTERVIEW_SCHEDULED, label: 'Lịch PV', fill: '#3b82f6' },
  { key: APPLICATION_STATUS.INTERVIEWED, label: 'Đã PV', fill: '#0ea5e9' },
  { key: APPLICATION_STATUS.OFFERED, label: 'Đề nghị', fill: '#f59e0b' },
  { key: APPLICATION_STATUS.HIRED, label: 'Nhận việc', fill: '#22c55e' },
];

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Toàn thời gian' },
  { value: 'week', label: '7 ngày' },
  { value: 'month', label: '30 ngày' },
  { value: 'quarter', label: '90 ngày' },
];
const DAY_IN_MS = 86_400_000;

const TONE_STYLES = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    soft: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  blue: {
    icon: 'bg-blue-50 text-blue-700 ring-blue-100',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    soft: 'bg-blue-50',
    text: 'text-blue-700',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-700 ring-violet-100',
    badge: 'border-violet-200 bg-violet-50 text-violet-700',
    soft: 'bg-violet-50',
    text: 'text-violet-700',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    soft: 'bg-amber-50',
    text: 'text-amber-700',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
    soft: 'bg-slate-100',
    text: 'text-slate-700',
  },
};

const formatCompactNumber = (value) =>
  new Intl.NumberFormat('vi-VN', {
    notation: Number(value) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);

const formatRelative = (value) => {
  if (!value) return 'Mới cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Mới cập nhật';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes}m trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h trước`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? '1 ngày' : `${diffDays} ngày`;
};

const getCandidateName = (app) =>
  app?.candidate_name ||
  app?.candidateName ||
  app?.candidate?.full_name ||
  app?.candidate?.name ||
  'Ứng viên';

const getJobTitle = (item) => item?.jobTitle || item?.title || item?.job_title || 'Vai trò';

const getToneStyle = (tone) => TONE_STYLES[tone] || TONE_STYLES.emerald;

function DashboardSection({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  children,
  className = '',
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200/70 hover:shadow-md sm:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-1 text-base font-bold text-slate-950">{title}</h2>
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

function SidebarSection({ eyebrow, title, description, action, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="mt-2 text-[1.35rem] font-bold tracking-tight text-slate-950">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SignalListItem({ item }) {
  const score = Number(item.score ?? 0);
  const scoreClass =
    score >= 90
      ? 'text-emerald-700'
      : score >= 75
        ? 'text-blue-700'
        : score >= 60
          ? 'text-amber-700'
          : 'text-slate-500';

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
        <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-600">
          {getCandidateName(item)
            .split(/\s+/)
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'UV'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{getCandidateName(item)}</p>
            <p className="truncate text-sm text-slate-500">{getJobTitle(item)}</p>
          </div>
          <span className={`text-sm font-bold ${scoreClass}`}>{score}%</span>
        </div>
        <p className="mt-2 text-xs text-slate-400">{formatRelative(item.updated_at || item.created_at)}</p>
      </div>
    </div>
  );
}

function GuideLinkRow({ icon: Icon, label, helper, value, to, tone = 'emerald' }) {
  const toneStyle = getToneStyle(tone);

  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-sm"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${toneStyle.icon}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          {value ? <span className={`text-sm font-bold ${toneStyle.text}`}>{value}</span> : null}
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>
      </div>
      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
    </Link>
  );
}

const EmployerDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobsRes = await jobService.getMyJobs().catch(() => ({ data: { data: [] } }));
        const jobsData = Array.isArray(jobsRes.data?.data) ? jobsRes.data.data : [];
        setJobs(jobsData);

        if (!jobsData.length) {
          setApplications([]);
          return;
        }

        const appResponses = await Promise.all(
          jobsData.map((job) =>
            applicationService.getJobApplications(job.id).catch(() => ({ data: { data: [] } }))
          )
        );

        const merged = appResponses.flatMap((response, index) => {
          const job = jobsData[index];
          const list = Array.isArray(response.data?.data) ? response.data.data : [];
          return list.map((app) => ({
            ...app,
            status: normalizeApplicationStatus(app?.status),
            jobTitle: job?.title || app?.jobTitle || 'Vai trò',
            jobId: job?.id || app?.job_id,
          }));
        });

        setApplications(merged);
      } catch (error) {
        console.error('Failed to fetch employer dashboard', error);
      }
    };

    fetchData();
  }, []);

  const filteredApplications = useMemo(() => {
    if (period === 'all') return applications;

    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * DAY_IN_MS);

    return applications.filter((item) => {
      const rawDate = item.created_at || item.updated_at;
      const date = new Date(rawDate);
      return !Number.isNaN(date.getTime()) && date >= cutoff;
    });
  }, [applications, period]);

  const publishedJobs = jobs.filter((item) => item.status === 'published').length;
  const reviewJobs = jobs.filter((item) => item.status === 'pending_review').length;
  const draftJobs = jobs.filter((item) => item.status === 'draft').length;
  const interviewCount = filteredApplications.filter((item) =>
    INTERVIEW_APPLICATION_STATUSES.has(item.status)
  ).length;
  const offerCount = filteredApplications.filter(
    (item) => item.status === APPLICATION_STATUS.OFFERED
  ).length;
  const hiredCount = filteredApplications.filter(
    (item) => item.status === APPLICATION_STATUS.HIRED
  ).length;
  const pendingCount = filteredApplications.filter(
    (item) => item.status === APPLICATION_STATUS.SUBMITTED
  ).length;
  const totalProfiles = filteredApplications.length;

  const averageScreeningScore = totalProfiles
    ? Math.round(
      filteredApplications.reduce(
        (sum, item) => sum + Number(item.score ?? 76),
        0
      ) / totalProfiles
    )
    : 78;

  const priorityCount = filteredApplications.filter(
    (item) => Number(item.score ?? 0) >= 80
  ).length;

  const priorityRate = totalProfiles ? Math.round((priorityCount / totalProfiles) * 100) : 0;
  const pipelinePercent = totalProfiles ? Math.min(95, averageScreeningScore + 7) : 85;

  const jobsWithoutApplicants = useMemo(
    () =>
      jobs.filter(
        (job) => !applications.some((item) => String(item.jobId) === String(job.id))
      ).length,
    [jobs, applications]
  );

  const latestActivityAt = useMemo(() => {
    const timestamps = filteredApplications
      .map((item) => new Date(item.updated_at || item.created_at || 0).getTime())
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps)).toISOString();
  }, [filteredApplications]);

  const funnelChartData = useMemo(
    () =>
      FUNNEL_STAGES.map((stage) => ({
        key: stage.key,
        name: stage.label,
        value: filteredApplications.filter((item) => item.status === stage.key).length,
        fill: stage.fill,
      })),
    [filteredApplications]
  );

  const trendChartData = useMemo(() => {
    const source = filteredApplications;
    const bucketCount = 6;
    const now = new Date();

    let rangeDays =
      period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 180;
    if (period === 'all' && source.length) {
      const validDates = source
        .map((item) => new Date(item.created_at || item.updated_at || 0).getTime())
        .filter((value) => Number.isFinite(value) && value > 0);
      if (validDates.length) {
        const earliest = Math.min(...validDates);
        rangeDays = Math.max(30, Math.ceil((now.getTime() - earliest) / DAY_IN_MS));
      }
    }

    const start = new Date(now.getTime() - rangeDays * DAY_IN_MS);
    const totalMs = Math.max(1, now.getTime() - start.getTime());
    const bucketMs = totalMs / bucketCount;
    const formatter = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });

    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const bucketEnd = new Date(start.getTime() + bucketMs * (index + 1));
      return {
        label: formatter.format(bucketEnd),
        profiles: 0,
        highMatch: 0,
        interviews: 0,
      };
    });

    source.forEach((item) => {
      const timestamp = new Date(item.created_at || item.updated_at || 0).getTime();
      if (!Number.isFinite(timestamp) || timestamp < start.getTime() || timestamp > now.getTime()) {
        return;
      }

      const index = Math.min(
        bucketCount - 1,
        Math.max(0, Math.floor((timestamp - start.getTime()) / bucketMs))
      );

      buckets[index].profiles += 1;
      if (Number(item.score ?? 0) >= 80) {
        buckets[index].highMatch += 1;
      }
      if (INTERVIEW_APPLICATION_STATUSES.has(item.status)) {
        buckets[index].interviews += 1;
      }
    });

    return buckets;
  }, [filteredApplications, period]);

  const pipelineDistribution = useMemo(() => {
    const total = jobs.length || 15;
    const byDepartment = jobs.reduce((acc, item) => {
      const department = item.department || item.category || 'Khác';
      acc[department] = (acc[department] || 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(byDepartment);

    if (!entries.length) {
      return [
        { name: 'IT', value: Math.round(total * 0.65), fill: '#10b981' },
        { name: 'Sales', value: Math.round(total * 0.25), fill: '#3b82f6' },
        {
          name: 'Khác',
          value: total - Math.round(total * 0.65) - Math.round(total * 0.25),
          fill: '#94a3b8',
        },
      ].filter((item) => item.value > 0);
    }

    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#94a3b8'];
    return entries.map(([name, value], index) => ({
      name,
      value,
      fill: colors[index % colors.length],
    }));
  }, [jobs]);

  const recentMatches = useMemo(
    () =>
      [...filteredApplications]
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at || 0) -
            new Date(a.updated_at || a.created_at || 0)
        )
        .slice(0, 5)
        .map((item, index) => ({
          ...item,
          score: Number(item.score ?? 98 - index * 3),
        })),
    [filteredApplications]
  );

  const topJobsWithStats = useMemo(
    () =>
      jobs.slice(0, 6).map((job) => {
        const jobApplications = applications.filter((item) => String(item.jobId) === String(job.id));
        const highMatch = jobApplications.filter(
          (item) => Number(item.score ?? 0) >= 80
        ).length;

        return {
          ...job,
          applicants: jobApplications.length,
          highMatch,
          matchRate: jobApplications.length
            ? Math.round((highMatch / jobApplications.length) * 100)
            : 0,
          statusLabel: job.status === 'published' ? 'Đang mở' : 'Cần chú ý',
        };
      }),
    [jobs, applications]
  );

  const spotlightMatch = recentMatches[0] || null;
  const distributionTotal = pipelineDistribution.reduce((sum, item) => sum + item.value, 0) || 1;
  const lastTrendPoint = trendChartData[trendChartData.length - 1] || {
    profiles: 0,
    highMatch: 0,
    interviews: 0,
  };
  const previousTrendPoint = trendChartData[trendChartData.length - 2] || {
    profiles: 0,
    highMatch: 0,
    interviews: 0,
  };
  const trendDelta = lastTrendPoint.profiles - previousTrendPoint.profiles;

  const commandCenterStatus = useMemo(() => {
    if (!totalProfiles) {
      return {
        label: 'Chờ tín hiệu',
        tone: 'slate',
        summary:
          'Chưa có nhiều hồ sơ trong kỳ đang chọn. Bạn có thể mở thêm chiến dịch hoặc chủ động tìm ứng viên phù hợp.',
      };
    }

    if (reviewJobs > 0 || jobsWithoutApplicants > 0) {
      return {
        label: 'Cần tinh chỉnh',
        tone: 'amber',
        summary:
          'Một số chiến dịch đang thiếu nhịp đầu vào hoặc còn hồ sơ chờ xử lý. Nên ưu tiên rà soát và tin chưa phát sinh hồ sơ.',
      };
    }

    if (interviewCount > 0 || priorityRate >= 70) {
      return {
        label: 'Đang ổn định',
        tone: 'emerald',
        summary:
          'Quy trình đang có tín hiệu tốt và chất lượng hồ sơ tích cực. Phù hợp để đẩy nhanh phỏng vấn và chốt đề nghị tuyển dụng.',
      };
    }

    return {
      label: 'Đang mở rộng',
      tone: 'blue',
      summary:
        'Nguồn hồ sơ đang tăng nhưng cần thêm thời gian để chuyển đổi sang các vòng sâu hơn trong quy trình.',
    };
  }, [priorityRate, interviewCount, jobsWithoutApplicants, reviewJobs, totalProfiles]);

  const overviewStats = [
    {
      icon: Megaphone,
      label: 'Tuyển đang mở',
      value: formatCompactNumber(publishedJobs),
      helper: `${formatCompactNumber(jobs.length)} chiến dịch đang được quản lý trên bảng điều khiển.`,
      tone: 'emerald',
    },
    {
      icon: TrendingUp,
      label: 'Mức ưu tiên',
      value: `${priorityRate}%`,
      helper: `${formatCompactNumber(priorityCount)} hồ sơ nên xem trước.`,
      tone: 'violet',
    },
    {
      icon: Target,
      label: 'Cần chú ý',
      value: formatCompactNumber(reviewJobs + jobsWithoutApplicants),
      helper: `${jobsWithoutApplicants} tin chưa có hồ sơ, ${reviewJobs} tin đang chờ duyệt.`,
      tone: 'amber',
    },
  ];

  const summaryPills = [
    {
      icon: Target,
      label: 'Hồ sơ xử lý hiệu quả',
      value: `${pipelinePercent}%`,
      tone: 'emerald',
    },
    {
      icon: Workflow,
      label: 'Đợi tối ưu thêm',
      value: `${reviewJobs + jobsWithoutApplicants}`,
      tone: 'blue',
    },
  ];

  const commandBlocks = [
    {
      label: 'Theo dõi sâu',
      value: interviewCount + offerCount,
      helper:
        interviewCount + offerCount
          ? 'Ứng viên đã vào vòng phỏng vấn hoặc đề nghị tuyển dụng.'
          : 'Chưa phát sinh hồ sơ ở vòng sâu hơn.',
    },
    {
      label: 'Đề nghị & đã tuyển',
      value: offerCount + hiredCount,
      helper:
        offerCount + hiredCount
          ? 'Có tín hiệu chốt cuối ở một số chiến dịch.'
          : 'Chưa có hồ sơ tiến đến giai đoạn chốt cuối.',
    },
  ];

  const capacityRows = pipelineDistribution.slice(0, 4).map((item) => ({
    ...item,
    share: Math.round((item.value / distributionTotal) * 100),
  }));

  const guideRows = [
    {
      icon: Calendar,
      label: 'Phỏng vấn',
      helper:
        interviewCount + offerCount
          ? 'Khóa lịch và phản hồi nhanh cho các hồ sơ đã vào vòng sâu.'
          : 'Chưa có nhiều hồ sơ ở vòng phỏng vấn hoặc đề nghị tuyển dụng.',
      value: formatCompactNumber(interviewCount + offerCount),
      to: '/employer/interview-schedule',
      tone: interviewCount + offerCount ? 'blue' : 'slate',
    },
    {
      icon: Briefcase,
      label: 'Chiến dịch',
      helper:
        reviewJobs + jobsWithoutApplicants
          ? 'Rà lại tin chờ duyệt hoặc chưa có đầu vào để giữ nhịp quy trình.'
          : 'Các chiến dịch hiện tại đang được duy trì tương đối ổn định.',
      value: formatCompactNumber(reviewJobs + jobsWithoutApplicants),
      to: '/employer/jobs',
      tone: reviewJobs + jobsWithoutApplicants ? 'amber' : 'emerald',
    },
  ];

  const companyName = user?.company_name || user?.companyName || 'Doanh nghiệp của bạn';
  const currentPeriodLabel =
    PERIOD_OPTIONS.find((item) => item.value === period)?.label || '30 ngày';
  const commandTone = getToneStyle(commandCenterStatus.tone);
  const activeCampaignShare = jobs.length ? Math.round((publishedJobs / jobs.length) * 100) : 0;

  return (
    <div className="pb-12 pt-2 animate-fade-in">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#f8fffc_0%,#f4f8ff_48%,#ffffff_100%)] p-6 shadow-sm sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-70" />
            <div className="pointer-events-none absolute -top-24 right-8 h-64 w-64 rounded-full bg-emerald-100/70 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-20 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />

            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Trung tâm điều phối tuyển dụng
                </Badge>
                <Badge className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                  {currentPeriodLabel}
                </Badge>
              </div>

              <div className="max-w-4xl space-y-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-[3rem] sm:leading-[1.08]">
                  Trung tâm điều phối tuyển dụng cho{' '}
                  <span className="text-emerald-600">{companyName}</span>
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600">
                  Theo dõi toàn bộ nhịp hồ sơ, tín hiệu AI và chuyển đổi trong cùng một bảng điều khiển
                  nhà tuyển dụng thống nhất với bố cục hồ sơ công ty, dễ quét nhanh và dễ mở rộng về sau.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {summaryPills.map((item) => {
                  const toneStyle = getToneStyle(item.tone);
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/85 px-4 py-2 text-sm shadow-sm"
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-inset ${toneStyle.icon}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-slate-600">{item.label}:</span>
                      <span className="font-bold text-slate-950">{item.value}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  <Link to="/employer/jobs/post">
                    <Plus className="mr-2 h-4 w-4" />
                    Đăng tin mới
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-lg border-slate-200 bg-white/85 px-5 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-white hover:text-emerald-700"
                >
                  <Link to="/employer/reports">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Báo cáo
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-lg border-slate-200 bg-white/85 px-5 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-white hover:text-emerald-700"
                >
                  <Link to="/employer/search-candidates">
                    <Search className="mr-2 h-4 w-4" />
                    Tìm ứng viên
                  </Link>
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur">
                <div className="grid gap-px bg-slate-200/70 md:grid-cols-2 xl:grid-cols-4">
                  {overviewStats.map((item) => (
                    <EmployerStatCard key={item.label} {...item} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <DashboardSection
            icon={BarChart3}
            eyebrow="Trung tâm phân tích"
            title="Nhịp tuyển dụng và chuyển đổi"
            description="Tập trung các tín hiệu chính của quy trình vào một khu vực lớn, dễ quét nhanh hơn và giảm cảm giác thẻ vụn."
            action={
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-10 w-[160px] rounded-lg border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                  <SelectValue placeholder="Chọn kỳ" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white">
                  {PERIOD_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="text-sm font-semibold">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            <div className="rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Hồ sơ và nhóm phù hợp cao
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-950">
                    Xu hướng hồ sơ vào hệ thống
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {trendChartData.length} mốc
                  </Badge>
                  <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {formatCompactNumber(priorityCount)} hồ sơ ưu tiên
                  </Badge>
                </div>
              </div>

              <div className="mt-5 h-[340px] min-h-[260px] w-full">
                <ChartSurface className="h-full" minChartHeight={260}>
                  <AreaChart data={trendChartData} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardProfilesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
                      </linearGradient>
                      <linearGradient id="dashboardHighMatchFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={CHART_MUTED_TICK_STYLE}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                      tick={CHART_MUTED_TICK_STYLE}
                    />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="profiles"
                      name="Hồ sơ"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#dashboardProfilesFill)"
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="highMatch"
                      name="Phù hợp tốt"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#dashboardHighMatchFill)"
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }}
                    />
                  </AreaChart>
                </ChartSurface>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Nhịp mới nhất
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {formatCompactNumber(lastTrendPoint.profiles)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {trendDelta >= 0 ? '+' : ''}
                    {trendDelta} hồ sơ so với mốc liền trước.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Match nổi bật
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {formatCompactNumber(lastTrendPoint.highMatch)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Hồ sơ phù hợp tốt xuất hiện ở nhịp gần nhất.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Phỏng vấn phát sinh
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {formatCompactNumber(lastTrendPoint.interviews)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Hồ sơ đã đi sâu vào vòng trao đổi trong cùng nhịp.
                  </p>
                </div>
              </div>
            </div>
          </DashboardSection>

          <DashboardSection
            icon={Briefcase}
            eyebrow="Điều phối"
            title="Hiệu suất chiến dịch tuyển dụng"
            description="Danh sách vị trí trọng tâm với số hồ sơ, chất lượng và thao tác điều phối nhanh ngay trên một khu vực lớn."
            action={
              <Button
                asChild
                variant="ghost"
                className="h-10 rounded-lg px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                <Link to="/employer/jobs">Quản lý tất cả</Link>
              </Button>
            }
          >
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Tổng vị trí
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{formatCompactNumber(jobs.length)}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Số chiến dịch đang được quản lý.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Hồ sơ toàn bảng
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {formatCompactNumber(applications.length)}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Toàn bộ hồ sơ lấy từ các chiến dịch hiện có.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Tin đang mở
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {formatCompactNumber(publishedJobs)}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Các vị trí đang nhận hồ sơ từ ứng viên.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Phù hợp cao
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{priorityRate}%</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Tỷ trọng hồ sơ đạt mức phù hợp nổi bật.</p>
              </div>
            </div>

            <div className="mt-6 data-table-shell overflow-hidden rounded-lg border border-slate-200 shadow-none">
              <div className="data-table-scroll">
                <table className="data-table text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Vị trí tuyển dụng
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Hồ sơ
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Chất lượng
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Trạng thái
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topJobsWithStats.map((job) => (
                      <tr key={job.id} className="group">
                        <td className="px-4 py-5">
                          <div className="min-w-[220px]">
                            <p className="font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
                              {job.title || 'Vị trí'}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {job.location || 'Từ xa'} • {job.employment_type || 'Toàn thời gian'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <div>
                            <p className="text-lg font-bold text-slate-950">{job.applicants}</p>
                            <p className="text-sm text-slate-500">
                              {job.applicants ? 'đã vào quy trình' : 'chưa phát sinh'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <div className="min-w-[180px]">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-slate-700">
                                {job.highMatch} hồ sơ ưu tiên
                              </span>
                              <span className="text-sm font-bold text-emerald-700">{job.matchRate}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${job.matchRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <Badge
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${job.statusLabel === 'Đang mở'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                              }`}
                          >
                            {job.statusLabel}
                          </Badge>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              asChild
                              variant="outline"
                              className="h-9 rounded-lg border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                            >
                              <Link to={`/employer/jobs/${job.id}/edit`}>
                                <Settings className="mr-2 h-4 w-4" />
                                Sửa tin
                              </Link>
                            </Button>
                            <Button
                              asChild
                              className="h-9 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-emerald-600"
                            >
                              <Link to={`/employer/applications?jobId=${job.id}`}>
                                Xem quy trình
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {topJobsWithStats.length === 0 && (
                  <div className="py-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                      <Briefcase className="h-7 w-7 text-slate-300" />
                    </div>
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Chưa có chiến dịch tuyển dụng nào
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Bắt đầu bằng một tin tuyển dụng mới để bảng điều khiển có thêm dữ liệu vận hành.
                    </p>
                    <Button
                      asChild
                      className="mt-5 h-10 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <Link to="/employer/jobs/post">Đăng tin ngay</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DashboardSection>
        </div>

        <div className="space-y-6 self-start xl:sticky xl:top-24">
          <section className="overflow-hidden rounded-lg border border-slate-900 bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Trung tâm điều phối
                </p>
                <h2 className="mt-2 text-[2rem] font-bold leading-none text-white">
                  Bức tranh hiện tại
                </h2>
              </div>
              <span className="rounded-full border border-white/20 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                {currentPeriodLabel}
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Sức khỏe quy trình
                  </p>
                  <p className="mt-2 text-5xl font-bold text-white">{pipelinePercent}%</p>
                </div>
                <div className="text-right text-sm text-slate-300">
                  <p>{formatCompactNumber(priorityCount)} ưu tiên cao</p>
                  <p className="mt-1 inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatRelative(latestActivityAt)}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${commandTone.soft}`}
                  style={{ width: `${pipelinePercent}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {commandBlocks.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.helper}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Gợi ý hành động
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{commandCenterStatus.summary}</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-lg border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white hover:text-slate-950"
              >
                <Link to="/employer/jobs">
                  Quản lý chiến dịch
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          <SidebarSection
            eyebrow="Tín hiệu AI"
            title="Ứng viên có tín hiệu AI"
            action={
              <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {formatCompactNumber(recentMatches.length)}
              </Badge>
            }
          >
            {spotlightMatch ? (
              <div className="rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                    <AvatarFallback className="bg-slate-100 text-sm font-bold text-slate-700">
                      {getCandidateName(spotlightMatch)
                        .split(/\s+/)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'UV'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-slate-950">
                          {getCandidateName(spotlightMatch)}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {getJobTitle(spotlightMatch)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-emerald-700">
                        {spotlightMatch.score}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatRelative(spotlightMatch.updated_at || spotlightMatch.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">Chưa có tín hiệu AI mới</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Khi AI cập nhật chấm điểm hoặc hồ sơ mới xuất hiện, khu vực này sẽ phản ánh ngay.
                </p>
              </div>
            )}

            <div className="mt-4 space-y-3">
              {recentMatches.slice(1).map((item, index) => (
                <SignalListItem key={item.id || index} item={item} />
              ))}
            </div>
          </SidebarSection>

          <SidebarSection
            eyebrow="Sức tải"
            title="Năng lực vận hành"
            description="Tóm tắt sức tải chiến dịch và phân bổ vị trí đang chiếm trọng tâm tuyển dụng."
          >
            <div className="rounded-xl border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_90%)] p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-3xl font-bold text-white">
                  {publishedJobs}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">đang mở</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {activeCampaignShare}% chiến dịch hiện ở trạng thái nhận hồ sơ.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Phỏng vấn
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{interviewCount}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Ứng viên đã vào vòng sâu.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {capacityRows.map((item) => (
                <div key={item.name} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-950">{item.share}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.fill, width: `${item.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection
            eyebrow="Gợi ý hành động"
            title="Điểm cần ưu tiên"
            description="Những việc nên xử lý trước để giữ nhịp tuyển dụng rõ ràng và không bị nghẽn."
          >
            <div className="space-y-3">
              {guideRows.map((item) => (
                <GuideLinkRow key={item.label} {...item} />
              ))}
            </div>
          </SidebarSection>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
