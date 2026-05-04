import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import applicationService from '../../../services/applicationService';
import { formatTimeAgo } from '../../../utils/formatters';
import { NOTIFICATION_TYPE_CONFIG, getAppStatusConfig } from '../../../constants';
import { isHandledAuthError } from '../../../utils/authErrors';

/**
 * Lấy notification icon config dựa trên application status.
 * Fallback về 'application' type nếu không có status.
 */
const getIconConfig = (notification) => {
  const status = notification?.status;
  if (status) {
    const appCfg = getAppStatusConfig(status);
    if (appCfg) {
      return { icon: appCfg.icon, bg: appCfg.bg, text: appCfg.text };
    }
  }
  const typeCfg =
    NOTIFICATION_TYPE_CONFIG[notification?.type] || NOTIFICATION_TYPE_CONFIG.application;
  return { icon: typeCfg.icon, bg: typeCfg.bg, text: typeCfg.text };
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
        if (isHandledAuthError(error)) {
          setNotifications([]);
          return;
        }
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
            const { icon: IconName, bg, text } = getIconConfig(notification);
            const Icon = IconName;
            const isRead = index > 1;

            return (
              <div
                key={notification.id}
                className="group flex cursor-pointer gap-4 rounded-xl border border-transparent bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:bg-secondary/5"
                onClick={() => openNotification(notification)}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg} shadow-sm transition-transform`}
                >
                  {Icon && <Icon size={16} className={text} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`line-clamp-2 text-base tracking-normal ${isRead ? 'font-medium text-txt-muted' : 'font-semibold text-foreground'}`}
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
