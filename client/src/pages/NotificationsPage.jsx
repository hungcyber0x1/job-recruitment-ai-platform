import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Inbox,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { useNotification } from '../context/NotificationContext';
import notificationService from '../services/notificationService';
import { cn } from '../utils/cn';
import { formatTimeAgo } from '../utils/formatters';

const TYPE_CONFIG = {
  application: {
    label: 'Ứng tuyển',
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
  job: {
    label: 'Tin tuyển dụng',
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    tone: 'bg-blue-50 text-blue-700 ring-blue-100',
  },
  interview: {
    label: 'Phỏng vấn',
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 12" />
      </svg>
    ),
    tone: 'bg-violet-50 text-violet-700 ring-violet-100',
  },
  message: {
    label: 'Tin nhắn',
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
      </svg>
    ),
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
  system: {
    label: 'Hệ thống',
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    tone: 'bg-amber-50 text-amber-700 ring-amber-100',
  },
  moderation: {
    label: 'Kiểm duyệt',
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    tone: 'bg-rose-50 text-rose-700 ring-rose-100',
  },
  company: {
    label: 'Công ty',
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    tone: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  },
  report: {
    label: 'Báo cáo',
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    tone: 'bg-rose-50 text-rose-700 ring-rose-100',
  },
  job_expiring: {
    label: 'Sắp hết hạn',
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 12" />
      </svg>
    ),
    tone: 'bg-orange-50 text-orange-700 ring-orange-100',
  },
};

const CATEGORY_LABELS = {
  pending_company: 'Công ty chờ duyệt',
  pending_job: 'Tin chờ duyệt',
  new_report: 'Báo cáo mới',
  auto_detected_violation: 'AI gắn cờ',
  general: 'Hệ thống chung',
  bulk: 'Gửi hàng loạt',
  recruitment_message: 'Tin nhắn tuyển dụng',
};

const TABS_BY_ROLE = {
  candidate: [
    { id: 'all', label: 'Tất cả' },
    { id: 'unread', label: 'Chưa đọc' },
    { id: 'application', label: 'Ứng tuyển' },
    { id: 'message', label: 'Tin nhắn' },
    { id: 'job', label: 'Tin tuyển dụng' },
  ],
  recruiter: [
    { id: 'all', label: 'Tất cả' },
    { id: 'unread', label: 'Chưa đọc' },
    { id: 'application', label: 'Ứng viên' },
    { id: 'message', label: 'Tin nhắn' },
    { id: 'interview', label: 'Phỏng vấn' },
    { id: 'job_expiring', label: 'Hết hạn' },
  ],
  admin: [
    { id: 'all', label: 'Tất cả' },
    { id: 'unread', label: 'Chưa đọc' },
    { id: 'moderation', label: 'Kiểm duyệt' },
    { id: 'report', label: 'Báo cáo' },
  ],
};

const ROLE_META = {
  candidate: {
    eyebrow: 'Trung tâm thông báo',
    title: 'Thông báo',
    description: 'Theo dõi cập nhật mới về ứng tuyển, lịch phỏng vấn và cơ hội việc làm.',
    searchPlaceholder: 'Tìm thông báo...',
  },
  recruiter: {
    eyebrow: 'Hộp tin nhà tuyển dụng',
    title: 'Thông báo tuyển dụng',
    description: 'Theo dõi phản hồi ứng viên, lịch phỏng vấn và cảnh báo vận hành.',
    searchPlaceholder: 'Tìm ứng viên, lịch hẹn...',
  },
  admin: {
    eyebrow: 'Thông báo quản trị',
    title: 'Thông báo quản trị',
    description: 'Theo dõi kiểm duyệt, báo cáo vi phạm và cập nhật hệ thống.',
    searchPlaceholder: 'Tìm kiểm duyệt, báo cáo...',
  },
};

const getTypeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.system;

const getNotificationData = (notification) => {
  const rawData = notification?.data;
  if (!rawData) return {};
  if (typeof rawData === 'object') return rawData;
  if (typeof rawData === 'string') {
    try { return JSON.parse(rawData); } catch (_) { return {}; }
  }
  return {};
};

const getCategoryLabel = (category) => CATEGORY_LABELS[category] || category;

const getContextTags = (notification) => {
  const data = getNotificationData(notification);
  const tags = [];

  if (notification.category) {
    tags.push({ label: getCategoryLabel(notification.category), tone: 'slate' });
  }
  if (data.application_id) {
    tags.push({ label: `Hồ sơ #${data.application_id}`, tone: 'emerald' });
  }
  if (data.conversation_id) {
    tags.push({ label: `Hội thoại #${data.conversation_id}`, tone: 'violet' });
  }
  if (data.job_id) {
    tags.push({ label: `Tin #${data.job_id}`, tone: 'blue' });
  }
  if (data.company_id) {
    tags.push({ label: `Công ty #${data.company_id}`, tone: 'cyan' });
  }
  if (data.report_id) {
    tags.push({ label: `Báo cáo #${data.report_id}`, tone: 'rose' });
  }
  if (data.report_type) {
    tags.push({ label: String(data.report_type), tone: 'amber' });
  }
  if (Array.isArray(data.violations) && data.violations.length > 0) {
    tags.push({ label: `${data.violations.length} tín hiệu AI`, tone: 'violet' });
  }

  return tags;
};

const StatCard = ({ label, value, icon: Icon, tone }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-3xl font-bold leading-none text-slate-950">{value ?? '—'}</div>
        <div className="mt-1 text-sm font-bold text-slate-700">{label}</div>
      </div>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1', tone)}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const SidebarCard = ({ title, icon: Icon, children, className }) => (
  <Card className={cn('overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm', className)}>
    <CardContent className="p-5">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
        <Icon className="h-4 w-4 text-emerald-600" />
        {title}
      </h3>
      {children}
    </CardContent>
  </Card>
);

const NotificationCard = ({ notification, onAction, onMarkAsRead, onDelete, isAdmin }) => {
  const typeConfig = getTypeConfig(notification.type);
  const Icon = typeConfig.icon;
  const isUnread = !notification.is_read;
  const contextTags = getContextTags(notification);

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-100/40',
        isUnread ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1', typeConfig.tone)}>
            <Icon />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-bold ring-1', typeConfig.tone)}>
                {typeConfig.label}
              </span>
              <span className={cn('inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold ring-1', isUnread ? 'bg-emerald-600 text-white ring-emerald-700' : 'bg-slate-100 text-slate-500 ring-slate-200')}>
                {isUnread ? 'Cần xem' : 'Đã đọc'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                <Clock3 className="h-3 w-3" />
                {formatTimeAgo(notification.created_at)}
              </span>
            </div>

            {/* Title & message */}
            <h3 className="mt-2 line-clamp-1 text-sm font-bold text-slate-950">
              {notification.title || 'Thông báo hệ thống'}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">
              {notification.message || 'Không có nội dung bổ sung.'}
            </p>

            {/* Tags */}
            {contextTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {contextTags.map((tag) => (
                  <span
                    key={`${notification.id}-${tag.label}`}
                    className={cn(
                      'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ring-1',
                      {
                        slate: 'border-slate-200 bg-slate-50 text-slate-600 ring-slate-200',
                        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-200',
                        blue: 'border-blue-200 bg-blue-50 text-blue-700 ring-blue-200',
                        violet: 'border-violet-200 bg-violet-50 text-violet-700 ring-violet-200',
                        rose: 'border-rose-200 bg-rose-50 text-rose-700 ring-rose-200',
                        amber: 'border-amber-200 bg-amber-50 text-amber-700 ring-amber-200',
                        cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700 ring-cyan-200',
                      }[tag.tone] || 'border-slate-200 bg-slate-50 text-slate-600 ring-slate-200'
                    )}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={() => onAction(notification)}
              className="inline-flex h-9 items-center gap-1 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              Chi tiết
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            {isUnread && (
              <button
                type="button"
                onClick={() => onMarkAsRead(notification.id)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đánh dấu
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(notification.id)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const NotificationsPage = ({ userRole = 'candidate' }) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [typeStats, setTypeStats] = useState({});

  const tabs = TABS_BY_ROLE[userRole] || TABS_BY_ROLE.candidate;
  const roleMeta = ROLE_META[userRole] || ROLE_META.candidate;
  const isAdmin = userRole === 'admin';

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (userRole === 'recruiter') {
        response = await notificationService.getRecruiterNotifications({ limit: 100 });
      } else if (userRole === 'admin') {
        response = await notificationService.getAdminNotifications({ limit: 100 });
      } else {
        response = await notificationService.getNotifications({ limit: 100 });
      }

      const data = response.data?.data || response.data || {};
      const items = Array.isArray(data.notifications) ? data.notifications : [];

      setNotifications(items);
      setUnreadCount(data.unread_count ?? items.filter((item) => !item.is_read).length);
      setTypeStats(data.stats && typeof data.stats === 'object' ? data.stats : {});
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      showNotification('Không thể tải thông báo', 'error');
      setNotifications([]);
      setUnreadCount(0);
      setTypeStats({});
    } finally {
      setLoading(false);
    }
  }, [showNotification, userRole]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const stats = useMemo(() => {
    const getTotalByType = (type) =>
      Number(typeStats?.[type]?.total ?? notifications.filter((item) => item.type === type).length);

    const totalFromStats = Object.values(typeStats || {}).reduce(
      (sum, item) => sum + Number(item?.total || 0), 0
    );
    const total = totalFromStats || notifications.length;
    const readCount = Math.max(0, total - unreadCount);

    return {
      total,
      unread: unreadCount,
      readCount,
      applicationCount: getTotalByType('application'),
      jobCount: getTotalByType('job'),
      interviewCount: getTotalByType('interview'),
      messageCount: getTotalByType('message'),
      moderationCount: getTotalByType('moderation'),
      reportCount: getTotalByType('report'),
      systemCount: getTotalByType('system'),
      jobExpiringCount: getTotalByType('job_expiring'),
    };
  }, [notifications, typeStats, unreadCount]);

  const displayList = useMemo(() => {
    let filtered = notifications;

    if (activeTab === 'unread') {
      filtered = filtered.filter((item) => !item.is_read);
    } else if (activeTab !== 'all') {
      filtered = filtered.filter((item) => item.type === activeTab);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          String(item.title || '').toLowerCase().includes(query) ||
          String(item.message || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeTab, notifications, searchQuery]);

  const tabCounts = useMemo(() => {
    const map = {
      all: stats.total,
      unread: stats.unread,
      application: stats.applicationCount,
      job: stats.jobCount,
      interview: stats.interviewCount,
      message: stats.messageCount,
      moderation: stats.moderationCount,
      report: stats.reportCount,
      job_expiring: stats.jobExpiringCount,
    };
    return tabs.reduce((acc, tab) => {
      acc[tab.id] = map[tab.id] ?? notifications.filter((item) => item.type === tab.id).length;
      return acc;
    }, {});
  }, [notifications, stats, tabs]);

  const summaryCards = [
    {
      label: 'Tổng thông báo',
      value: stats.total,
      icon: Inbox,
      tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    },
    {
      label: 'Chưa đọc',
      value: stats.unread,
      icon: Bell,
      tone: 'bg-amber-50 text-amber-600 ring-amber-100',
    },
    {
      label: 'Đã đọc',
      value: stats.readCount,
      icon: CheckCircle2,
      tone: 'bg-sky-50 text-sky-600 ring-sky-100',
    },
  ];

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      showNotification('Không thể đánh dấu đã đọc', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      showNotification('Đã đánh dấu tất cả là đã đọc', 'success');
    } catch (error) {
      showNotification('Không thể đánh dấu đã đọc', 'error');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      const notification = notifications.find((item) => item.id === notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      showNotification('Đã xóa thông báo', 'success');
    } catch (error) {
      showNotification('Không thể xóa thông báo', 'error');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    const data = getNotificationData(notification);
    const applicationId = data.application_id || notification.application_id;
    const conversationId = data.conversation_id || notification.conversation_id;
    const jobId = data.job_id || notification.job_id;
    const companyId = data.company_id || notification.company_id;
    let path = '';

    if (notification.type === 'message' && conversationId) {
      if (userRole === 'candidate') path = `/candidate/messages?conversationId=${conversationId}`;
      if (userRole === 'recruiter') path = `/employer/messages?conversationId=${conversationId}`;
      if (userRole === 'admin') path = '/admin/support';
    } else if (applicationId) {
      if (userRole === 'candidate') path = `/candidate/applications?applicationId=${applicationId}`;
      if (userRole === 'recruiter') path = `/employer/applications?applicationId=${applicationId}`;
      if (userRole === 'admin') path = `/admin/applications/${applicationId}`;
    } else if (jobId) {
      if (userRole === 'candidate') path = `/candidate/jobs/${jobId}`;
      if (userRole === 'recruiter') path = `/employer/jobs/${jobId}`;
      if (userRole === 'admin') path = `/admin/jobs/${jobId}`;
    } else if (companyId) {
      path = `/admin/companies/${companyId}`;
    } else if (userRole === 'admin' && ['moderation', 'report'].includes(notification.type)) {
      path = '/admin/moderation';
    }

    if (path) navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16">
      {/* Header */}
      <div className="border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-8 sm:px-6 lg:px-8">
          {/* Title row */}
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                <Bell className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  {roleMeta.eyebrow}
                </span>
                <h1 className="mt-2 text-xl font-bold tracking-normal text-slate-950 sm:text-2xl">
                  {roleMeta.title}
                </h1>
                <p className="mt-0.5 max-w-2xl text-sm font-medium text-slate-600">
                  {roleMeta.description}
                </p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          {!loading && notifications.length > 0 && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {summaryCards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </div>
          )}
          {loading && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-white shadow-sm" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        {/* Search + Filter row */}
        {notifications.length > 0 && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={roleMeta.searchPlaceholder}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium shadow-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label="Xóa tìm kiếm"
                  >
                    <span className="text-sm font-medium">Xóa</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {tabs.map((tab) => {
                    const count = tabCounts[tab.id] ?? 0;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors',
                          active
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
                            : 'text-slate-500 hover:bg-white hover:text-slate-900'
                        )}
                      >
                        {tab.label}
                        {count > 0 && (
                          <span className={cn(
                            'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                            active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          )}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Đánh dấu hết
                </button>
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                  Làm mới
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2-column layout */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Notifications list */}
          <section className="space-y-3">
            {/* Result count bar */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <span className="text-sm font-semibold text-slate-700">
                  <b className="text-emerald-700">{displayList.length}</b> thông báo
                  {(searchQuery || activeTab !== 'all') && (
                    <span className="font-medium text-slate-500"> / {notifications.length} tổng</span>
                  )}
                </span>
                {(searchQuery || activeTab !== 'all') && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <Inbox className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 text-base font-bold text-slate-800">Chưa có thông báo nào</p>
                <p className="mt-2 text-sm text-slate-500">
                  {userRole === 'admin'
                    ? 'Thông báo kiểm duyệt, báo cáo và hệ thống sẽ xuất hiện tại đây khi có phát sinh mới.'
                    : 'Các cập nhật quan trọng về ứng tuyển, phỏng vấn và tin tuyển dụng sẽ xuất hiện tại đây.'}
                </p>
              </div>
            ) : displayList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <Search className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-4 text-base font-bold text-slate-800">Không tìm thấy kết quả phù hợp</p>
                <p className="mt-2 text-sm text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc.</p>
              </div>
            ) : (
              displayList.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onAction={handleNotificationClick}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  isAdmin={isAdmin}
                />
              ))
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <SidebarCard title="Theo loại" icon={Bell}>
              <div className="mt-3 space-y-2">
                {[
                  { label: 'Ứng tuyển', count: stats.applicationCount, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                  { label: 'Tin tuyển dụng', count: stats.jobCount, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { label: 'Phỏng vấn', count: stats.interviewCount, tone: 'bg-violet-50 text-violet-700 border-violet-100' },
                  { label: 'Tin nhắn', count: stats.messageCount, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                  { label: 'Hệ thống', count: stats.systemCount, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
                  ...(isAdmin
                    ? [
                      { label: 'Kiểm duyệt', count: stats.moderationCount, tone: 'bg-rose-50 text-rose-700 border-rose-100' },
                      { label: 'Báo cáo', count: stats.reportCount, tone: 'bg-rose-50 text-rose-700 border-rose-100' },
                    ]
                    : []),
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn('flex items-center justify-between rounded-lg border px-3 py-2.5', item.tone)}
                  >
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-xl font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </SidebarCard>

          </aside>
        </div>
      </main>
    </div>
  );
};

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  icon: PropTypes.elementType.isRequired,
  tone: PropTypes.string,
};

SidebarCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node,
};

NotificationCard.propTypes = {
  notification: PropTypes.object.isRequired,
  onAction: PropTypes.func.isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired,
};

NotificationsPage.propTypes = {
  userRole: PropTypes.oneOf(['candidate', 'recruiter', 'admin']),
};

export default NotificationsPage;
