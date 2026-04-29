const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/application');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { updateStatusValidator, applicationValidator } = require('../validations/application');
const { idParamValidator, jobIdParamValidator } = require('../validations/common');

// ─── Candidate routes ────────────────────────────────────────────────────────
router.get('/my-applications', protect, authorize('candidate'), ApplicationController.getMyApplications);
router.get('/my-notifications', protect, authorize('candidate'), ApplicationController.getMyNotifications);
router.get('/my-interviews', protect, authorize('candidate'), ApplicationController.getMyInterviews);
router.get('/my-applications/:id', protect, authorize('candidate'), ApplicationController.getMyApplication);
router.get('/my-applications/:id/history', protect, authorize('candidate'), ApplicationController.getMyApplicationHistory);

// Candidate tự rút đơn
router.post('/:id/withdraw', protect, authorize('candidate'), idParamValidator, validate, ApplicationController.withdraw);

// Nộp đơn
router.post('/:jobId', protect, authorize('candidate'), jobIdParamValidator, applicationValidator, validate, ApplicationController.apply);

// ─── Recruiter / Admin routes ────────────────────────────────────────────────
router.get('/interviews', protect, authorize('recruiter', 'admin'), ApplicationController.getCompanyInterviews);
router.patch('/interviews/:interviewId/status', protect, authorize('recruiter', 'admin'), ApplicationController.updateInterviewStatus);
router.get('/job/:jobId', protect, authorize('recruiter', 'admin'), ApplicationController.getJobApplications);
router.get('/:id', protect, authorize('recruiter', 'admin'), ApplicationController.getApplication);

// Cập nhật status (kèm metadata: interview details, offer details)
router.put(
  '/:id/status',
  protect,
  authorize('recruiter', 'admin'),
  idParamValidator,
  updateStatusValidator,
  validate,
  ApplicationController.updateStatus
);

router.post('/:id/notes', protect, authorize('recruiter', 'admin'), ApplicationController.addNote);
router.get('/:id/history', protect, authorize('recruiter', 'admin'), ApplicationController.getHistory);

// Chi tiết lịch phỏng vấn của một đơn
router.get('/:id/interviews', protect, authorize('recruiter', 'admin'), ApplicationController.getInterviews);

// Chi tiết offer của một đơn
router.get('/:id/offer', protect, authorize('recruiter', 'admin'), ApplicationController.getOffer);

module.exports = router;
