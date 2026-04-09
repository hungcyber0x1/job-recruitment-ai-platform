const express = require('express');
const router = express.Router();
const AdminChatbotController = require('../controllers/admin-chatbot');
const { protect } = require('../middlewares/auth');

// Chỉ admin mới được gọi các route dưới đây
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
  next();
};

// Thống kê chatbot
router.get('/analytics', protect, adminOnly, AdminChatbotController.getAnalytics);

// Cấu hình chatbot (system_settings)
router.get('/configurations', protect, adminOnly, AdminChatbotController.getConfigurations);
router.put('/configurations', protect, adminOnly, AdminChatbotController.updateConfigurations);

// Giám sát hội thoại
router.get('/conversations', protect, adminOnly, AdminChatbotController.getAllConversations);
router.get('/conversations/:id', protect, adminOnly, AdminChatbotController.getConversationById);
router.delete(
  '/conversations/:id',
  protect,
  adminOnly,
  AdminChatbotController.deleteUserConversation
);

// Mẫu prompt AI
router.get('/templates', protect, adminOnly, AdminChatbotController.getPromptTemplates);
router.post('/templates', protect, adminOnly, AdminChatbotController.createPromptTemplate);
router.put('/templates/:id', protect, adminOnly, AdminChatbotController.updatePromptTemplate);
router.delete('/templates/:id', protect, adminOnly, AdminChatbotController.deletePromptTemplate);

// Xuất dữ liệu hội thoại
router.get('/export', protect, adminOnly, AdminChatbotController.exportConversations);

module.exports = router;
