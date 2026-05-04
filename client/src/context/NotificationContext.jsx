import PropTypes from 'prop-types';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Alert from '../components/common/Alert';
import { createClientId } from '../utils/clientId';

const defaultNotificationValue = {
  showNotification: () => {},
  removeNotification: () => {},
  unreadCount: 0,
  updateUnreadCount: () => {},
  addNotification: () => {},
  isLoading: false,
  setIsLoading: () => {},
};

const NotificationContext = createContext(defaultNotificationValue);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutsRef = useRef(new Map());

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((tid) => clearTimeout(tid));
      timeouts.clear();
    };
  }, []);

  /**
   * Toast notification (hiển thị tạm thời)
   */
  const showNotification = useCallback((message, type = 'info') => {
    const id = createClientId();
    setNotifications((prev) => [...prev, { id, message, type }]);

    const tid = setTimeout(() => {
      timeoutsRef.current.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
    timeoutsRef.current.set(id, tid);
  }, []);

  /**
   * Xóa toast notification
   */
  const removeNotification = useCallback((id) => {
    const pending = timeoutsRef.current.get(id);
    if (pending !== undefined) {
      clearTimeout(pending);
      timeoutsRef.current.delete(id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /**
   * Cập nhật số thông báo chưa đọc
   */
  const updateUnreadCount = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  /**
   * Thêm một thông báo mới vào đầu danh sách
   */
  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        removeNotification,
        unreadCount,
        updateUnreadCount,
        addNotification,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
      {/* Toast Container — rendered into document.body via Portal to avoid z-index stacking issues */}
      {typeof document !== 'undefined' &&
        document.body &&
        createPortal(
          <div className="fixed top-24 right-6 z-[200] flex flex-col gap-3 w-80">
            {notifications.map((n) => (
              <Alert
                key={n.id}
                type={n.type}
                message={n.message}
                onClose={() => removeNotification(n.id)}
              />
            ))}
          </div>,
          document.body
        )}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => useContext(NotificationContext);
