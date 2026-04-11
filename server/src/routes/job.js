const express = require('express');
const router = express.Router();
const JobController = require('../controllers/job');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { jobValidator } = require('../validations/job');
const { idParamValidator } = require('../validations/common');

router.get('/', JobController.getJobs);
router.get(
  '/my-jobs',
  protect,
  authorize('employer', 'admin'),
  JobController.getMyJobs.bind(JobController)
);
router.get('/:id', idParamValidator, validate, JobController.getJob);
router.post(
  '/',
  protect,
  authorize('employer', 'admin'),
  jobValidator,
  validate,
  JobController.createJob.bind(JobController)
);
router.put(
  '/:id',
  protect,
  authorize('employer', 'admin'),
  idParamValidator,
  jobValidator,
  validate,
  JobController.updateJob.bind(JobController)
);
router.delete(
  '/:id',
  protect,
  authorize('employer', 'admin'),
  idParamValidator,
  validate,
  JobController.deleteJob.bind(JobController)
);

module.exports = router;
