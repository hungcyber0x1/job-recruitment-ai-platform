import PropTypes from 'prop-types';
import React from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const NotificationDropdown = ({ isOpen, onClose, notifications = [] }) => {
  if (!isOpen) return null;

  // Mock notifications if none provided
  const displayNotifications =
    notifications.length > 0
      ? notifications
      : [
          {
            id: 1,
            title: 'Ứng viên mới',
            message: 'Nguyễn Văn A vừa ứng tuyển vào vị trí Senior React Developer.',
            time: '5 phút trước',
            type: 'application',
            isRead: false,
          },
          {
            id: 2,
            title: 'Hệ thống',
            message: 'Gói dịch vụ của bạn sẽ hết hạn sau 3 ngày nữa.',
            time: '2 giờ trước',
            type: 'system',
            isRead: false,
          },
          {
            id: 3,
            title: 'Tin nhắn mới',
            message: 'Tech Corp đã trả lời tin nhắn của bạn.',
            time: '1 ngày trước',
            type: 'message',
            isRead: true,
          },
        ];

  return (
    <>
      <div className="fixed inset-0 z-[45]" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[50] overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary-600" />
            <h3 className="font-bold text-slate-800">Thông báo</h3>
            <span className="bg-primary-100 text-primary-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {displayNotifications.filter((n) => !n.isRead).length}
            </span>
          </div>
          <button className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
            Đánh dấu đã đọc
          </button>
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {displayNotifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Không có thông báo mới</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/35 transition-colors cursor-pointer group relative ${!notification.isRead ? 'bg-primary-50/30' : ''}`}
                >
                  {!notification.isRead && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-primary-500 rounded-full"></div>
                  )}
                  <div className="flex gap-3">
                    <div
                      className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        notification.type === 'application'
                          ? 'bg-green-100 text-green-600'
                          : notification.type === 'system'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-primary-100 text-primary-600'
                      }`}
                    >
                      {notification.type === 'application' && <Check size={14} />}
                      {notification.type === 'system' && <Clock size={14} />}
                      {notification.type === 'message' && <Bell size={14} />}
                    </div>
                    <div>
                      <h4
                        className={`text-sm ${!notification.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}
                      >
                        {notification.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2 font-medium">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
          <button className="text-xs font-semibold text-slate-600 hover:text-primary-600 transition-colors">
            Xem tất cả thông báo
          </button>
        </div>
      </motion.div>
    </>
  );
};

NotificationDropdown.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string,
      message: PropTypes.string,
      time: PropTypes.string,
      type: PropTypes.oneOf(['application', 'system', 'message']),
      isRead: PropTypes.bool,
    })
  ),
};

NotificationDropdown.defaultProps = {
  notifications: [],
};

export default NotificationDropdown;
