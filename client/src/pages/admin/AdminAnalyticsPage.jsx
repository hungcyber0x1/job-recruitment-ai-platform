import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Briefcase,
  Building2,
  CheckCircle,
  Download,
  FileText,
  Globe,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Tags,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';

import ChartSurface, { CHART_MUTED_TICK_STYLE } from '@/components/charts/ChartSurface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/context/NotificationContext';
import adminService from '@/services/adminService';
import { cn } from '../../utils';

const EMPTY_STATS = {
  users: 0,
  jobs: 0,
  applications: 0,
  companies: 0,
  tickets: 0,
  revenue: 0,
  candidateAccounts: 0,
  recruiterAccounts: 0,
  adminAccounts: 0,
  lockedAccounts: 0,
  verifiedCompanies: 0,
  pendingCompanyApprovals: 0,
  publishedJobs: 0,
  pendingJobApprovals: 0,
  rejectedJobs: 0,
  blogPosts: 0,
  homepageBanners: 0,
  testimonials: 0,
  totalSkills: 0,
  totalCategories: 0,
  totalLocations: 0,
  aiUsageCount: 0,
  chatbotConversations: 0,
  cvScans: 0,
  aiAccuracyScore: 0,
  spamDetected: 0,
  flaggedAccounts: 0,
  totalApplications: 0,
  submittedCount: 0,
  screeningCount: 0,
  interviewCount: 0,
  hiredCount: 0,
  rejectedCount: 0,
  topSkills: [],
  topIndustries: [],
  topLocations: [],
};

const EMPTY_CHARTS = {
  userGrowth: [],
  jobStats: [],
  applicationStats: [],
  weeklyActivity: [],
  userDistribution: [],
};

const TIME_FILTERS = [
  { id: 'month', label: 'Theo tháng' },
  { id: 'quarter', label: 'Theo quý' },
  { id: 'year', label: 'Theo năm' },
];

const MONTH_ABBR_VI = {
  Jan: 'T1',
  Feb: 'T2',
  Mar: 'T3',
  Apr: 'T4',
  May: 'T5',
  Jun: 'T6',
  Jul: 'T7',
  Aug: 'T8',
  Sep: 'T9',
  Oct: 'T10',
  Nov: 'T11',
  Dec: 'T12',
};

const MONTH_INDEX = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

const TONE_STYLES = {
  emerald: {
    icon: 'bg-emerald-100 text-emerald-700 ring-emerald-100',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    progress: 'bg-emerald-500',
    surface: 'border-emerald-200/80 bg-emerald-50/70',
  },
  blue: {
    icon: 'bg-blue-100 text-blue-700 ring-blue-100',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    progress: 'bg-blue-500',
    surface: 'border-blue-200/80 bg-blue-50/70',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-700 ring-violet-100',
    badge: 'border-violet-200 bg-violet-50 text-violet-700',
    progress: 'bg-violet-500',
    surface: 'border-violet-200/80 bg-violet-50/70',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700 ring-amber-100',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    progress: 'bg-amber-500',
    surface: 'border-amber-200/80 bg-amber-50/70',
  },
  rose: {
    icon: 'bg-rose-100 text-rose-700 ring-rose-100',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    progress: 'bg-rose-500',
    surface: 'border-rose-200/80 bg-rose-50/70',
  },
  indigo: {
    icon: 'bg-indigo-100 text-indigo-700 ring-indigo-100',
    badge: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    progress: 'bg-indigo-500',
    surface: 'border-indigo-200/80 bg-indigo-50/70',
  },
  orange: {
    icon: 'bg-orange-100 text-orange-700 ring-orange-100',
    badge: 'border-orange-200 bg-orange-50 text-orange-700',
    progress: 'bg-orange-500',
    surface: 'border-orange-200/80 bg-orange-50/70',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-100',
    badge: 'border-slate-200 bg-slate-50 text-slate-600',
    progress: 'bg-slate-700',
    surface: 'border-slate-200/80 bg-slate-50/70',
  },
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function calculatePercent(value, total) {
  const safeValue = Number(value) || 0;
  const safeTotal = Number(total) || 0;
  if (!safeTotal) return 0;
  return Math.round((safeValue / safeTotal) * 100);
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

function normalizeTimeSeries(rows, dataKey) {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row, index) => {
      const rawName = String(row?.name ?? '').trim();
      const month = MONTH_INDEX[rawName] || index + 1;

      return {
        month,
        label: MONTH_ABBR_VI[rawName] || rawName || `M${index + 1}`,
        [dataKey]: Number(row?.[dataKey] ?? row?.value ?? 0) || 0,
      };
    })
    .sort((a, b) => a.month - b.month);
}

function getFallbackSeries(filter, dataKey) {
  if (filter === 'quarter') {
    return Array.from({ length: 4 }, (_, index) => ({
      label: `Q${index + 1}`,
      [dataKey]: 0,
    }));
  }

  if (filter === 'year') {
    return [{ label: '12 tháng', [dataKey]: 0 }];
  }

  return ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'].map((label) => ({
    label,
    [dataKey]: 0,
  }));
}

function aggregateSeries(series, filter, dataKey) {
  if (!series.length) return getFallbackSeries(filter, dataKey);

  if (filter === 'quarter') {
    const grouped = new Map();

    series.forEach((point) => {
      const quarter = Math.ceil((point.month || 1) / 3);
      grouped.set(quarter, (grouped.get(quarter) || 0) + (Number(point[dataKey]) || 0));
    });

    return Array.from({ length: 4 }, (_, index) => ({
      label: `Q${index + 1}`,
      [dataKey]: grouped.get(index + 1) || 0,
    }));
  }

  if (filter === 'year') {
    return [
      {
        label: '12 tháng',
        [dataKey]: series.reduce((sum, point) => sum + (Number(point[dataKey]) || 0), 0),
      },
    ];
  }

  return series.map((point) => ({
    label: point.label,
    [dataKey]: Number(point[dataKey]) || 0,
  }));
}

function SectionCard({ icon: Icon, title, description, action, className = '', children, ...props }) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200/70 hover:shadow-md sm:p-6',
        className
      )}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-slate-950">{title}</h2>
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

function OverviewCard({ icon: Icon, label, value, helper, badge, tone = 'slate' }) {
  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.slate;

  return (
    <div
      className={cn(
        'rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md',
        toneStyle.surface
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{formatNumber(value)}</p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
            toneStyle.icon
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {badge ? (
        <div className="mt-4">
          <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', toneStyle.badge)}>
            {badge}
          </span>
        </div>
      ) : null}

      {helper ? <p className="mt-3 text-sm leading-6 text-slate-500">{helper}</p> : null}
    </div>
  );
}

function MetricRow({ icon: Icon, label, value, helper, tone = 'slate', suffix = '' }) {
  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.slate;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
          toneStyle.icon
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
      </div>

      <div className="shrink-0 text-right">
        <div className="text-xl font-bold tracking-tight text-slate-950">
          {formatNumber(value)}
          {suffix}
        </div>
      </div>
    </div>
  );
}

function PipelineStep({ icon: Icon, label, value, progress, tone = 'slate' }) {
  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.slate;

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
            toneStyle.icon
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{formatNumber(value)}</p>
          <p className="mt-1 text-xs text-slate-500">{progress}% trên tổng hồ sơ</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all', toneStyle.progress)}
          style={{ width: `${progress > 0 ? Math.max(8, Math.round(progress)) : 0}%` }}
        />
      </div>
    </div>
  );
}

function InsightItem({ label, value, tone = 'slate', helper }) {
  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.slate;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
          {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
        </div>
        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', toneStyle.badge)}>
          {value}
        </span>
      </div>
    </div>
  );
}

function RankedColumn({ icon: Icon, title, description, items, emptyMessage, tone = 'emerald' }) {
  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.emerald;
  const maxValue = Math.max(1, ...items.map((item) => Number(item.value) || 0));

  return (
    <div className="p-5">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
            toneStyle.icon
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>

      {items.length ? (
        <div className="mt-5 space-y-3">
          {items.map((item, index) => {
            const width = `${Math.max(12, Math.round(((Number(item.value) || 0) / maxValue) * 100))}%`;

            return (
              <div key={`${item.label}-${index}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold',
                        toneStyle.badge
                      )}
                    >
                      {index + 1}
                    </span>
                    <p className="truncate text-sm font-medium text-slate-800">{item.label}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{formatNumber(item.value)}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn('h-full rounded-full', toneStyle.progress)} style={{ width }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm leading-6 text-slate-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label, valueSuffix }) => {
  if (!active || !payload?.length) return null;

  const value = Number(payload[0]?.value);

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-xl shadow-slate-200/50">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="text-lg font-bold tabular-nums text-slate-900">
        {Number.isFinite(value) ? value.toLocaleString('vi-VN') : '—'}
        {valueSuffix ? <span className="ml-1 text-xs font-semibold text-slate-500">{valueSuffix}</span> : null}
      </p>
    </div>
  );
};

ChartTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number,
    })
  ),
  label: PropTypes.string,
  valueSuffix: PropTypes.string,
};

SectionCard.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
};

OverviewCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  helper: PropTypes.string,
  badge: PropTypes.string,
  tone: PropTypes.string,
};

MetricRow.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  helper: PropTypes.string,
  tone: PropTypes.string,
  suffix: PropTypes.string,
};

PipelineStep.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  progress: PropTypes.number.isRequired,
  tone: PropTypes.string,
};

InsightItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  tone: PropTypes.string,
  helper: PropTypes.string,
};

RankedColumn.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  emptyMessage: PropTypes.string.isRequired,
  tone: PropTypes.string,
};

const AdminAnalyticsPage = () => {
  const { showNotification } = useNotification();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [charts, setCharts] = useState(EMPTY_CHARTS);
  const [timeFilter, setTimeFilter] = useState('month');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsRes, chartRes] = await Promise.all([
        adminService.getStats(),
        adminService.getChartStats(),
      ]);

      if (statsRes?.data?.success) {
        const raw = statsRes.data.data || {};
        setStats({
          ...EMPTY_STATS,
          ...raw,
          users: Number(raw.users) || 0,
          jobs: Number(raw.jobs) || 0,
          applications: Number(raw.applications) || 0,
          companies: Number(raw.companies) || 0,
          revenue: Number(raw.revenue) || 0,
        });
      }

      if (chartRes?.data?.success) {
        setCharts({
          ...EMPTY_CHARTS,
          ...(chartRes.data.data || {}),
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      showNotification('Không tải được dữ liệu phân tích hệ thống', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalApplications = stats.totalApplications || stats.applications || 0;
  const activeAccounts = Math.max(0, stats.users - stats.lockedAccounts);
  const accountHealth = calculatePercent(activeAccounts, stats.users);
  const hiringRate = calculatePercent(stats.hiredCount, totalApplications);
  const rejectionRate = calculatePercent(stats.rejectedCount, totalApplications);
  const companyVerificationRate = calculatePercent(stats.verifiedCompanies, stats.companies);
  const aiUsageTotal =
    (stats.chatbotConversations || 0) + (stats.cvScans || 0);

  const overviewCards = useMemo(
    () => [
      {
        label: 'Tổng người dùng',
        value: stats.users,
        helper: `${formatNumber(activeAccounts)} tài khoản đang hoạt động ổn định.`,
        badge: `${accountHealth}% ổn định`,
        tone: 'emerald',
        icon: Users,
      },
      {
        label: 'Việc làm hoạt động',
        value: stats.jobs,
        helper: `${formatNumber(stats.publishedJobs || stats.jobs)} tin đang hiển thị trên nền tảng.`,
        badge: `${formatNumber(stats.pendingJobApprovals || 0)} chờ duyệt`,
        tone: 'blue',
        icon: Briefcase,
      },
      {
        label: 'Đơn ứng tuyển',
        value: stats.applications,
        helper: `${formatNumber(totalApplications)} hồ sơ đã đi vào pipeline tuyển dụng.`,
        badge: `${hiringRate}% được nhận`,
        tone: 'violet',
        icon: FileText,
      },
      {
        label: 'Doanh nghiệp',
        value: stats.companies,
        helper: `${formatNumber(stats.verifiedCompanies)} doanh nghiệp đã xác thực.`,
        badge: `${companyVerificationRate}% verified`,
        tone: 'amber',
        icon: Building2,
      },
    ],
    [accountHealth, activeAccounts, companyVerificationRate, hiringRate, stats, totalApplications]
  );

  const accountBreakdown = useMemo(
    () => [
      {
        label: 'Ứng viên',
        value: formatNumber(stats.candidateAccounts),
        tone: 'emerald',
      },
      {
        label: 'Nhà tuyển dụng',
        value: formatNumber(stats.recruiterAccounts),
        tone: 'blue',
      },
      {
        label: 'Admin',
        value: formatNumber(stats.adminAccounts),
        tone: 'violet',
      },
      {
        label: 'Đã khóa',
        value: formatNumber(stats.lockedAccounts),
        tone: 'rose',
      },
    ],
    [stats.adminAccounts, stats.candidateAccounts, stats.lockedAccounts, stats.recruiterAccounts]
  );

  const pipelineKpis = useMemo(() => {
    const total = totalApplications;

    return [
      {
        label: 'Đã nộp',
        value: stats.submittedCount || 0,
        icon: FileText,
        tone: 'slate',
        progress: calculatePercent(stats.submittedCount, total),
      },
      {
        label: 'Sàng lọc',
        value: stats.screeningCount || 0,
        icon: CheckCircle,
        tone: 'blue',
        progress: calculatePercent(stats.screeningCount, total),
      },
      {
        label: 'Phỏng vấn',
        value: stats.interviewCount || 0,
        icon: Users,
        tone: 'amber',
        progress: calculatePercent(stats.interviewCount, total),
      },
      {
        label: 'Được nhận',
        value: stats.hiredCount || 0,
        icon: TrendingUp,
        tone: 'emerald',
        progress: calculatePercent(stats.hiredCount, total),
      },
      {
        label: 'Từ chối',
        value: stats.rejectedCount || 0,
        icon: XCircle,
        tone: 'rose',
        progress: calculatePercent(stats.rejectedCount, total),
      },
    ];
  }, [stats, totalApplications]);

  const aiUsageItems = useMemo(
    () => [
      {
        label: 'Lượt chatbot',
        value: stats.chatbotConversations || 0,
        icon: MessageSquare,
        tone: 'indigo',
        helper: 'Số phiên AI chat được kích hoạt trong hệ thống.',
      },
      {
        label: 'CV scans',
        value: stats.cvScans || 0,
        icon: FileText,
        tone: 'violet',
        helper: 'Lượt phân tích CV tự động phục vụ screening.',
      },
    ],
    [stats]
  );

  const applicationTypeMix = useMemo(() => {
    if (!Array.isArray(charts.applicationStats)) return [];

    return charts.applicationStats
      .map((item) => ({
        label: String(item?.name ?? 'Khác'),
        value: Number(item?.value ?? 0) || 0,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [charts.applicationStats]);

  const taxonomySkills = useMemo(
    () =>
      (Array.isArray(stats.topSkills) ? stats.topSkills : []).slice(0, 8).map((item, index) => ({
        label: String(item?.name ?? item?.skill ?? `Kỹ năng ${index + 1}`),
        value: Number(item?.count ?? item?.value ?? 0) || 0,
      })),
    [stats.topSkills]
  );

  const taxonomyIndustries = useMemo(
    () =>
      (Array.isArray(stats.topIndustries) ? stats.topIndustries : []).slice(0, 6).map((item, index) => ({
        label: String(item?.name ?? item?.industry ?? `Ngành ${index + 1}`),
        value: Number(item?.count ?? item?.value ?? 0) || 0,
      })),
    [stats.topIndustries]
  );

  const taxonomyLocations = useMemo(
    () =>
      (Array.isArray(stats.topLocations) ? stats.topLocations : []).slice(0, 6).map((item, index) => ({
        label: String(item?.name ?? item?.location ?? `Địa điểm ${index + 1}`),
        value: Number(item?.count ?? item?.value ?? 0) || 0,
      })),
    [stats.topLocations]
  );

  const userGrowthSeries = useMemo(
    () => normalizeTimeSeries(charts.userGrowth, 'users'),
    [charts.userGrowth]
  );

  const jobGrowthSeries = useMemo(
    () => normalizeTimeSeries(charts.jobStats, 'jobs'),
    [charts.jobStats]
  );

  const userChartSeries = useMemo(
    () => aggregateSeries(userGrowthSeries, timeFilter, 'users'),
    [timeFilter, userGrowthSeries]
  );

  const jobChartSeries = useMemo(
    () => aggregateSeries(jobGrowthSeries, timeFilter, 'jobs'),
    [jobGrowthSeries, timeFilter]
  );

  const userChartTotal = useMemo(
    () => userChartSeries.reduce((sum, item) => sum + (Number(item.users) || 0), 0),
    [userChartSeries]
  );

  const jobChartTotal = useMemo(
    () => jobChartSeries.reduce((sum, item) => sum + (Number(item.jobs) || 0), 0),
    [jobChartSeries]
  );

  const timeFilterLabel = TIME_FILTERS.find((item) => item.id === timeFilter)?.label || 'Theo tháng';

  const timeFilterHint = useMemo(() => {
    if (timeFilter === 'quarter') {
      return 'Gộp dữ liệu thành 4 quý để so sánh nhịp tăng trưởng rõ hơn.';
    }

    if (timeFilter === 'year') {
      return 'Hiển thị tổng lũy kế 12 tháng gần nhất cho góc nhìn dài hạn.';
    }

    return 'Hiển thị dữ liệu theo từng tháng trong 12 tháng gần nhất.';
  }, [timeFilter]);

  const handleExportReport = useCallback(() => {
    try {
      setExporting(true);

      const rows = [
        ['Nhóm', 'Chỉ số', 'Giá trị'],
        ...overviewCards.map((item) => ['Tổng quan', item.label, String(item.value)]),
        ...pipelineKpis.map((item) => ['Pipeline tuyển dụng', item.label, String(item.value)]),
        ...aiUsageItems.map((item) => ['AI vận hành', item.label, String(item.value)]),
        ['AI chất lượng', 'Độ chính xác AI', `${stats.aiAccuracyScore || 0}%`],
        ['AI chất lượng', 'Spam phát hiện', String(stats.spamDetected || 0)],
        ['AI chất lượng', 'Tài khoản bị khóa', String(stats.flaggedAccounts || 0)],
        ['Taxonomy', 'Tổng kỹ năng', String(stats.totalSkills || 0)],
        ['Taxonomy', 'Tổng ngành nghề', String(stats.totalCategories || 0)],
        ['Taxonomy', 'Tổng địa điểm', String(stats.totalLocations || 0)],
        ...taxonomySkills.map((item) => ['Top kỹ năng', item.label, String(item.value)]),
        ...taxonomyIndustries.map((item) => ['Top ngành nghề', item.label, String(item.value)]),
        ...taxonomyLocations.map((item) => ['Top địa điểm', item.label, String(item.value)]),
        ...userChartSeries.map((item) => [`Người dùng mới (${timeFilterLabel})`, item.label, String(item.users)]),
        ...jobChartSeries.map((item) => [`Tin tuyển dụng (${timeFilterLabel})`, item.label, String(item.jobs)]),
      ];

      downloadCsv(`analytics-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
      showNotification('Đã xuất báo cáo phân tích', 'success');
    } catch (error) {
      console.error('Export analytics report error:', error);
      showNotification('Không thể xuất báo cáo phân tích', 'error');
    } finally {
      setExporting(false);
    }
  }, [
    aiUsageItems,
    jobChartSeries,
    overviewCards,
    pipelineKpis,
    showNotification,
    stats.aiAccuracyScore,
    stats.flaggedAccounts,
    stats.spamDetected,
    stats.totalCategories,
    stats.totalLocations,
    stats.totalSkills,
    taxonomyIndustries,
    taxonomyLocations,
    taxonomySkills,
    timeFilterLabel,
    userChartSeries,
  ]);

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_36%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_32%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                  <BarChart3 className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div className="max-w-3xl">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    Analytics workspace
                  </span>
                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    Phân tích hệ thống
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Theo dõi nhịp tăng trưởng người dùng, hiệu quả tuyển dụng, chất lượng dữ liệu và mức độ
                    vận hành AI trên toàn bộ nền tảng. Trang được tinh gọn lại để giảm số lượng card, ưu tiên
                    các nhóm chỉ số có tác động trực tiếp đến vận hành.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {overviewCards.map((item) => (
                  <OverviewCard
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                    helper={item.helper}
                    badge={item.badge}
                    tone={item.tone}
                  />
                ))}
              </div>
            </div>

            <div className="flex w-full self-start flex-col gap-3 lg:max-w-[320px]">
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
                  onClick={fetchData}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Làm mới
                </Button>

                <Button
                  type="button"
                  className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  onClick={handleExportReport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Xuất báo cáo
                </Button>
              </div>

              <div className="rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Sức khỏe tài khoản
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">{accountHealth}%</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${accountHealth}%` }} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {accountBreakdown.map((item) => {
                    const toneStyle = TONE_STYLES[item.tone] || TONE_STYLES.slate;

                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                      >
                        <p className="text-sm font-medium text-slate-600">{item.label}</p>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                            toneStyle.badge
                          )}
                        >
                          {item.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <SectionCard
            icon={TrendingUp}
            title="Tuyển dụng & chuyển đổi"
            description="Gộp toàn bộ pipeline vào một khối để nhìn nhanh khả năng đi tiếp của hồ sơ và chất lượng đầu vào."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  {formatNumber(totalApplications)} hồ sơ
                </Badge>
                <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Hired {hiringRate}%
                </Badge>
                <Badge className="rounded-full border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                  Reject {rejectionRate}%
                </Badge>
              </div>
            }
          >
            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Toàn cảnh pipeline
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">Từ hồ sơ vào đến quyết định tuyển dụng</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Phần này tập trung vào những chỉ số giúp admin và đội vận hành đánh giá hiệu quả xử lý hồ sơ
                  thay vì tách thành nhiều ô nhỏ rời rạc.
                </p>

                <div className="mt-5 space-y-3">
                  <InsightItem
                    label="Tổng hồ sơ"
                    value={`${formatNumber(totalApplications)} hồ sơ`}
                    tone="slate"
                    helper="Toàn bộ ứng viên đã đi qua pipeline tuyển dụng."
                  />
                  <InsightItem
                    label="Tỷ lệ được nhận"
                    value={`${hiringRate}%`}
                    tone="emerald"
                    helper={
                      stats.hiredCount
                        ? `${formatNumber(stats.hiredCount)} hồ sơ đã được nhận`
                        : 'Chưa có hồ sơ được nhận trong tập dữ liệu'
                    }
                  />
                  <InsightItem
                    label="Tỷ lệ từ chối"
                    value={`${rejectionRate}%`}
                    tone="rose"
                    helper={
                      stats.rejectedCount
                        ? `${formatNumber(stats.rejectedCount)} hồ sơ bị từ chối`
                        : 'Chưa có hồ sơ từ chối trong tập dữ liệu'
                    }
                  />
                  <InsightItem
                    label="Tin chờ duyệt"
                    value={formatNumber(stats.pendingJobApprovals || 0)}
                    tone="amber"
                    helper="Khối lượng tuyển dụng mới có thể tác động tới pipeline sắp tới."
                  />
                </div>

                {applicationTypeMix.length ? (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Loại công việc nhận hồ sơ
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {applicationTypeMix.map((item) => (
                        <Badge
                          key={item.label}
                          className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                        >
                          {item.label}: {formatNumber(item.value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                <div className="grid divide-y divide-slate-200 md:grid-cols-5 md:divide-x md:divide-y-0">
                  {pipelineKpis.map((item) => (
                    <PipelineStep
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      progress={item.progress}
                      tone={item.tone}
                    />
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={BrainCircuit}
            title="AI & chất lượng dữ liệu"
            description="Nhóm lại theo 2 mục tiêu rõ ràng: khối lượng sử dụng AI và các tín hiệu kiểm soát chất lượng."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {formatNumber(aiUsageTotal)} tương tác AI
                </Badge>
                <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Accuracy {formatNumber(stats.aiAccuracyScore)}%
                </Badge>
              </div>
            }
          >
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Khối lượng sử dụng
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">Tương tác AI trong vận hành</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Theo dõi khối lượng xử lý của các mô-đun AI đang tham gia trực tiếp vào trải nghiệm tuyển dụng.
                    </p>
                  </div>

                  <div className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-right shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Tổng</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">{formatNumber(aiUsageTotal)}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {aiUsageItems.map((item) => (
                    <MetricRow
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      helper={item.helper}
                      tone={item.tone}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Chất lượng & rủi ro
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">Kiểm soát đầu ra và cảnh báo</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Giữ lại các chỉ số thật sự quan trọng cho vận hành: độ chính xác AI, spam và tài khoản bị khóa.
                </p>

                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/75 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-inset ring-emerald-100">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                          Độ chính xác AI
                        </p>
                        <p className="mt-1 text-sm text-emerald-800/90">
                          Chỉ số tổng hợp của các mô-đun đang phục vụ matching và screening.
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-950">{formatNumber(stats.aiAccuracyScore)}%</p>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/90">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#10b981_0%,#34d399_100%)]"
                      style={{ width: `${Math.min(100, Math.max(0, stats.aiAccuracyScore || 0))}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <MetricRow
                    icon={ShieldAlert}
                    label="Spam phát hiện"
                    value={stats.spamDetected || 0}
                    helper="Nội dung hoặc tín hiệu bị gắn cờ trong quá trình kiểm soát."
                    tone="rose"
                  />
                  <MetricRow
                    icon={AlertTriangle}
                    label="Tài khoản bị khóa"
                    value={stats.flaggedAccounts || 0}
                    helper="Tài khoản vi phạm hoặc bị tạm khóa để rà soát thêm."
                    tone="orange"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={Tags}
            title="Taxonomy dữ liệu"
            description="Ba cụm xếp hạng được gom chung vào một mặt phẳng để đọc nhanh mà không bị chia cắt quá nhiều."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  {formatNumber(stats.totalSkills)} kỹ năng
                </Badge>
                <Badge className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {formatNumber(stats.totalCategories)} ngành nghề
                </Badge>
                <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {formatNumber(stats.totalLocations)} địa điểm
                </Badge>
              </div>
            }
          >
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
              <div className="grid divide-y divide-slate-200 xl:grid-cols-3 xl:divide-x xl:divide-y-0">
                <RankedColumn
                  icon={Tags}
                  title="Top kỹ năng"
                  description="Những skill xuất hiện hoặc được tra cứu nhiều nhất trong taxonomy."
                  items={taxonomySkills}
                  emptyMessage="Chưa có dữ liệu kỹ năng nổi bật."
                  tone="violet"
                />
                <RankedColumn
                  icon={Building2}
                  title="Top ngành nghề"
                  description="Nhóm ngành đang có tần suất quan tâm và tương tác cao nhất."
                  items={taxonomyIndustries}
                  emptyMessage="Chưa có dữ liệu ngành nghề nổi bật."
                  tone="amber"
                />
                <RankedColumn
                  icon={Globe}
                  title="Top địa điểm"
                  description="Những khu vực được gắn vào dữ liệu hoặc tìm kiếm nhiều nhất."
                  items={taxonomyLocations}
                  emptyMessage="Chưa có dữ liệu địa điểm nổi bật."
                  tone="emerald"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={BarChart3}
            title="Biểu đồ tăng trưởng"
            description={timeFilterHint}
            action={
              <div className="flex rounded-xl border border-slate-200 bg-slate-100/90 p-1">
                {TIME_FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTimeFilter(item.id)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                      timeFilter === item.id
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/40">
                <div className="border-b border-slate-200 bg-white px-6 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950">Người dùng mới</h3>
                        <p className="mt-1 text-sm text-slate-500">{timeFilterHint}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {timeFilterLabel}
                      </p>
                      <p className="mt-1 text-lg font-bold text-emerald-700">{formatNumber(userChartTotal)}</p>
                    </div>
                  </div>
                </div>

                <div className="h-[340px] bg-white p-6">
                  <ChartSurface className="h-full" minChartHeight={260}>
                    <ComposedChart data={userChartSeries} margin={{ top: 16, right: 12, left: -20, bottom: 8 }}>
                      <defs>
                        <linearGradient id="analyticsUserArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" tick={CHART_MUTED_TICK_STYLE} axisLine={false} tickLine={false} />
                      <YAxis tick={CHART_MUTED_TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        content={<ChartTooltip valueSuffix="người" />}
                        cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                      />
                      <Area type="monotone" dataKey="users" stroke="none" fill="url(#analyticsUserArea)" />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#10b981"
                        strokeWidth={3.5}
                        dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 7, strokeWidth: 0 }}
                      />
                    </ComposedChart>
                  </ChartSurface>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/40">
                <div className="border-b border-slate-200 bg-white px-6 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950">Tin tuyển dụng</h3>
                        <p className="mt-1 text-sm text-slate-500">{timeFilterHint}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {timeFilterLabel}
                      </p>
                      <p className="mt-1 text-lg font-bold text-blue-700">{formatNumber(jobChartTotal)}</p>
                    </div>
                  </div>
                </div>

                <div className="h-[340px] bg-white p-6">
                  <ChartSurface className="h-full" minChartHeight={260}>
                    <AreaChart data={jobChartSeries} margin={{ top: 16, right: 12, left: -20, bottom: 8 }}>
                      <defs>
                        <linearGradient id="analyticsJobArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" tick={CHART_MUTED_TICK_STYLE} axisLine={false} tickLine={false} />
                      <YAxis tick={CHART_MUTED_TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        content={<ChartTooltip valueSuffix="tin" />}
                        cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="jobs"
                        stroke="#3b82f6"
                        strokeWidth={3.5}
                        fill="url(#analyticsJobArea)"
                        activeDot={{ r: 7, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ChartSurface>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalyticsPage;
