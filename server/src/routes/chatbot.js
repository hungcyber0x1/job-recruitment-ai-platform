const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/chatbot');
const { protect } = require('../middlewares/auth');
const { aiLimiter } = require('../middlewares/rate-limiter');
const { verifyUploadSignature } = require('../middlewares/verify-upload-signature');

// Conversation management
router.post('/conversations', protect, ChatbotController.createConversation);
router.get('/conversations', protect, ChatbotController.getConversations);
router.put('/conversations/:id', protect, ChatbotController.renameConversation);
router.delete('/conversations/:id', protect, ChatbotController.deleteConversation);
router.delete('/conversations/:id/messages', protect, ChatbotController.clearHistory);

// Messages
router.post('/message', protect, aiLimiter, ChatbotController.sendMessage);
router.get('/history', protect, ChatbotController.getHistory);

// Suggested questions
router.get('/suggested-questions', protect, ChatbotController.getSuggestedQuestions);

// File upload
router.post(
  '/upload',
  protect,
  ChatbotController.upload.single('file'),
  verifyUploadSignature,
  ChatbotController.uploadFile
);

module.exports = router;
