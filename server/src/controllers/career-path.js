const CareerPathService = require('../services/career-path');
const CandidateRepository = require('../repositories/candidate');
const logger = require('../utils/logger');

/**
 * Controller for Career Path endpoints
 */
class CareerPathController {
  async _getCandidateId(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    return candidate?.id || null;
  }
  /**
   * Generate career path
   * POST /api/candidates/career-path/generate
   */
  async generatePath(req, res) {
    try {
      const { targetRole } = req.body;
      const candidateId = await this._getCandidateId(req.user.id);

      if (!targetRole) {
        return res.status(400).json({
          success: false,
          message: 'Target role is required',
        });
      }

      if (!candidateId) {
        return res.status(404).json({
          success: false,
          message: 'Candidate profile not found',
        });
      }

      const careerPath = await CareerPathService.generateCareerPath(candidateId, targetRole);

      res.json({
        success: true,
        data: careerPath,
      });
    } catch (error) {
      logger.error('Generate career path error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate career path',
        error: error.message,
      });
    }
  }

  /**
   * Get current career path
   * GET /api/candidates/career-path
   */
  async getCurrentPath(req, res) {
    try {
      const candidateId = await this._getCandidateId(req.user.id);
      if (!candidateId) {
        return res.status(404).json({
          success: false,
          message: 'Candidate profile not found',
        });
      }

      const careerPath = await CareerPathService.getCareerPath(candidateId);

      if (!careerPath) {
        return res.status(404).json({
          success: false,
          message: 'No career path found',
        });
      }

      res.json({
        success: true,
        data: careerPath,
      });
    } catch (error) {
      logger.error('Get career path error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get career path',
        error: error.message,
      });
    }
  }

  /**
   * Get skill gaps
   * GET /api/candidates/skill-gaps
   */
  async getSkillGaps(req, res) {
    try {
      const candidateId = await this._getCandidateId(req.user.id);
      if (!candidateId) {
        return res.status(404).json({
          success: false,
          message: 'Candidate profile not found',
        });
      }

      const skillGaps = await CareerPathService.getSkillGaps(candidateId);

      res.json({
        success: true,
        data: skillGaps,
      });
    } catch (error) {
      logger.error('Get skill gaps error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get skill gaps',
        error: error.message,
      });
    }
  }

  /**
   * Update progress
   * PUT /api/candidates/career-path/:id/progress
   */
  async updateProgress(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updated = await CareerPathService.updateProgress(id, updates);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      logger.error('Update progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update progress',
        error: error.message,
      });
    }
  }
}

module.exports = new CareerPathController();
