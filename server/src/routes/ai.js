const express = require('express');
const AIController = require('../controllers/ai');
const { authenticate } = require('../middlewares/auth');
const { aiLimiter } = require('../middlewares/rate-limiter');

const router = express.Router();

/**
 * @route   POST /api/ai/generate-jd
 * @desc    Generate a job description using AI
 * @access  Private (Authenticated users)
 */
router.post(
  '/generate-jd',
  authenticate,
  aiLimiter,
  AIController.generateJD.bind(AIController)
);

module.exports = router;
