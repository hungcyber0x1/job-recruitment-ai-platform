import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, MessageSquare, Users, Clock,
  ThumbsUp, ThumbsDown, Star, Download, Calendar,
  RefreshCw, ChevronDown, TrendingDown, Zap
} from 'lucide-react';
import adminChatbotService from '../../../services/adminChatbotService';

const ChatbotAnalyticsEnhanced = () => {
  const [analytics, setAnalytics] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [intentStats, setIntentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  });
  const [showDatePresets, setShowDatePresets] = useState(false);

  const datePresets = [
    { label: '7 ngày', days: 7 },
    { label: '14 ngày', days: 14 },
    { label: '30 ngày', days: 30 },
    { label: '90 ngày', days: 90 },
  ];

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes] = await Promise.all([
        adminChatbotService.getAnalytics(dateRange),
      ]);

      const data = analyticsRes.data?.data || {};
      setAnalytics(data);

      // Feedback from real API data
      setFeedbackStats({
        positive: data.feedbackPositive || 0,
        negative: data.feedbackNegative || 0,
        total: (data.feedbackPositive || 0) + (data.feedbackNegative || 0),
      });

      // Intent distribution from real API data
      const INTENT_COLORS = {
        job_search: '#10b981',
        cv_review: '#6366f1',
        interview: '#f59e0b',
        salary: '#ef4444',
        career_path: '#8b5cf6',
        general: '#6b7280',
      };
      const INTENT_LABELS = {
        job_search: 'Tìm việc',
        cv_review: 'Review CV',
        interview: 'Phỏng vấn',
        salary: 'Lương',
        career_path: 'Lộ trình nghề',
        general: 'Khác',
      };
      const intents = (data.intentDistribution || []).map((item) => ({
        intent: item.intent || 'general',
        label: INTENT_LABELS[item.intent] || item.intent || 'Khác',
        count: item.count || 0,
        color: INTENT_COLORS[item.intent] || '#6b7280',
      }));
      intents.sort((a, b) => b.count - a.count);
      setIntentStats(intents);
    } catch (err) {
      console.error('Error fetching enhanced analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const applyPreset = (days) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    });
    setShowDatePresets(false);
  };

  const handleExport = async () => {
    try {
      const response = await adminChatbotService.exportConversations({
        ...dateRange,
        format: 'csv',
      });
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chatbot-analytics-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const dailyActivity = analytics?.dailyActivity || [];
  const maxActivity = Math.max(...dailyActivity.map((d) => d.conversations), 1);

  const positiveRate = feedbackStats && (feedbackStats.positive + feedbackStats.negative) > 0
    ? ((feedbackStats.positive / (feedbackStats.positive + feedbackStats.negative)) * 100).toFixed(1)
    : '0';

  const totalIntentCount = intentStats.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-foreground">Phân tích nâng cao</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDatePresets(!showDatePresets)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-bold text-foreground transition-colors hover:bg-muted"
            >
              <Calendar size={18} />
              Lọc ngày
              <ChevronDown size={16} />
            </button>
            {showDatePresets && (
              <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-xl border border-border bg-card p-2 shadow-lg">
                {datePresets.map((preset) => (
                  <button
                    key={preset.days}
                    onClick={() => applyPreset(preset.days)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-bold text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw size={18} />
            Làm mới
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download size={18} />
            Xuất CSV
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MessageSquare}
          iconBg="bg-primary"
          label="Tổng hội thoại"
          value={analytics?.totalConversations || 0}
          trend="+12%"
          trendUp
        />
        <StatCard
          icon={Users}
          iconBg="bg-indigo-500"
          label="Người dùng hoạt động"
          value={analytics?.activeUsers || 0}
          trend="+8%"
          trendUp
        />
        <StatCard
          icon={BarChart3}
          iconBg="bg-emerald-500"
          label="Tin nhắn TB / hội thoại"
          value={analytics?.averageMessagesPerConversation || 0}
          trend="+5%"
          trendUp
        />
        <StatCard
          icon={ThumbsUp}
          iconBg="bg-amber-500"
          label="Tỷ lệ phản hồi tích cực"
          value={`${positiveRate}%`}
          subLabel={`${feedbackStats?.positive || 0} đánh giá tích cực`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Hoạt động theo ngày</h3>
            <span className="text-sm text-muted-foreground">
              {dateRange.startDate} → {dateRange.endDate}
            </span>
          </div>

          {dailyActivity.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Không có dữ liệu trong khoảng thời gian này
            </div>
          ) : (
            <div className="space-y-2">
              {dailyActivity.map((day, idx) => {
                const pct = (day.conversations / maxActivity) * 100;
                return (
                  <div key={day.date || idx} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <div className="relative h-8 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-primary to-indigo-500 px-3 text-sm font-bold text-white transition-all"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      >
                        {day.conversations > 0 && day.conversations}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">Phân bổ Intent</h3>
          <div className="space-y-3">
            {intentStats.map((intent) => {
              const pct = totalIntentCount > 0 ? (intent.count / totalIntentCount) * 100 : 0;
              return (
                <div key={intent.intent} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: intent.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{intent.label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {intent.count} <span className="text-xs font-normal text-muted-foreground">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: intent.color }}
                    />
                  </div>
                </div>
              );
            })}
            {intentStats.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu intent
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">Phản hồi người dùng</h3>
          <div className="mb-4 flex items-center justify-center gap-6">
            <div className="text-center">
              <ThumbsUp size={32} className="mx-auto mb-2 text-emerald-500" />
              <p className="text-3xl font-bold text-emerald-500">{feedbackStats?.positive || 0}</p>
              <p className="text-sm text-muted-foreground">Tích cực</p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div className="text-center">
              <ThumbsDown size={32} className="mx-auto mb-2 text-red-400" />
              <p className="text-3xl font-bold text-red-400">{feedbackStats?.negative || 0}</p>
              <p className="text-sm text-muted-foreground">Tiêu cực</p>
            </div>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
              style={{ width: `${positiveRate}%` }}
            />
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {positiveRate}%满意度
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">Tin nhắn chatbot</h3>
          <div className="mb-4 flex items-center justify-center gap-6">
            <div className="text-center">
              <MessageSquare size={32} className="mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-primary">{analytics?.totalMessages || 0}</p>
              <p className="text-sm text-muted-foreground">Tổng tin nhắn</p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div className="text-center">
              <Zap size={32} className="mx-auto mb-2 text-amber-500" />
              <p className="text-3xl font-bold text-amber-500">
                {Math.round((analytics?.aiMessages || 0) / Math.max(analytics?.totalMessages || 1, 1) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">Tỷ lệ AI</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tin nhắn người dùng</span>
              <span className="font-bold">{analytics?.userMessages || 0}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{
                  width: `${(analytics?.userMessages || 0) / Math.max(analytics?.totalMessages || 1, 1) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tin nhắn AI</span>
              <span className="font-bold">{analytics?.aiMessages || 0}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${(analytics?.aiMessages || 0) / Math.max(analytics?.totalMessages || 1, 1) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">Sự kiện chatbot</h3>
          <div className="space-y-3">
            {(analytics?.events || []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Không có dữ liệu sự kiện
              </p>
            ) : (
              analytics.events.map((event) => (
                <div
                  key={event.event_type}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <span className="text-sm font-medium text-foreground capitalize">
                    {event.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-lg font-bold text-primary">{event.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground">Hướng dẫn đọc báo cáo</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-600" />
              <span className="font-bold text-emerald-800">Xu hướng tích cực</span>
            </div>
            <ul className="space-y-1 text-sm text-emerald-700">
              <li>• Tỷ lệ phản hồi tích cực trên 80% là tốt</li>
              <li>• Số người dùng hoạt động tăng đều theo thời gian</li>
              <li>• Intent phân bổ đều, không tập trung quá 1 loại</li>
            </ul>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingDown size={20} className="text-amber-600" />
              <span className="font-bold text-amber-800">Cần cải thiện</span>
            </div>
            <ul className="space-y-1 text-sm text-amber-700">
              <li>• Tỷ lệ positive dưới 70% = cần xem lại prompt</li>
              <li>• Feedback negative cao = kiểm tra intent detection</li>
              <li>• Quota hết sớm = tăng giới hạn cho user</li>
            </ul>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              <span className="font-bold text-blue-800">Về quota</span>
            </div>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Quota mặc định: 50 tin nhắn/ngày/user</li>
              <li>• Đặt quota hợp lý tránh lạm dụng API</li>
              <li>• Theo dõi user quota tại bảng chatbot_daily_quotas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, iconBg, label, value, trend, trendUp, subLabel }) => (
  <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm">
    <div className="mb-3 flex items-start justify-between">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon size={22} className="text-white" />
      </div>
      {trend && (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            trendUp
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {trend}
        </span>
      )}
    </div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    {subLabel && <p className="mt-1 text-xs text-muted-foreground">{subLabel}</p>}
  </div>
);

export default ChatbotAnalyticsEnhanced;
