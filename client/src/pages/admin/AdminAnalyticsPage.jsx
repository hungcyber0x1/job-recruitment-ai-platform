import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ComposedChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Briefcase,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  Target,
} from 'lucide-react';
import ChartSurface from '@/components/charts/ChartSurface';
import AdminLayout from '../../layouts/AdminLayout';
import adminService from '../../services/adminService';

const EMPTY_STATS = {
  users: 0,
  jobs: 0,
  applications: 0,
  tickets: 0,
  revenue: 0,
};

const TIME_FILTERS = [
  { id: 'month', label: 'Theo tháng' },
  { id: 'quarter', label: 'Theo quý' },
  { id: 'year', label: 'Theo năm' },
];

/** %b từ MySQL thường là tiếng Anh — map sang nhãn ngắn gọn */
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

const ChartTooltip = ({ active, payload, label, valueSuffix }) => {
  if (!active || !payload?.length) return null;
  const n = Number(payload[0]?.value);
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-lg shadow-slate-200/50">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-base font-bold tabular-nums text-slate-900">
        {Number.isFinite(n) ? n.toLocaleString('vi-VN') : '—'}
        {valueSuffix ? (
          <span className="text-sm font-semibold text-slate-500"> {valueSuffix}</span>
        ) : null}
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

const AI_ACCURACY_ITEMS = [
  { label: 'Kỹ năng kỹ thuật', value: 0 },
  { label: 'Kinh nghiệm làm việc', value: 0 },
  { label: 'Văn hóa doanh nghiệp', value: 0 },
  { label: 'Kỳ vọng mức lương', value: 0 },
];

const AdminAnalyticsPage = () => {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [charts, setCharts] = useState({ userGrowth: [], jobStats: [], applicationStats: [] });
  const [timeFilter, setTimeFilter] = useState('month');
  const [searchData, setSearchData] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          adminService.getStats(),
          adminService.getChartStats(),
        ]);

        if (statsRes.data?.success) {
          const raw = statsRes.data.data || {};
          setStats({
            ...EMPTY_STATS,
            users: Number(raw.users) || 0,
            jobs: Number(raw.jobs) || 0,
            applications: Number(raw.applications) || 0,
            companies: Number(raw.companies) || 0,
            revenue: Number(raw.revenue) || EMPTY_STATS.revenue,
          });
        }

        if (chartRes.data?.success) {
          setCharts(chartRes.data.data || { userGrowth: [], jobStats: [], applicationStats: [] });
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };

    fetchData();
  }, []);

  const userGrowthChartData = useMemo(() => {
    const rows = charts.userGrowth;
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }
    return rows.map((row) => {
      const name = String(row.name ?? '').trim();
      return {
        label: MONTH_ABBR_VI[name] || name || '—',
        users: Number(row.users ?? row.value ?? 0) || 0,
      };
    });
  }, [charts.userGrowth]);

  const jobTrendChartData = useMemo(() => {
    const rows = charts.jobStats;
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }
    return rows.map((row) => {
      const name = String(row.name ?? '').trim();
      return {
        label: MONTH_ABBR_VI[name] || name || '—',
        jobs: Number(row.jobs ?? row.value ?? 0) || 0,
      };
    });
  }, [charts.jobStats]);

  const userChartSeries = useMemo(() => {
    if (userGrowthChartData.length > 0) return userGrowthChartData;
    return ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'].map((label) => ({ label, users: 0 }));
  }, [userGrowthChartData]);

  const jobChartSeries = useMemo(() => {
    if (jobTrendChartData.length > 0) return jobTrendChartData;
    return ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'].map((label) => ({ label, jobs: 0 }));
  }, [jobTrendChartData]);

  const userGrowthSummary = useMemo(() => {
    const sum = userGrowthChartData.reduce((a, d) => a + d.users, 0);
    return { sum, hasApiRows: userGrowthChartData.length > 0 };
  }, [userGrowthChartData]);

  const jobTrendSummary = useMemo(() => {
    const sum = jobTrendChartData.reduce((a, d) => a + d.jobs, 0);
    return { sum, hasApiRows: jobTrendChartData.length > 0 };
  }, [jobTrendChartData]);

  const kpis = useMemo(
    () => [
      {
        label: 'Tổng doanh thu',
        value: `${(stats.revenue || 0).toLocaleString('vi-VN')} VND`,
        trend: stats.revenue > 0 ? '+12.5%' : '0%',
        up: stats.revenue > 0,
        icon: DollarSign,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
      },
      {
        label: 'Người dùng mới',
        value: `${(stats.users || 0).toLocaleString('vi-VN')} User`,
        trend: stats.users > 0 ? '+8.2%' : '0%',
        up: stats.users > 0,
        icon: Users,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
      },
      {
        label: 'Tỷ lệ khớp AI',
        value: stats.applications > 0 ? '94.2%' : '0%',
        trend: stats.applications > 0 ? '+2.1%' : '0%',
        up: true,
        icon: Target,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
      },
      {
        label: 'Việc làm hoạt động',
        value: `${stats.jobs || 0} Tin`,
        trend: stats.jobs > 0 ? '-1.5%' : '0%',
        up: false,
        icon: Briefcase,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
      },
    ],
    [stats]
  );

  return (
    <AdminLayout>
      <div className="space-y-6 text-slate-900">
        {/* Header: Title + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Phân tích hệ thống chuyên sâu</h1>
              <p className="text-sm text-slate-500">
                Dữ liệu tổng hợp từ 30 ngày qua trên toàn hệ thống AI
              </p>
            </div>
          </div>
          <div className="relative max-w-md flex-1 lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm dữ liệu..."
              value={searchData}
              onChange={(e) => setSearchData(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Time filters + Thống kê hiệu suất */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Thống kê hiệu suất</h2>
            <div className="flex gap-2">
              {TIME_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTimeFilter(f.id)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                    timeFilter === f.id
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                      : 'border-slate-200 bg-white text-slate-500 hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-200"
                >
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-2 ${item.iconBg}`}>
                      <Icon size={20} className={item.iconColor} />
                    </div>
                    <span
                      className={`flex items-center gap-0.5 text-xs font-bold ${item.up ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {item.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {item.trend}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50/40 to-white px-5 py-4">
              <h3 className="text-base font-black text-slate-900">Người dùng mới theo tháng</h3>
              <p className="mt-1 text-xs text-slate-500">
                Đăng ký trong 12 tháng gần nhất
                {userGrowthSummary.hasApiRows ? (
                  <>
                    {' '}
                    ·{' '}
                    <span className="font-semibold text-slate-700">
                      {userGrowthSummary.sum.toLocaleString('vi-VN')} người
                    </span>
                  </>
                ) : (
                  <span className="text-amber-700/90"> · Chưa có dữ liệu từ hệ thống</span>
                )}
              </p>
            </div>
            <div className="h-[280px] min-h-[220px] w-full min-w-0 px-2 pb-2 pt-3 sm:px-4">
              <ChartSurface className="h-full" minChartHeight={220}>
                <ComposedChart
                  data={userChartSeries}
                  margin={{ top: 8, right: 8, left: -8, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="adminUserArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#e2e8f0"
                    vertical={false}
                    strokeOpacity={0.9}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    dy={4}
                  />
                  <YAxis
                    width={36}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    domain={[0, (max) => Math.max(Math.ceil(max * 1.12), 1)]}
                  />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={({ active, payload, label }) => (
                      <ChartTooltip
                        active={active}
                        payload={payload}
                        label={label}
                        valueSuffix="người đăng ký"
                      />
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="none"
                    fill="url(#adminUserArea)"
                    isAnimationActive
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ fill: '#059669', strokeWidth: 0, r: 3.5 }}
                    activeDot={{
                      fill: '#fff',
                      stroke: '#059669',
                      strokeWidth: 2,
                      r: 6,
                    }}
                    isAnimationActive
                  />
                </ComposedChart>
              </ChartSurface>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50/50 to-white px-5 py-4">
              <h3 className="text-base font-black text-slate-900">Tin tuyển dụng tạo theo tháng</h3>
              <p className="mt-1 text-xs text-slate-500">
                Số tin đăng trong 12 tháng gần nhất
                {jobTrendSummary.hasApiRows ? (
                  <>
                    {' '}
                    ·{' '}
                    <span className="font-semibold text-slate-700">
                      {jobTrendSummary.sum.toLocaleString('vi-VN')} tin
                    </span>
                  </>
                ) : (
                  <span className="text-amber-700/90"> · Chưa có dữ liệu từ hệ thống</span>
                )}
              </p>
            </div>
            <div className="h-[280px] min-h-[220px] w-full min-w-0 px-2 pb-2 pt-3 sm:px-4">
              <ChartSurface className="h-full" minChartHeight={220}>
                <AreaChart data={jobChartSeries} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
                  <defs>
                    <linearGradient id="adminJobArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.45} />
                      <stop offset="55%" stopColor="#6366f1" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#e2e8f0"
                    vertical={false}
                    strokeOpacity={0.9}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    dy={4}
                  />
                  <YAxis
                    width={36}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    domain={[0, (max) => Math.max(Math.ceil(max * 1.12), 1)]}
                  />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={({ active, payload, label }) => (
                      <ChartTooltip
                        active={active}
                        payload={payload}
                        label={label}
                        valueSuffix="tin"
                      />
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="jobs"
                    stroke="#0284c7"
                    strokeWidth={2.25}
                    fill="url(#adminJobArea)"
                    activeDot={{
                      fill: '#fff',
                      stroke: '#0284c7',
                      strokeWidth: 2,
                      r: 6,
                    }}
                    isAnimationActive
                  />
                </AreaChart>
              </ChartSurface>
            </div>
          </div>
        </div>

        {/* AI accuracy bars + Heatmap */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-base font-bold text-slate-900">Độ chính xác AI Khớp lệnh</h3>
            <div className="space-y-4">
              {AI_ACCURACY_ITEMS.map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Mật độ tuyển dụng (Heatmap)</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-500">Thấp</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-3 w-3 rounded-sm bg-emerald-500"
                      style={{ opacity: 0.2 + i * 0.16 }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Cao</span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Giờ cao điểm
                  </p>
                  <p className="mt-1 font-medium text-slate-900">14:00 - 16:00</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ngày bận rộn
                  </p>
                  <p className="mt-1 font-medium text-slate-900">Thứ 3 & Thứ 4</p>
                </div>
              </div>
              <a
                href="#heatmap-detail"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Xem chi tiết bản đồ
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Export report - bottom */}
        <div className="flex justify-end">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <Download size={18} />
            Xuất báo cáo
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;
