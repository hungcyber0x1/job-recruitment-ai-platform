const ResumeAnalysisService = require('../services/resume-analysis');
const CandidateRepository = require('../models/Candidate');
const SystemSettingsRepository = require('../models/SystemSettings');
const logger = require('../utils/logger');

class ResumeAnalysisController {
  async _getCandidateId(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    return candidate?.id || null;
  }

  async analyzeResume(req, res) {
    try {
      const { resumeText } = req.body;
      const candidateId = await this._getCandidateId(req.user.id);

      if (!candidateId) {
        return res.status(404).json({
          success: false,
          message: 'Candidate profile not found',
        });
      }

      if (!resumeText && !req.file) {
        return res.status(400).json({
          success: false,
          message: 'Resume text or file is required',
        });
      }

      const resumeAnalysisEnabled = await SystemSettingsRepository.getBoolean(
        'ai_resume_analysis',
        true
      );
      if (!resumeAnalysisEnabled) {
        return res.status(503).json({
          success: false,
          message: 'Resume analysis is currently disabled by admin settings',
        });
      }

      const analysis = await ResumeAnalysisService.analyzeResume(candidateId, resumeText, req.file);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('Resume analysis controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze resume',
        error: error.message,
      });
    }
  }

  async getLatestAnalysis(req, res) {
    try {
      const candidateId = await this._getCandidateId(req.user.id);
      if (!candidateId) {
        return res.status(404).json({
          success: false,
          message: 'Candidate profile not found',
        });
      }

      const analysis = await ResumeAnalysisService.getAnalysis(candidateId);

      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'No resume analysis found',
        });
      }

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('Get analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get resume analysis',
        error: error.message,
      });
    }
  }

  async compareWithMarket(req, res) {
    try {
      const candidateId = await this._getCandidateId(req.user.id);
      if (!candidateId) {
        return res.status(404).json({
          success: false,
          message: 'Candidate profile not found',
        });
      }

      const comparison = await ResumeAnalysisService.compareWithMarket(candidateId);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      logger.error('Market comparison error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to compare with market',
        error: error.message,
      });
    }
  }
}

module.exports = new ResumeAnalysisController();
