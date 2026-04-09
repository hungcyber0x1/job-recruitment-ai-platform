const express = require('express');
const CareerPathController = require('../controllers/career-path');
const { authenticate, isCandidate } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication and candidate role
router.use(authenticate);
router.use(isCandidate);

/**
 * @route   POST /api/candidates/career-path/generate
 * @desc    Generate personalized career path
 * @access  Private (Candidate only)
 */
router.post('/generate', CareerPathController.generatePath.bind(CareerPathController));

/**
 * @route   GET /api/candidates/career-path
 * @desc    Get current active career path
 * @access  Private (Candidate only)
 */
router.get('/', CareerPathController.getCurrentPath.bind(CareerPathController));

/**
 * @route   GET /api/candidates/skill-gaps
 * @desc    Get identified skill gaps
 * @access  Private (Candidate only)
 */
router.get('/skill-gaps', CareerPathController.getSkillGaps.bind(CareerPathController));

/**
 * @route   PUT /api/candidates/career-path/:id/progress
 * @desc    Update progress on career path
 * @access  Private (Candidate only)
 */
router.put('/:id/progress', CareerPathController.updateProgress.bind(CareerPathController));

module.exports = router;
