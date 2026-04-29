import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Clock, Briefcase, AlertTriangle, Building, FileText, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import { useNotification } from '../context/NotificationContext';
import { formatTimeAgo } from '../utils/formatters';

// Icon mapping cho các loại notification
const ICON_MAP = {
  application: Briefcase,
  job: FileText,
  interview: Clock,
  message: MessageSquare,
  system: AlertTriangle,
  moderation: Building,
  company: Building,
  report: AlertTriangle,
  job_expiring: Clock,
  default: Bell
};

// Màu sắc cho từng loại notification
const TYPE_STYLES = {
  application: { bg: 'bg-primary/10', text: 'text-primary' },
  job: { bg: 'bg-primary/10', text: 'text-primary' },
  interview: { bg: 'bg-primary/10', text: 'text-primary' },
  message: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  system: { bg: 'bg-warning/10', text: 'text-warning-700' },
  moderation: { bg: 'bg-danger/10', text: 'text-danger-700' },
  company: { bg: 'bg-primary/10', text: 'text-primary' },
  report: { bg: 'bg-danger/10', text: 'text-danger-700' },
  job_expiring: { bg: 'bg-warning/10', text: 'text-warning-700' },
  default: { bg: 'bg-muted', text: 'text-muted-foreground' }
};

const getNotificationData = (notification) => {
  const rawData = notification?.data;
  if (!rawData) return {};
  if (typeof rawData === 'object') return rawData;
  try {
    return JSON.parse(rawData);
  } catch {
    return {};
  }
};

const NotificationDropdown = ({ isOpen, onClose, userRole = 'candidate' }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { showNotification, updateUnreadCount } = useNotification();
  const navigate = useNavigate();
  const isFetchingRef = useRef(false);

  // Lấy notification path dựa trên role
  const getNotificationPath = useCallback(() => {
    switch (userRole) {
      case 'admin':
        return '/admin/notifications';
      case 'recruiter':
      case 'employer':
        return '/employer/notifications';
      case 'candidate':
      default:
        return '/candidate/notifications';
    }
  }, [userRole]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isOpen || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);
    try {
      let response;
      if (userRole === 'recruiter' || userRole === 'employer') {
        response = await notificationService.getRecruiterNotifications({ limit: 10 });
      } else if (userRole === 'admin') {
        response = await notificationService.getAdminNotifications({ limit: 10 });
      } else {
        response = await notificationService.getNotifications({ limit: 10 });
      }

      const data = response?.data?.data || response?.data || {};
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unread_count) || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isOpen, userRole]);

  // Sync unreadCount với NotificationContext (1 chiều: chỉ khi thực sự thay đổi từ API)
  useEffect(() => {
    updateUnreadCount(unreadCount);
  }, [unreadCount, updateUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      showNotification('Đã đánh dấu tất cả là đã đọc', 'success');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Get icon component
  const getIcon = (type) => {
    const Icon = ICON_MAP[type] || ICON_MAP.default;
    return Icon;
  };

  // Get style for type
  const getStyle = (type) => {
    return TYPE_STYLES[type] || TYPE_STYLES.default;
  };

  // Navigate to notification
  const handleNotificationClick = useCallback((notification) => {
    if (!notification.is_read) {
      notificationService.markAsRead(notification.id).catch(() => {});
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    const data = getNotificationData(notification);
    let path = getNotificationPath();

    if (notification.type === 'message' && data.conversation_id) {
      if (userRole === 'candidate') {
        path = `/candidate/messages?conversationId=${data.conversation_id}`;
      } else if (userRole === 'recruiter' || userRole === 'employer') {
        path = `/employer/messages?conversationId=${data.conversation_id}`;
      }
    } else if (data.application_id) {
      if (userRole === 'candidate') {
        path = `/candidate/applications?applicationId=${data.application_id}`;
      } else if (userRole === 'recruiter' || userRole === 'employer') {
        path = `/employer/applications?applicationId=${data.application_id}`;
      }
    } else if (data.job_id) {
      if (userRole === 'candidate') {
        path = `/candidate/jobs/${data.job_id}`;
      } else if (userRole === 'recruiter' || userRole === 'employer') {
        path = `/employer/jobs/${data.job_id}`;
      }
    }

    onClose();
    navigate(path);
  }, [getNotificationPath, navigate, onClose, userRole]);

  // Format notification time
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return formatTimeAgo(dateStr);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[45]" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 z-[50] overflow-hidden max-h-[500px] flex flex-col"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary-600" />
            <h3 className="font-bold text-slate-800">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="bg-primary-100 text-primary-600 text-sm font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
          >
            Đánh dấu đã đọc
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-base">Không có thông báo mới</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                const style = getStyle(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group relative ${
                      !notification.is_read ? 'bg-primary-50/30' : ''
                    }`}
                  >
                    {!notification.is_read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-primary-500 rounded-full"></div>
                    )}
                    
                    <div className="flex gap-3">
                      <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                        <Icon size={16} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm ${!notification.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-2 font-medium">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center shrink-0">
          <Link 
            to={getNotificationPath()}
            onClick={onClose}
            className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors"
          >
            Xem tất cả thông báo
          </Link>
        </div>
      </motion.div>
    </>
  );
};

NotificationDropdown.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userRole: PropTypes.oneOf(['candidate', 'recruiter', 'employer', 'admin']),
};

NotificationDropdown.defaultProps = {
  userRole: 'candidate'
};

export default NotificationDropdown;
