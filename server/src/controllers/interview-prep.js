const InterviewPrepService = require('../services/interview-prep');
const CandidateRepository = require('../repositories/candidate');
const logger = require('../utils/logger');

/**
 * Controller for Interview Preparation endpoints
 */
class InterviewPrepController {
  async _getCandidateId(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    return candidate?.id || null;
  }
  /**
   * Start new interview session
   * POST /api/candidates/interview/start
   */
  async startSession(req, res) {
    try {
      const { sessionType, jobId, difficultyLevel } = req.body;
      const candidateId = await this._getCandidateId(req.user.id);

      if (!candidateId) {
        return res.status(404).json({
          success: false,
          message: 'Candidate profile not found',
        });
      }

      const result = await InterviewPrepService.startSession(
        candidateId,
        sessionType || 'general',
        jobId,
        difficultyLevel || 'intermediate'
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Start interview session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start interview session',
        error: error.message,
      });
    }
  }

  /**
   * Submit answer to question
   * POST /api/candidates/interview/answer
   */
  async submitAnswer(req, res) {
    try {
      const { questionId, answerText, timeTakenSeconds } = req.body;

      if (!questionId || !answerText) {
        return res.status(400).json({
          success: false,
          message: 'Question ID and answer text are required',
        });
      }

      const result = await InterviewPrepService.submitAnswer(
        questionId,
        answerText,
        timeTakenSeconds || 0
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Submit answer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit answer',
        error: error.message,
      });
    }
  }

  /**
   * Get next question
   * GET /api/candidates/interview/:sessionId/next
   */
  async getNextQuestion(req, res) {
    try {
      const { sessionId } = req.params;

      const result = await InterviewPrepService.getNextQuestion(sessionId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get next question error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get next question',
        error: error.message,
      });
    }
  }

  /**
   * Complete interview session
   * POST /api/candidates/interview/:sessionId/complete
   */
  async completeSession(req, res) {
    try {
      const { sessionId } = req.params;

      const result = await InterviewPrepService.completeSession(sessionId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Complete session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete session',
        error: error.message,
      });
    }
  }

  /**
   * Get session history
   * GET /api/candidates/interview/history
   */
  async getHistory(req, res) {
    try {
      const candidateId = await this._getCandidateId(req.user.id);
      if (!candidateId) {
        return res.status(404).json({
          success: false,
          message: 'Candidate profile not found',
        });
      }

      const history = await InterviewPrepService.getSessionHistory(candidateId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Get interview history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get interview history',
        error: error.message,
      });
    }
  }

  /**
   * Get session details
   * GET /api/candidates/interview/:sessionId
   */
  async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;

      const details = await InterviewPrepService.getSessionDetails(sessionId);

      res.json({
        success: true,
        data: details,
      });
    } catch (error) {
      logger.error('Get session details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get session details',
        error: error.message,
      });
    }
  }
}

module.exports = new InterviewPrepController();
