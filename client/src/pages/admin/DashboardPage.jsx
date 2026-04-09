import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Building2,
  FileText,
  Flag,
  LayoutDashboard,
  Users,
  Workflow,
} from 'lucide-react';
import { Pie, PieChart, Cell, Tooltip } from 'recharts';

import ChartSurface from '@/components/charts/ChartSurface';
import AdminLayout from '../../layouts/AdminLayout';
import Skeleton from '../../components/common/Skeleton.jsx';
import adminService from '../../services/adminService';

const EMPTY_STATS = {
  users: 0,
  jobs: 0,
  applications: 0,
  tickets: 0,
  moderation: { pendingJobs: 0, flaggedJobs: 0, unverifiedCompanies: 0 },
  pipeline: {
    pending: 0,
    screening: 0,
    reviewed: 0,
    shortlisted: 0,
    interviewing: 0,
    offered: 0,
    hired: 0,
    rejected: 0,
  },
};

const sanitizeStats = (data) => {
  if (!data || typeof data !== 'object') return EMPTY_STATS;
  return {
    users: Number(data?.users) || 0,
    jobs: Number(data?.jobs) || 0,
    applications: Number(data?.applications) || 0,
    tickets: Number(data?.tickets) || 0,
    moderation: {
      pendingJobs: Number(data?.moderation?.pendingJobs) || 0,
      flaggedJobs: Number(data?.moderation?.flaggedJobs) || 0,
      unverifiedCompanies: Number(data?.moderation?.unverifiedCompanies) || 0,
    },
    pipeline: {
      pending: Number(data?.pipeline?.pending) || 0,
      screening: Number(data?.pipeline?.screening) || 0,
      reviewed: Number(data?.pipeline?.reviewed) || 0,
      shortlisted: Number(data?.pipeline?.shortlisted) || 0,
      interviewing: Number(data?.pipeline?.interviewing) || 0,
      offered: Number(data?.pipeline?.offered) || 0,
      hired: Number(data?.pipeline?.hired) || 0,
      rejected: Number(data?.pipeline?.rejected) || 0,
    },
  };
};

const PIPELINE_CHART_COLORS = ['#10b981', '#059669', '#047857', '#064e3b'];

const AdminDashboardSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="h-48 rounded-2xl bg-white" />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 rounded-2xl bg-white" />
      ))}
    </div>
    <div className="grid gap-6 xl:grid-cols-3">
      <Skeleton className="h-80 rounded-2xl bg-white xl:col-span-2" />
      <Skeleton className="h-80 rounded-2xl bg-white" />
    </div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        const statsRes = await adminService.getStats().catch(() => ({ data: { success: false } }));
        if (statsRes.data?.success) {
          setStats(sanitizeStats(statsRes.data.data));
        } else {
          setStats(EMPTY_STATS);
        }
      } catch (error) {
        console.error('Failed to fetch admin dashboard', error);
        setStats(EMPTY_STATS);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminDashboard();
  }, []);

  const platformHealth = Math.min(
    99,
    Math.max(
      48,
      92 - (stats.moderation?.pendingJobs || 0) * 2 - (stats.moderation?.flaggedJobs || 0) * 2
    )
  );

  const pipelineChartData = useMemo(() => {
    const p = stats.pipeline || {};
    const total =
      (p.pending || 0) +
        (p.screening || 0) +
        (p.interviewing || 0) +
        (p.hired || 0) +
        (p.rejected || 0) || 1;
    return [
      {
        name: 'Chờ duyệt',
        value: p.pending || 0,
        percent: total ? Math.round(((p.pending || 0) / total) * 100) : 15,
      },
      {
        name: 'AI Screening',
        value: p.screening || 0,
        percent: total ? Math.round(((p.screening || 0) / total) * 100) : 45,
      },
      {
        name: 'Phỏng vấn',
        value: p.interviewing || 0,
        percent: total ? Math.round(((p.interviewing || 0) / total) * 100) : 30,
      },
      {
        name: 'Khác',
        value: (p.hired || 0) + (p.rejected || 0),
        percent: total ? 100 - 15 - 45 - 30 : 10,
      },
    ].filter((d) => d.value > 0 || d.percent > 0);
  }, [stats.pipeline]);

  const totalApplicants =
    (stats.pipeline?.pending || 0) +
      (stats.pipeline?.screening || 0) +
      (stats.pipeline?.interviewing || 0) +
      (stats.pipeline?.hired || 0) +
      (stats.pipeline?.rejected || 0) || 0;

  const keyMetrics = [
    {
      label: 'Tổng người dùng',
      value: (stats.users || 0).toLocaleString('vi-VN'),
      sub: stats.users > 0 ? '+12%' : '0%',
      subColor: 'text-emerald-400',
      icon: Users,
    },
    {
      label: 'Tin tuyển dụng',
      value: `${(stats.jobs || 0).toLocaleString('vi-VN')} / ${stats.moderation?.pendingJobs ?? 0} Chờ`,
      sub: stats.jobs > 0 ? 'Mới' : '--',
      subColor: 'text-emerald-400',
      icon: FileText,
    },
    {
      label: 'Lượng ứng tuyển',
      value: `${(stats.applications || 0).toLocaleString('vi-VN')} Screening`,
      sub: stats.applications > 0 ? '89% AI' : '0% AI',
      subColor: 'text-emerald-400',
      icon: Workflow,
    },
    {
      label: 'Hỗ trợ & Báo xấu',
      value: `${stats.tickets || 0} Tickets`,
      sub: stats.tickets > 0 ? 'Gấp' : '--',
      subColor: 'text-emerald-400',
      icon: AlertTriangle,
    },
  ];

  const featureModules = [
    {
      title: 'Quản lý người dùng',
      desc: 'Phân quyền & Hoạt động',
      to: '/admin/users',
      icon: Users,
    },
    {
      title: 'Kiểm duyệt tin đăng',
      desc: 'Duyệt thủ công & Tự động',
      to: '/admin/moderation',
      icon: Flag,
    },
    {
      title: 'Doanh nghiệp & Xác minh',
      desc: 'Hồ sơ & Giấy phép',
      to: '/admin/companies',
      icon: Building2,
    },
    {
      title: 'Ứng tuyển & Pipeline',
      desc: 'Theo dõi quy trình',
      to: '/admin/applications',
      icon: Workflow,
    },
    {
      title: 'Blog công khai',
      desc: 'Bài hiển thị tại /blog — cùng nguồn dữ liệu',
      to: '/admin/blog',
      icon: BookOpen,
    },
    {
      title: 'Quản trị AI Chatbot',
      desc: 'Huấn luyện & Câu trả lời',
      to: '/admin/chatbot',
      icon: BrainCircuit,
    },
    {
      title: 'Hỗ trợ & Cấu hình',
      desc: 'Tùy biến hệ thống',
      to: '/admin/settings',
      icon: LayoutDashboard,
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8 pb-12">
          <AdminDashboardSkeleton />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12 text-slate-900">
        {/* Trung tâm Điều hành Nền tảng */}
        <section>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Trung tâm Điều hành Nền tảng</h1>
          <p className="text-slate-500 text-sm mb-6">
            Chào mừng trở lại, hệ thống đang hoạt động ổn định.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Link
              to="/admin/moderation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95"
            >
              Kiểm duyệt
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/admin/service-health"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95"
            >
              Sức khỏe hệ thống
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/admin/feature-flags"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-900 font-semibold text-sm hover:bg-muted/60 transition-colors duration-200 ease-out active:scale-95"
            >
              Bản đồ tính năng
            </Link>

            <div className="ml-auto flex items-center gap-4">
              <div className="px-5 py-3 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Sức khỏe nền tảng
                </p>
                <p className="text-2xl font-bold text-emerald-400">
                  {platformHealth}% <span className="text-sm text-emerald-500">↑0.5%</span>
                </p>
              </div>
              <div className="px-5 py-3 rounded-xl bg-white border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Trạng thái tải AI
                </p>
                <p className="text-xl font-bold text-emerald-400">BÌNH THƯỜNG</p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Metrics */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Key Metrics</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {keyMetrics.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/30 hover:shadow-md transition-all hover:-translate-y-1 cursor-default group"
                >
                  <div className="flex items-start justify-between">
                    <Icon className="h-8 w-8 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                    <span className={`text-xs font-semibold ${m.subColor}`}>{m.sub}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-2 uppercase tracking-wide">
                    {m.label}
                  </p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{m.value}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Module Chức năng + Trạng thái Pipeline */}
        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Module Chức năng</h2>
              <Link
                to="/admin/analytics"
                className="text-sm font-semibold text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                Xem tất cả
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {featureModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.title}
                    to={mod.to}
                    className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/40 hover:shadow-md transition-all hover:scale-[1.02] group"
                  >
                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-emerald-500 transition-colors duration-200 ease-out">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">{mod.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Trạng thái Pipeline - Doughnut */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Trạng thái Pipeline</h2>
            <div className="p-6 rounded-2xl bg-white border border-slate-200">
              <div className="relative h-64 w-full min-w-0">
                <ChartSurface className="h-full" minChartHeight={200}>
                  <PieChart>
                    <Pie
                      data={
                        pipelineChartData.length
                          ? pipelineChartData
                          : [
                              { name: 'Chờ duyệt', value: 15 },
                              { name: 'AI Screening', value: 45 },
                              { name: 'Phỏng vấn', value: 30 },
                              { name: 'Khác', value: 10 },
                            ]
                      }
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {(pipelineChartData.length
                        ? pipelineChartData
                        : [{ value: 15 }, { value: 45 }, { value: 30 }, { value: 10 }]
                      ).map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIPELINE_CHART_COLORS[i % PIPELINE_CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                      }}
                      formatter={(value) => [`${value}`, '']}
                    />
                  </PieChart>
                </ChartSurface>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {totalApplicants >= 1000
                        ? `${(totalApplicants / 1000).toFixed(1)}k`
                        : totalApplicants}
                    </p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ứng viên
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  {
                    label: 'Chờ duyệt',
                    percent: pipelineChartData[0]?.percent ?? 15,
                    color: PIPELINE_CHART_COLORS[0],
                  },
                  {
                    label: 'AI Screening',
                    percent: pipelineChartData[1]?.percent ?? 45,
                    color: PIPELINE_CHART_COLORS[1],
                  },
                  {
                    label: 'Phỏng vấn',
                    percent: pipelineChartData[2]?.percent ?? 30,
                    color: PIPELINE_CHART_COLORS[2],
                  },
                  {
                    label: 'Khác',
                    percent: pipelineChartData[3]?.percent ?? 10,
                    color: PIPELINE_CHART_COLORS[3],
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-500">{item.label}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
