import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Loader2,
  Minus,
  Pencil,
  RefreshCw,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import profileAnalyticsService from '../../services/profileAnalyticsService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const toneMap = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
    track: '#10b981',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-700 border-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-100',
    track: '#8b5cf6',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 border-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-100',
    track: '#f59e0b',
  },
  sky: {
    icon: 'bg-sky-50 text-sky-700 border-sky-100',
    text: 'text-sky-700',
    border: 'border-sky-100',
    track: '#0ea5e9',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-700 border-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-100',
    track: '#f43f5e',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 border-slate-200',
    text: 'text-slate-700',
    border: 'border-slate-200',
    track: '#64748b',
  },
};

const priorityMap = {
  high: {
    label: 'Ưu tiên cao',
    className: 'border-rose-100 bg-rose-50 text-rose-700',
  },
  medium: {
    label: 'Nên làm sớm',
    className: 'border-amber-100 bg-amber-50 text-amber-700',
  },
  low: {
    label: 'Bổ sung',
    className: 'border-sky-100 bg-sky-50 text-sky-700',
  },
};

const defaultSuggestions = [
  {
    label: 'Cập nhật ảnh đại diện chuyên nghiệp',
    description: 'Ảnh rõ mặt giúp nhà tuyển dụng nhận diện hồ sơ nhanh hơn khi sàng lọc.',
    priority: 'high',
  },
  {
    label: 'Bổ sung kỹ năng trọng tâm',
    description:
      'Thêm các kỹ năng chính liên quan vị trí mục tiêu để tăng khả năng ghép nối phù hợp.',
    priority: 'high',
  },
  {
    label: 'Làm mới phần tóm tắt',
    description: 'Tóm tắt nên nêu vai trò, thế mạnh và kết quả nổi bật trong 2-3 câu.',
    priority: 'medium',
  },
  {
    label: 'Thêm hồ sơ dự án hoặc dự án',
    description: 'Liên kết dự án giúp nhà tuyển dụng kiểm chứng năng lực nhanh hơn.',
    priority: 'low',
  },
];

const defaultStrengthBreakdown = [
  { label: 'Ảnh đại diện', score: 100 },
  { label: 'Tiêu đề nghề nghiệp', score: 100 },
  { label: 'Kỹ năng', score: 100 },
  { label: 'Tóm tắt hồ sơ', score: 100 },
  { label: 'Học vấn', score: 100 },
  { label: 'Hồ sơ dự án', score: 20 },
];

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const clampScore = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const getScoreTone = (score) => {
  if (score >= 80) return toneMap.emerald;
  if (score >= 50) return toneMap.amber;
  return toneMap.rose;
};

const TrendBadge = ({ value }) => {
  const trend = Number(value) || 0;
  const Icon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold',
        trend > 0 && 'border-emerald-100 bg-emerald-50 text-emerald-700',
        trend < 0 && 'border-rose-100 bg-rose-50 text-rose-700',
        trend === 0 && 'border-slate-200 bg-slate-50 text-slate-500'
      )}
    >
      <Icon className="h-3 w-3" />
      {trend === 0 ? 'Ổn định' : `${Math.abs(trend)}%`}
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value, change, tone = 'emerald', helper }) => {
  const palette = toneMap[tone] || toneMap.emerald;

  return (
    <Card className="border-slate-200 bg-white p-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg border',
              palette.icon
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {change !== undefined && <TrendBadge value={change} />}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold leading-none text-slate-950">{value}</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{label}</p>
          {helper && <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 gap-3">
      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>
    </div>
    {action}
  </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
      <Icon className="h-6 w-6" />
    </div>
    <p className="mt-4 text-sm font-bold text-slate-800">{title}</p>
    <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
  </div>
);

const ViewerRow = ({ viewer }) => {
  const companyName = viewer.company_name || viewer.company || 'Công ty chưa xác định';
  const firstLetter = companyName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm transition-colors hover:border-emerald-200">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-700">
        {firstLetter}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{companyName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {viewer.last_viewed_at ? formatDate(viewer.last_viewed_at) : 'Chưa có thời gian'}
          </span>
          <span>{formatNumber(viewer.view_count || 1)} lượt xem</span>
        </div>
      </div>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
        {formatNumber(viewer.view_count || 1)}x
      </span>
    </div>
  );
};

const SuggestionItem = ({ suggestion, index }) => {
  const priority = priorityMap[suggestion.priority] || priorityMap.medium;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900">{suggestion.label}</p>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-xs font-semibold',
                priority.className
              )}
            >
              {priority.label}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">{suggestion.description}</p>
        </div>
      </div>
    </div>
  );
};

const StrengthGauge = ({ item }) => {
  const score = clampScore(item.score);
  const palette = getScoreTone(score);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="relative mx-auto h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={palette.track}
            strokeLinecap="round"
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">
          {score}%
        </span>
      </div>
      <p className="mt-3 text-sm font-bold text-slate-800">{item.label}</p>
    </div>
  );
};

const ProfileAnalyticsPage = () => {
  const { showNotification } = useNotification();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await profileAnalyticsService.getDashboard();
      setAnalytics(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      showNotification('Không tải được dữ liệu phân tích hồ sơ.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const data = analytics || {};
  const views = Number(data.profile_views || 0);
  const totalApplications = Number(data.total_applications || 0);
  const responseCount = Number(data.response_count || 0);
  const skillCount = Number(data.skill_count || 0);
  const responseRate = Number(data.response_rate || 0);
  const recentViewers = Array.isArray(data.recent_viewers) ? data.recent_viewers : [];
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : defaultSuggestions;
  const strengthBreakdown = Array.isArray(data.strength_breakdown)
    ? data.strength_breakdown
    : defaultStrengthBreakdown;

  const averageStrength = useMemo(() => {
    if (!strengthBreakdown.length) return 0;
    const total = strengthBreakdown.reduce((sum, item) => sum + clampScore(item.score), 0);
    return Math.round(total / strengthBreakdown.length);
  }, [strengthBreakdown]);

  const weakestArea = useMemo(() => {
    if (!strengthBreakdown.length) return null;
    return [...strengthBreakdown].sort((a, b) => clampScore(a.score) - clampScore(b.score))[0];
  }, [strengthBreakdown]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-50">
        <div className="rounded-lg border border-emerald-100 bg-white px-6 py-5 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Đang tải phân tích hồ sơ...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Độ hoàn thiện',
      value: `${averageStrength}%`,
      icon: Target,
      tone: 'emerald',
      helper: 'Dựa trên các phần hồ sơ chính',
    },
    {
      label: 'Đơn đã nộp',
      value: formatNumber(totalApplications),
      icon: Briefcase,
      tone: 'violet',
      helper: 'Tổng lượt ứng tuyển trong hệ thống',
    },
    {
      label: 'Phản hồi nhà tuyển dụng',
      value: formatNumber(responseCount),
      icon: Users,
      tone: 'amber',
      helper: `${responseRate}% trên tổng đơn đã nộp`,
    },
    {
      label: 'Kỹ năng hồ sơ',
      value: formatNumber(skillCount),
      icon: Sparkles,
      tone: 'sky',
      helper: skillCount >= 5 ? 'Đủ dữ liệu ghép nối cơ bản' : 'Nên có ít nhất 5 kỹ năng',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent pb-14">
      <section className="border-b border-emerald-100/70 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                <BarChart3 className="h-3.5 w-3.5" />
                Hồ sơ ứng viên
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                Phân tích hồ sơ
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Theo dõi độ hoàn thiện hồ sơ, phản hồi tuyển dụng và những điểm cần tối ưu để hồ sơ
                nổi bật hơn.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="bg-white">
                <Link to="/candidate/profile/edit">
                  <Pencil className="h-4 w-4" />
                  Chỉnh hồ sơ
                </Link>
              </Button>
              <Button onClick={fetchAnalytics}>
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Tổng quan hồ sơ hiện tại</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Hồ sơ có {formatNumber(skillCount)} kỹ năng, {formatNumber(totalApplications)}{' '}
                    đơn ứng tuyển, {formatNumber(responseCount)} phản hồi và {formatNumber(views)}{' '}
                    lượt xem ghi nhận.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-lg font-bold text-emerald-700">
                    {averageStrength}%
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Sức mạnh hồ sơ
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {averageStrength >= 80 ? 'Đang rất tốt' : 'Còn điểm để tối ưu'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">Khu vực nên ưu tiên</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {weakestArea
                      ? `${weakestArea.label} đang ở mức ${clampScore(weakestArea.score)}%. Cập nhật phần này trước để tăng độ tin cậy.`
                      : 'Chưa có dữ liệu đánh giá chi tiết. Hãy làm mới sau khi hồ sơ được cập nhật.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-slate-200 bg-white p-0 shadow-sm">
            <CardContent className="p-6">
              <SectionHeader
                icon={Building2}
                title="Công ty đã xem hồ sơ"
                subtitle="Những công ty đã mở hồ sơ của bạn trong giai đoạn gần đây."
              />

              {recentViewers.length > 0 ? (
                <div className="space-y-3">
                  {recentViewers.map((viewer, index) => (
                    <ViewerRow
                      key={`${viewer.company_name || viewer.company || 'viewer'}-${index}`}
                      viewer={viewer}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Eye}
                  title="Chưa có công ty nào xem hồ sơ"
                  description="Hồ sơ sẽ bắt đầu có dữ liệu khi nhà tuyển dụng tìm kiếm hoặc mở trang cá nhân của bạn."
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white p-0 shadow-sm">
            <CardContent className="p-6">
              <SectionHeader
                icon={Sparkles}
                title="Gợi ý cải thiện hồ sơ"
                subtitle="Các hành động nhỏ có thể giúp tăng độ nổi bật khi nhà tuyển dụng sàng lọc."
                action={
                  suggestions.length > 0 && (
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {suggestions.length} gợi ý
                    </span>
                  )
                }
              />

              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <SuggestionItem
                      key={`${suggestion.label}-${index}`}
                      suggestion={suggestion}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="Hồ sơ đang ở trạng thái tốt"
                  description="Chưa có gợi ý mới. Tiếp tục cập nhật kinh nghiệm, kỹ năng và hồ sơ dự án khi có thay đổi."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-slate-200 bg-white p-0 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader
              icon={BarChart3}
              title="Điểm mạnh hồ sơ"
              subtitle="Đánh giá từng phần quan trọng để bạn biết khu vực nào đã tốt và khu vực nào cần bổ sung."
              action={
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                  Trung bình {averageStrength}%
                </div>
              }
            />

            {strengthBreakdown.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {strengthBreakdown.map((item, index) => (
                  <StrengthGauge key={`${item.label}-${index}`} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Chưa có dữ liệu điểm mạnh"
                description="Điểm thành phần sẽ xuất hiện sau khi hệ thống phân tích đầy đủ hồ sơ của bạn."
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProfileAnalyticsPage;
