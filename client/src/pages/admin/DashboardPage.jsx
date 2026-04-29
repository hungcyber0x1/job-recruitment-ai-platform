import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Flag,
  Globe2,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import ChartSurface, {
  CHART_MUTED_TICK_STYLE,
  CHART_TICK_STYLE,
  CHART_TOOLTIP_STYLE,
} from '@/components/charts/ChartSurface';
import adminService from '../../services/adminService';
import { cn } from '../../utils';
import {
  AdminActivityFeed,
  AdminChartPanel,
  AdminQuickLinks,
  AdminStatCard,
} from '../../components/admin';

const EMPTY_STATS = {
  users: 0,
  jobs: 0,
  applications: 0,
  companies: 0,
  publishedJobs: 0,
  verifiedCompanies: 0,
  rejectedJobs: 0,
  closedJobs: 0,
  tickets: 0,
  blogPosts: 0,
  candidateAccounts: 0,
  recruiterAccounts: 0,
  adminAccounts: 0,
  lockedAccounts: 0,
  unverifiedCompanies: 0,
  pendingJobApprovals: 0,
  taxonomy: {
    totalSkills: 0,
    totalIndustries: 0,
    totalLocations: 0,
  },
  topSkills: [],
  topIndustries: [],
  topLocations: [],
  aiStats: {
    spamDetected: 0,
    flaggedAccounts: 0,
    chatbotConversations: 0,
  },
  moderation: {
    pendingJobs: 0,
    flaggedJobs: 0,
    unverifiedCompanies: 0,
    flaggedCompanies: 0,
    pendingBlogs: 0,
    flaggedBlogs: 0,
  },
  pipeline: {
    submitted: 0,
    screening: 0,
    interviewing: 0,
    hired: 0,
    rejected: 0,
  },
  conversion: {
    submittedToScreening: 0,
    screeningToInterview: 0,
    interviewToHired: 0,
    submittedToHired: 0,
  },
  userDistribution: [],
};

const EMPTY_HEALTH = {
  service: 'gateway-server',
  status: 'unknown',
  database: 'unknown',
  architecture: 'monolith',
  timestamp: '',
};

const ROLE_META = {
  candidate: { label: 'Ứng viên', color: '#10b981' },
  recruiter: { label: 'Nhà tuyển dụng', color: '#3b82f6' },
  employer: { label: 'Nhà tuyển dụng', color: '#3b82f6' },
  admin: { label: 'Quản trị viên', color: '#64748b' },
};

const STATUS_META = {
  healthy: {
    label: 'Ổn định',
    pill: 'border-emerald-200/80 bg-emerald-50/90 text-emerald-700',
    dot: 'bg-emerald-500',
    ring: '#10b981',
  },
  monitoring: {
    label: 'Đang theo dõi',
    pill: 'border-amber-200/80 bg-amber-50/90 text-amber-700',
    dot: 'bg-amber-500',
    ring: '#f59e0b',
  },
  degraded: {
    label: 'Cần rà soát',
    pill: 'border-rose-200/80 bg-rose-50/90 text-rose-700',
    dot: 'bg-rose-500',
    ring: '#f43f5e',
  },
  unknown: {
    label: 'Chưa có tín hiệu',
    pill: 'border-slate-200/80 bg-slate-50/90 text-slate-600',
    dot: 'bg-slate-400',
    ring: '#94a3b8',
  },
};

const toNumber = (value) => Number(value) || 0;

const formatNumber = (value) => toNumber(value).toLocaleString('vi-VN');

const formatPercent = (value) => `${Math.round(toNumber(value))}%`;

const ratioToPercent = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

const normalizeHealthStatus = (status) => {
  if (status === 'ok') return 'healthy';
  if (status === 'degraded') return 'monitoring';
  if (status === 'error') return 'degraded';
  return 'unknown';
};

const formatSnapshotTime = (value) => {
  if (!value) return 'Đang cập nhật';

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Đang cập nhật';

    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  } catch {
    return 'Đang cập nhật';
  }
};

const normalizeRankingItems = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      name: item?.name || 'Chưa đặt tên',
      count: toNumber(item?.count ?? item?.value),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

const sanitizeStats = (data) => {
  if (!data || typeof data !== 'object') return EMPTY_STATS;

  const submitted = toNumber(data?.pipeline?.submitted ?? data?.pipeline?.pending);
  const screening = toNumber(data?.pipeline?.screening);
  const interviewing =
    toNumber(data?.pipeline?.interviewing) ||
    toNumber(data?.pipeline?.interview_scheduled) +
    toNumber(data?.pipeline?.interviewed) +
    toNumber(data?.pipeline?.offered);
  const hired = toNumber(data?.pipeline?.hired);
  const rejected = toNumber(data?.pipeline?.rejected);

  return {
    ...EMPTY_STATS,
    users: toNumber(data.users),
    jobs: toNumber(data.jobs),
    applications: toNumber(data.applications),
    companies: toNumber(data.companies),
    publishedJobs: toNumber(data.publishedJobs),
    verifiedCompanies: toNumber(data.verifiedCompanies),
    rejectedJobs: toNumber(data.rejectedJobs),
    closedJobs: toNumber(data.closedJobs),
    tickets: toNumber(data.tickets),
    blogPosts: toNumber(data.blogPosts),
    candidateAccounts: toNumber(data.candidateAccounts),
    recruiterAccounts: toNumber(data.recruiterAccounts),
    adminAccounts: toNumber(data.adminAccounts),
    lockedAccounts: toNumber(data.lockedAccounts),
    userDistribution: Array.isArray(data.userDistribution) ? data.userDistribution : [],
    unverifiedCompanies: toNumber(data.unverifiedCompanies),
    pendingJobApprovals: toNumber(data.pendingJobApprovals),
    moderation: {
      pendingJobs: toNumber(data?.moderation?.pendingJobs),
      flaggedJobs: toNumber(data?.moderation?.flaggedJobs),
      unverifiedCompanies: toNumber(data?.moderation?.unverifiedCompanies),
      flaggedCompanies: toNumber(data?.moderation?.flaggedCompanies),
      pendingBlogs: toNumber(data?.moderation?.pendingBlogs),
      flaggedBlogs: toNumber(data?.moderation?.flaggedBlogs),
    },
    pipeline: {
      submitted,
      screening,
      interviewing,
      hired,
      rejected,
    },
    conversion: {
      submittedToScreening:
        toNumber(data?.conversion?.submittedToScreening) || ratioToPercent(screening, submitted),
      screeningToInterview:
        toNumber(data?.conversion?.screeningToInterview) ||
        ratioToPercent(interviewing, screening),
      interviewToHired:
        toNumber(data?.conversion?.interviewToHired) || ratioToPercent(hired, interviewing),
      submittedToHired:
        toNumber(data?.conversion?.submittedToHired) || ratioToPercent(hired, submitted),
    },
    taxonomy: {
      totalSkills: toNumber(data?.taxonomy?.totalSkills),
      totalIndustries: toNumber(data?.taxonomy?.totalIndustries),
      totalLocations: toNumber(data?.taxonomy?.totalLocations),
    },
    topSkills: Array.isArray(data.topSkills) ? data.topSkills : [],
    topIndustries: Array.isArray(data.topIndustries) ? data.topIndustries : [],
    topLocations: Array.isArray(data.topLocations) ? data.topLocations : [],
    aiStats: {
      spamDetected: toNumber(data?.aiStats?.spamDetected),
      flaggedAccounts: toNumber(data?.aiStats?.flaggedAccounts),
      chatbotConversations: toNumber(data?.aiStats?.chatbotConversations),
    },
  };
};

const sanitizeHealth = (data) => {
  if (!data || typeof data !== 'object') return EMPTY_HEALTH;

  return {
    ...EMPTY_HEALTH,
    service: data.service || EMPTY_HEALTH.service,
    status: data.status || EMPTY_HEALTH.status,
    database: data.database || EMPTY_HEALTH.database,
    architecture: data.architecture || EMPTY_HEALTH.architecture,
    timestamp: data.timestamp || '',
  };
};

const StatusPill = ({ status, label }) => {
  const meta = STATUS_META[status] || STATUS_META.unknown;

  const body = (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
        meta.pill
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
      {label || meta.label}
    </span>
  );
};

const HeaderSignalChip = ({ icon: Icon, label, value, tone = 'slate', to, detail, loading = false }) => {
  const tones = {
    emerald: {
      surface: 'border-emerald-100 bg-emerald-50/80 text-emerald-900 hover:border-emerald-200 hover:bg-emerald-50',
      icon: 'bg-emerald-500 text-white',
    },
    amber: {
      surface: 'border-amber-100 bg-amber-50/80 text-amber-900 hover:border-amber-200 hover:bg-amber-50',
      icon: 'bg-amber-500 text-white',
    },
    rose: {
      surface: 'border-rose-100 bg-rose-50/80 text-rose-900 hover:border-rose-200 hover:bg-rose-50',
      icon: 'bg-rose-500 text-white',
    },
    slate: {
      surface: 'border-slate-200/80 bg-white/85 text-slate-900 hover:border-slate-300 hover:bg-white',
      icon: 'bg-slate-900 text-white',
    },
  };

  const scheme = tones[tone] || tones.slate;
  const resolvedValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <div
      className={cn(
        'relative inline-flex min-w-[148px] items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3 shadow-sm transition-all duration-200',
        scheme.surface
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-70', scheme.glow)} />
      <div className="relative flex items-center gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm', scheme.icon)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-current">
            {loading ? '—' : typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {detail ? <p className="mt-1 text-sm leading-6 text-slate-200/80">{detail}</p> : null}
        </div>
      </div>
    </div>
  );
};

const HeroMetricCard = HeaderSignalChip;

const PriorityCard = ({
  icon: Icon,
  title,
  value,
  helper,
  tone = 'amber',
  to,
  progress = 100,
  loading = false,
}) => {
  const tones = {
    amber: {
      icon: 'bg-amber-400/15 text-amber-50',
      bar: 'from-amber-300 via-amber-200 to-amber-100',
      border: 'border-white/10',
    },
    rose: {
      icon: 'bg-rose-400/15 text-rose-50',
      bar: 'from-rose-300 via-rose-200 to-rose-100',
      border: 'border-white/10',
    },
    emerald: {
      icon: 'bg-emerald-400/15 text-emerald-50',
      bar: 'from-emerald-300 via-emerald-200 to-emerald-100',
      border: 'border-white/10',
    },
  };

  const scheme = tones[tone] || tones.amber;
  const resolvedValue = typeof value === 'number' ? formatNumber(value) : value;
  const progressWidth = loading ? 38 : Math.min(100, Math.max(0, progress));
  const body = (
    <div
      className={cn(
        'rounded-2xl border bg-white/[0.05] px-4 py-3.5 transition-all duration-200',
        'hover:bg-white/[0.08]',
        scheme.border
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', scheme.icon)}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-300/80">{helper}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold tracking-tight text-white">{loading ? '—' : resolvedValue}</p>
          {to ? <ArrowRight className="h-4 w-4 text-white/50" /> : null}
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className={cn('h-full rounded-full bg-gradient-to-r', scheme.bar)} style={{ width: `${progressWidth}%` }} />
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {body}
      </Link>
    );
  }

  return body;
};

const HeroSummaryCard = ({ icon: Icon, label, value, helper }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300/70">{label}</p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-white">{value}</p>
        <p className="mt-1 text-xs leading-5 text-slate-300/75">{helper}</p>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/80">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  </div>
);

const SignalTile = ({ icon: Icon, label, value, helper, tone = 'slate' }) => {
  const tones = {
    emerald: {
      surface: 'border-slate-200/70 bg-white/90',
      icon: 'bg-emerald-50 text-emerald-700',
      value: 'text-slate-900',
    },
    blue: {
      surface: 'border-slate-200/70 bg-white/90',
      icon: 'bg-blue-50 text-blue-700',
      value: 'text-slate-900',
    },
    amber: {
      surface: 'border-slate-200/70 bg-white/90',
      icon: 'bg-amber-50 text-amber-700',
      value: 'text-slate-900',
    },
    rose: {
      surface: 'border-slate-200/70 bg-white/90',
      icon: 'bg-rose-50 text-rose-700',
      value: 'text-slate-900',
    },
    violet: {
      surface: 'border-slate-200/70 bg-white/90',
      icon: 'bg-violet-50 text-violet-700',
      value: 'text-slate-900',
    },
    slate: {
      surface: 'border-slate-200/70 bg-white/90',
      icon: 'bg-slate-100 text-slate-700',
      value: 'text-slate-700',
    },
  };

  const scheme = tones[tone] || tones.slate;

  return (
    <div className={cn('rounded-2xl border p-4 shadow-sm', scheme.surface)}>
      <div className="flex items-start gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm', scheme.icon)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className={cn('mt-2 text-2xl font-semibold tracking-tight', scheme.value)}>{value}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>
        </div>
      </div>
    </div>
  );
};

const RankingList = ({ title, subtitle, items, tone = 'emerald', emptyLabel }) => {
  const tones = {
    emerald: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      fill: 'bg-emerald-500',
      track: 'bg-emerald-100',
    },
    blue: {
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      fill: 'bg-blue-500',
      track: 'bg-blue-100',
    },
    amber: {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      fill: 'bg-amber-500',
      track: 'bg-amber-100',
    },
  };

  const scheme = tones[tone] || tones.emerald;
  const safeItems = items.slice(0, 5);
  const maxValue = Math.max(...safeItems.map((item) => item.count), 1);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>

      {safeItems.length > 0 ? (
        <div className="space-y-3">
          {safeItems.map((item, index) => {
            const width = Math.max(14, Math.round((item.count / maxValue) * 100));

            return (
              <div key={`${item.name}-${index}`} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                        scheme.badge
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatNumber(item.count)}</span>
                </div>
                <div className={cn('h-1.5 overflow-hidden rounded-full', scheme.track)}>
                  <div className={cn('h-full rounded-full', scheme.fill)} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-500">
          {emptyLabel}
        </div>
      )}
    </div>
  );
};

const DashboardPage = () => {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [chartData, setChartData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [health, setHealth] = useState(EMPTY_HEALTH);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logRefTime, setLogRefTime] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        const [statsResult, chartResult, healthResult] = await Promise.allSettled([
          adminService.getStats(),
          adminService.getChartStats(),
          adminService.getServiceHealth(),
        ]);

        if (!active) return;

        let nextStats = EMPTY_STATS;

        if (statsResult.status === 'fulfilled' && statsResult.value.data?.success) {
          nextStats = sanitizeStats(statsResult.value.data.data);
        }

        if (chartResult.status === 'fulfilled' && chartResult.value.data?.success) {
          const payload = chartResult.value.data.data || {};
          setChartData(Array.isArray(payload.weeklyActivity) ? payload.weeklyActivity : []);

          if (Array.isArray(payload.userDistribution)) {
            nextStats = {
              ...nextStats,
              userDistribution: payload.userDistribution,
            };
          }
        } else {
          setChartData([]);
        }

        if (healthResult.status === 'fulfilled') {
          setHealth(sanitizeHealth(healthResult.value.data));
        }

        setStats(nextStats);
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const fetchLogs = async () => {
      setLogsLoading(true);

      try {
        const response = await adminService
          .getLogs({ limit: 8 })
          .catch(() => ({ data: { success: false } }));

        if (!active) return;

        if (response.data?.success) {
          setLogs(Array.isArray(response.data.data) ? response.data.data : []);
        } else {
          setLogs([]);
        }
      } catch (error) {
        console.error('Dashboard logs fetch error:', error);
      } finally {
        if (active) {
          setLogRefTime(Date.now());
          setLogsLoading(false);
        }
      }
    };

    fetchDashboardData();
    fetchLogs();

    return () => {
      active = false;
    };
  }, []);

  const snapshotLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date()),
    []
  );

  const weeklyActivity = chartData.length
    ? chartData
    : [
      { name: 'T2', uv: 0, pv: 0 },
      { name: 'T3', uv: 0, pv: 0 },
      { name: 'T4', uv: 0, pv: 0 },
      { name: 'T5', uv: 0, pv: 0 },
      { name: 'T6', uv: 0, pv: 0 },
      { name: 'T7', uv: 0, pv: 0 },
      { name: 'CN', uv: 0, pv: 0 },
    ];

  const weeklySummary = useMemo(
    () =>
      weeklyActivity.reduce(
        (accumulator, item) => {
          const recruiter = toNumber(item.uv);
          const candidate = toNumber(item.pv);
          const total = recruiter + candidate;

          accumulator.recruiters += recruiter;
          accumulator.candidates += candidate;

          if (total > accumulator.peakTotal) {
            accumulator.peakTotal = total;
            accumulator.peakLabel = item.name;
          }

          return accumulator;
        },
        {
          recruiters: 0,
          candidates: 0,
          peakLabel: '—',
          peakTotal: 0,
        }
      ),
    [weeklyActivity]
  );

  const distributionData = useMemo(
    () =>
      (Array.isArray(stats.userDistribution) ? stats.userDistribution : [])
        .map((item) => {
          const role = String(item?.role || item?.name || '').trim().toLowerCase();
          const meta = ROLE_META[role] || {
            label: item?.name || 'Khác',
            color: '#94a3b8',
          };

          return {
            role,
            name: meta.label,
            value: toNumber(item?.value ?? item?.count),
            color: meta.color,
          };
        })
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value),
    [stats.userDistribution]
  );

  const topSkills = useMemo(() => normalizeRankingItems(stats.topSkills), [stats.topSkills]);
  const topIndustries = useMemo(() => normalizeRankingItems(stats.topIndustries), [stats.topIndustries]);
  const topLocations = useMemo(() => normalizeRankingItems(stats.topLocations), [stats.topLocations]);

  const distributionTotal = distributionData.reduce((sum, item) => sum + item.value, 0) || stats.users || 1;

  const pipelineData = [
    { label: 'Chờ duyệt', value: stats.pipeline.submitted, color: '#f59e0b' },
    { label: 'Sàng lọc', value: stats.pipeline.screening, color: '#3b82f6' },
    { label: 'Phỏng vấn', value: stats.pipeline.interviewing, color: '#8b5cf6' },
    { label: 'Tuyển dụng', value: stats.pipeline.hired, color: '#10b981' },
    { label: 'Từ chối', value: stats.pipeline.rejected, color: '#f43f5e' },
  ];

  const pipelineTotal = pipelineData.reduce((sum, item) => sum + item.value, 0);

  const moderationBreakdown = [
    {
      label: 'Tin chờ duyệt',
      axisLabel: 'Tin chờ duyệt',
      value: stats.moderation.pendingJobs,
      color: '#f59e0b',
    },
    {
      label: 'Tin gắn cờ',
      axisLabel: 'Tin gắn cờ',
      value: stats.moderation.flaggedJobs,
      color: '#fb7185',
    },
    {
      label: 'DN chờ xác minh',
      axisLabel: 'DN chờ xác minh',
      value: stats.moderation.unverifiedCompanies,
      color: '#38bdf8',
    },
    {
      label: 'DN gắn cờ',
      axisLabel: 'DN gắn cờ',
      value: stats.moderation.flaggedCompanies,
      color: '#f97316',
    },
    {
      label: 'Blog chờ duyệt',
      axisLabel: 'Blog chờ duyệt',
      value: stats.moderation.pendingBlogs,
      color: '#8b5cf6',
    },
    {
      label: 'Blog gắn cờ',
      axisLabel: 'Blog gắn cờ',
      value: stats.moderation.flaggedBlogs,
      color: '#e11d48',
    },
  ];

  const totalReviewQueue =
    stats.moderation.pendingJobs +
    stats.moderation.unverifiedCompanies +
    stats.moderation.pendingBlogs;
  const totalFlaggedItems =
    stats.moderation.flaggedJobs +
    stats.moderation.flaggedCompanies +
    stats.moderation.flaggedBlogs;
  const verificationRate = ratioToPercent(stats.verifiedCompanies, stats.companies);
  const publishedRate = ratioToPercent(stats.publishedJobs, stats.jobs);
  const lockRate = ratioToPercent(stats.lockedAccounts, stats.users);
  const moderationPressure = totalReviewQueue + totalFlaggedItems;
  const aiSignals = stats.aiStats.spamDetected + (stats.aiStats.flaggedAccounts || stats.lockedAccounts);

  const healthServices = [
    {
      id: 'gateway',
      label: 'API Gateway',
      detail: health.service || 'gateway-server',
      status: normalizeHealthStatus(health.status),
      icon: Activity,
    },
    {
      id: 'database',
      label: 'Cơ sở dữ liệu',
      detail: health.database === 'ok' ? 'Đã kết nối' : health.database || 'Đang chờ kiểm tra',
      status: health.database === 'ok' ? 'healthy' : health.database === 'unknown' ? 'unknown' : 'degraded',
      icon: Database,
    },
  ];

  const healthScore = ratioToPercent(
    healthServices.filter((service) => service.status === 'healthy').length,
    healthServices.length || 1
  );

  const systemState =
    totalFlaggedItems > 0
      ? 'degraded'
      : totalReviewQueue > 0 || healthScore < 100
        ? 'monitoring'
        : 'healthy';
  const systemMeta = STATUS_META[systemState] || STATUS_META.unknown;
  const systemMessage =
    systemState === 'degraded'
      ? 'Có mục cần rà soát ưu tiên cao.'
      : systemState === 'monitoring'
        ? 'Hệ thống ổn định nhưng vẫn còn hàng chờ vận hành.'
        : 'Hệ thống đang chạy ổn định và không có điểm nghẽn lớn.';

  const headerSignals = [
    {
      icon: Clock3,
      label: 'Chờ duyệt',
      value: loading ? '-' : formatNumber(totalReviewQueue),
      tone: 'amber',
      to: '/admin/moderation',
    },
    {
      icon: Flag,
      label: 'Cần rà soát',
      value: loading ? '-' : formatNumber(totalFlaggedItems),
      tone: 'rose',
      to: '/admin/moderation',
    },
    {
      icon: ShieldCheck,
      label: 'Hệ thống',
      value: loading ? 'Đang cập nhật' : systemMeta.label,
      tone: systemState === 'degraded' ? 'rose' : systemState === 'monitoring' ? 'amber' : 'emerald',
      to: '/admin/service-health',
    },
  ];

  const heroMetrics = [
    {
      icon: Users,
      label: 'Người dùng',
      value: stats.users,
      detail: `${formatNumber(stats.candidateAccounts)} ứng viên · ${formatNumber(stats.recruiterAccounts)} nhà tuyển dụng`,
      tone: 'emerald',
    },
    {
      icon: FileText,
      label: 'Tin đang hiển thị',
      value: stats.publishedJobs || stats.jobs,
      detail: `${formatNumber(stats.publishedJobs)} trong tổng số tin tuyển dụng`,
      tone: 'blue',
    },
    {
      icon: Workflow,
      label: 'Hồ sơ trong quy trình',
      value: stats.applications,
      detail: `${formatNumber(stats.pipeline.interviewing)} hồ sơ đang ở vòng phỏng vấn`,
      tone: 'violet',
    },
  ];

  const priorityCards = [
    {
      icon: Clock3,
      title: 'Hàng chờ kiểm duyệt',
      value: totalReviewQueue,
      helper: 'Tin tuyển dụng, doanh nghiệp và blog đang chờ phản hồi.',
      tone: 'amber',
      to: '/admin/moderation',
      progress: ratioToPercent(
        totalReviewQueue,
        stats.moderation.pendingJobs + stats.moderation.unverifiedCompanies + stats.moderation.pendingBlogs + 1
      ),
    },
    {
      icon: Flag,
      title: 'Mục cần rà soát',
      value: totalFlaggedItems,
      helper: 'Nội dung có tín hiệu rủi ro cần kiểm tra thủ công.',
      tone: 'rose',
      to: '/admin/moderation',
      progress: ratioToPercent(totalFlaggedItems, moderationPressure || 1),
    },
    {
      icon: ShieldCheck,
      title: 'Sức khỏe hệ thống',
      value: systemMeta.label,
      helper: 'Tổng hợp trạng thái cổng API, cơ sở dữ liệu và tài nguyên vận hành.',
      tone: 'emerald',
      to: '/admin/service-health',
    },
  ];

  const heroSummaryCards = [
    {
      icon: Building2,
      label: 'Xác minh DN',
      value: `${formatNumber(stats.verifiedCompanies)} / ${formatNumber(stats.companies)}`,
      helper: 'Doanh nghiệp đã được xác minh trên tổng số.',
    },
    {
      icon: Workflow,
      label: 'Đã được tuyển',
      value: formatNumber(stats.pipeline.hired),
      helper: 'Hồ sơ ứng viên đã chốt tuyển dụng thành công.',
    },
    {
      icon: Ticket,
      label: 'Hỗ trợ đang mở',
      value: formatNumber(stats.tickets),
      helper: 'Yêu cầu cần đội vận hành xử lý tiếp.',
    },
    {
      icon: Users,
      label: 'Tài khoản theo dõi',
      value: formatNumber(stats.lockedAccounts),
      helper: 'Số tài khoản đang ở trạng thái cảnh báo.',
    },
  ];

  const executiveCards = [
    {
      title: 'Tổng người dùng',
      value: loading ? '—' : formatNumber(stats.users),
      icon: Users,
      color: 'emerald',
      description: 'Quy mô toàn bộ hệ thống theo các nhóm tài khoản nghiệp vụ.',
      trendValue: `${formatNumber(stats.adminAccounts)} admin`,
      badge: `${formatNumber(stats.candidateAccounts)} UV · ${formatNumber(stats.recruiterAccounts)} NTD`,
    },
    {
      title: 'Tin tuyển dụng',
      value: loading ? '—' : formatNumber(stats.jobs),
      icon: FileText,
      color: 'blue',
      description: 'Theo dõi tổng tin đang live và khối lượng cần kiểm duyệt.',
      trendValue: `${formatNumber(stats.pendingJobApprovals)} chờ duyệt`,
      badge: `${formatNumber(stats.publishedJobs)} đang live`,
    },
    {
      title: 'Đơn ứng tuyển',
      value: loading ? '—' : formatNumber(stats.applications),
      icon: Workflow,
      color: 'violet',
      description: 'Phỏng vấn, sàng lọc và pipeline ứng tuyển.',
      trendValue: `${formatNumber(stats.pipeline.hired)} đã tuyển`,
      badge: `${formatNumber(stats.pipeline.interviewing)} phỏng vấn`,
    },
    {
      title: 'Khối lượng cần xử lý',
      value: loading ? '—' : formatNumber(moderationPressure),
      icon: AlertTriangle,
      color: 'amber',
      description: 'Tổng hợp review queue, mục gắn cờ và những điểm cần ưu tiên.',
      trendValue: `${formatNumber(totalFlaggedItems)} gắn cờ`,
      badge: `${formatNumber(totalReviewQueue)} chờ duyệt`,
    },
  ];

  const quickLinks = [
    {
      icon: Users,
      label: 'Quản lý người dùng',
      to: '/admin/users',
      color: 'emerald',
      description: 'Phân quyền, khóa mở và theo dõi tài khoản.',
      badge: `${formatNumber(stats.users)} tài khoản`,
    },
    {
      icon: Building2,
      label: 'Doanh nghiệp',
      to: '/admin/companies',
      color: 'blue',
      description: 'Xác minh hồ sơ công ty và năng lực nhà tuyển dụng.',
      badge: `${formatNumber(stats.unverifiedCompanies)} chờ xác minh`,
    },
    {
      icon: FileText,
      label: 'Tin tuyển dụng',
      to: '/admin/jobs',
      color: 'amber',
      description: 'Duyệt, gắn cờ và quản lý tình trạng đăng tuyển.',
      badge: `${formatNumber(stats.pendingJobApprovals)} chờ duyệt`,
    },
    {
      icon: Workflow,
      label: 'Ứng tuyển',
      to: '/admin/applications',
      color: 'violet',
      description: 'Theo dõi chuyển động pipeline của ứng viên.',
      badge: `${formatNumber(stats.pipeline.hired)} đã tuyển`,
    },
    {
      icon: Flag,
      label: 'Hàng đợi kiểm duyệt',
      to: '/admin/moderation',
      color: 'rose',
      description: 'Tập trung xử lý nội dung và đối tượng bị cảnh báo.',
      badge: `${formatNumber(moderationPressure)} mục`,
    },
    {
      icon: BookOpen,
      label: 'Blog & nội dung',
      to: '/admin/blog',
      color: 'red',
      description: 'Kiểm duyệt bài viết, nội dung public và banner.',
      badge: `${formatNumber(stats.moderation.pendingBlogs)} chờ duyệt`,
    },
    {
      icon: ShieldCheck,
      label: 'Sức khỏe hệ thống',
      to: '/admin/service-health',
      color: 'cyan',
      description: 'Xem trạng thái gateway, database và các dịch vụ.',
      badge: systemMeta.label,
    },
  ];

  const aiSignalCards = [
    {
      icon: Sparkles,
      label: 'Tín hiệu AI',
      value: formatNumber(aiSignals),
      helper: 'Tổng hợp spam, gắn cờ và kiểm soát chất lượng dữ liệu.',
      tone: 'amber',
    },
    {
      icon: BrainCircuit,
      label: 'Tương tác AI',
      value: formatNumber(stats.aiStats.chatbotConversations),
      helper: 'Số phiên AI đã được ghi nhận trên hệ thống.',
      tone: 'violet',
    },
    {
      icon: Ticket,
      label: 'Phiếu hỗ trợ',
      value: formatNumber(stats.tickets),
      helper: 'Yêu cầu mở đang chờ đội vận hành phản hồi.',
      tone: 'blue',
    },
    {
      icon: Globe2,
      label: 'Tin đang hiển thị',
      value: formatNumber(stats.publishedJobs),
      helper: `Trong tổng số ${formatNumber(stats.jobs)} tin tuyển dụng.`,
      tone: 'emerald',
    },
  ];

  const taxonomyHighlights = [
    {
      label: 'Kỹ năng',
      value: formatNumber(stats.taxonomy.totalSkills),
      helper: 'Tổng kỹ năng trong phân loại hệ thống',
    },
    {
      label: 'Ngành nghề',
      value: formatNumber(stats.taxonomy.totalIndustries),
      helper: 'Nhóm ngành đang hoạt động',
    },
    {
      label: 'Khu vực',
      value: formatNumber(stats.taxonomy.totalLocations),
      helper: 'Địa điểm đang được sử dụng',
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_48%,#f8fafc_100%)] pb-12 animate-fade-in">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,23,42,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.45) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="relative isolate overflow-hidden rounded-[28px] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_58%,rgba(236,253,245,0.92)_100%)] shadow-[0_24px_60px_-42px_rgba(15,23,42,0.38)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
          <div className="absolute -left-12 top-0 h-36 w-36 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-200/35 blur-3xl" />

          <div className="relative px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusPill status={systemState} />
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-sm">
                    <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                    {snapshotLabel}
                  </span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                    Bảng điều phối vận hành tuyển dụng
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span>{loading ? 'Đang tải snapshot vận hành...' : `${systemMessage} Cập nhật ${formatSnapshotTime(health.timestamp)}.`}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:items-end">
                <div className="flex flex-wrap gap-2.5">
                  {headerSignals.map((item) => (
                    <Link key={item.label} to={item.to} className="block">
                      <HeaderSignalChip icon={item.icon} label={item.label} value={item.value} tone={item.tone} />
                    </Link>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/admin/analytics"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Mở phân tích
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hidden relative isolate overflow-hidden rounded-[32px] border border-slate-900/10 bg-slate-950 shadow-[0_40px_110px_-48px_rgba(15,23,42,0.78)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_36%),linear-gradient(135deg,_#082434_0%,_#0f172a_58%,_#102234_100%)]" />
          <div className="absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-emerald-300/[0.12] blur-3xl" />
          <div className="absolute -right-8 top-0 h-60 w-60 rounded-full bg-blue-300/[0.1] blur-3xl" />

          <div className="relative px-5 py-6 sm:px-8 sm:py-8">
            <div className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,360px)]">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/[0.92] backdrop-blur-md">
                    <Activity className="h-3.5 w-3.5" />
                    Trung tâm điều hành admin
                  </span>
                  <StatusPill status={systemState} />
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/80">
                    <Clock3 className="h-3.5 w-3.5" />
                    {snapshotLabel}
                  </span>
                </div>

                <div className="max-w-3xl space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-emerald-100/65">
                      Bảng điều hành vận hành
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl xl:max-w-4xl xl:text-[2.65rem] xl:leading-[1.08]">
                      Trung tâm điều hành tuyển dụng rõ ưu tiên, gọn mạch bố cục và dễ đọc hơn cho vận hành hằng ngày.
                    </h1>
                  </div>
                  <p className="max-w-2xl text-sm leading-7 text-slate-200/[0.78] sm:text-base">
                    Gom lại các lớp thông tin quan trọng nhất của admin trong một luồng đọc mạch lạc: quy mô hệ thống,
                    hàng đợi kiểm duyệt, sức khỏe hệ thống, chuyển đổi và phân loại dữ liệu. Mục tiêu là đọc nhanh,
                    thao tác nhanh và không bị đứt mạch khi theo dõi vận hành.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {heroMetrics.map((item) => (
                    <HeroMetricCard
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      detail={item.detail}
                      tone={item.tone}
                      loading={loading}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/admin/analytics"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-200 hover:bg-slate-100"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Mở phân tích
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/admin/moderation"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.08] px-4 py-3 text-sm font-semibold text-white/[0.92] backdrop-blur-md transition-all duration-200 hover:bg-white/[0.12]"
                  >
                    <Flag className="h-4 w-4" />
                    Mở hàng đợi kiểm duyệt
                  </Link>
                  <span className="inline-flex items-center gap-2 text-sm text-slate-200/70">
                    <TrendingUp className="h-4 w-4 text-emerald-200" />
                    {loading ? 'Đang tải ảnh chụp vận hành...' : `${systemMessage} Cập nhật ${formatSnapshotTime(health.timestamp)}.`}
                  </span>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/[0.1] bg-white/[0.06] p-5 shadow-xl backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-300/70">
                      Ảnh chụp vận hành
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Ưu tiên vận hành</h2>
                  </div>
                  <div className="rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/[0.88]">
                    {loading ? 'Đang cập nhật' : `${healthScore}% điểm hệ thống`}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {priorityCards.map((item) => (
                    <PriorityCard
                      key={item.title}
                      icon={item.icon}
                      title={item.title}
                      value={item.value}
                      helper={item.helper}
                      tone={item.tone}
                      to={item.to}
                      progress={item.progress}
                      loading={loading}
                    />
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to="/admin/service-health"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white/85 transition-colors hover:bg-white/[0.1]"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Xem sức khỏe
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {heroSummaryCards.map((item) => (
                  <HeroSummaryCard
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    value={loading ? '—' : item.value}
                    helper={item.helper}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {executiveCards.map((card, index) => (
            <AdminStatCard key={card.title} delay={index * 60} {...card} />
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-12">
          <AdminChartPanel
            className="xl:col-span-8"
            title="Nhịp tăng trưởng hệ thống"
            subtitle="Hoạt động tham gia mới trong 7 ngày gần nhất"
            actionLabel="Mở phân tích"
            actionTo="/admin/analytics"
            loading={loading}
          >
            <div className="h-[320px] w-full">
              <ChartSurface className="h-full" minChartHeight={300}>
                <AreaChart data={weeklyActivity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminRecruiterArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="adminCandidateArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={CHART_MUTED_TICK_STYLE} />
                  <YAxis axisLine={false} tickLine={false} tick={CHART_MUTED_TICK_STYLE} width={40} />
                  <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area
                    type="monotone"
                    dataKey="uv"
                    name="Nhà tuyển dụng mới"
                    stroke="#10b981"
                    fill="url(#adminRecruiterArea)"
                    strokeWidth={2.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="pv"
                    name="Ứng viên mới"
                    stroke="#3b82f6"
                    fill="url(#adminCandidateArea)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ChartSurface>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Nhà tuyển dụng mới</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(weeklySummary.recruiters)}</p>
                <p className="mt-1 text-sm text-slate-500">Tổng phát sinh trong 7 ngày gần nhất.</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Ứng viên mới</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(weeklySummary.candidates)}</p>
                <p className="mt-1 text-sm text-slate-500">Nguồn cung hồ sơ mới đang vào hệ thống.</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Ngày cao điểm</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{weeklySummary.peakLabel}</p>
                <p className="mt-1 text-sm text-slate-500">{formatNumber(weeklySummary.peakTotal)} tài khoản mới được ghi nhận.</p>
              </div>
            </div>
          </AdminChartPanel>

          <div className="space-y-6 xl:col-span-4">
            <AdminChartPanel
              title="Sức khỏe hệ thống"
              subtitle="Trạng thái gateway và cơ sở dữ liệu"
              actionLabel="Xem sức khỏe"
              actionTo="/admin/service-health"
              loading={loading}
            >
              <div className="grid gap-5 lg:grid-cols-[140px,1fr]">
                <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full p-3"
                  style={{ background: `conic-gradient(${systemMeta.ring} ${healthScore}%, #e2e8f0 0)` }}
                >
                  <div className="flex h-[calc(100%-12px)] w-[calc(100%-12px)] flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Trạng thái</span>
                    <span className={cn('mt-1 text-sm font-semibold', systemMeta.dot.replace('bg-', 'text-'))}>{loading ? '—' : systemMeta.label}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {healthServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                          <service.icon className="h-4 w-4 text-slate-700" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{service.label}</p>
                          <p className="text-xs text-slate-500">{service.detail}</p>
                        </div>
                      </div>
                      <StatusPill status={service.status} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-600">
                <span className="font-semibold text-slate-900">Cập nhật cuối:</span> {formatSnapshotTime(health.timestamp)}.
                {` `}
                {systemMessage}
              </div>
            </AdminChartPanel>

            <AdminChartPanel
              title="Pipeline tuyển dụng"
              subtitle="Theo dõi luồng từ nộp đơn đến kết quả"
              actionLabel="Xem hồ sơ"
              actionTo="/admin/applications"
              loading={loading}
            >
              <div className="space-y-4">
                {pipelineData.map((item) => {
                  const percentage = ratioToPercent(item.value, pipelineTotal || 1);

                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{formatNumber(item.value)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </AdminChartPanel>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-12">
          <AdminChartPanel
            className="xl:col-span-5"
            title="Bảng điều phối kiểm duyệt"
            subtitle="Tập trung vào các cụm chờ duyệt và điểm cần rà soát"
            actionLabel="Mở kiểm duyệt"
            actionTo="/admin/moderation"
            loading={loading}
          >
            <div className="h-[290px] w-full">
              <ChartSurface className="h-full" minChartHeight={270}>
                <BarChart data={moderationBreakdown} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={CHART_MUTED_TICK_STYLE} />
                  <YAxis
                    dataKey="axisLabel"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={CHART_TICK_STYLE}
                    width={110}
                  />
                  <RechartsTooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value) => [formatNumber(value), 'Số mục']}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {moderationBreakdown.map((item) => (
                      <Cell key={item.label} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartSurface>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {moderationBreakdown.filter((item) => item.value > 0).length > 0 ? (
                moderationBreakdown
                  .filter((item) => item.value > 0)
                  .slice(0, 4)
                  .map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      {item.label}: {formatNumber(item.value)}
                    </span>
                  ))
              ) : (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  Hàng đợi kiểm duyệt đang trống và chưa có điểm nóng.
                </span>
              )}
            </div>
          </AdminChartPanel>

          <AdminChartPanel
            className="xl:col-span-3"
            title="Cơ cấu người dùng"
            subtitle="Phân bố ứng viên, nhà tuyển dụng và admin"
            actionLabel="Xem người dùng"
            actionTo="/admin/users"
            loading={loading}
          >
            <div className="grid gap-5">
              <div className="relative mx-auto h-[208px] w-full max-w-[208px]">
                <ChartSurface className="h-full" minChartHeight={208}>
                  <PieChart>
                    <Pie
                      data={
                        distributionData.length
                          ? distributionData
                          : [{ name: 'Chưa có dữ liệu', value: 1, color: '#e2e8f0' }]
                      }
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {(distributionData.length
                        ? distributionData
                        : [{ name: 'Chưa có dữ liệu', value: 1, color: '#e2e8f0' }]
                      ).map((entry, index) => (
                        <Cell key={`distribution-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ChartSurface>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Người dùng</span>
                  <span className="mt-2 text-[44px] font-semibold leading-none text-slate-900">
                    {formatNumber(stats.users)}
                  </span>
                  <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    Tài khoản
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {distributionData.length > 0 ? (
                  distributionData.map((item) => {
                    const share = ratioToPercent(item.value, distributionTotal);

                    return (
                      <div key={item.name} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.name}
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {formatNumber(item.value)}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-500">
                    Chưa có dữ liệu phân bố người dùng.
                  </div>
                )}
              </div>
            </div>
          </AdminChartPanel>

          <AdminChartPanel
            className="xl:col-span-4"
            title="AI & chất lượng dữ liệu"
            subtitle="Tín hiệu rủi ro, hỗ trợ và hiệu quả vận hành"
            loading={loading}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {aiSignalCards.map((item) => (
                <SignalTile
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  helper={item.helper}
                  tone={item.tone}
                />
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  icon: CheckCircle2,
                  title: 'Xác minh doanh nghiệp',
                  detail: `${formatNumber(stats.verifiedCompanies)} / ${formatNumber(stats.companies)} công ty đã được xác minh.`,
                  tone: 'border-slate-200 bg-white text-slate-700',
                },
                {
                  icon: AlertTriangle,
                  title: 'Áp lực kiểm duyệt',
                  detail: `${formatNumber(moderationPressure)} mục cần được xử lý hoặc theo dõi.`,
                  tone: 'border-slate-200 bg-white text-slate-700',
                },
                {
                  icon: ShieldCheck,
                  title: 'Tài khoản bị khóa',
                  detail: `${formatNumber(stats.lockedAccounts)} tài khoản đang ở trạng thái cảnh báo.`,
                  tone: 'border-slate-200 bg-white text-slate-700',
                },
              ].map((item) => (
                <div key={item.title} className={cn('rounded-2xl border px-4 py-3', item.tone)}>
                  <div className="flex items-start gap-3">
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 opacity-90">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminChartPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-12">
          <AdminChartPanel
            className="xl:col-span-8"
            title="Phân loại hệ thống"
            subtitle="Kiểm tra độ đầy đủ của kỹ năng, ngành và khu vực"
            actionLabel="Mở phân tích"
            actionTo="/admin/analytics"
            loading={loading}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {taxonomyHighlights.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              <RankingList
                title="Kỹ năng nổi bật"
                subtitle="Những kỹ năng được ghi nhận nhiều nhất"
                items={topSkills}
                tone="emerald"
                emptyLabel="Chưa có dữ liệu kỹ năng nổi bật."
              />
              <RankingList
                title="Ngành ưu tiên"
                subtitle="Nhóm doanh nghiệp đang xuất hiện nhiều"
                items={topIndustries}
                tone="blue"
                emptyLabel="Chưa có dữ liệu ngành."
              />
              <RankingList
                title="Thị trường địa lý"
                subtitle="Những khu vực có tần suất đăng tuyển cao"
                items={topLocations}
                tone="amber"
                emptyLabel="Chưa có dữ liệu khu vực."
              />
            </div>
          </AdminChartPanel>

          <AdminChartPanel
            className="xl:col-span-4"
            title="Launchpad quản trị"
            subtitle="Đường dẫn đến các thao tác cần mở nhanh"
          >
            <AdminQuickLinks links={quickLinks} className="xl:grid-cols-2" />
          </AdminChartPanel>
        </div>

        <AdminActivityFeed logs={logs} loading={logsLoading} nowTs={logRefTime} />
      </div>
    </div>
  );
};

export default DashboardPage;

