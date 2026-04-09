import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  ChevronDown,
  FileText,
  MessageSquare,
  MoreVertical,
  Search,
  User,
  X,
} from 'lucide-react';
import applicationService from '../../services/applicationService';
import { formatTimeAgo } from '../../utils/formatters';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'unread', label: 'Chưa đọc' },
  { id: 'important', label: 'Quan trọng' },
];

const formatNotificationTime = (dateStr) => {
  if (!dateStr) return 'Vừa xong';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Vừa xong';
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffMs < 60000) return 'Vừa xong';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)} phút trước`;
  if (diffDays === 0)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatTimeAgo(dateStr);
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await applicationService.getMyNotifications();
        const raw = response.data?.data ?? [];
        const items = raw.map((item, index) => ({
          ...item,
          read: item.read ?? index > 2,
          _type: inferNotificationType(item),
        }));
        setNotifications(items);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications(getSampleNotifications());
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  function inferNotificationType(item) {
    const t = (item.type || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();
    if (t === 'message' || title.includes('tin nhắn') || title.includes('message'))
      return 'message';
    if (title.includes('phỏng vấn') || title.includes('interview') || msg.includes('phỏng vấn'))
      return 'interview';
    if (title.includes('nhận hồ sơ') || title.includes('received') || msg.includes('ghi nhận'))
      return 'profile_received';
    if (title.includes('xét duyệt') || title.includes('review') || msg.includes('đang xem xét'))
      return 'under_review';
    if (title.includes('kết quả') || title.includes('result') || msg.includes('chưa phù hợp'))
      return 'result';
    return 'system';
  }

  function getSampleNotifications() {
    return [
      {
        id: 's1',
        _type: 'message',
        title: 'Tin nhắn mới từ Chi Lan Anh - HR TechGlobal',
        message:
          'Chào bạn, mình đã xem qua CV của bạn cho vị trí UI Designer. Bạn có thể dành chút thời gian trao đổi thêm vào sáng mai không?',
        created_at: new Date().toISOString(),
        read: false,
        sender_name: 'Chi Lan Anh',
      },
      {
        id: 's2',
        _type: 'interview',
        title: 'Lời mời phỏng vấn - Cyber Soft JSC',
        message:
          'Chúc mừng! Bạn đã vượt qua vòng sơ loại. Chúng tôi trân trọng mời bạn tham dự buổi phỏng vấn chuyên môn cho vị trí Senior Frontend.',
        created_at: new Date().toISOString(),
        read: false,
        confirmed: true,
      },
      {
        id: 's3',
        _type: 'profile_received',
        title: 'Đã nhận hồ sơ - VNG Corporation',
        message:
          'Hồ sơ ứng tuyển vị trí Product Designer của bạn đã được hệ thống ghi nhận thành công.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        read: true,
      },
      {
        id: 's4',
        _type: 'under_review',
        title: 'Đang xét duyệt - FPT Software',
        message:
          'Nhà tuyển dụng đang xem xét chi tiết kinh nghiệm của bạn. Kết quả sẽ có trong vòng 3-5 ngày làm việc.',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        read: true,
      },
      {
        id: 's5',
        _type: 'result',
        title: 'Kết quả ứng tuyển - TechOne Co.',
        message:
          'Cảm ơn bạn đã quan tâm. Rất tiếc hiện tại kinh nghiệm của bạn chưa phù hợp với yêu cầu của vị trí này.',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        read: true,
      },
    ];
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered =
    activeTab === 'all'
      ? notifications
      : activeTab === 'unread'
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n._type === 'interview' || n._type === 'message');

  const displayList = searchQuery.trim()
    ? filtered.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (n.message || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filtered;

  const handleNotificationClick = (notification) => {
    if (notification.application_id) {
      navigate(`/candidate/applications?applicationId=${notification.application_id}`);
    } else {
      navigate('/candidate/applications');
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Thông báo</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Cập nhật trạng thái hồ sơ của bạn</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-[180px] pl-9 rounded-lg bg-background"
            />
          </div>
          <Button variant="ghost" size="icon" className="rounded-lg">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.id === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-xl">
              <CardContent className="flex gap-4 p-5">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-full rounded bg-muted animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : displayList.length === 0 ? (
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <EmptyState
                variant="robotChat"
                title="Chưa có thông báo nào"
                description="Thông báo mới sẽ xuất hiện tại đây."
              />
            </CardContent>
          </Card>
        ) : (
          displayList.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onAction={handleNotificationClick}
            />
          ))
        )}
      </div>

      {/* Load more */}
      {!loading && displayList.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Xem tất cả thông báo cũ hơn
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

function NotificationCard({ notification, onAction }) {
  const { _type, title, message, created_at, read, sender_name, confirmed } = notification;
  const timeStr = formatNotificationTime(created_at);

  const isUnread = !read;

  return (
    <Card
      className={`rounded-xl border bg-card ${isUnread ? 'border-primary/30' : ''} ${_type === 'message' && isUnread ? 'border-l-4 border-l-[#0ea5e9]' : ''}`}
    >
      <CardContent className="p-0">
        <div className="flex gap-4 p-5">
          {/* Left: Icon or Avatar */}
          <div className="relative shrink-0">
            {_type === 'message' ? (
              <Avatar className="h-12 w-12 rounded-full border-2 border-background">
                <AvatarFallback className="bg-primary/20 text-sm font-semibold text-primary">
                  {(sender_name || 'U').charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  _type === 'interview'
                    ? 'bg-primary/15 text-primary'
                    : _type === 'profile_received'
                      ? 'bg-muted text-muted-foreground'
                      : _type === 'under_review'
                        ? 'bg-orange-100 text-orange-600'
                        : _type === 'result'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-muted text-muted-foreground'
                }`}
              >
                {_type === 'interview' ? (
                  <CalendarCheck className="h-6 w-6" />
                ) : _type === 'profile_received' ? (
                  <FileText className="h-6 w-6" />
                ) : _type === 'under_review' ? (
                  <FileText className="h-6 w-6" />
                ) : _type === 'result' ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Bell className="h-6 w-6" />
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className="font-semibold text-foreground">{title}</h4>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {isUnread && _type !== 'message' && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
                {timeStr}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>

            {_type === 'message' && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-lg bg-primary hover:bg-primary/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(notification);
                  }}
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                  Phản hồi ngay
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(notification);
                  }}
                >
                  <User className="mr-1.5 h-3.5 w-3.5" />
                  Xem hồ sơ
                </Button>
              </div>
            )}

            {_type === 'interview' && confirmed && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20">
                  ✓
                </span>
                ĐÃ XÁC NHẬN
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

NotificationCard.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    _type: PropTypes.string,
    title: PropTypes.string,
    message: PropTypes.string,
    created_at: PropTypes.string,
    read: PropTypes.bool,
    sender_name: PropTypes.string,
    confirmed: PropTypes.bool,
    application_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onAction: PropTypes.func.isRequired,
};

export default NotificationsPage;
