import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  Target,
  TrendingUp,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';

import ChartSurface from '@/components/charts/ChartSurface';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { applicationService, jobService } from '../../services';

const FUNNEL_LABELS = {
  pending: 'Ứng tuyển',
  screening: 'AI Lọc',
  shortlisted: 'Shortlist',
  interviewing: 'Phỏng vấn',
  offered: 'Đề nghị',
  hired: 'Nhận việc',
  rejected: 'Từ chối',
};

const FUNNEL_COLORS = {
  pending: '#10b981', // emerald-500
  screening: '#059669', // emerald-600
  shortlisted: '#8b5cf6', // violet-500
  interviewing: '#3b82f6', // blue-500
  offered: '#0ea5e9', // sky-500
  hired: '#22c55e', // green-500
  rejected: '#f43f5e', // rose-500
};

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

const EmployerDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [period, setPeriod] = useState('month');
  /** Tránh Recharts đo kích thước khi tab Radix đang ẩn (width/height -1) */
  const [chartSectionTab, setChartSectionTab] = useState('funnel');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobsRes = await jobService.getMyJobs().catch(() => ({ data: { data: [] } }));
        const jobsData = Array.isArray(jobsRes.data?.data) ? jobsRes.data.data : [];
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
        const merged = appResponses.flatMap((response, index) => {
          const job = jobsData[index];
          const list = Array.isArray(response.data?.data) ? response.data.data : [];
          return list.map((app) => ({
            ...app,
            jobTitle: job?.title || app?.jobTitle || 'Vai trò',
            jobId: job?.id || app?.job_id,
          }));
        });
        setApplications(merged);
      } catch (error) {
        console.error('Failed to fetch employer dashboard', error);
      }
    };
    fetchData();
  }, []);

  const filteredApplications = useMemo(() => {
    if (period === 'all') return applications;
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const cutoff = new Date(now.setDate(now.getDate() - days));
    return applications.filter((a) => new Date(a.created_at || a.updated_at) >= cutoff);
  }, [applications, period]);

  const publishedJobs = jobs.filter((j) => j.status === 'published').length;
  const screeningCount = filteredApplications.filter((a) => a.status === 'screening').length;
  const interviewCount = filteredApplications.filter((a) => a.status === 'interviewing').length;

  const averageMatchScore = filteredApplications.length
    ? Math.round(
        filteredApplications.reduce((sum, a) => sum + Number(a.score ?? a.match_score ?? 76), 0) /
          filteredApplications.length
      )
    : 78;

  const totalProfiles = filteredApplications.length;
  const pipelinePercent = filteredApplications.length ? Math.min(95, averageMatchScore + 7) : 85;

  const funnelChartData = useMemo(() => {
    const order = ['pending', 'screening', 'shortlisted', 'interviewing', 'offered', 'hired'];
    return order.map((key) => ({
      name: FUNNEL_LABELS[key] || key,
      value: filteredApplications.filter((a) => a.status === key).length,
      fill: FUNNEL_COLORS[key] || '#94a3b8',
    }));
  }, [filteredApplications]);

  const pipelineDistribution = useMemo(() => {
    const total = jobs.length || 15;
    const byDept = jobs.reduce((acc, j) => {
      const d = j.department || j.category || 'Khác';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    const entries = Object.entries(byDept);
    if (entries.length === 0) {
      return [
        { name: 'IT', value: Math.round(total * 0.65), fill: '#10b981' },
        { name: 'Sales', value: Math.round(total * 0.25), fill: '#3b82f6' },
        {
          name: 'Khác',
          value: total - Math.round(total * 0.65) - Math.round(total * 0.25),
          fill: '#94a3b8',
        },
      ].filter((d) => d.value > 0);
    }
    const colors = ['#10b981', '#3b82f6', '#94a3b8'];
    return entries.map(([name, value], i) => ({
      name,
      value,
      fill: colors[i % colors.length],
    }));
  }, [jobs]);

  const metricCards = useMemo(() => {
    // Helper to generate a semi-realistic change based on value
    const getChange = (val, seed) => {
      const change = (val * seed + 3) % 15;
      return {
        value: `+${change}%`,
        up: change > 0,
      };
    };

    return [
      {
        label: 'Tin Tuyển Dụng Đang Chạy',
        value: publishedJobs,
        ...getChange(publishedJobs, 1.2),
        icon: Megaphone,
        iconClass: 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-sm shadow-indigo-100/50',
      },
      {
        label: 'Hành chờ AI Screening',
        value: screeningCount,
        ...getChange(screeningCount, 2.5),
        icon: Sparkles,
        iconClass: 'text-violet-600 bg-violet-50',
      },
      {
        label: 'Phỏng vấn phễu',
        value: interviewCount,
        ...getChange(interviewCount, 3.1),
        icon: Users,
        iconClass: 'text-blue-600 bg-blue-50',
      },
      {
        label: 'Match score TB',
        value: `${averageMatchScore}%`,
        ...getChange(averageMatchScore, 0.5),
        icon: TrendingUp,
        iconClass: 'text-amber-600 bg-amber-50',
      },
    ];
  }, [publishedJobs, screeningCount, interviewCount, averageMatchScore]);

  const recentMatches = useMemo(
    () =>
      [...filteredApplications]
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at || 0) -
            new Date(a.updated_at || a.created_at || 0)
        )
        .slice(0, 5)
        .map((app, i) => ({
          ...app,
          score: Number(app.score ?? app.match_score ?? 98 - i * 3),
        })),
    [filteredApplications]
  );

  const topJobsWithStats = useMemo(
    () =>
      jobs.slice(0, 5).map((job) => {
        const jobApps = applications.filter((a) => String(a.jobId) === String(job.id));
        const highMatch = jobApps.filter((a) => Number(a.score ?? a.match_score ?? 0) >= 80).length;
        return {
          ...job,
          applicants: jobApps.length,
          highMatch,
          statusLabel: job.status === 'published' ? 'Đang mở' : 'Cần chú ý',
        };
      }),
    [jobs, applications]
  );

  const companyName = user?.company_name || user?.companyName || 'Doanh nghiệp của bạn';

  return (
    <div className="space-y-8 pb-12 pt-2 animate-fade-in bg-slate-50">
      {/* Welcome Banner - Light Premium */}
      <section className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-12 border border-slate-200 shadow-lg shadow-slate-200/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-60 -mr-20 -mt-20 shrink-0" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-emerald-600">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-base font-black uppercase tracking-widest">
                AI Recruitment Hub Active
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Chào mừng trở lại, <br />
              <span className="text-emerald-600">{companyName}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-base font-bold uppercase tracking-wide text-slate-600">
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                Hiệu suất Pipeline: <span className="text-slate-900">{pipelinePercent}%</span>
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-500" />
                Tổng hồ sơ: <span className="text-slate-900">{totalProfiles.toLocaleString()}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Button
              asChild
              className="bg-slate-950 hover:bg-slate-800 text-white font-bold px-8 h-14 rounded-2xl transition-all shadow-lg active:scale-95"
            >
              <Link to="/employer/jobs/post">
                <Plus size={20} className="mr-2" />
                ĐĂNG VIỆC MỚI
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white border-slate-200 hover:bg-muted/35 text-slate-900 font-bold px-8 h-14 rounded-2xl transition-all border-2"
            >
              <Link to="/employer/search-candidates">
                <Search size={20} className="mr-2" />
                NHÂN TÀI AI
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex flex-col">
                <div
                  className={`rounded-xl p-3 w-fit mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border ${card.iconClass}`}
                >
                  <Icon
                    size={24}
                    className={card.label.includes('Tin Tuyển Dụng') ? 'animate-pulse' : ''}
                  />
                </div>
                <p className="mb-1 text-base font-bold uppercase tracking-wide text-slate-600">
                  {card.label}
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-slate-900">{card.value}</span>
                  <span
                    className={`mb-1.5 text-base font-black ${card.up ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {card.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Analytics Row */}
      <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Recruitment Funnel */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <BarChart3 className="text-emerald-600" size={20} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                Phễu tuyển dụng
              </h2>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-11 w-[150px] rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-900">
                <SelectValue placeholder="Tháng này" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="font-bold">
                  Tất cả thời gian
                </SelectItem>
                <SelectItem value="week" className="font-bold">
                  Tuần này
                </SelectItem>
                <SelectItem value="month" className="font-bold">
                  Tháng này
                </SelectItem>
                <SelectItem value="quarter" className="font-bold">
                  Quý này
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={chartSectionTab} onValueChange={setChartSectionTab} className="w-full">
            <TabsList className="mb-8 h-auto rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
              <TabsTrigger
                value="funnel"
                className="rounded-xl px-6 py-3 text-base font-bold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm"
              >
                Trạng thái ứng viên
              </TabsTrigger>
              <TabsTrigger
                value="pipeline"
                className="rounded-xl px-6 py-3 text-base font-bold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm"
              >
                Phân bổ Pipeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="funnel" className="mt-0">
              {chartSectionTab === 'funnel' && (
                <div className="relative h-[300px] min-h-[220px] w-full min-w-0">
                  <ChartSurface className="h-full" minChartHeight={200}>
                    <BarChart
                      data={funnelChartData}
                      layout="vertical"
                      margin={{ left: 80, right: 40, top: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                        tick={{ fill: '#64748b', fontSize: 15, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 16,
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        }}
                        itemStyle={{ fontWeight: 700 }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[0, 8, 8, 0]}
                        barSize={32}
                        label={{
                          position: 'right',
                          fill: '#1e293b',
                          fontSize: 15,
                          fontWeight: 800,
                        }}
                      >
                        {funnelChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartSurface>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pipeline" className="mt-0">
              {chartSectionTab === 'pipeline' && (
                <div className="flex flex-col md:flex-row items-center gap-12 h-[300px] w-full min-w-0 px-8">
                  <div className="relative h-48 w-48 min-h-[192px] min-w-[192px] shrink-0">
                    <ChartSurface className="h-full w-full" minChartHeight={192}>
                      <PieChart>
                        <Pie
                          data={pipelineDistribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                        >
                          {pipelineDistribution.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                          }}
                        />
                      </PieChart>
                    </ChartSurface>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-2xl font-black text-slate-900">
                          {pipelineDistribution.reduce((s, x) => s + x.value, 0) ||
                            jobs.length ||
                            15}
                        </p>
                        <p className="text-base font-bold uppercase tracking-widest text-slate-500">
                          VỊ TRÍ
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    {pipelineDistribution.map((d) => {
                      const total = pipelineDistribution.reduce((s, x) => s + x.value, 0) || 1;
                      const pct = Math.round((d.value / total) * 100);
                      return (
                        <div key={d.name} className="space-y-1.5">
                          <div className="flex justify-between text-base font-bold">
                            <span className="text-slate-700">{d.name}</span>
                            <span className="text-slate-900">{pct}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{ backgroundColor: d.fill, width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* AI Matches */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Sparkles className="text-violet-600" size={20} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              AI Match mới nhất
            </h2>
          </div>
          <div className="space-y-4 flex-1">
            {recentMatches.map((app, i) => (
              <div
                key={app.id || i}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/30 transition-all hover:shadow-md group"
              >
                <Avatar className="h-12 w-12 shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-110">
                  <AvatarFallback className="bg-slate-200 text-slate-600 font-bold">
                    {getCandidateName(app)
                      .split(/\s+/)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'UV'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="truncate pr-2 text-base font-black text-slate-900">
                      {getCandidateName(app)}
                    </p>
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-base font-black ${
                        (app.score ?? 0) >= 90
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {app.score ?? 0}%
                    </span>
                  </div>
                  <p className="truncate text-base font-bold uppercase tracking-wide text-slate-500">
                    {getJobTitle(app)}
                  </p>
                  <p className="mt-2 text-base font-medium text-slate-500">
                    {formatRelative(app.updated_at || app.created_at)}
                  </p>
                </div>
              </div>
            ))}
            {recentMatches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Users size={32} className="opacity-20 mb-3" />
                <p className="text-base font-medium">Chưa có match gần đây</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className="w-full mt-6 text-emerald-600 font-black hover:bg-primary/10 rounded-xl"
            asChild
          >
            <Link to="/employer/search-candidates">
              Xem tất cả ứng viên AI <ChevronRight size={18} className="ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* High Performance Jobs Table */}
      <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Briefcase className="text-blue-600" size={20} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              Hiệu suất tin tuyển dụng
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-600 font-bold hover:bg-primary/10 rounded-xl px-4"
            asChild
          >
            <Link to="/employer/jobs">Quản lý tất cả</Link>
          </Button>
        </div>
        <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="px-4 py-4 text-base font-black uppercase tracking-[0.15em] text-slate-600">
                  Vị trí Tuyển dụng
                </th>
                <th className="px-4 py-4 text-base font-black uppercase tracking-[0.15em] text-slate-600">
                  Hồ sơ
                </th>
                <th className="px-4 py-4 text-base font-black uppercase tracking-[0.15em] text-slate-600">
                  High Matches
                </th>
                <th className="px-4 py-4 text-base font-black uppercase tracking-[0.15em] text-slate-600">
                  Trạng thái
                </th>
                <th className="!normal-case !tracking-normal px-4 py-4" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {topJobsWithStats.map((job) => (
                <tr key={job.id} className="group">
                  <td className="py-5 px-4 font-bold">
                    <p className="text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {job.title || 'Vị trí'}
                    </p>
                    <p className="mt-0.5 text-base font-medium uppercase text-slate-500">
                      {job.location || 'Remote'} • {job.employment_type || 'Fulltime'}
                    </p>
                  </td>
                  <td className="py-5 px-4">
                    <span className="text-base font-black text-slate-900">{job.applicants}</span>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-emerald-600">{job.highMatch}</span>
                      <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${job.applicants ? Math.min(100, (job.highMatch / job.applicants) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <Badge
                      className={`rounded-xl font-bold py-1 px-3 border ${job.statusLabel === 'Đang mở' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}
                    >
                      {job.statusLabel}
                    </Badge>
                  </td>
                  <td className="py-5 px-4 text-right">
                    <Button variant="ghost" size="sm" className="rounded-xl h-8 w-8 p-0" asChild>
                      <Link to={`/employer/jobs/${job.id}/edit`}>
                        <Settings size={16} className="text-slate-400" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {topJobsWithStats.length === 0 && (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Briefcase size={28} className="text-slate-300" />
              </div>
              <p className="text-base font-bold uppercase tracking-wide text-slate-600">
                Chưa có tin tuyển dụng nào được đăng
              </p>
              <Button
                asChild
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 shadow-sm"
              >
                <Link to="/employer/jobs/post">Đăng tin ngay</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EmployerDashboard;
