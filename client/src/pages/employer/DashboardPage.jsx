import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Megaphone,
  PieChart as PieChartIconLucide,
  Plus,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';

import ChartSurface, { CHART_TOOLTIP_STYLE } from '@/components/charts/ChartSurface';
import StatCard from '@/components/common/StatCard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils';
import {
  APPLICATION_STATUS,
  INTERVIEW_APPLICATION_STATUSES,
  normalizeApplicationStatus,
} from '../../constants/status';
import { useAuth } from '../../context/AuthContext';
import { applicationService, jobService } from '../../services';

const numberFormatter = new Intl.NumberFormat('vi-VN');

const TONE = {
  emerald: {
    soft: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    border: 'border-emerald-200',
    icon: 'bg-emerald-600 text-white shadow-emerald-500/25',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    gradient: 'from-emerald-500/15 via-emerald-50 to-white',
    chart: '#10b981',
  },
  sky: {
    soft: 'bg-sky-50 text-sky-700 ring-sky-100',
    border: 'border-sky-200',
    icon: 'bg-sky-600 text-white shadow-sky-500/25',
    bar: 'bg-sky-500',
    dot: 'bg-sky-500',
    text: 'text-sky-700',
    gradient: 'from-sky-500/15 via-sky-50 to-white',
    chart: '#0ea5e9',
  },
  blue: {
    soft: 'bg-blue-50 text-blue-700 ring-blue-100',
    border: 'border-blue-200',
    icon: 'bg-blue-600 text-white shadow-blue-500/25',
    bar: 'bg-blue-500',
    dot: 'bg-blue-500',
    text: 'text-blue-700',
    gradient: 'from-blue-500/15 via-blue-50 to-white',
    chart: '#3b82f6',
  },
  cyan: {
    soft: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    border: 'border-cyan-200',
    icon: 'bg-cyan-600 text-white shadow-cyan-500/25',
    bar: 'bg-cyan-500',
    dot: 'bg-cyan-500',
    text: 'text-cyan-700',
    gradient: 'from-cyan-500/15 via-cyan-50 to-white',
    chart: '#06b6d4',
  },
  amber: {
    soft: 'bg-amber-50 text-amber-700 ring-amber-100',
    border: 'border-amber-200',
    icon: 'bg-amber-500 text-white shadow-amber-500/25',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    gradient: 'from-amber-500/15 via-amber-50 to-white',
    chart: '#f59e0b',
  },
  violet: {
    soft: 'bg-violet-50 text-violet-700 ring-violet-100',
    border: 'border-violet-200',
    icon: 'bg-violet-600 text-white shadow-violet-500/25',
    bar: 'bg-violet-500',
    dot: 'bg-violet-500',
    text: 'text-violet-700',
    gradient: 'from-violet-500/15 via-violet-50 to-white',
    chart: '#8b5cf6',
  },
  rose: {
    soft: 'bg-rose-50 text-rose-700 ring-rose-100',
    border: 'border-rose-200',
    icon: 'bg-rose-500 text-white shadow-rose-500/25',
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    gradient: 'from-rose-500/15 via-rose-50 to-white',
    chart: '#f43f5e',
  },
  slate: {
    soft: 'bg-slate-50 text-slate-700 ring-slate-100',
    border: 'border-slate-200',
    icon: 'bg-slate-900 text-white shadow-slate-500/25',
    bar: 'bg-slate-400',
    dot: 'bg-slate-400',
    text: 'text-slate-700',
    gradient: 'from-slate-400/15 via-slate-50 to-white',
    chart: '#64748b',
  },
};

const FUNNEL_STAGES = [
  { key: APPLICATION_STATUS.SUBMITTED, label: 'Đã nộp', tone: 'amber' },
  { key: APPLICATION_STATUS.SHORTLISTED, label: 'Rút gọn', tone: 'violet' },
  { key: APPLICATION_STATUS.INTERVIEW_SCHEDULED, label: 'Lịch PV', tone: 'blue' },
  { key: APPLICATION_STATUS.INTERVIEWED, label: 'Đã PV', tone: 'cyan' },
  { key: APPLICATION_STATUS.OFFERED, label: 'Đề nghị', tone: 'amber' },
  { key: APPLICATION_STATUS.HIRED, label: 'Nhận việc', tone: 'emerald' },
  { key: APPLICATION_STATUS.REJECTED, label: 'Từ chối', tone: 'rose' },
];

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Toàn thời gian' },
  { value: 'week', label: '7 ngày' },
  { value: 'month', label: '30 ngày' },
  { value: 'quarter', label: '90 ngày' },
];

const DAY_IN_MS = 86_400_000;

const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const formatNumber = (value) => numberFormatter.format(toNumber(value));

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

const getToneStyle = (tone) => TONE[tone] || TONE.emerald;

const getInitials = (name) =>
  String(name || 'UV')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'UV';

const SectionCard = ({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  eyebrow,
  compact = false,
}) => (
  <section
    className={cn(
      'rounded-[1.75rem] border border-white/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 backdrop-blur',
      compact ? 'p-4' : 'p-5',
      className
    )}
  >
    <div className={cn('flex items-start justify-between gap-4', compact ? 'mb-3' : 'mb-4')}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div
            className={cn(
              'flex shrink-0 items-center justify-center bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100',
              compact ? 'h-9 w-9 rounded-xl' : 'h-11 w-11 rounded-2xl'
            )}
          >
            <Icon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
          </div>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p
              className={cn(
                'mb-1 font-black uppercase tracking-[0.22em] text-emerald-600',
                compact ? 'text-[10px]' : 'text-[11px]'
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2
            className={cn(
              'font-black tracking-tight text-slate-950',
              compact ? 'text-sm' : 'text-base'
            )}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className={cn(
                'mt-1 line-clamp-2 font-medium text-slate-500',
                compact ? 'text-xs leading-5' : 'text-sm leading-6'
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
    {children}
  </section>
);

const StatTile = ({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'emerald',
  loading = false,
  trend,
  className,
}) => {
  const isTextValue = typeof value === 'string' && /[^\d.,\s]/.test(value);

  return (
    <StatCard
      title={label}
      value={loading ? '—' : isTextValue ? value : formatNumber(value)}
      subtitle={helper}
      icon={Icon}
      type={tone}
      trend={trend}
      className={className}
    />
  );
};

const CampaignRow = ({ job }) => {
  const isOpen = job.status === 'published';

  return (
    <Link
      to={`/employer/applications?jobId=${job.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3 transition-all hover:border-emerald-100 hover:bg-emerald-50/40 hover:shadow-sm"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <Briefcase className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-slate-900 group-hover:text-emerald-700">
            {job.title || 'Vị trí tuyển dụng'}
          </p>
          <span
            className={cn(
              'hidden rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ring-inset sm:inline-flex',
              isOpen
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                : 'bg-amber-50 text-amber-700 ring-amber-100'
            )}
          >
            {isOpen ? 'Đang mở' : 'Cần chú ý'}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {formatNumber(job.applicants)} hồ sơ
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
    </Link>
  );
};

const CandidateSignalRow = ({ item }) => (
  <Link
    to={item.id ? `/employer/applications/${item.id}` : '/employer/applications'}
    className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3 transition-all hover:border-emerald-100 hover:bg-emerald-50/40 hover:shadow-sm"
  >
    <Avatar className="h-11 w-11 border border-slate-100 shadow-sm">
      <AvatarFallback className="bg-slate-100 text-xs font-black text-slate-600">
        {getInitials(getCandidateName(item))}
      </AvatarFallback>
    </Avatar>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-black text-slate-900 group-hover:text-emerald-700">
        {getCandidateName(item)}
      </p>
      <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{getJobTitle(item)}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {formatRelative(item.updated_at || item.created_at)}
      </p>
    </div>
    <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
  </Link>
);

const ActionPlanRow = ({ icon: Icon, title, helper, to, tone = 'emerald' }) => {
  const toneStyle = getToneStyle(tone);

  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/80 p-4 transition-all hover:border-emerald-100 hover:bg-emerald-50/40"
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
          toneStyle.soft
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-900 group-hover:text-emerald-700">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{helper}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
    </Link>
  );
};

const QuickAction = ({ to, icon: Icon, label, helper, tone = 'emerald' }) => {
  const toneStyle = getToneStyle(tone);

  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-[1.35rem] border border-white/70 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-75', toneStyle.gradient)} />
      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
            toneStyle.soft
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-900 group-hover:text-emerald-700">
            {label}
          </p>
          <p className="truncate text-xs font-semibold text-slate-500">{helper}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
      </div>
    </Link>
  );
};

const EmptyPieGraphic = () => (
  <div className="relative h-12 w-12 rounded-full bg-slate-200">
    <div className="absolute right-0 top-0 h-6 w-6 rounded-tr-full bg-emerald-400" />
    <div className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-full bg-sky-400" />
    <div className="absolute inset-3 rounded-full bg-white" />
  </div>
);

const RecruitmentPipelinePieChart = ({ data, total, loading }) => {
  const chartData = data.filter((item) => item.value > 0);
  const hasData = chartData.length > 0;
  const legendData = data;

  if (loading) {
    return (
      <div className="grid gap-8 py-4 lg:grid-cols-[minmax(420px,1fr)_minmax(280px,1fr)] lg:items-center">
        <div className="flex justify-center">
          <div className="h-80 w-80 animate-pulse rounded-full bg-slate-100 sm:h-96 sm:w-96 lg:h-[26rem] lg:w-[26rem]" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 py-4 lg:grid-cols-[minmax(420px,1fr)_minmax(280px,1fr)] lg:items-center">
      <div className="flex justify-center">
        <div className="relative h-80 w-80 shrink-0 sm:h-96 sm:w-96 lg:h-[26rem] lg:w-[26rem]">
          {hasData ? (
            <>
              <ChartSurface
                className="h-80 w-80 flex-none bg-transparent p-0 shadow-none ring-0 sm:h-96 sm:w-96 lg:h-[26rem] lg:w-[26rem]"
                minChartHeight={416}
              >
                <PieChart>
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value, name) => [`${formatNumber(value)} hồ sơ`, name]}
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={112}
                    outerRadius={166}
                    paddingAngle={5}
                    cornerRadius={14}
                    stroke="#ffffff"
                    strokeWidth={7}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartSurface>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Tổng hồ sơ
                </span>
                <span className="mt-2 text-6xl font-black tracking-tight text-slate-950 tabular-nums">
                  {formatNumber(total)}
                </span>
                <span className="mt-3 rounded-full bg-emerald-50 px-4 py-2 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100">
                  Pipeline
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-white/80 text-center">
              <EmptyPieGraphic />
              <p className="mt-3 text-sm font-black text-slate-700">Chưa có dữ liệu</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Các trạng thái sẽ hiển thị khi có hồ sơ ứng tuyển.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-4 shadow-sm ring-1 ring-slate-900/5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
              Chú thích trạng thái
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Số lượng hồ sơ theo từng giai đoạn tuyển dụng.
            </p>
          </div>
          <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-100">
            {formatNumber(total)} hồ sơ
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {legendData.map((item) => (
            <div key={item.key} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-xs font-black text-slate-700">{item.label}</span>
                </div>
                <span className="text-xs font-black text-slate-950 tabular-nums">
                  {formatNumber(item.value)}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] font-bold text-slate-400">
                {formatNumber(item.value)} hồ sơ trong giai đoạn này
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const EmployerDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const jobsRes = await jobService.getMyJobs().catch(() => ({ data: { data: [] } }));
        const jobsData = Array.isArray(jobsRes.data?.data) ? jobsRes.data.data : [];

        if (!isMounted) return;
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

        if (!isMounted) return;

        const merged = appResponses.flatMap((response, index) => {
          const job = jobsData[index];
          const list = Array.isArray(response.data?.data) ? response.data.data : [];
          return list.map((app) => ({
            ...app,
            status: normalizeApplicationStatus(app?.status),
            jobTitle: job?.title || app?.jobTitle || app?.job_title || 'Vai trò',
            jobId: job?.id || app?.job_id,
          }));
        });

        setApplications(merged);
      } catch (error) {
        console.error('Failed to fetch employer dashboard', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
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

  const jobsWithoutApplicants = useMemo(
    () =>
      jobs.filter((job) => !applications.some((item) => String(item.jobId) === String(job.id)))
        .length,
    [jobs, applications]
  );

  const pipelineChartData = useMemo(
    () =>
      FUNNEL_STAGES.map((stage) => {
        const toneStyle = getToneStyle(stage.tone);
        return {
          ...stage,
          value: filteredApplications.filter((item) => item.status === stage.key).length,
          color: toneStyle.chart,
        };
      }),
    [filteredApplications]
  );

  const pipelineTotal = Math.max(
    totalProfiles,
    pipelineChartData.reduce((sum, item) => sum + toNumber(item.value), 0)
  );

  const recentMatches = useMemo(
    () =>
      [...filteredApplications]
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at || 0) -
            new Date(a.updated_at || a.created_at || 0)
        )
        .slice(0, 5),
    [filteredApplications]
  );

  const topJobsWithStats = useMemo(
    () =>
      jobs.slice(0, 6).map((job) => {
        const jobApplications = applications.filter(
          (item) => String(item.jobId) === String(job.id)
        );

        return {
          ...job,
          applicants: jobApplications.length,
        };
      }),
    [jobs, applications]
  );

  const commandCenterSummary = useMemo(() => {
    if (!totalProfiles) {
      return 'Chưa có nhiều hồ sơ trong kỳ đang chọn. Hãy mở thêm chiến dịch hoặc chủ động tìm ứng viên mới.';
    }

    if (reviewJobs > 0 || jobsWithoutApplicants > 0) {
      return 'Một số chiến dịch cần được tinh chỉnh vì còn tin chờ duyệt hoặc chưa có hồ sơ đầu vào.';
    }

    if (interviewCount > 0 || offerCount > 0 || hiredCount > 0) {
      return 'Quy trình đang có tín hiệu tốt. Nên đẩy nhanh phỏng vấn và chốt các hồ sơ đã vào vòng sâu.';
    }

    return 'Nguồn hồ sơ đang tăng nhưng cần thêm thời gian để đi tới các vòng sâu hơn trong quy trình.';
  }, [hiredCount, interviewCount, jobsWithoutApplicants, offerCount, reviewJobs, totalProfiles]);

  const companyName = user?.company_name || user?.companyName || 'Doanh nghiệp của bạn';
  const currentPeriodLabel =
    PERIOD_OPTIONS.find((item) => item.value === period)?.label || '30 ngày';
  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'Nhà tuyển dụng';
  const activeCampaignSummaryText = `${formatCompactNumber(publishedJobs)} tin đang nhận hồ sơ`;

  const overviewStats = [
    {
      icon: Megaphone,
      label: 'Tin đang mở',
      value: publishedJobs,
      helper: `${formatCompactNumber(jobs.length)} chiến dịch đang quản lý`,
      tone: 'emerald',
      trend: activeCampaignSummaryText,
    },
    {
      icon: FileText,
      label: 'Hồ sơ ứng tuyển',
      value: totalProfiles,
      helper: `${formatCompactNumber(pendingCount)} hồ sơ chờ sàng lọc`,
      tone: 'sky',
    },
    {
      icon: Users,
      label: 'Phỏng vấn',
      value: interviewCount + offerCount,
      helper: 'Lịch phỏng vấn và đề nghị',
      tone: 'violet',
    },
  ];

  const actionPlan = [
    {
      icon: Plus,
      title: 'Mở chiến dịch mới',
      helper: 'Tạo tin tuyển dụng mới để tăng nguồn hồ sơ đầu vào.',
      to: '/employer/jobs/post',
      tone: 'emerald',
    },
    {
      icon: Radar,
      title: 'Tìm ứng viên',
      helper: 'Chủ động tìm kiếm và lưu ứng viên vào kho talent pool.',
      to: '/employer/search-candidates',
      tone: 'sky',
    },
    {
      icon: Calendar,
      title: 'Điều phối lịch phỏng vấn',
      helper: 'Rà lịch hẹn và phản hồi nhanh cho các hồ sơ đã vào vòng sâu.',
      to: '/employer/interview-schedule',
      tone: 'violet',
    },
  ];

  const operationTools = [
    {
      label: 'Báo cáo tuyển dụng',
      helper: 'Theo dõi hiệu suất và kết quả theo thời gian',
      icon: BarChart3,
      to: '/employer/reports',
      tone: 'sky',
    },
    {
      label: 'Kho ứng viên',
      helper: 'Mở danh sách ứng viên đã lưu và phân nhóm',
      icon: Star,
      to: '/employer/saved-candidates',
      tone: 'emerald',
    },
    {
      label: 'Nội dung tuyển dụng',
      helper: 'Quản lý blog và nội dung thương hiệu tuyển dụng',
      icon: Sparkles,
      to: '/employer/blog',
      tone: 'violet',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-border/70 bg-card p-6 shadow-premium sm:p-8 lg:p-10">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_8%_100%,rgba(16,185,129,0.08),transparent_28%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.04)_1px,transparent_0)] bg-[length:28px_28px] opacity-60"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-8 top-0 h-px w-56 bg-gradient-to-r from-primary/50 to-transparent"
              aria-hidden
            />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-normal text-primary">
                    <Sparkles className="h-4 w-4" /> Trung tâm nhà tuyển dụng
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-2 text-xs font-bold text-foreground-soft shadow-sm backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-primary" /> {currentPeriodLabel}
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Xin chào, <span className="text-primary">{firstName}</span>
                </h1>
                <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-muted-foreground">
                  Điều phối tuyển dụng cho{' '}
                  <span className="font-bold text-foreground">{companyName}</span>: theo dõi tin
                  đăng, hồ sơ ứng tuyển, lịch phỏng vấn và tín hiệu cần xử lý trong một bố cục thống
                  nhất như trang tổng quan ứng viên.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <Button
                  asChild
                  className="h-12 rounded-xl bg-primary px-6 text-base font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/90"
                >
                  <Link to="/employer/jobs/post">
                    <Zap className="h-4 w-4" />
                    Đăng tin mới
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-xl border-border bg-white px-6 text-base font-bold text-foreground shadow-sm hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  <Link to="/employer/search-candidates">
                    <Search className="h-4 w-4" />
                    Tìm ứng viên
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {overviewStats.map((item) => (
              <StatTile key={item.label} {...item} loading={loading} />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <main className="min-w-0 space-y-5">
            <div className="grid gap-5 lg:grid-cols-3">
              <SectionCard
                icon={Briefcase}
                title="Chiến dịch trọng tâm"
                subtitle="Các tin tuyển dụng cần theo dõi nhanh về hồ sơ, chất lượng và trạng thái mở."
                eyebrow="Tin tuyển dụng"
                action={
                  <Link
                    to="/employer/jobs"
                    className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-black text-emerald-700 hover:bg-emerald-50"
                  >
                    Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              >
                <div className="space-y-3">
                  {loading ? (
                    [1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-[82px] animate-pulse rounded-2xl bg-slate-100" />
                    ))
                  ) : topJobsWithStats.length > 0 ? (
                    topJobsWithStats
                      .slice(0, 4)
                      .map((job) => <CampaignRow key={job.id} job={job} />)
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                      <Briefcase className="mx-auto h-9 w-9 text-slate-300" />
                      <p className="mt-3 text-sm font-black text-slate-700">
                        Chưa có tin tuyển dụng
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Đăng tin đầu tiên để bắt đầu theo dõi tại đây.
                      </p>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                icon={Users}
                title="Ứng viên gần đây"
                subtitle="Theo dõi nhanh các hồ sơ mới nhất trong pipeline."
                eyebrow="Hồ sơ mới"
                action={
                  <Link
                    to="/employer/applications"
                    className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-black text-emerald-700 hover:bg-emerald-50"
                  >
                    Chi tiết <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              >
                <div className="space-y-3">
                  {loading ? (
                    [1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-[72px] animate-pulse rounded-2xl bg-slate-100" />
                    ))
                  ) : recentMatches.length > 0 ? (
                    recentMatches
                      .slice(0, 4)
                      .map((item, index) => (
                        <CandidateSignalRow key={item.id || index} item={item} />
                      ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                      <Users className="mx-auto h-9 w-9 text-slate-300" />
                      <p className="mt-3 text-sm font-black text-slate-700">Chưa có hồ sơ mới</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Khi ứng viên nộp hồ sơ, danh sách sẽ hiển thị tại đây.
                      </p>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                icon={ShieldCheck}
                title="Kế hoạch điều phối"
                subtitle="Các hành động đề xuất giúp giữ nhịp tuyển dụng không bị nghẽn."
                eyebrow="Việc nên làm tiếp theo"
              >
                <div className="space-y-3">
                  {actionPlan.map((action) => (
                    <ActionPlanRow key={action.title} {...action} />
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    Gợi ý hệ thống
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {commandCenterSummary}
                  </p>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              icon={TrendingUp}
              title="Phân tích pipeline tuyển dụng"
              subtitle="Biểu đồ trạng thái kèm chú thích chi tiết để theo dõi từng giai đoạn và nhận diện điểm nghẽn."
              eyebrow="Phân tích tuyển dụng"
              className="min-w-0"
              compact
              action={
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="h-9 w-[150px] rounded-xl border-slate-200 bg-slate-50 text-xs font-black text-slate-700">
                    <SelectValue placeholder="Chọn kỳ" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white">
                    {PERIOD_OPTIONS.map((item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                        className="text-sm font-semibold"
                      >
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            >
              <RecruitmentPipelinePieChart
                data={pipelineChartData}
                total={pipelineTotal}
                loading={loading}
              />
            </SectionCard>

            <SectionCard
              icon={PieChartIconLucide}
              title="Công cụ vận hành"
              subtitle="Mở nhanh các khu vực hỗ trợ phân tích, lưu ứng viên và xây dựng thương hiệu tuyển dụng."
              eyebrow="Điều phối nhanh"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {operationTools.map((tool) => (
                  <QuickAction key={tool.to} {...tool} />
                ))}
              </div>
            </SectionCard>
          </main>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
