import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  Building2,
  CheckCircle2,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts';

import ChartSurface from '@/components/charts/ChartSurface';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import JobCard from '../../components/candidate/jobs/JobCard';
import { useAuth } from '../../context/AuthContext';
import { applicationService, candidateService, jobService } from '../../services';
import { calculateProfileCompletion } from '../../utils/profileCompletion';

const getJobTitle = (job) =>
  job?.title || job?.job_title || job?.position || job?.role || 'Vị trí tuyển dụng';

const getCompanyName = (item) =>
  item?.company_name || item?.company?.name || item?.employer_name || 'Công ty';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Vừa đăng';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Vừa đăng';
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Đăng vài phút trước';
  if (hours < 24) return `Đăng ${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `Đăng ${days} ngày trước`;
};

const JobsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qFromUrl = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(qFromUrl);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [funnelRange, setFunnelRange] = useState('30');
  const [loading, setLoading] = useState(true);

  const displayName =
    user?.fullName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Nguyễn Văn A';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, applicationsRes, profileRes, notificationsRes] = await Promise.all([
          jobService.getJobs({ limit: 20 }).catch(() => ({ data: { data: [] } })),
          applicationService.getMyApplications().catch(() => ({ data: { data: [] } })),
          candidateService.getProfile().catch(() => ({ data: { data: null } })),
          applicationService.getMyNotifications().catch(() => ({ data: { data: [] } })),
        ]);
        setJobs(Array.isArray(jobsRes.data?.data) ? jobsRes.data.data : []);
        setApplications(Array.isArray(applicationsRes.data?.data) ? applicationsRes.data.data : []);
        setProfile(profileRes.data?.data || null);
        setNotifications(
          Array.isArray(notificationsRes.data?.data) ? notificationsRes.data.data : []
        );
      } catch (e) {
        console.error('Jobs page fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setSearchQuery(qFromUrl);
  }, [qFromUrl]);

  const profileCompletion = useMemo(
    () => calculateProfileCompletion(profile || {}, user || {}),
    [profile, user]
  );

  const activeApplications = applications.filter((a) =>
    ['pending', 'screening', 'reviewed', 'shortlisted', 'interviewing', 'offered'].includes(
      a?.status || ''
    )
  );

  const matchRate = useMemo(() => {
    if (!jobs.length) return 0;
    const total = jobs.reduce(
      (s, j) => s + Number(j.match_score ?? j.matchScore ?? j.relevance_score ?? 0),
      0
    );
    return Math.round(total / jobs.length);
  }, [jobs]);

  const careerMomentum = Math.min(
    100,
    Math.round(profileCompletion.completion * 0.5 + matchRate * 0.3 + activeApplications.length * 3)
  );

  const roadmapProgress = useMemo(() => {
    const tasks = [
      profileCompletion.completion >= 75,
      profileCompletion.completion >= 55,
      notifications.length > 0,
      activeApplications.length > 0,
    ];
    return Math.round((tasks.filter(Boolean).length / 4) * 100);
  }, [profileCompletion.completion, notifications.length, activeApplications.length]);

  const funnelChartData = useMemo(() => {
    const weeks = ['TUẦN 1', 'TUẦN 2', 'TUẦN 3', 'TUẦN 4'];
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return weeks.map((name, i) => {
      const weekStart = now - (4 - i) * weekMs;
      const weekEnd = weekStart + weekMs;
      const count = applications.filter((a) => {
        const t = new Date(a.created_at || a.application_date || 0).getTime();
        return t >= weekStart && t < weekEnd;
      }).length;
      return { name, count };
    });
  }, [applications]);

  const roadmapTasks = [
    { label: 'Hoàn thiện hồ sơ', done: profileCompletion.completion >= 75 },
    { label: 'Tối ưu CV với AI', done: profileCompletion.completion >= 55 },
    { label: 'Kích hoạt AI Chat', inProgress: true },
    { label: 'Theo dõi Pipeline', done: activeApplications.length > 0 },
  ];

  const priorityJobs = jobs.slice(0, 3);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/candidate/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="space-y-8 pb-12 animate-slide-up">
      {/* Header: Title + Greeting + Search + CTA */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Trung tâm Trí tuệ Nghề nghiệp
        </h1>
        <p className="mt-1 text-muted-foreground">
          Chào mừng trở lại, {displayName}. Hãy xem tiến độ sự nghiệp của bạn.
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
          <form onSubmit={handleQuickSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm việc nhanh"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-lg bg-muted/50"
            />
          </form>
          <Button
            className="rounded-xl gap-2 bg-emerald-500 hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-emerald-500/20 px-6 h-11"
            asChild
          >
            <Link to="/candidate/jobs">
              <Zap className="h-4 w-4" />
              Khám phá việc làm
            </Link>
          </Button>
        </div>
      </div>
      {/* Hero banner + 2 metric cards */}
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="relative overflow-hidden rounded-[32px] border-none bg-slate-900 p-10 text-white shadow-2xl shadow-emerald-500/10">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-black uppercase tracking-[0.2em] text-emerald-400 border border-emerald-500/20 mb-6 font-mono">
              <Sparkles size={14} className="animate-pulse" />
              AI Powered Dashboard
            </div>
            <h2 className="text-3xl font-black leading-[1.1] tracking-tight md:text-5xl mb-6">
              Nâng tầm sự nghiệp với <span className="text-emerald-400">AI cá nhân hóa</span>
            </h2>
            <p className="text-lg font-semibold text-slate-400 leading-relaxed mb-8">
              Hồ sơ của bạn đã hoàn thiện{' '}
              <span className="text-white font-black">{profileCompletion.completion}%</span>.
              {profileCompletion.completion < 100
                ? ' Hãy tối ưu hóa CV để mở khóa 85% cơ hội việc làm tiềm năng đang chờ đón.'
                : ' Hệ thống AI đã sẵn sàng kết nối bạn với những cơ hội bứt phá nhất.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                className="h-12 rounded-xl bg-emerald-500 px-8 text-[15px] font-black uppercase tracking-widest text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 transition-all active:scale-95 border-none"
              >
                <Link to="/candidate/resume">Tối ưu CV ngay</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-xl border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all active:scale-95 px-6"
              >
                <Link to="/candidate/chat" className="gap-2">
                  <MessageSquare size={18} className="text-emerald-400" />
                  Trò chuyện với AI
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-[28px] border border-border/40 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50 card-premium-hover">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                Động lực sự nghiệp
              </p>
              <div className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100/50 text-sm font-black text-emerald-600">
                Lên 2%
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-4xl font-black tracking-tighter text-foreground">
                {careerMomentum}%
              </p>
            </div>
            <p className="text-base font-black text-emerald-600 flex items-center gap-1.5 mb-6">
              <TrendingUp size={16} />
              {careerMomentum > 50 ? 'Hoạt động xuất sắc' : 'Đang tăng trưởng'}
            </p>
            <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                style={{ width: `${careerMomentum}%` }}
              />
            </div>
          </Card>

          <Card className="rounded-[28px] border border-border/40 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50 card-premium-hover">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                Tối ưu hồ sơ
              </p>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
            </div>
            <h3 className="text-4xl font-black tracking-tighter text-foreground mb-1">
              {profileCompletion.completion}%
            </h3>
            <p className="text-base font-semibold text-muted-foreground/70 mb-6">
              {profileCompletion.missingItems?.length
                ? `Cần bổ sung thêm ${profileCompletion.missingItems.length} hạng mục`
                : 'Hồ sơ đã đạt chuẩn 5 sao'}
            </p>
            <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${profileCompletion.completion}%` }}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* 4 metric cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Độ sẵn sàng',
            value: careerMomentum >= 70 ? 'Sẵn sàng' : 'Cần tối ưu',
            icon: Sparkles,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
          },
          {
            label: 'Đơn đang xử lý',
            value: `${activeApplications.length} đơn tuyển`,
            icon: FileText,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
          },
          {
            label: 'Độ phù hợp AI',
            value: `${matchRate}% Lương`,
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
          },
          {
            label: 'Thông báo',
            value: `${notifications.length} bản tin`,
            icon: MessageSquare,
            color: 'text-violet-500',
            bg: 'bg-violet-50',
            border: 'border-violet-100',
          },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="card-premium-hover group flex items-center gap-5 rounded-2xl border border-border/40 bg-white p-6 shadow-sm shadow-slate-200/30"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${m.bg} ${m.border} transition-all group-hover:scale-110 group-hover:rotate-3`}
              >
                <Icon size={22} className={m.color} />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black uppercase tracking-[0.2em] text-muted-foreground/50 leading-none mb-1">
                  {m.label}
                </p>
                <p className="text-lg font-black text-foreground truncate">{m.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Việc làm ưu tiên từ AI + Lộ trình 90 ngày */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-8 bg-primary rounded-full" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  Việc làm ưu tiên từ AI
                </h2>
              </div>
              <Link
                to="#all-jobs"
                className="group flex items-center gap-1.5 text-sm font-black uppercase tracking-widest text-primary hover:text-emerald-700 transition-colors"
              >
                Khám phá thêm{' '}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid gap-4">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-2xl border bg-muted/20 animate-pulse" />
                ))
              ) : priorityJobs.length > 0 ? (
                priorityJobs.map((job, i) => {
                  const score = Number(job.match_score ?? job.matchScore ?? 0);
                  const logo = job.company_logo || job.logo;
                  return (
                    <Link
                      key={job.id ?? i}
                      to={`/candidate/jobs/${job.id}`}
                      className="card-premium-hover group relative flex items-center gap-6 rounded-2xl border border-border/40 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:shadow-slate-200/50"
                    >
                      <div className="relative h-16 w-16 shrink-0 rounded-xl border border-border/40 bg-slate-50/50 p-1 transition-all group-hover:border-primary/30 group-hover:scale-105">
                        {logo ? (
                          <img
                            src={logo}
                            alt=""
                            className="h-full w-full rounded-lg object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-lg bg-emerald-50 text-xl font-black text-emerald-600">
                            {getCompanyName(job).charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors truncate">
                            {getJobTitle(job)}
                          </h3>
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100/60 text-sm font-black text-emerald-600 uppercase tracking-widest font-mono">
                            <Sparkles size={10} className="animate-pulse" />
                            Match {score}%
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <p className="text-base font-semibold text-muted-foreground/70 flex items-center gap-1.5">
                            <Building2 size={14} className="opacity-40" />
                            {getCompanyName(job)}
                          </p>
                          <p className="text-base font-semibold text-muted-foreground/50">
                            {job.location || 'Hà Nội'}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-5">
                          <p className="text-base font-black text-emerald-600 bg-emerald-50 px-3 py-0.5 rounded-lg border border-emerald-100/30">
                            {job.salary_range || '$2,500 - $4,000'}
                          </p>
                          <span className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">
                            {formatTimeAgo(job.created_at || job.posted_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100/50"
                        >
                          <Bookmark size={18} />
                        </Button>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-border/60 bg-slate-50/50 py-12 text-center">
                  <p className="text-base font-black text-muted-foreground uppercase tracking-widest">
                    Chưa có gợi ý phù hợp
                  </p>
                  <p className="text-base font-semibold text-muted-foreground/60 mt-2">
                    Hoàn thiện hồ sơ để AI bắt đầu đề xuất
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Phân tích dòng ứng tuyển */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-8 bg-primary rounded-full" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  Xu hướng ứng tuyển
                </h2>
              </div>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                {['7', '30'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setFunnelRange(d)}
                    className={`px-4 py-1.5 text-sm font-black uppercase tracking-widest rounded-lg transition-all ${
                      funnelRange === d
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-muted-foreground/40 hover:text-muted-foreground'
                    }`}
                  >
                    {d} ngày
                  </button>
                ))}
              </div>
            </div>

            <Card className="rounded-[32px] border border-border/40 bg-white p-8 shadow-sm">
              <div className="h-[240px] w-full">
                <ChartSurface className="h-full w-full" minChartHeight={240}>
                  <BarChart
                    data={funnelChartData}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                      contentStyle={{
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ChartSurface>
              </div>
            </Card>
          </div>
        </div>

        {/* Lộ trình 90 ngày */}
        <aside className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-8 bg-primary rounded-full" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Tiến độ 90 ngày
            </h2>
          </div>

          <Card className="rounded-[32px] border border-border/40 bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
              <div className="relative inline-flex mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-slate-50" />
                <div
                  className="h-28 w-28 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow rotate-[45deg]"
                  style={{
                    clipPath: `conic-gradient(from 0deg, #10b981 ${roadmapProgress}%, transparent 0)`,
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-foreground">{roadmapProgress}%</span>
                  <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">
                    Complete
                  </span>
                </div>
              </div>
              <p className="text-base font-black text-foreground">
                {roadmapProgress >= 100 ? 'Hành trình hoàn tất!' : 'Tiếp tục phát triển'}
              </p>
            </div>

            <ul className="space-y-5">
              {roadmapTasks.map((t, i) => (
                <li key={i} className="group flex items-start gap-4">
                  <div
                    className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                      t.done
                        ? 'bg-emerald-500 border-emerald-500'
                        : t.inProgress
                          ? 'border-emerald-500 bg-white'
                          : 'border-slate-200'
                    }`}
                  >
                    {t.done && <CheckCircle2 size={12} className="text-white" />}
                    {t.inProgress && (
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-base font-black transition-colors ${t.done ? 'text-foreground' : 'text-foreground/80'}`}
                    >
                      {t.label}
                    </p>
                    <p className="text-base font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5">
                      {t.done ? 'COMPLETED' : t.inProgress ? 'IN PROGRESS' : 'PENDING'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-8 w-full h-11 rounded-xl font-black uppercase tracking-widest text-sm border-border shadow-sm active:scale-[0.98]"
              variant="outline"
            >
              <Link to="/candidate/career-roadmap">Xem lộ trình chi tiết</Link>
            </Button>
          </Card>
        </aside>
      </div>

      {/* 3 feature cards */}
      <div className="grid gap-8 sm:grid-cols-3">
        {[
          {
            title: 'AI Tư vấn nghề',
            desc: 'Phân tích điểm mạnh, yếu và chiến lược thăng tiến sự nghiệp từ dữ liệu thị trường thực tế.',
            to: '/candidate/chat',
            icon: MessageSquare,
            gradient: 'from-amber-400 to-orange-500',
          },
          {
            title: 'Việc đã lưu',
            desc: 'Quản lý kho việc làm tiềm năng. So sánh mức lương và chế độ dựa trên phân tích AI.',
            to: '/candidate/saved-jobs',
            icon: Bookmark,
            gradient: 'from-violet-400 to-fuchsia-500',
          },
          {
            title: 'Tìm việc thông minh',
            desc: 'Bộ lọc AI nâng cao giúp bạn tiếp cận những vị trí phù hợp 95% với kỹ năng cốt lõi.',
            to: '/candidate/jobs',
            icon: Search,
            gradient: 'from-emerald-400 to-teal-500',
          },
        ].map((feat, idx) => (
          <Link key={idx} to={feat.to} className="group flex flex-col h-full">
            <Card className="card-premium-hover relative flex flex-col h-full overflow-hidden rounded-[32px] border border-border/40 bg-white p-8 shadow-sm transition-all hover:shadow-2xl hover:shadow-slate-200/50">
              <div
                className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${feat.gradient} opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700`}
              />

              <div className="relative z-10">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-border/40 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-primary group-hover:shadow-primary/20">
                  <feat.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors mb-3">
                  {feat.title}
                </h3>
                <p className="text-base font-semibold text-muted-foreground/70 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Tất cả việc làm - list bên dưới */}
      {jobs.length > 3 && (
        <section id="all-jobs">
          <h2 className="mb-4 text-lg font-bold text-foreground">Tất cả việc làm</h2>
          <div className="flex flex-col gap-4">
            {(Array.isArray(jobs) ? jobs : []).slice(3, 12).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {jobs.length > 12 && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                className="rounded-lg text-emerald-600 border-emerald-200 hover:bg-primary/10"
                asChild
              >
                <Link to="/candidate/jobs">Xem thêm</Link>
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default JobsPage;
