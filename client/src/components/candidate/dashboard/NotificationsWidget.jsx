import React, { useEffect, useState } from 'react';
import { Bell, Briefcase, CheckCircle, Mail, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import applicationService from '../../../services/applicationService';
import { formatTimeAgo } from '../../../utils/formatters';

const getNotificationType = (item) => {
  if (item.status === 'interviewing') return 'interview';
  if (item.status === 'rejected' || item.status === 'withdrawn') return 'status';
  if (item.status === 'reviewed' || item.status === 'shortlisted' || item.status === 'offered') {
    return 'viewed';
  }
  return item.type || 'job';
};

const getIcon = (type) => {
  switch (type) {
    case 'interview':
      return <Mail size={16} className="text-secondary" />;
    case 'viewed':
      return <CheckCircle size={16} className="text-accent" />;
    case 'job':
      return <Briefcase size={16} className="text-state-success" />;
    case 'status':
      return <XCircle size={16} className="text-state-danger" />;
    default:
      return <Bell size={16} className="text-txt-muted" />;
  }
};

const getBg = (type) => {
  switch (type) {
    case 'interview':
      return 'bg-secondary/10';
    case 'viewed':
      return 'bg-accent/10';
    case 'job':
      return 'bg-state-success/10';
    case 'status':
      return 'bg-state-danger/10';
    default:
      return 'bg-muted';
  }
};

const NotificationsWidget = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await applicationService.getMyNotifications();
        setNotifications((response.data.data || []).slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch dashboard notifications:', error);
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, []);

  const openNotification = (notification) => {
    if (notification.application_id) {
      navigate(`/candidate/applications?applicationId=${notification.application_id}`);
      return;
    }

    navigate('/candidate/notifications');
  };

  return (
    <div className="relative flex h-full flex-col">
      <div className="space-y-4">
        {notifications.length ? (
          notifications.map((notification, index) => {
            const type = getNotificationType(notification);
            const isRead = index > 1;

            return (
              <div
                key={notification.id}
                className="group flex cursor-pointer gap-4 rounded-xl border border-transparent bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:bg-secondary/5"
                onClick={() => openNotification(notification)}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getBg(type)} shadow-sm transition-transform`}
                >
                  {getIcon(type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`line-clamp-2 text-base tracking-wide ${isRead ? 'font-medium text-txt-muted' : 'font-semibold text-foreground'}`}
                  >
                    {notification.message}
                  </p>
                  <p className="mt-1 text-base text-txt-light">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
                {!isRead ? (
                  <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-sm shadow-primary/30" />
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-txt-muted">
            Chưa có thông báo mới.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsWidget;
