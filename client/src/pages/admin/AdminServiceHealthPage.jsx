import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  RefreshCw,
  Briefcase,
  CheckCircle2,
  Database,
  HeartPulse,
  ServerCog,
  Shield,
  Sparkles,
  Users,
  AlertTriangle,
  MinusCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import adminService from '../../services/adminService';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils';

/** ok → operational, degraded → monitoring (cảnh báo), thiếu dữ liệu → unknown */
const mapStatus = (status) => {
  if (status === 'ok') return 'operational';
  if (status === 'degraded') return 'monitoring';
  if (status == null || status === '') return 'unknown';
  return 'monitoring';
};

const STATUS_META = {
  operational: {
    label: 'Ổn định',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/10',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    border: 'border-l-emerald-500',
  },
  monitoring: {
    label: 'Cần theo dõi',
    badge: 'bg-amber-50 text-amber-800 border-amber-200 shadow-sm shadow-amber-500/10',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    border: 'border-l-amber-500',
  },
  degraded: {
    label: 'Suy giảm',
    badge: 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-500/10',
    bar: 'bg-red-500',
    dot: 'bg-red-500',
    border: 'border-l-red-500',
  },
  unknown: {
    label: 'Chưa xác định',
    badge: 'bg-slate-50 text-slate-600 border-slate-200',
    bar: 'bg-slate-400',
    dot: 'bg-slate-400',
    border: 'border-l-slate-400',
  },
};

const AdminServiceHealthPage = () => {
  const [gatewayHealth, setGatewayHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, statsRes] = await Promise.all([
        adminService.getServiceHealth().then((response) => response.data),
        adminService.getStats().then((response) => {
          const data = response.data?.data;
          if (!data || typeof data !== 'object') return null;
          return {
            users: Number(data.users) || 0,
            jobs: Number(data.jobs) || 0,
            applications: Number(data.applications) || 0,
            pipeline: data.pipeline || {},
          };
        }),
      ]);
      setGatewayHealth(healthRes);
      setStats(statsRes);
      setRefreshedAt(new Date());
    } catch (error) {
      console.error('Error loading service health:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const services = useMemo(() => {
    const hasScreeningLoad = (stats?.pipeline?.screening || 0) > 0;
    const serviceMap = gatewayHealth?.services || {};

    return [
      {
        name: 'Cổng vào API',
        status: gatewayHealth ? mapStatus(gatewayHealth?.status) : 'unknown',
        detail: gatewayHealth?.service || 'gateway-server',
        icon: ServerCog,
        hint: 'Health endpoint & process',
      },
      {
        name: 'Cơ sở dữ liệu',
        status: gatewayHealth
          ? gatewayHealth?.database === 'ok'
            ? 'operational'
            : 'degraded'
          : 'unknown',
        detail:
          gatewayHealth?.database === 'ok'
            ? 'Connected'
            : gatewayHealth?.database || 'Đang chờ kiểm tra',
        icon: Database,
        hint: 'MySQL / Kết nối pool',
      },
      {
        name: 'Dịch vụ xác thực',
        status: gatewayHealth ? mapStatus(serviceMap.auth?.status) : 'unknown',
        detail:
          serviceMap.auth?.error ||
          (serviceMap.auth?.status === 'ok' ? 'Đang hoạt động' : 'Không có báo cáo chi tiết'),
        icon: Shield,
        hint: 'JWT & Session Management',
      },
      {
        name: 'Dịch vụ việc làm',
        status: gatewayHealth ? mapStatus(serviceMap.jobs?.status) : 'unknown',
        detail:
          serviceMap.jobs?.error ||
          `${stats?.jobs?.toLocaleString('vi-VN') ?? 0} tin tuyển dụng trên hệ thống`,
        icon: Briefcase,
        hint: 'Jobs Engine',
      },
      {
        name: 'Dịch vụ ứng viên',
        status: gatewayHealth ? mapStatus(serviceMap.candidates?.status) : 'unknown',
        detail:
          serviceMap.candidates?.error ||
          `${stats?.applications?.toLocaleString('vi-VN') ?? 0} hồ sơ ứng tuyển`,
        icon: Users,
        hint: 'Applications Pipeline',
      },
      {
        name: 'Dịch vụ AI',
        status: gatewayHealth
          ? serviceMap.ai?.status && serviceMap.ai.status !== 'ok'
            ? mapStatus(serviceMap.ai.status)
            : hasScreeningLoad
              ? 'monitoring'
              : 'operational'
          : 'unknown',
        detail: serviceMap.ai?.error
          ? serviceMap.ai.error
          : hasScreeningLoad
            ? `${stats?.pipeline?.screening || 0} hồ sơ đang sàng lọc AI`
            : 'Sẵn sàng xử lý',
        icon: Sparkles,
        hint: 'Screening & Embedding',
      },
    ];
  }, [gatewayHealth, stats]);

  const healthSummary = useMemo(() => {
    const total = services.length;
    const operational = services.filter((s) => s.status === 'operational').length;
    const monitoring = services.filter((s) => s.status === 'monitoring').length;
    const degraded = services.filter((s) => s.status === 'degraded').length;
    const unknown = services.filter((s) => s.status === 'unknown').length;
    const score = total > 0 ? Math.round((operational / total) * 100) : 0;
    return { total, operational, monitoring, degraded, unknown, score };
  }, [services]);

  const formatTime = (d) =>
    d
      ? new Intl.DateTimeFormat('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
        }).format(d)
      : '—';

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white p-8 shadow-premium">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-2 text-xs font-bold uppercase tracking-normal text-emerald-700 border border-emerald-100 shadow-sm">
                <HeartPulse size={14} className="shrink-0" strokeWidth={2.5} />
                Service Health System
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-normal text-slate-900">Sức khỏe Hệ thống</h1>
            <p className="max-w-xl text-base font-semibold text-slate-500 leading-relaxed italic opacity-80">
              Tổng hợp health check từ gateway và các module nghiệp vụ để giám sát hiệu năng nền
              tảng Emerald.
            </p>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-normal pt-2">
              <div className="flex items-center gap-1.5">
                <Clock size={14} /> Cập nhật lần cuối:{' '}
                <span className="text-slate-900">{formatTime(refreshedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
            <Button
              onClick={fetchHealth}
              disabled={loading}
              variant="outline"
              className="h-12 rounded-xl border-slate-200 bg-white font-bold uppercase tracking-normal shadow-sm hover:bg-slate-50 min-w-[180px]"
            >
              {loading ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : (
                <RefreshCw size={18} className="mr-2" />
              )}
              Làm mới
            </Button>
            <div className="rounded-xl bg-slate-900 p-6 text-center shadow-xl shadow-slate-900/20 min-w-[180px]">
              <p className="text-xs font-bold uppercase tracking-normal text-white/50">
                System Score
              </p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-emerald-400">
                {loading ? '...' : `${healthSummary.score}%`}
              </p>
              <div className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1 bg-white/10 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase">
                  {healthSummary.operational}/{healthSummary.total} OK
                </span>
              </div>
            </div>
          </div>
        </div>

        {!loading && (
          <div className="mt-8 flex flex-wrap gap-2 pt-8 border-t border-slate-100">
            {[
              {
                n: healthSummary.operational,
                label: 'Ổn định',
                Icon: CheckCircle2,
                cls: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              },
              {
                n: healthSummary.monitoring,
                label: 'Theo dõi',
                Icon: AlertTriangle,
                cls: 'bg-amber-50 text-amber-700 border-amber-100',
              },
              {
                n: healthSummary.degraded,
                label: 'Suy giảm',
                Icon: AlertTriangle,
                cls: 'bg-red-50 text-red-700 border-red-100',
              },
              {
                n: healthSummary.unknown,
                label: 'Chưa rõ',
                Icon: MinusCircle,
                cls: 'bg-slate-50 text-slate-600 border-slate-100',
              },
            ].map(({ n, label, Icon, cls }) => (
              <span
                key={label}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-normal border shadow-sm',
                  cls
                )}
              >
                <Icon size={14} strokeWidth={2.5} />
                {n} {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 h-[200px]"
              />
            ))
          : services.map((service) => {
              const meta = STATUS_META[service.status] || STATUS_META.unknown;
              const Icon = service.icon;
              return (
                <div
                  key={service.name}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1',
                    service.status === 'operational'
                      ? 'hover:border-emerald-500/30'
                      : 'hover:border-amber-500/30'
                  )}
                >
                  <div className={cn('absolute inset-y-0 left-0 w-1.5', meta.bar)} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-900 border border-slate-100 ring-4 ring-slate-500/5">
                        <Icon size={22} strokeWidth={2.5} />
                      </div>
                      <span
                        className={cn(
                          'rounded-lg px-3.5 py-2 text-xs font-bold uppercase tracking-normal border',
                          meta.badge
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-5">
                      <p className="text-xs font-bold uppercase tracking-normal text-slate-400 mb-1">
                        {service.hint}
                      </p>
                      <h2 className="text-lg font-bold tracking-normal text-slate-900 line-clamp-1">
                        {service.name}
                      </h2>
                      <p className="mt-2 text-sm font-semibold text-slate-500 line-clamp-2 italic leading-relaxed">
                        {service.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      <div className="rounded-[2.5rem] border border-slate-200/60 bg-white p-8 shadow-premium">
        <h2 className="text-xs font-bold uppercase tracking-normal text-slate-400 mb-6">
          Vận hành Gateway & Database
        </h2>
        <div className="grid gap-px bg-slate-100 overflow-hidden rounded-xl border border-slate-100 sm:grid-cols-3 shadow-inner">
          {[
            {
              label: 'Gateway API',
              value: gatewayHealth?.status || (loading ? '...' : 'unknown'),
              sub: gatewayHealth?.service || 'N/A',
              ok: gatewayHealth?.status === 'ok',
            },
            {
              label: 'Cơ sở dữ liệu',
              value: gatewayHealth?.database || (loading ? '...' : 'unknown'),
              sub: 'Ping Pool & Latency',
              ok: gatewayHealth?.database === 'ok',
            },
            {
              label: 'Backlog AI',
              value: loading ? '...' : String(stats?.pipeline?.screening ?? 0),
              sub: 'Số lượng hồ sơ đang chờ',
              ok: (stats?.pipeline?.screening || 0) < 10,
            },
          ].map((row) => (
            <div key={row.label} className="bg-white p-6 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-normal text-slate-500">
                  {row.label}
                </span>
                {row.ok ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-500" />
                )}
              </div>
              <p
                className={cn(
                  'text-2xl font-bold capitalize tabular-nums',
                  row.ok ? 'text-slate-900' : 'text-amber-600'
                )}
              >
                {row.value}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-normal">
                {row.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminServiceHealthPage;
