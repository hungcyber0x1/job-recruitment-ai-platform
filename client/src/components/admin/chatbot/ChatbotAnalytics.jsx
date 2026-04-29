import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Users, Activity, MessageCircle, Calendar, Download } from 'lucide-react';

import { Button, Card, Input } from '../../common';
import adminChatbotService from '../../../services/adminChatbotService';

const ChatbotAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminChatbotService.getAnalytics(dateRange);
      setAnalytics(response.data?.data || null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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
      link.setAttribute('download', `chatbot-conversations-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-state-danger font-medium">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const stats = [
    {
      label: 'Tổng hội thoại',
      value: analytics?.totalConversations || 0,
      icon: MessageSquare,
      color: 'bg-secondary',
      change: '+12%',
    },
    {
      label: 'Tin nhắn người dùng',
      value: analytics?.userMessages || 0,
      icon: MessageCircle,
      color: 'bg-state-success',
      change: '+8%',
    },
    {
      label: 'Người dùng hoạt động',
      value: analytics?.activeUsers || 0,
      icon: Users,
      color: 'bg-accent',
      change: '+15%',
    },
    {
      label: 'Trung bình tin nhắn',
      value: analytics?.averageMessagesPerConversation || 0,
      icon: Activity,
      color: 'bg-state-warning',
      change: '+5%',
    },
  ];

  const eventStats = analytics?.events || [];
  const dailyActivity = analytics?.dailyActivity || [];
  const maxDailyConversations = Math.max(...dailyActivity.map((item) => item.conversations), 1);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <Input
              type="date"
              label="Từ ngày"
              value={dateRange.startDate}
              onChange={(event) => setDateRange({ ...dateRange, startDate: event.target.value })}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <Input
              type="date"
              label="Đến ngày"
              value={dateRange.endDate}
              onChange={(event) => setDateRange({ ...dateRange, endDate: event.target.value })}
            />
          </div>
          <Button onClick={handleExport} leftIcon={<Download size={18} />}>
            Xuất dữ liệu
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} hover className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon size={24} className="text-white" />
                </div>
                <span className="rounded-lg bg-state-success/10 px-2 py-1 text-sm font-bold text-state-success">
                  {stat.change}
                </span>
              </div>
              <p className="mb-1 text-base font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground">Phân tích sự kiện</h3>
        <div className="space-y-3">
          {eventStats.map((event) => (
            <div
              key={event.event_type}
              className="flex items-center justify-between rounded-xl bg-muted p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="font-bold text-foreground">
                  {event.event_type.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <span className="text-2xl font-bold text-foreground">{event.count}</span>
            </div>
          ))}
          {eventStats.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Không có dữ liệu sự kiện</p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
          <Calendar size={20} className="text-primary" />
          Hoạt động theo ngày (30 ngày gần nhất)
        </h3>
        <div className="space-y-2">
          {dailyActivity.slice(0, 10).map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                {new Date(day.date).toLocaleDateString('vi-VN')}
              </span>
              <div className="relative h-8 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="flex h-full items-center justify-end rounded-full bg-primary pr-3 transition-all"
                  style={{
                    width: `${Math.min((day.conversations / maxDailyConversations) * 100, 100)}%`,
                  }}
                >
                  <span className="text-sm font-bold text-white">{day.conversations}</span>
                </div>
              </div>
            </div>
          ))}
          {dailyActivity.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Không có dữ liệu hoạt động</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ChatbotAnalytics;
