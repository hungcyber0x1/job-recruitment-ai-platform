const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/application');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { updateStatusValidator } = require('../validations/application');
const { idParamValidator } = require('../validations/common');

router.get(
  '/my-applications',
  protect,
  authorize('candidate'),
  ApplicationController.getMyApplications
);
router.get(
  '/my-notifications',
  protect,
  authorize('candidate'),
  ApplicationController.getMyNotifications
);
router.get(
  '/my-applications/:id',
  protect,
  authorize('candidate'),
  ApplicationController.getMyApplication
);
router.get(
  '/my-applications/:id/history',
  protect,
  authorize('candidate'),
  ApplicationController.getMyApplicationHistory
);
router.post('/:jobId', protect, authorize('candidate'), ApplicationController.apply);
router.get(
  '/job/:jobId',
  protect,
  authorize('employer', 'admin'),
  ApplicationController.getJobApplications
);
router.get('/:id', protect, authorize('employer', 'admin'), ApplicationController.getApplication);
router.put(
  '/:id/status',
  protect,
  authorize('employer', 'admin'),
  idParamValidator,
  updateStatusValidator,
  validate,
  ApplicationController.updateStatus
);
router.post('/:id/notes', protect, authorize('employer', 'admin'), ApplicationController.addNote);
router.get(
  '/:id/history',
  protect,
  authorize('employer', 'admin'),
  ApplicationController.getHistory
);
router.get(
  '/:id/screening',
  protect,
  authorize('employer', 'admin'),
  ApplicationController.getScreening
);

module.exports = router;
