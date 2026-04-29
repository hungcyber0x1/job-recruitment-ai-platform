/**
 * Notification Controller - API endpoints cho notification center
 */
const notificationService = require('../services/notification');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { USER_STATUS } = require('../utils/constants');

/**
 * ========================
 * CANDIDATE ENDPOINTS
 * ========================
 */
const getMyNotifications = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { limit = 20, offset = 0, type, unread_only } = req.query;

  const options = {
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    type,
    unreadOnly: unread_only === 'true'
  };

  const [notifications, unreadCount] = await Promise.all([
    notificationService.getUserNotifications(userId, options),
    notificationService.getUnreadCount(userId)
  ]);

  return ApiResponse.success(res, {
    notifications,
    unread_count: unreadCount,
    pagination: {
      limit: options.limit,
      offset: options.offset,
      has_more: notifications.length === options.limit
    }
  });
});

const getNotificationStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const stats = await notificationService.getNotificationStats(userId);
  const unreadCount = await notificationService.getUnreadCount(userId);

  return ApiResponse.success(res, { stats, unread_count: unreadCount });
});

const markAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const success = await notificationService.markAsRead(parseInt(id, 10), userId);
  
  if (!success) {
    return ApiResponse.notFound(res, 'Không tìm thấy thông báo');
  }

  return ApiResponse.success(res, { message: 'Đã đánh dấu là đã đọc' });
});

const markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const count = await notificationService.markAllAsRead(userId);

  return ApiResponse.success(res, { 
    message: 'Đã đánh dấu tất cả là đã đọc',
    count 
  });
});

const deleteNotification = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const success = await notificationService.deleteNotification(parseInt(id, 10), userId);
  
  if (!success) {
    return ApiResponse.notFound(res, 'Không tìm thấy thông báo');
  }

  return ApiResponse.success(res, { message: 'Đã xóa thông báo' });
});

const clearReadNotifications = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const count = await notificationService.clearReadNotifications(userId);

  return ApiResponse.success(res, { 
    message: 'Đã xóa các thông báo đã đọc',
    count 
  });
});

/**
 * ========================
 * RECRUITER ENDPOINTS
 * ========================
 */
const getRecruiterNotifications = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { limit = 20, offset = 0, type, unread_only } = req.query;

  const options = {
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    type,
    unreadOnly: unread_only === 'true'
  };

  const [notifications, unreadCount] = await Promise.all([
    notificationService.getUserNotifications(userId, options),
    notificationService.getUnreadCount(userId)
  ]);

  return ApiResponse.success(res, {
    notifications,
    unread_count: unreadCount,
    pagination: {
      limit: options.limit,
      offset: options.offset,
      has_more: notifications.length === options.limit
    }
  });
});

/**
 * ========================
 * ADMIN ENDPOINTS
 * ========================
 */
const getAdminNotifications = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { limit = 20, offset = 0, type, unread_only, category } = req.query;

  const options = {
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    type: type && type !== 'all' ? type : undefined,
    unreadOnly: unread_only === 'true'
  };

  const [notifications, unreadCount, stats] = await Promise.all([
    notificationService.getUserNotifications(userId, options),
    notificationService.getUnreadCount(userId),
    notificationService.getNotificationStats(userId)
  ]);

  // Lấy thêm số lượng pending items cho admin
  const { pool } = require('../config/database.config');
  const [pendingStats] = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM company_profiles WHERE is_verified = 0 AND deleted_at IS NULL) as pending_companies,
      (SELECT COUNT(*) FROM jobs WHERE status = 'pending_review' AND deleted_at IS NULL) as pending_jobs,
      (SELECT COUNT(*) FROM blog_posts WHERE status = 'pending' AND deleted_at IS NULL) as pending_posts
  `);

  return ApiResponse.success(res, {
    notifications,
    unread_count: unreadCount,
    stats,
    pending_moderation: pendingStats[0],
    pagination: {
      limit: options.limit,
      offset: options.offset,
      has_more: notifications.length === options.limit
    }
  });
});

const sendBulkNotification = catchAsync(async (req, res) => {
  const { user_ids, title, message, data } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const count = await notificationService.sendBulkNotification(
    user_ids,
    title,
    message,
    data
  );

  return ApiResponse.success(res, { 
    message: 'Đã gửi thông báo',
    count 
  });
});

module.exports = {
  getMyNotifications,
  getNotificationStats,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getRecruiterNotifications,
  getAdminNotifications,
  sendBulkNotification
};
