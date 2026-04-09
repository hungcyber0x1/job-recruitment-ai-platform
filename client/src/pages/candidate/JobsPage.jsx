import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
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
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

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
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden rounded-xl border-0 bg-gradient-to-br from-primary to-[#0d9488] text-white">
          <CardContent className="relative p-8">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%22100%22%20viewBox%3D%220%200%2040%20100%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%220%22%20y%3D%2260%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22white%22%20fill-opacity%3D%220.15%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2240%22%20width%3D%228%22%20height%3D%2260%22%20fill%3D%22white%22%20fill-opacity%3D%220.15%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%228%22%20height%3D%2280%22%20fill%3D%22white%22%20fill-opacity%3D%220.15%22%2F%3E%3Crect%20x%3D%2230%22%20y%3D%2250%22%20width%3D%228%22%20height%3D%2250%22%20fill%3D%22white%22%20fill-opacity%3D%220.15%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right bg-contain opacity-80" />
            <div className="relative">
              <h2 className="text-xl font-bold leading-tight md:text-2xl">
                Nâng tầm sự nghiệp với công nghệ AI cá nhân hóa
              </h2>
              <p className="mt-3 text-sm text-white/90">
                Hồ sơ của bạn đã hoàn thiện {profileCompletion.completion}%.{' '}
                {profileCompletion.completion < 100
                  ? 'Hãy cập nhật thêm kỹ năng để tăng cơ hội kết nối với nhà tuyển dụng.'
                  : 'Hồ sơ đã sẵn sàng cho những cơ hội mới!'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-lg bg-white text-[#0d9488] hover:bg-white/90">
                  <Link to="/candidate/resume">Tối ưu CV ngay</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-lg border-white/50 bg-transparent text-white shadow-none hover:border-white/60 hover:bg-white/10 hover:text-white"
                >
                  <Link to="/candidate/chat" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Trò chuyện với AI
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-2xl hover-lift app-panel-hover border-slate-200/60">
            <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Động lực sự nghiệp
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold text-slate-900">{careerMomentum}%</p>
                <p className="text-xs font-bold text-emerald-500">↑2%</p>
              </div>
              <p className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Sparkles size={12} />
                {careerMomentum > 0 ? 'Hoạt động tích cực' : 'Bắt đầu ngay hôm nay'}
              </p>
              <Progress
                value={careerMomentum}
                className="mt-4 h-1.5 bg-slate-100"
                indicatorClassName="bg-emerald-500"
              />
            </CardContent>
          </Card>
          <Card className="rounded-2xl hover-lift app-panel-hover border-slate-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tối ưu hồ sơ
                </p>
                <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {profileCompletion.completion}%
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {profileCompletion.missingItems?.length
                  ? `Cần thêm ${profileCompletion.missingItems.length} dự án`
                  : 'Đã đủ thông tin'}
              </p>
              <Progress
                value={profileCompletion.completion}
                className="mt-4 h-1.5 bg-slate-100"
                indicatorClassName="bg-emerald-500"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4 metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Độ sẵn sàng',
            value: careerMomentum >= 70 ? 'Sẵn sàng' : 'Đang cải thiện',
            icon: Sparkles,
          },
          { label: 'Đơn đang xử lý', value: `${activeApplications.length} đơn`, icon: FileText },
          { label: 'Độ phù hợp đề xuất', value: `${matchRate}%`, icon: TrendingUp },
          { label: 'Thông báo mới', value: `${notifications.length} tin`, icon: MessageSquare },
        ].map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="rounded-2xl hover-lift app-panel-hover border-slate-200/60 group"
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-emerald-500 transition-all duration-300">
                <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                  {label}
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Việc làm ưu tiên từ AI + Lộ trình 90 ngày */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Việc làm ưu tiên từ AI</h2>
              <Link to="#all-jobs" className="text-sm font-medium text-emerald-600 hover:underline">
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-2">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl border bg-muted/30 animate-pulse" />
                ))
              ) : priorityJobs.length > 0 ? (
                priorityJobs.map((job, i) => {
                  const score = Number(job.match_score ?? job.matchScore ?? 0);
                  return (
                    <Link
                      key={job.id ?? i}
                      to={`/candidate/jobs/${job.id}`}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-emerald-500/30 hover:shadow-md hover:-translate-y-0.5 group"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-emerald-500 transition-all">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {getJobTitle(job)}
                          </span>
                          <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                            MATCH {score}%
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">
                          {getCompanyName(job)} · {job.location || 'Hà Nội, Việt Nam'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {job.salary_range || '$2,500 - $4,000'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatTimeAgo(job.created_at || job.posted_at)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-xl p-2.5 text-slate-400 hover:bg-primary/10 hover:text-emerald-600 transition-all hover:scale-110 active:scale-90"
                        onClick={(e) => e.preventDefault()}
                        aria-label="Lưu việc làm"
                      >
                        <Bookmark className="h-5 w-5" />
                      </button>
                    </Link>
                  );
                })
              ) : (
                <Card className="rounded-xl border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Chưa có gợi ý. Hoàn thiện hồ sơ để nhận việc làm phù hợp.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Phân tích dòng ứng tuyển */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-foreground">Phân tích dòng ứng tuyển</h2>
            <div className="mb-4 flex gap-2">
              {['7', '30'].map((d) => (
                <Button
                  key={d}
                  variant={funnelRange === d ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setFunnelRange(d)}
                >
                  {d} ngày
                </Button>
              ))}
            </div>
            <Card className="rounded-xl">
              <CardContent className="p-6">
                <div className="h-[220px] min-h-[200px] w-full min-w-0">
                  <ChartSurface className="h-full" minChartHeight={200}>
                    <BarChart
                      data={funnelChartData}
                      margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartSurface>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lộ trình 90 ngày */}
        <Card className="h-fit rounded-xl">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-foreground">Lộ trình 90 ngày</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tiến độ kế hoạch: {roadmapProgress}%
            </p>
            <ul className="mt-6 space-y-4">
              {roadmapTasks.map((t, i) => (
                <li key={i} className="flex items-center gap-3">
                  {t.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : t.inProgress ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold">
                      i
                    </span>
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.done ? 'ĐÃ HOÀN THÀNH' : t.inProgress ? 'ĐANG THỰC HIỆN' : 'CHƯA BẮT ĐẦU'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 w-full rounded-lg" variant="outline">
              <Link to="/candidate/career-roadmap">Xem lộ trình chi tiết</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 3 feature cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          {
            title: 'AI Tư vấn nghề',
            desc: 'Nhận phân tích điểm mạnh, yếu dựa trên dữ liệu thị trường.',
            to: '/candidate/chat',
            icon: MessageSquare,
            color: 'bg-amber-100 text-amber-700',
          },
          {
            title: 'Việc đã lưu',
            desc: 'Xem và quản lý các công việc bạn đã lưu để ứng tuyển sau.',
            to: '/candidate/saved-jobs',
            icon: Bookmark,
            color: 'bg-violet-100 text-violet-700',
          },
          {
            title: 'Tìm việc thông minh',
            desc: 'Lọc công việc theo mức lương và chế độ đãi ngộ AI.',
            to: '/candidate/jobs',
            icon: Search,
            color: 'bg-emerald-500/10 text-emerald-600',
          },
        ].map(({ title, desc, to, icon: Icon, color: _color }) => (
          <Link key={to} to={to} className="group h-full">
            <Card className="rounded-2xl hover-lift app-panel-hover border-slate-200/60 h-full overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
              <CardContent className="p-6 relative z-10">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:border-emerald-100`}
                >
                  <Icon className="h-6 w-6 text-emerald-600 transition-colors" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
              </CardContent>
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
