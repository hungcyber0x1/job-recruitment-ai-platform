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
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import adminService from '../../services/adminService';

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
    badge: 'bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/25',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    border: 'border-l-emerald-500',
  },
  monitoring: {
    label: 'Cần theo dõi',
    badge: 'bg-amber-500/12 text-amber-800 ring-1 ring-amber-500/25',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    border: 'border-l-amber-500',
  },
  degraded: {
    label: 'Suy giảm',
    badge: 'bg-red-500/12 text-red-700 ring-1 ring-red-500/25',
    bar: 'bg-red-500',
    dot: 'bg-red-500',
    border: 'border-l-red-500',
  },
  unknown: {
    label: 'Chưa xác định',
    badge: 'bg-slate-500/10 text-slate-600 ring-1 ring-slate-400/20',
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
        detail: gatewayHealth?.database || 'Đang chờ kiểm tra',
        icon: Database,
        hint: 'MySQL / kết nối pool',
      },
      {
        name: 'Dịch vụ xác thực',
        status: gatewayHealth ? mapStatus(serviceMap.auth?.status) : 'unknown',
        detail: serviceMap.auth?.error || serviceMap.auth?.status || 'Không có báo cáo chi tiết',
        icon: Shield,
        hint: 'JWT & session',
      },
      {
        name: 'Dịch vụ việc làm',
        status: gatewayHealth ? mapStatus(serviceMap.jobs?.status) : 'unknown',
        detail:
          serviceMap.jobs?.error ||
          `${stats?.jobs?.toLocaleString('vi-VN') ?? 0} tin tuyển dụng trong hệ thống`,
        icon: Briefcase,
        hint: 'Jobs module',
      },
      {
        name: 'Dịch vụ ứng viên',
        status: gatewayHealth ? mapStatus(serviceMap.candidates?.status) : 'unknown',
        detail:
          serviceMap.candidates?.error ||
          `${stats?.applications?.toLocaleString('vi-VN') ?? 0} hồ sơ ứng tuyển`,
        icon: Users,
        hint: 'Applications pipeline',
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
            : 'Không có backlog AI lớn',
        icon: Sparkles,
        hint: 'Sàng lọc & embedding',
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

  const healthModules = [
    {
      title: 'Gateway & dữ liệu',
      description: 'Điểm vào API, phiên bản service và ping cơ sở dữ liệu nền.',
      icon: ServerCog,
    },
    {
      title: 'Nghiệp vụ lõi',
      description: 'Auth, tin tuyển dụng, ứng viên và tải AI theo số liệu thật.',
      icon: Activity,
    },
    {
      title: 'Mở rộng vận hành',
      description: 'Sẵn sàng gắn SLA, hàng đợi, cảnh báo PagerDuty / Slack.',
      icon: HeartPulse,
    },
  ];

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
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-8 pb-10">
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-emerald-500/[0.07] via-card to-card p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-300">
                <HeartPulse size={14} className="shrink-0" strokeWidth={2.5} />
                Service health
              </span>
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Theo dõi sức khỏe hệ thống
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Tổng hợp health check từ gateway và các module để nhanh chóng phát hiện điểm nghẽn
                trước khi ảnh hưởng ứng viên và nhà tuyển dụng.
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Cập nhật lần cuối:{' '}
                <span className="font-bold text-foreground">{formatTime(refreshedAt)}</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row lg:flex-col lg:items-end">
              <button
                type="button"
                onClick={() => fetchHealth()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition hover:bg-muted/60 disabled:opacity-60"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Làm mới
              </button>
              <div className="rounded-2xl border border-border/80 bg-background/80 px-5 py-4 text-center shadow-inner backdrop-blur-sm sm:min-w-[140px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Điểm tổng quan
                </p>
                <p className="mt-1 text-3xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                  {loading ? '…' : `${healthSummary.score}%`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {healthSummary.operational}/{healthSummary.total} thành phần ổn định
                </p>
              </div>
            </div>
          </div>

          {!loading && (
            <div className="relative mt-6 flex flex-wrap gap-2">
              {[
                {
                  key: 'ok',
                  n: healthSummary.operational,
                  label: 'Ổn định',
                  Icon: CheckCircle2,
                  cls: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
                },
                {
                  key: 'watch',
                  n: healthSummary.monitoring,
                  label: 'Theo dõi',
                  Icon: AlertTriangle,
                  cls: 'bg-amber-500/10 text-amber-900 dark:text-amber-200',
                },
                {
                  key: 'bad',
                  n: healthSummary.degraded,
                  label: 'Suy giảm',
                  Icon: AlertTriangle,
                  cls: 'bg-red-500/10 text-red-800 dark:text-red-200',
                },
                {
                  key: 'unk',
                  n: healthSummary.unknown,
                  label: 'Chưa rõ',
                  Icon: MinusCircle,
                  cls: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
                },
              ].map(({ key, n, label, Icon, cls }) => (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${cls}`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                  {n} {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-6">
                  <div className="flex justify-between">
                    <div className="h-12 w-12 rounded-xl bg-muted" />
                    <div className="h-7 w-24 rounded-full bg-muted" />
                  </div>
                  <div className="mt-5 h-6 w-3/4 rounded-lg bg-muted" />
                  <div className="mt-3 h-4 w-full rounded bg-muted/70" />
                </div>
              ))
            : services.map((service) => {
                const meta = STATUS_META[service.status] || STATUS_META.unknown;
                const Icon = service.icon;
                return (
                  <div
                    key={service.name}
                    className={`group relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:border-emerald-500/20 hover:shadow-md ${meta.border} border-l-[3px]`}
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 text-emerald-700 ring-1 ring-emerald-500/15 dark:text-emerald-400">
                          <Icon size={22} strokeWidth={2} />
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <h2 className="mt-4 text-lg font-black tracking-tight text-foreground">
                        {service.name}
                      </h2>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                        {service.hint}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {service.detail}
                      </p>
                    </div>
                    <div
                      className={`h-1 w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${meta.bar} opacity-80`}
                      aria-hidden
                    />
                  </div>
                );
              })}
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.15em] text-muted-foreground">
            Phạm vi giám sát
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {healthModules.map((module) => {
              const MIcon = module.icon;
              return (
                <div
                  key={module.title}
                  className="flex gap-4 rounded-2xl border border-dashed border-border/90 bg-muted/20 p-5 transition-colors hover:bg-muted/35"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-emerald-600 shadow-sm ring-1 ring-border dark:text-emerald-400">
                    <MIcon size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground">{module.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
          <div className="border-b border-border/60 bg-muted/30 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-black text-foreground">Tóm tắt vận hành</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Chỉ số nhanh từ gateway và hàng đợi AI hiện tại.
            </p>
          </div>
          <div className="grid gap-px bg-border/60 sm:grid-cols-3">
            {[
              {
                label: 'Gateway',
                value: gatewayHealth?.status || (loading ? '…' : 'không rõ'),
                sub: gatewayHealth?.service || '—',
                ok: gatewayHealth?.status === 'ok',
              },
              {
                label: 'Database',
                value: gatewayHealth?.database || (loading ? '…' : 'không rõ'),
                sub: 'Ping pool',
                ok: gatewayHealth?.database === 'ok',
              },
              {
                label: 'Backlog AI',
                value: loading ? '…' : String(stats?.pipeline?.screening ?? 0),
                sub: 'Hồ sơ đang sàng lọc',
                ok: (stats?.pipeline?.screening || 0) < 10,
              },
            ].map((row) => (
              <div key={row.label} className="flex flex-col justify-center bg-card p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {row.label}
                  </span>
                  {row.ok ? (
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-500" strokeWidth={2} />
                  ) : (
                    <AlertTriangle size={18} className="shrink-0 text-amber-500" strokeWidth={2} />
                  )}
                </div>
                <p className="mt-2 text-2xl font-black capitalize tabular-nums text-foreground">
                  {row.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{row.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminServiceHealthPage;
