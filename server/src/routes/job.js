const express = require('express');
const router = express.Router();
const JobController = require('../controllers/job');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', JobController.getJobs);
router.get(
  '/my-jobs',
  protect,
  authorize('employer', 'admin'),
  JobController.getMyJobs.bind(JobController)
);
router.get('/:id', JobController.getJob);
router.post(
  '/',
  protect,
  authorize('employer', 'admin'),
  JobController.createJob.bind(JobController)
);
router.put(
  '/:id',
  protect,
  authorize('employer', 'admin'),
  JobController.updateJob.bind(JobController)
);
router.delete(
  '/:id',
  protect,
  authorize('employer', 'admin'),
  JobController.deleteJob.bind(JobController)
);

module.exports = router;
