import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Goal,
  MapPin,
  Radar,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import { APPLICATION_STATUS, getAppStatusConfig } from '@/constants/status';
import ChartSurface, { CHART_TOOLTIP_STYLE } from '../../components/charts/ChartSurface';
import { getJobSalaryCardLabel } from '../../utils/jobSalary';
import { isHandledAuthError } from '../../utils/authErrors';
import { useAuth } from '../../context/AuthContext';
import applicationService from '../../services/applicationService';
import candidateService from '../../services/candidateService';
import { jobService } from '../../services';
import FollowedCompaniesFeed from '../../components/candidate/dashboard/FollowedCompaniesFeed';

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
  indigo: {
    soft: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    border: 'border-indigo-200',
    icon: 'bg-indigo-600 text-white shadow-indigo-500/25',
    bar: 'bg-indigo-500',
    dot: 'bg-indigo-500',
    text: 'text-indigo-700',
    gradient: 'from-indigo-500/15 via-indigo-50 to-white',
    chart: '#6366f1',
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

const PIPELINE_STAGES = [
  { key: APPLICATION_STATUS.SUBMITTED, label: 'Đã nộp', tone: 'amber' },
  { key: APPLICATION_STATUS.SHORTLISTED, label: 'Phù hợp SB', tone: 'amber' },
  { key: APPLICATION_STATUS.INTERVIEW_SCHEDULED, label: 'Lịch PV', tone: 'cyan' },
  { key: APPLICATION_STATUS.INTERVIEWED, label: 'Đã PV', tone: 'emerald' },
  { key: APPLICATION_STATUS.OFFERED, label: 'Offer', tone: 'violet' },
  { key: APPLICATION_STATUS.HIRED, label: 'Đã tuyển', tone: 'emerald' },
  { key: APPLICATION_STATUS.REJECTED, label: 'Từ chối', tone: 'rose' },
  { key: APPLICATION_STATUS.WITHDRAWN, label: 'Đã rút', tone: 'slate' },
];

const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const formatNumber = (value) => numberFormatter.format(toNumber(value));

const formatShortDate = (value) => {
  if (!value) return 'Mới cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Mới cập nhật';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const normalizeSkillList = (skills = []) =>
  (Array.isArray(skills) ? skills : [])
    .map((skill) => (typeof skill === 'string' ? skill : skill?.name || skill?.skill_name || ''))
    .map((skill) => String(skill).trim())
    .filter(Boolean);

const buildDashboardRecommendations = (jobs = [], savedJobIds = []) => {
  const savedIdSet = new Set((Array.isArray(savedJobIds) ? savedJobIds : []).map((id) => String(id)));

  return (Array.isArray(jobs) ? jobs : [])
    .map((job) => {
      const normalizedSkills = normalizeSkillList(job.skills);
      return {
        ...job,
        title: job.title || job.job_title || 'Vị trí đang cập nhật',
        company_name: job.company_name || job.company?.name || 'Doanh nghiệp đang tuyển',
        company_logo: job.company_logo || job.company?.logo || job.company?.logo_url || '',
        location: job.location || job.location_name || job.company_location || job.address || 'Linh hoạt',
        type: job.type || job.job_type || job.employment_type || '',
        salary_range: job.salary_range || job.salary_display || null,
        skills: normalizedSkills,
        is_saved: savedIdSet.has(String(job.id)),
      };
    })
    .sort((a, b) => {
      const featuredDiff = Number(b.featured || 0) - Number(a.featured || 0);
      if (featuredDiff !== 0) return featuredDiff;
      return (
        new Date(b.published_at || b.created_at || 0).getTime() -
        new Date(a.published_at || a.created_at || 0).getTime()
      );
    })
    .slice(0, 6);
};

const SectionCard = ({ title, subtitle, icon: Icon, action, children, className, eyebrow, compact = false }) => (
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
          <h2 className={cn('font-black tracking-tight text-slate-950', compact ? 'text-sm' : 'text-base')}>{title}</h2>
          {subtitle ? (
            <p className={cn('mt-1 line-clamp-2 font-medium text-slate-500', compact ? 'text-xs leading-5' : 'text-sm leading-6')}>
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

const StatTile = ({ label, value, helper, icon: Icon, tone = 'emerald', loading = false, trend, className }) => {
  const toneStyle = TONE[tone] || TONE.emerald;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[1.5rem] border border-white/70 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)]',
        className
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', toneStyle.gradient)} />
      <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/60 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none tracking-tight text-slate-950 tabular-nums">
            {loading ? '—' : formatNumber(value)}
          </p>
          {helper ? <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-600">{helper}</p> : null}
          {trend ? (
            <div className={cn('mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ring-inset', toneStyle.soft)}>
              <TrendingUp className="h-3.5 w-3.5" />
              {trend}
            </div>
          ) : null}
        </div>
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg', toneStyle.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const ApplicationRow = ({ app }) => {
  const statusCfg = getAppStatusConfig(app.status);
  const StatusIcon = statusCfg.icon;

  return (
    <Link
      to={`/candidate/applications/${app.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3 transition-all hover:border-emerald-100 hover:bg-emerald-50/40 hover:shadow-sm"
    >
      {app.company_logo ? (
        <img src={app.company_logo} alt={app.company_name} className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-slate-100" />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Building2 className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900 group-hover:text-emerald-700">
          {app.job_title || 'Vị trí ứng tuyển'}
        </p>
        <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
          {app.company_name || 'Công ty đang cập nhật'}
        </p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {formatShortDate(app.applied_at)}
        </p>
      </div>
      <div className={cn('hidden items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-black ring-1 ring-inset sm:inline-flex', statusCfg.bg, statusCfg.text)}>
        <StatusIcon className="h-3.5 w-3.5" />
        {statusCfg.shortLabel || statusCfg.label}
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
    </Link>
  );
};

const JobRow = ({ job, onToggleSave }) => {
  const salaryDisplay = getJobSalaryCardLabel(job);

  const handleSaveClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await onToggleSave(job);
  };

  return (
    <Link
      to={`/candidate/jobs/${job.id}`}
      className="group relative flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3 transition-all hover:border-emerald-100 hover:bg-emerald-50/40 hover:shadow-sm"
    >
      {job.company_logo ? (
        <img src={job.company_logo} alt={job.company_name} className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-slate-100" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700 ring-1 ring-emerald-100">
          {job.company_name?.[0] || 'J'}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-slate-900 group-hover:text-emerald-700">
            {job.title || job.job_title}
          </p>
          {job.featured ? (
            <span className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700 ring-1 ring-amber-100 sm:inline-flex">
              Nổi bật
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{job.company_name}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
          <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" />{salaryDisplay}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSaveClick}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
          job.is_saved
            ? 'border-amber-200 bg-amber-50 text-amber-600'
            : 'border-slate-200 bg-white text-slate-400 hover:border-emerald-200 hover:text-emerald-600'
        )}
        aria-label={job.is_saved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
      >
        <Star className={cn('h-4 w-4', job.is_saved && 'fill-current')} />
      </button>
      <ChevronRight className="hidden h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500 sm:block" />
    </Link>
  );
};

const QuickAction = ({ to, icon: Icon, label, helper, tone = 'emerald' }) => {
  const toneStyle = TONE[tone] || TONE.emerald;

  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-[1.35rem] border border-white/70 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-75', toneStyle.gradient)} />
      <div className="relative flex items-center gap-3">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset', toneStyle.soft)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-900 group-hover:text-emerald-700">{label}</p>
          <p className="truncate text-xs font-semibold text-slate-500">{helper}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
      </div>
    </Link>
  );
};

const PipelinePieChart = ({ data, total, loading }) => {
  const chartData = data.filter((item) => item.value > 0);
  const hasData = chartData.length > 0;
  const legendData = data.map((item) => ({
    ...item,
    percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }));

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
              <ChartSurface className="h-80 w-80 flex-none bg-transparent p-0 shadow-none ring-0 sm:h-96 sm:w-96 lg:h-[26rem] lg:w-[26rem]" minChartHeight={416}>
                <PieChart>
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value, name) => [`${formatNumber(value)} đơn`, name]}
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
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Tổng đơn</span>
                <span className="mt-2 text-6xl font-black tracking-tight text-slate-950 tabular-nums">{formatNumber(total)}</span>
                <span className="mt-3 rounded-full bg-emerald-50 px-4 py-2 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100">Quy trình</span>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-white/80 text-center">
              <PieChartIcon />
              <p className="mt-3 text-sm font-black text-slate-700">Chưa có dữ liệu</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Các trạng thái sẽ hiển thị khi có đơn ứng tuyển.</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-4 shadow-sm ring-1 ring-slate-900/5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Chú thích trạng thái</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Số lượng và tỷ trọng theo từng giai đoạn.</p>
          </div>
          <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-100">
            {formatNumber(total)} đơn
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {legendData.map((item) => (
            <div key={item.key} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-xs font-black text-slate-700">{item.label}</span>
                </div>
                <span className="text-xs font-black text-slate-950 tabular-nums">{formatNumber(item.value)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                />
              </div>
              <p className="mt-1.5 text-[11px] font-bold text-slate-400">{item.percent}% tổng pipeline</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PieChartIcon = () => (
  <div className="relative h-12 w-12 rounded-full bg-slate-200">
    <div className="absolute right-0 top-0 h-6 w-6 rounded-tr-full bg-emerald-400" />
    <div className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-full bg-sky-400" />
    <div className="absolute inset-3 rounded-full bg-white" />
  </div>
);

const CandidateDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);

  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'Ứng viên';

  const loadData = useCallback(async () => {
    try {
      const [statsRes, appsRes, jobsRes, savedJobsRes] = await Promise.allSettled([
        candidateService.getDashboardStats(),
        applicationService.getMyApplications().catch(() => ({ data: { data: [] } })),
        jobService.getJobs({ limit: 12 }).catch(() => ({ data: { data: [] } })),
        candidateService.getSavedJobs().catch(() => ({ data: { data: [] } })),
      ]);

      const dashboardData = statsRes.status === 'fulfilled' ? statsRes.value.data?.data || null : null;
      const fallbackApplications =
        appsRes.status === 'fulfilled' && Array.isArray(appsRes.value.data?.data)
          ? appsRes.value.data.data
          : [];
      const availableJobs =
        jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value.data?.data)
          ? jobsRes.value.data.data
          : [];
      const savedJobs =
        savedJobsRes.status === 'fulfilled' && Array.isArray(savedJobsRes.value.data?.data)
          ? savedJobsRes.value.data.data
          : [];
      const nextSavedJobIds = savedJobs
        .map((job) => job?.id || job?.job_id)
        .filter((id) => id !== undefined && id !== null);

      if (statsRes.status === 'fulfilled') {
        setStats({
          ...(dashboardData || {}),
          recentApplications: dashboardData?.recentApplications || fallbackApplications.slice(0, 5),
          savedJobsCount: dashboardData?.savedJobsCount ?? nextSavedJobIds.length,
          savedJobIds: nextSavedJobIds,
        });
      } else {
        setStats({
          applications: { total: fallbackApplications.length },
          recentApplications: fallbackApplications.slice(0, 5),
          savedJobsCount: nextSavedJobIds.length,
          savedJobIds: nextSavedJobIds,
        });
      }

      setSavedJobIds(nextSavedJobIds);

      const serverRecommendedJobs = Array.isArray(dashboardData?.recommendedJobs)
        ? dashboardData.recommendedJobs
        : [];
      const nextRecommendedJobs = buildDashboardRecommendations(
        serverRecommendedJobs.length > 0 ? serverRecommendedJobs : availableJobs,
        nextSavedJobIds
      );
      setRecommendedJobs(nextRecommendedJobs);
    } catch (err) {
      if (isHandledAuthError(err)) {
        setStats(null);
        setRecommendedJobs([]);
        setSavedJobIds([]);
        return;
      }
      console.error('Dashboard load error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleRecommendedSave = useCallback(
    async (job) => {
      const normalizedId = String(job.id);
      const isSaved = savedJobIds.some((id) => String(id) === normalizedId);

      try {
        if (isSaved) {
          await candidateService.unsaveJob(job.id);
        } else {
          await candidateService.saveJob(job.id);
        }

        setSavedJobIds((prev) =>
          isSaved ? prev.filter((id) => String(id) !== normalizedId) : [...prev, job.id]
        );
        setRecommendedJobs((prev) =>
          prev.map((item) => (String(item.id) === normalizedId ? { ...item, is_saved: !isSaved } : item))
        );
        setStats((prev) =>
          prev
            ? {
              ...prev,
              savedJobsCount: Math.max(0, Number(prev.savedJobsCount || 0) + (isSaved ? -1 : 1)),
              savedJobIds: isSaved
                ? (prev.savedJobIds || []).filter((id) => String(id) !== normalizedId)
                : [...(prev.savedJobIds || []), job.id],
            }
            : prev
        );
      } catch (error) {
        if (isHandledAuthError(error)) return;
        throw error;
      }
    },
    [savedJobIds]
  );

  const recentApps = useMemo(() => stats?.recentApplications || [], [stats?.recentApplications]);

  const appCounts = useMemo(() => {
    const counts = {};
    PIPELINE_STAGES.forEach((stage) => {
      counts[stage.key] = recentApps.filter((app) => app.status === stage.key).length;
    });

    const applicationStats = stats?.applications || {};
    counts.submitted = Math.max(counts.submitted || 0, toNumber(applicationStats.submitted, 0));
    counts.shortlisted = Math.max(counts.shortlisted || 0, toNumber(applicationStats.shortlisted, 0));
    counts.interview_scheduled = Math.max(
      counts.interview_scheduled || 0,
      toNumber(applicationStats.interview_scheduled, 0)
    );
    counts.interviewed = Math.max(counts.interviewed || 0, toNumber(applicationStats.interviewed, 0));
    counts.offered = Math.max(counts.offered || 0, toNumber(applicationStats.offered, 0));
    counts.hired = Math.max(counts.hired || 0, toNumber(applicationStats.hired, 0));
    counts.rejected = Math.max(counts.rejected || 0, toNumber(applicationStats.rejected, 0));
    counts.withdrawn = Math.max(counts.withdrawn || 0, toNumber(applicationStats.withdrawn, 0));

    return counts;
  }, [recentApps, stats?.applications]);

  const applicationTotal = toNumber(stats?.applications?.total, recentApps.length);
  const processingCount = toNumber(
    stats?.applications?.pending,
    appCounts.submitted + appCounts.shortlisted
  );
  const interviewCount = toNumber(
    stats?.applications?.interviewing,
    appCounts.interview_scheduled + appCounts.interviewed
  );
  const savedJobsCount = toNumber(stats?.savedJobsCount, 0);
  const pipelineTotal = Math.max(
    applicationTotal,
    PIPELINE_STAGES.reduce((sum, stage) => sum + toNumber(appCounts[stage.key], 0), 0)
  );

  const pipelineChartData = PIPELINE_STAGES.map((stage) => {
    const toneStyle = TONE[stage.tone] || TONE.slate;
    return {
      ...stage,
      value: toNumber(appCounts[stage.key], 0),
      color: toneStyle.chart,
    };
  });

  const aiTools = [
    { label: 'CV Scanner', helper: 'Chấm điểm CV & keyword ATS', icon: BarChart3, to: '/ai-cv-scanner', tone: 'sky' },
    { label: 'Dự đoán lương', helper: 'Ước tính thu nhập theo thị trường', icon: DollarSign, to: '/salary-predictor', tone: 'emerald' },
    { label: 'Phỏng vấn', helper: 'Luyện câu hỏi theo vai trò', icon: BookOpen, to: '/candidate/interview-prep', tone: 'violet' },
  ];

  const actionPlan = [
    {
      icon: ShieldCheck,
      title: 'Tối ưu hồ sơ ứng tuyển',
      helper: 'Cập nhật kỹ năng, dự án và CV để tăng khả năng qua lọc.',
      to: '/candidate/profile/edit',
      tone: 'emerald',
    },
    {
      icon: Radar,
      title: 'Mở rộng danh sách cơ hội',
      helper: 'Lưu thêm vị trí phù hợp để không bỏ lỡ tin mới.',
      to: '/candidate/jobs',
      tone: 'sky',
    },
    {
      icon: CalendarCheck,
      title: 'Sẵn sàng phỏng vấn',
      helper: 'Rà lịch hẹn và luyện trả lời trước buổi phỏng vấn.',
      to: '/candidate/interviews',
      tone: 'violet',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/40 pb-12">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-border/70 bg-card p-6 shadow-premium sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_8%_100%,rgba(16,185,129,0.08),transparent_28%)]" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.04)_1px,transparent_0)] bg-[length:28px_28px] opacity-60" aria-hidden />
            <div className="pointer-events-none absolute left-8 top-0 h-px w-56 bg-gradient-to-r from-primary/50 to-transparent" aria-hidden />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-normal text-primary">
                    <Sparkles className="h-4 w-4" /> Trung tâm ứng viên
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-2 text-xs font-bold text-foreground-soft shadow-sm backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-primary" /> Cập nhật theo thời gian thực
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Xin chào, <span className="text-primary">{firstName}</span>
                </h1>
                <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-muted-foreground">
                  Theo dõi toàn bộ hành trình tìm việc: đơn ứng tuyển, lịch phỏng vấn, pipeline trạng thái và các cơ hội phù hợp trong một không gian quản trị thống nhất.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <Button asChild className="h-12 rounded-xl bg-primary px-6 text-base font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/90">
                  <Link to="/candidate/jobs">
                    <Zap className="h-4 w-4" />
                    Tìm việc ngay
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-xl border-border bg-white px-6 text-base font-bold text-foreground shadow-sm hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
                  <Link to="/candidate/profile/edit">
                    <FileText className="h-4 w-4" />
                    Nâng cấp hồ sơ
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Đơn đã nộp"
              value={applicationTotal}
              helper="Tổng lượt ứng tuyển"
              icon={FileText}
              tone="emerald"
              loading={loading}
            />
            <StatTile
              label="Đang xử lý"
              value={processingCount}
              helper="Chờ phản hồi tuyển dụng"
              icon={Clock}
              tone="amber"
              loading={loading}
            />
            <StatTile
              label="Phỏng vấn"
              value={interviewCount}
              helper="Lịch PV & đã PV"
              icon={Users}
              tone="sky"
              loading={loading}
            />
            <StatTile
              label="Việc đã lưu"
              value={savedJobsCount}
              helper="Cơ hội tiềm năng"
              icon={Star}
              tone="violet"
              loading={loading}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <main className="min-w-0 space-y-5">
            <div className="grid gap-5 lg:grid-cols-3">
              <SectionCard
                icon={Briefcase}
                title="Việc làm phù hợp"
                subtitle="Các vị trí nên xem trước dựa trên hồ sơ, tin mới và tín hiệu nổi bật."
                eyebrow="Việc làm phù hợp"
                action={
                  <Link to="/candidate/jobs" className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-black text-emerald-700 hover:bg-emerald-50">
                    Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              >
                <div className="space-y-3">
                  {loading ? (
                    [1, 2, 3, 4].map((item) => <div key={item} className="h-[76px] animate-pulse rounded-2xl bg-slate-100" />)
                  ) : recommendedJobs.length > 0 ? (
                    recommendedJobs.slice(0, 4).map((job) => (
                      <JobRow key={job.id} job={job} onToggleSave={handleToggleRecommendedSave} />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                      <Briefcase className="mx-auto h-9 w-9 text-slate-300" />
                      <p className="mt-3 text-sm font-black text-slate-700">Chưa có gợi ý việc làm</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Cập nhật hồ sơ để hệ thống gợi ý chính xác hơn.</p>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                icon={FileText}
                title="Đơn ứng tuyển gần đây"
                subtitle="Theo dõi nhanh trạng thái các đơn mới nhất và mở chi tiết khi cần."
                eyebrow="Hoạt động gần đây"
                action={
                  <Link to="/candidate/applications" className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-black text-emerald-700 hover:bg-emerald-50">
                    Chi tiết <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              >
                <div className="space-y-3">
                  {loading ? (
                    [1, 2, 3, 4].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-2xl bg-slate-100" />)
                  ) : recentApps.length > 0 ? (
                    recentApps.slice(0, 4).map((app) => <ApplicationRow key={app.id} app={app} />)
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                      <FileText className="mx-auto h-9 w-9 text-slate-300" />
                      <p className="mt-3 text-sm font-black text-slate-700">Chưa có đơn nộp</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Bắt đầu ứng tuyển để theo dõi tại đây.</p>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                icon={Goal}
                title="Kế hoạch bứt phá"
                subtitle="Các hành động ưu tiên để tăng tỷ lệ phản hồi và chuẩn bị phỏng vấn tốt hơn."
                eyebrow="Việc nên làm tiếp theo"
              >
                <div className="space-y-3">
                  {actionPlan.map((action) => {
                    const toneStyle = TONE[action.tone] || TONE.emerald;
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.title}
                        to={action.to}
                        className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/80 p-4 transition-all hover:border-emerald-100 hover:bg-emerald-50/40"
                      >
                        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset', toneStyle.soft)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900 group-hover:text-emerald-700">{action.title}</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{action.helper}</p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                      </Link>
                    );
                  })}
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-5">
              <SectionCard
                icon={TrendingUp}
                title="Phân tích pipeline ứng tuyển"
                subtitle="Biểu đồ trạng thái kèm chú thích chi tiết để theo dõi tiến độ và nhận diện điểm nghẽn."
                eyebrow="Phân tích ứng tuyển"
                className="min-w-0"
                compact
              >
                <PipelinePieChart data={pipelineChartData} total={pipelineTotal} loading={loading} />
              </SectionCard>

              <SectionCard icon={Building2} title="Công ty theo dõi" subtitle="Cập nhật nhanh từ các công ty bạn quan tâm." eyebrow="Danh sách công ty theo dõi">
                <FollowedCompaniesFeed />
              </SectionCard>
            </div>

            <SectionCard icon={BarChart3} title="Công cụ hỗ trợ AI" subtitle="Phân tích CV, lương và chuẩn bị phỏng vấn trong vài bước." eyebrow="Bộ công cụ AI">
              <div className="grid gap-3 sm:grid-cols-3">
                {aiTools.map((tool) => (
                  <QuickAction key={tool.to} to={tool.to} icon={tool.icon} label={tool.label} helper={tool.helper} tone={tool.tone} />
                ))}
              </div>
            </SectionCard>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
