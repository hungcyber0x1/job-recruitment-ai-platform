import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AlertCircle,
  BarChart3,
  BrainCircuit,
  Briefcase,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';

import ChartSurface, { CHART_MUTED_TICK_STYLE } from '@/components/charts/ChartSurface';
import { PageHeader } from '@/components/admin';
import { EmptyState } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/context/NotificationContext';
import adminService from '@/services/adminService';
import { cn } from '../../utils';

const RANGE_FILTERS = [
  { id: '7d', label: '7 ngày', helper: 'Tập trung tín hiệu rất mới' },
  { id: '30d', label: '30 ngày', helper: 'Theo dõi vận hành tháng này' },
  { id: '3m', label: '3 tháng', helper: 'Nhìn xu hướng ổn định hơn' },
];

const EMPTY_DASHBOARD = {
  range: { id: '30d', label: '30 ngày gần nhất', days: 30 },
  kpi: {
    users: 0,
    jobs: 0,
    applications: 0,
    companies: 0,
  },
  pipeline: {
    applied: 0,
    interview: 0,
    hired: 0,
    rejected: 0,
  },
  growth: [],
  topIndustries: [],
  insights: [],
  aiInsight: null,
  moderation: {
    pendingJobs: 0,
    pendingCompanies: 0,
  },
};

const INSIGHT_TONE = {
  success: {
    icon: CheckCircle2,
    card: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
    iconBox: 'bg-emerald-600 text-white',
    badge: 'border-emerald-200 bg-white text-emerald-700',
    label: 'Tốt',
  },
  warning: {
    icon: AlertCircle,
    card: 'border-amber-200 bg-amber-50/80 text-amber-950',
    iconBox: 'bg-amber-500 text-white',
    badge: 'border-amber-200 bg-white text-amber-700',
    label: 'Cảnh báo',
  },
  danger: {
    icon: XCircle,
    card: 'border-rose-200 bg-rose-50/80 text-rose-950',
    iconBox: 'bg-rose-600 text-white',
    badge: 'border-rose-200 bg-white text-rose-700',
    label: 'Vấn đề',
  },
  info: {
    icon: Info,
    card: 'border-sky-200 bg-sky-50/80 text-sky-950',
    iconBox: 'bg-sky-600 text-white',
    badge: 'border-sky-200 bg-white text-sky-700',
    label: 'Nhận định',
  },
  neutral: {
    icon: Sparkles,
    card: 'border-slate-200 bg-slate-50/80 text-slate-950',
    iconBox: 'bg-slate-800 text-white',
    badge: 'border-slate-200 bg-white text-slate-600',
    label: 'Theo dõi',
  },
};

const KPI_CARDS = [
  {
    key: 'users',
    title: 'Tổng người dùng',
    description: 'Tài khoản mới phát sinh trong khoảng lọc.',
    icon: Users,
    accent: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
  },
  {
    key: 'jobs',
    title: 'Tin tuyển dụng',
    description: 'Nhu cầu tuyển dụng mới trên hệ thống.',
    icon: Briefcase,
    accent: 'text-sky-700 bg-sky-50 ring-sky-100',
  },
  {
    key: 'applications',
    title: 'Ứng tuyển',
    description: 'Lượt ứng viên nộp hồ sơ vào pipeline.',
    icon: FileText,
    accent: 'text-violet-700 bg-violet-50 ring-violet-100',
  },
  {
    key: 'companies',
    title: 'Doanh nghiệp',
    description: 'Doanh nghiệp mới tham gia nền tảng.',
    icon: Building2,
    accent: 'text-amber-700 bg-amber-50 ring-amber-100',
  },
];

const PIPELINE_STAGES = [
  {
    key: 'applied',
    label: 'Đã nộp',
    description: 'Hồ sơ đầu vào',
    icon: FileText,
    tone: 'bg-slate-900 text-white',
    border: 'border-slate-200',
  },
  {
    key: 'interview',
    label: 'Phỏng vấn',
    description: 'Đã lên lịch hoặc đã phỏng vấn',
    icon: Users,
    tone: 'bg-amber-500 text-white',
    border: 'border-amber-200',
  },
  {
    key: 'hired',
    label: 'Đã tuyển',
    description: 'Kết quả tuyển thành công',
    icon: TrendingUp,
    tone: 'bg-emerald-600 text-white',
    border: 'border-emerald-200',
  },
  {
    key: 'rejected',
    label: 'Từ chối',
    description: 'Hồ sơ kết thúc không phù hợp',
    icon: XCircle,
    tone: 'bg-rose-600 text-white',
    border: 'border-rose-200',
  },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function csvEscape(value) {
  const normalized = String(value ?? '');
  return `"${normalized.replace(/"/g, '""')}"`;
}

function downloadCsv(filename, rows) {
  const csv = `\uFEFF${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getInsightTone(tone) {
  return INSIGHT_TONE[tone] || INSIGHT_TONE.neutral;
}

function SectionCard({ title, description, icon: Icon, action, children, className }) {
  return (
    <section
      className={cn('rounded-3xl border border-slate-200 bg-white p-6 shadow-sm', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function KpiCard({ item, value }) {
  const Icon = item.icon;

  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset',
            item.accent
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          KPI
        </span>
      </div>
      <p className="mt-7 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
        {item.title}
      </p>
      <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">
        {formatNumber(value)}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>
    </div>
  );
}

function InsightCard({ insight, index }) {
  const tone = getInsightTone(insight.tone);
  const Icon = tone.icon;

  return (
    <article className={cn('rounded-2xl border p-4', tone.card)}>
      <div className="flex gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm',
            tone.iconBox
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', tone.badge)}>
              {tone.label} {index + 1}
            </Badge>
          </div>
          <h3 className="mt-3 text-base font-bold leading-6">{insight.title}</h3>
          <p className="mt-2 text-sm leading-6 opacity-80">{insight.description}</p>
        </div>
      </div>
    </article>
  );
}

function PipelineCard({ stage, value }) {
  const Icon = stage.icon;

  return (
    <div className={cn('rounded-2xl border bg-white p-5 shadow-sm', stage.border)}>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
            stage.tone
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{stage.label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {formatNumber(value)}
          </p>
          <p className="mt-2 text-sm leading-5 text-slate-500">{stage.description}</p>
        </div>
      </div>
    </div>
  );
}

function HotIndustryList({ items }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-bold text-slate-700">Chưa có ngành nghề nổi bật</p>
        <p className="mt-2 text-sm text-slate-500">
          Khi có tin tuyển dụng mới, top ngành sẽ tự động cập nhật từ dữ liệu thật.
        </p>
      </div>
    );
  }

  const maxValue = Math.max(1, ...items.map((item) => Number(item.count) || 0));

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const width = `${Math.max(12, Math.round(((Number(item.count) || 0) / maxValue) * 100))}%`;
        return (
          <div
            key={`${item.name}-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-amber-50 px-2 text-sm font-black text-amber-700 ring-1 ring-inset ring-amber-100">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Nguồn: {item.source === 'applications' ? 'ứng tuyển' : 'tin tuyển dụng'}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-black tabular-nums text-slate-950">
                {formatNumber(item.count)}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-amber-500" style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const GrowthTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl shadow-slate-200/60">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-8 text-sm">
            <span className="flex items-center gap-2 font-semibold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-black tabular-nums text-slate-950">
              {formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-52 animate-pulse rounded-3xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_420px]">
        <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

const AdminAnalyticsPage = () => {
  const { showNotification } = useNotification();
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) setRefreshing(true);
        else setLoading(true);
        setError('');

        const response = await adminService.getAnalyticsDashboard({ range: timeRange });
        const payload = response?.data?.data || {};

        setDashboard({
          ...EMPTY_DASHBOARD,
          ...payload,
          range: payload.range || EMPTY_DASHBOARD.range,
          kpi: { ...EMPTY_DASHBOARD.kpi, ...(payload.kpi || {}) },
          pipeline: { ...EMPTY_DASHBOARD.pipeline, ...(payload.pipeline || {}) },
          moderation: { ...EMPTY_DASHBOARD.moderation, ...(payload.moderation || {}) },
          growth: Array.isArray(payload.growth) ? payload.growth : [],
          topIndustries: Array.isArray(payload.topIndustries)
            ? payload.topIndustries.slice(0, 5)
            : [],
          insights: Array.isArray(payload.insights) ? payload.insights : [],
          aiInsight: payload.aiInsight || null,
        });
      } catch (fetchError) {
        console.error('Error loading analytics dashboard:', fetchError);
        setError('Không thể tải dữ liệu phân tích hệ thống. Vui lòng thử lại sau.');
        showNotification('Không tải được dữ liệu phân tích hệ thống', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showNotification, timeRange]
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const selectedRange = RANGE_FILTERS.find((item) => item.id === timeRange) || RANGE_FILTERS[1];

  const hasData = useMemo(() => {
    const kpiTotal = Object.values(dashboard.kpi || {}).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
    const pipelineTotal = Object.values(dashboard.pipeline || {}).reduce((sum, value) => {
      if (typeof value === 'object') return sum;
      return sum + Number(value || 0);
    }, 0);
    return (
      kpiTotal > 0 ||
      pipelineTotal > 0 ||
      dashboard.growth.some((item) => item.users > 0 || item.applications > 0)
    );
  }, [dashboard]);

  const chartTotals = useMemo(
    () =>
      dashboard.growth.reduce(
        (summary, item) => ({
          users: summary.users + Number(item.users || 0),
          applications: summary.applications + Number(item.applications || 0),
        }),
        { users: 0, applications: 0 }
      ),
    [dashboard.growth]
  );

  const aiTone = getInsightTone(dashboard.aiInsight?.tone);
  const AiToneIcon = aiTone.icon;

  const handleExportReport = useCallback(() => {
    try {
      setExporting(true);
      const rows = [
        ['Nhóm', 'Chỉ số', 'Giá trị'],
        ['Khoảng lọc', 'Thời gian', dashboard.range?.label || selectedRange.label],
        ...KPI_CARDS.map((item) => ['KPI', item.title, String(dashboard.kpi?.[item.key] || 0)]),
        ...PIPELINE_STAGES.map((stage) => [
          'Pipeline tuyển dụng',
          stage.label,
          String(dashboard.pipeline?.[stage.key] || 0),
        ]),
        ...dashboard.topIndustries.map((item) => [
          'Ngành nghề hot',
          item.name,
          String(item.count || 0),
        ]),
        ...dashboard.insights.map((item) => ['Nhận định', item.title, item.description]),
        ...dashboard.growth.map((item) => [
          'Tăng trưởng',
          item.date || item.label,
          `Người dùng: ${item.users || 0}; Ứng tuyển: ${item.applications || 0}`,
        ]),
      ];

      downloadCsv(
        `analytics-dashboard-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`,
        rows
      );
      showNotification('Đã xuất báo cáo phân tích', 'success');
    } catch (exportError) {
      console.error('Export analytics dashboard error:', exportError);
      showNotification('Không thể xuất báo cáo phân tích', 'error');
    } finally {
      setExporting(false);
    }
  }, [dashboard, selectedRange.label, showNotification, timeRange]);

  return (
    <div className="animate-fade-in space-y-7 pb-10">
      <PageHeader
        icon={BarChart3}
        eyebrow="Tổng quan phân tích"
        badge="Chỉ xem dữ liệu"
        title="Phân tích hệ thống"
        description="Tổng quan tinh gọn cho Admin: ưu tiên KPI cốt lõi, nhận định nhanh và tín hiệu tuyển dụng giúp ra quyết định trong vài giây."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              {RANGE_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.helper}
                  onClick={() => setTimeRange(item.id)}
                  className={cn(
                    'rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                    timeRange === item.id
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl bg-white px-5 text-sm font-bold text-slate-700 shadow-sm"
              onClick={() => fetchDashboard({ silent: true })}
              disabled={loading || refreshing}
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Làm mới
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
              onClick={handleExportReport}
              disabled={exporting || loading || !hasData}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Xuất CSV
            </Button>
          </div>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-800 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black text-rose-950">Không tải được tổng quan</h2>
              <p className="mt-2 text-sm leading-6 text-rose-700">{error}</p>
              <Button
                className="mt-5 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                onClick={() => fetchDashboard()}
              >
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      ) : !hasData ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 shadow-sm">
          <EmptyState
            title="Chưa có dữ liệu phân tích"
            description="Khoảng thời gian đang chọn chưa phát sinh người dùng, tin tuyển dụng hoặc ứng tuyển. Hãy đổi filter để xem dữ liệu rộng hơn."
            variant="robotSearch"
          />
        </div>
      ) : (
        <div className="space-y-7">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {KPI_CARDS.map((item) => (
              <KpiCard key={item.key} item={item} value={dashboard.kpi?.[item.key] || 0} />
            ))}
          </div>

          <SectionCard
            icon={BrainCircuit}
            title="Nhận định nhanh"
            description={`Nhận định được sinh tự động từ dữ liệu thật trong ${dashboard.range?.label || selectedRange.label}; không dùng nhận định hardcode.`}
            action={
              <Badge className={cn('rounded-full px-3 py-1 text-xs font-bold', aiTone.badge)}>
                Nhận định AI
              </Badge>
            }
            className="bg-gradient-to-br from-white via-white to-slate-50"
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid gap-4 md:grid-cols-2">
                {(dashboard.insights.length ? dashboard.insights : EMPTY_DASHBOARD.insights).map(
                  (insight, index) => (
                    <InsightCard
                      key={insight.id || `${insight.title}-${index}`}
                      insight={insight}
                      index={index}
                    />
                  )
                )}
              </div>

              <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/60">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-inset ring-white/10">
                    <AiToneIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                      Nhận định AI
                    </p>
                    <h3 className="mt-3 text-lg font-black leading-7">
                      {dashboard.aiInsight?.title || 'Chưa đủ dữ liệu để tạo nhận định'}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {dashboard.aiInsight?.description ||
                        'Nhận định AI sẽ xuất hiện khi hệ thống có thêm dữ liệu vận hành.'}
                    </p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                  {dashboard.aiInsight?.context ||
                    'Không có dữ liệu nhạy cảm; chỉ tổng hợp số đếm vận hành.'}
                </div>
                <details className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <summary className="cursor-pointer font-bold text-white">
                    Chi tiết dữ liệu phụ
                  </summary>
                  <div className="mt-3 space-y-2 leading-6">
                    <p>Tin chờ duyệt: {formatNumber(dashboard.moderation?.pendingJobs)}</p>
                    <p>
                      Doanh nghiệp chưa xác minh:{' '}
                      {formatNumber(dashboard.moderation?.pendingCompanies)}
                    </p>
                  </div>
                </details>
              </aside>
            </div>
          </SectionCard>

          <div className="grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_420px]">
            <div className="space-y-7">
              <SectionCard
                icon={TrendingUp}
                title="Pipeline tuyển dụng"
                description="Chỉ giữ 4 trạng thái nghiệp vụ quan trọng: đã nộp, phỏng vấn, đã tuyển và từ chối."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {PIPELINE_STAGES.map((stage) => (
                    <PipelineCard
                      key={stage.key}
                      stage={stage}
                      value={dashboard.pipeline?.[stage.key] || 0}
                    />
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                icon={BarChart3}
                title="Biểu đồ tăng trưởng"
                description="Một line chart duy nhất theo trục thời gian, hiển thị người dùng mới và lượt ứng tuyển mới trong filter toàn cục."
                action={
                  <div className="flex flex-wrap gap-2">
                    <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      Người dùng {formatNumber(chartTotals.users)}
                    </Badge>
                    <Badge className="rounded-full border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                      Ứng tuyển {formatNumber(chartTotals.applications)}
                    </Badge>
                  </div>
                }
              >
                <div className="h-[380px] rounded-3xl border border-slate-200 bg-white p-5">
                  {dashboard.growth.length ? (
                    <ChartSurface className="h-full" minChartHeight={300}>
                      <LineChart
                        data={dashboard.growth}
                        margin={{ top: 18, right: 18, left: -16, bottom: 12 }}
                      >
                        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={CHART_MUTED_TICK_STYLE}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={CHART_MUTED_TICK_STYLE}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={<GrowthTooltip />}
                          cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="users"
                          name="Người dùng"
                          stroke="#059669"
                          strokeWidth={3}
                          dot={{ fill: '#059669', r: 3, strokeWidth: 2, stroke: '#ffffff' }}
                          activeDot={{ r: 7, strokeWidth: 0 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="applications"
                          name="Ứng tuyển"
                          stroke="#7c3aed"
                          strokeWidth={3}
                          dot={{ fill: '#7c3aed', r: 3, strokeWidth: 2, stroke: '#ffffff' }}
                          activeDot={{ r: 7, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ChartSurface>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                      <div className="max-w-sm px-6">
                        <p className="text-sm font-bold text-slate-700">
                          Chưa có dữ liệu tăng trưởng
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Biểu đồ sẽ xuất hiện khi có người dùng hoặc lượt ứng tuyển mới.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            <SectionCard
              icon={Building2}
              title="Ngành nghề hot"
              description="Top 5 ngành được tính từ tin tuyển dụng thật trong khoảng lọc."
              action={
                <Badge className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  Top 5
                </Badge>
              }
            >
              <HotIndustryList items={dashboard.topIndustries} />
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
};

SectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.elementType,
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

KpiCard.propTypes = {
  item: PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    accent: PropTypes.string.isRequired,
  }).isRequired,
  value: PropTypes.number,
};

InsightCard.propTypes = {
  insight: PropTypes.shape({
    id: PropTypes.string,
    tone: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

PipelineCard.propTypes = {
  stage: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    tone: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired,
  }).isRequired,
  value: PropTypes.number,
};

HotIndustryList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
      source: PropTypes.string,
    })
  ).isRequired,
};

GrowthTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string,
      color: PropTypes.string,
      name: PropTypes.string,
      value: PropTypes.number,
    })
  ),
  label: PropTypes.string,
};

export default AdminAnalyticsPage;
