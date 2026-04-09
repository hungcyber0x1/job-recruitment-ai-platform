import PropTypes from 'prop-types';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import Alert from '../components/common/Alert';
import { createClientId } from '../utils/clientId';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const timeoutsRef = useRef(new Map());

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((tid) => clearTimeout(tid));
      timeouts.clear();
    };
  }, []);

  const showNotification = useCallback((message, type = 'info') => {
    const id = createClientId();
    setNotifications((prev) => [...prev, { id, message, type }]);

    const tid = setTimeout(() => {
      timeoutsRef.current.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
    timeoutsRef.current.set(id, tid);
  }, []);

  const removeNotification = useCallback((id) => {
    const pending = timeoutsRef.current.get(id);
    if (pending !== undefined) {
      clearTimeout(pending);
      timeoutsRef.current.delete(id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-24 right-6 z-[200] flex flex-col gap-3 w-80">
        {notifications.map((n) => (
          <Alert
            key={n.id}
            type={n.type}
            message={n.message}
            onClose={() => removeNotification(n.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => useContext(NotificationContext);
