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
  authorize('recruiter', 'admin'),
  JobController.getMyJobs.bind(JobController)
);
router.get('/:id', idParamValidator, validate, JobController.getJob);
router.post(
  '/',
  protect,
  authorize('recruiter', 'admin'),
  jobValidator,
  validate,
  JobController.createJob.bind(JobController)
);
router.put(
  '/:id',
  protect,
  authorize('recruiter', 'admin'),
  idParamValidator,
  jobValidator,
  validate,
  JobController.updateJob.bind(JobController)
);
router.delete(
  '/:id',
  protect,
  authorize('recruiter', 'admin'),
  idParamValidator,
  validate,
  JobController.deleteJob.bind(JobController)
);

module.exports = router;
