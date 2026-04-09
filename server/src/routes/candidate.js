const express = require('express');
const router = express.Router();
const CandidateController = require('../controllers/candidate');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { verifyUploadSignature } = require('../middlewares/verify-upload-signature');

router.get('/profile', protect, authorize('candidate'), CandidateController.getProfile);
router.get('/me', protect, authorize('candidate'), CandidateController.getProfile);
router.put('/profile', protect, authorize('candidate'), CandidateController.updateProfile);
router.post(
  '/upload-resume',
  protect,
  authorize('candidate'),
  upload.single('resume'),
  verifyUploadSignature,
  CandidateController.uploadResume
);
router.post(
  '/upload-avatar',
  protect,
  authorize('candidate'),
  upload.single('avatar'),
  verifyUploadSignature,
  CandidateController.uploadAvatar
);
router.post(
  '/upload-project-image',
  protect,
  authorize('candidate'),
  upload.single('project_image'),
  verifyUploadSignature,
  CandidateController.uploadProjectImage
);
router.post('/profile/sync-ai', protect, authorize('candidate'), CandidateController.syncAIProfile);

module.exports = router;
