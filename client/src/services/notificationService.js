import api from './api';

/**
 * Notification Service - API calls for notification center
 * Hỗ trợ tất cả roles: candidate, recruiter, admin
 */

export const notificationService = {
  // ========================
  // COMMON ENDPOINTS
  // ========================

  /**
   * Lấy danh sách thông báo của user hiện tại
   */
  getNotifications: (params = {}) => {
    const { limit = 20, offset = 0, type, unread_only } = params;
    const queryParams = new URLSearchParams();
    
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    if (type) queryParams.append('type', type);
    if (unread_only) queryParams.append('unread_only', 'true');
    
    return api.get(`/notifications/me?${queryParams.toString()}`);
  },

  /**
   * Lấy thống kê thông báo
   */
  getStats: () => api.get('/notifications/me/stats'),

  /**
   * Đánh dấu một thông báo là đã đọc
   */
  markAsRead: (id) => api.patch(`/notifications/me/${id}/read`),

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  markAllAsRead: () => api.post('/notifications/me/read-all'),

  /**
   * Xóa một thông báo
   */
  deleteNotification: (id) => api.delete(`/notifications/me/${id}`),

  /**
   * Xóa tất cả thông báo đã đọc
   */
  clearReadNotifications: () => api.delete('/notifications/me/clear-read'),

  // ========================
  // RECRUITER ENDPOINTS
  // ========================

  /**
   * Lấy thông báo cho recruiter
   */
  getRecruiterNotifications: (params = {}) => {
    const { limit = 20, offset = 0, type, unread_only } = params;
    const queryParams = new URLSearchParams();
    
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    if (type) queryParams.append('type', type);
    if (unread_only) queryParams.append('unread_only', 'true');
    
    return api.get(`/notifications/recruiter?${queryParams.toString()}`);
  },

  // ========================
  // ADMIN ENDPOINTS
  // ========================

  /**
   * Lấy thông báo cho admin
   */
  getAdminNotifications: (params = {}) => {
    const { limit = 20, offset = 0, type, unread_only } = params;
    const queryParams = new URLSearchParams();
    
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    if (type) queryParams.append('type', type);
    if (unread_only) queryParams.append('unread_only', 'true');
    
    return api.get(`/notifications/admin?${queryParams.toString()}`);
  },

  /**
   * Gửi thông báo hàng loạt (admin only)
   */
  sendBulkNotification: (data) => api.post('/notifications/admin/bulk', data),
};

export default notificationService;
