const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification');
const { protect, authorize } = require('../middlewares/auth');

/**
 * ========================
 * CANDIDATE ROUTES
 * ========================
 */
router.get(
  '/me',
  protect,
  notificationController.getMyNotifications
);

router.get(
  '/me/stats',
  protect,
  notificationController.getNotificationStats
);

router.patch(
  '/me/:id/read',
  protect,
  notificationController.markAsRead
);

router.post(
  '/me/read-all',
  protect,
  notificationController.markAllAsRead
);

router.delete(
  '/me/clear-read',
  protect,
  notificationController.clearReadNotifications
);

router.delete(
  '/me/:id',
  protect,
  notificationController.deleteNotification
);

/**
 * ========================
 * RECRUITER ROUTES
 * ========================
 */
router.get(
  '/recruiter',
  protect,
  authorize('recruiter'),
  notificationController.getRecruiterNotifications
);

/**
 * ========================
 * ADMIN ROUTES
 * ========================
 */
router.get(
  '/admin',
  protect,
  authorize('admin'),
  notificationController.getAdminNotifications
);

router.post(
  '/admin/bulk',
  protect,
  authorize('admin'),
  notificationController.sendBulkNotification
);

module.exports = router;
