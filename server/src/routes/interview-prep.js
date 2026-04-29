const express = require('express');
const InterviewPrepController = require('../controllers/interview-prep');
const { authenticate, isCandidate } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication and candidate role
router.use(authenticate);
router.use(isCandidate);

router.get('/notes', InterviewPrepController.getNotes.bind(InterviewPrepController));
router.post('/notes', InterviewPrepController.createNote.bind(InterviewPrepController));
router.put('/notes/:noteId', InterviewPrepController.updateNote.bind(InterviewPrepController));
router.delete('/notes/:noteId', InterviewPrepController.deleteNote.bind(InterviewPrepController));

/**
 * @route   POST /api/candidates/interview/start
 * @desc    Start a new AI interview session
 * @access  Private (Candidate only)
 */
router.post('/start', InterviewPrepController.startSession.bind(InterviewPrepController));

/**
 * @route   POST /api/candidates/interview/answer
 * @desc    Submit answer to interview question
 * @access  Private (Candidate only)
 */
router.post('/answer', InterviewPrepController.submitAnswer.bind(InterviewPrepController));

/**
 * @route   GET /api/candidates/interview/:sessionId/next
 * @desc    Get next interview question
 * @access  Private (Candidate only)
 */
router.get(
  '/:sessionId/next',
  InterviewPrepController.getNextQuestion.bind(InterviewPrepController)
);

/**
 * @route   POST /api/candidates/interview/:sessionId/complete
 * @desc    Complete interview session and get summary
 * @access  Private (Candidate only)
 */
router.post(
  '/:sessionId/complete',
  InterviewPrepController.completeSession.bind(InterviewPrepController)
);

/**
 * @route   GET /api/candidates/interview/history
 * @desc    Get interview session history
 * @access  Private (Candidate only)
 */
router.get('/history', InterviewPrepController.getHistory.bind(InterviewPrepController));

/**
 * @route   GET /api/candidates/interview/:sessionId
 * @desc    Get session details with all Q&A
 * @access  Private (Candidate only)
 */
router.get('/:sessionId', InterviewPrepController.getSessionDetails.bind(InterviewPrepController));

module.exports = router;
