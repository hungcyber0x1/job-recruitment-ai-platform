const express = require('express');
const ResumeAnalysisController = require('../controllers/resume-analysis');
const { authenticate, isCandidate } = require('../middlewares/auth');
const { aiLimiter } = require('../middlewares/rate-limiter');

const router = express.Router();

const upload = require('../middlewares/upload');
const { verifyUploadSignature } = require('../middlewares/verify-upload-signature');

// All routes require authentication and candidate role
router.use(authenticate);
router.use(isCandidate);

/**
 * @route   POST /api/candidates/resume/analyze
 * @desc    Analyze candidate's resume with AI (supports text and file)
 * @access  Private (Candidate only)
 */
router.post(
  '/analyze',
  aiLimiter,
  upload.single('resume'),
  verifyUploadSignature,
  ResumeAnalysisController.analyzeResume.bind(ResumeAnalysisController)
);

/**
 * @route   GET /api/candidates/resume/analysis
 * @desc    Get latest resume analysis
 * @access  Private (Candidate only)
 */
router.get('/analysis', ResumeAnalysisController.getLatestAnalysis.bind(ResumeAnalysisController));

/**
 * @route   GET /api/candidates/resume/market-comparison
 * @desc    Compare candidate profile with market
 * @access  Private (Candidate only)
 */
router.get(
  '/market-comparison',
  ResumeAnalysisController.compareWithMarket.bind(ResumeAnalysisController)
);

module.exports = router;
