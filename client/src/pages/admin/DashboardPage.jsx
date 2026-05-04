import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Clock3,
  FileText,
  RefreshCw,
  Users,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';

import ChartSurface, {
  CHART_MUTED_TICK_STYLE,
  CHART_TOOLTIP_STYLE,
} from '@/components/charts/ChartSurface';
import { AdminActivityFeed, AdminStatCard, PageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/context/NotificationContext';
import adminService from '@/services/adminService';

const EMPTY_STATS = {
  users: 0,
  jobs: 0,
  applications: 0,
  companies: 0,
};

const toNumber = (value) => Number(value) || 0;

const formatNumber = (value) => toNumber(value).toLocaleString('vi-VN');

function getResponseData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function normalizeStats(data) {
  if (!data || typeof data !== 'object') return EMPTY_STATS;

  return {
    users: toNumber(data.users ?? data.totalUsers),
    jobs: toNumber(data.jobs ?? data.totalJobs),
    applications: toNumber(data.applications ?? data.totalApplications),
    companies: toNumber(data.companies ?? data.totalCompanies),
  };
}

function normalizeApplicationTrend(rows) {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((item) => ({
      name: item?.name || item?.label || item?.date || '',
      applications: toNumber(item?.applications ?? item?.value ?? item?.count),
    }))
    .filter((item) => item.name);
}

function formatSnapshotTime(value) {
  if (!value) return 'Đang cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Đang cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

const DashboardPage = () => {
  const { showNotification } = useNotification();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [applicationTrend, setApplicationTrend] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState('');
  const [logRefTime, setLogRefTime] = useState(Date.now());
  const [refreshedAt, setRefreshedAt] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setLogsLoading(true);
    setError('');

    try {
      const [statsResult, chartResult, logsResult] = await Promise.allSettled([
        adminService.getStats(),
        adminService.getChartStats(),
        adminService.getLogs({ limit: 8 }),
      ]);

      if (statsResult.status === 'fulfilled' && statsResult.value.data?.success) {
        setStats(normalizeStats(getResponseData(statsResult.value)));
      } else {
        throw statsResult.reason || new Error('Không thể tải số liệu tổng quan.');
      }

      if (chartResult.status === 'fulfilled' && chartResult.value.data?.success) {
        const chartPayload = getResponseData(chartResult.value) || {};
        setApplicationTrend(normalizeApplicationTrend(chartPayload.applicationTrend));
      } else {
        setApplicationTrend([]);
      }

      if (logsResult.status === 'fulfilled' && logsResult.value.data?.success) {
        const logPayload = getResponseData(logsResult.value);
        setLogs(Array.isArray(logPayload) ? logPayload : []);
      } else {
        setLogs([]);
      }

      setRefreshedAt(new Date());
      setLogRefTime(Date.now());
    } catch (fetchError) {
      const message =
        fetchError?.response?.data?.message || 'Không thể tải dữ liệu tổng quan quản trị.';
      setError(message);
      showNotification(message, 'error');
    } finally {
      setLoading(false);
      setLogsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const statCards = useMemo(
    () => [
      {
        title: 'Người dùng',
        value: loading ? '—' : formatNumber(stats.users),
        icon: Users,
        color: 'emerald',
        description: 'Tất cả tài khoản admin, nhà tuyển dụng và ứng viên.',
      },
      {
        title: 'Tin tuyển dụng',
        value: loading ? '—' : formatNumber(stats.jobs),
        icon: Briefcase,
        color: 'blue',
        description: 'Tổng tin tuyển dụng trong hệ thống quản trị.',
      },
      {
        title: 'Ứng tuyển',
        value: loading ? '—' : formatNumber(stats.applications),
        icon: FileText,
        color: 'violet',
        description: 'Hồ sơ ứng viên đã nộp vào các tin tuyển dụng.',
      },
      {
        title: 'Công ty',
        value: loading ? '—' : formatNumber(stats.companies),
        icon: Building2,
        color: 'amber',
        description: 'Hồ sơ doanh nghiệp và nhà tuyển dụng cần quản lý.',
      },
    ],
    [loading, stats]
  );

  return (
    <div className="space-y-7 pb-10">
      <PageHeader
        icon={Clock3}
        eyebrow="Tổng quan quản trị"
        badge="Dữ liệu API thật"
        title="Bảng tổng quan tuyển dụng"
        description="Theo dõi các chỉ số vận hành cốt lõi: người dùng, tin tuyển dụng, ứng tuyển và công ty. Dữ liệu được lấy trực tiếp từ API quản trị, không dùng dữ liệu giả."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={fetchDashboard}
            disabled={loading}
            className="self-start"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </Button>
        }
      >
        <p className="text-xs font-semibold text-slate-400">
          Cập nhật lần cuối: {refreshedAt ? formatSnapshotTime(refreshedAt) : 'Đang cập nhật'}
        </p>
      </PageHeader>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Không tải được dữ liệu tổng quan</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => (
          <AdminStatCard key={card.title} delay={index * 50} {...card} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Ứng tuyển theo thời gian</h2>
              <p className="mt-1 text-sm text-slate-500">
                Biểu đồ đơn giản thể hiện số hồ sơ ứng tuyển mới theo ngày.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="h-[320px] animate-pulse rounded-2xl bg-slate-100" />
          ) : applicationTrend.length === 0 ? (
            <div className="flex h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <FileText className="h-9 w-9 text-slate-400" />
              <p className="mt-3 font-semibold text-slate-700">
                Chưa có dữ liệu ứng tuyển theo thời gian
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Khi ứng viên nộp hồ sơ, biểu đồ sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="h-[320px]">
              <ChartSurface className="h-full" minChartHeight={300}>
                <LineChart
                  data={applicationTrend}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="name"
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
                  <RechartsTooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value) => [formatNumber(value), 'Ứng tuyển']}
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartSurface>
            </div>
          )}
        </div>

        <AdminActivityFeed
          className="xl:col-span-4"
          logs={logs}
          loading={logsLoading}
          nowTs={logRefTime}
          maxItems={8}
        />
      </section>
    </div>
  );
};

export default DashboardPage;
