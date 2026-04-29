const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messaging');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { verifyUploadSignature } = require('../middlewares/verify-upload-signature');
const { messageLimiter } = require('../middlewares/rate-limiter');

router.use(protect);

router.get('/conversations', messagingController.getConversations);
router.post('/conversations', messageLimiter, messagingController.startConversation);
router.get('/conversations/by-application/:applicationId', messagingController.openByApplication);
router.get('/attachments/:filename', messagingController.getAttachment);
router.get('/conversations/:id', messagingController.getConversation);
router.post('/conversations/:id/messages', messageLimiter, messagingController.sendMessage);
router.post(
    '/conversations/:id/attachments',
    messageLimiter,
    upload.single('message_attachment'),
    verifyUploadSignature,
    messagingController.sendAttachment
);
router.post('/conversations/:id/interview-invite', messageLimiter, messagingController.sendInterviewInvite);
router.post('/conversations/:id/job-info', messageLimiter, messagingController.sendJobInfo);
router.post('/conversations/:id/read', messagingController.markRead);
router.post('/conversations/:id/archive', messagingController.archiveConversation);
router.delete('/conversations/:id', messagingController.deleteConversation);
router.post('/conversations/:id/block', messagingController.blockConversation);

module.exports = router;
