const ResumeAnalysisService = require('../services/resume-analysis');
const SystemSettingsRepository = require('../repositories/system-settings');
const PublicToolsService = require('../services/public-tools');
const logger = require('../utils/logger');

class PublicToolsController {
  async salaryEstimate(req, res) {
    try {
      const { title = '', industry = 'it', location = 'hcm', experience = 'mid' } = req.body || {};
      const data = PublicToolsService.computeSalaryEstimate({
        title,
        industry,
        location,
        experience,
      });
      res.json({ success: true, data });
    } catch (error) {
      logger.error('public salary estimate:', error);
      res.status(500).json({ success: false, message: 'Không tính được khoảng lương' });
    }
  }

  async cvPreview(req, res) {
    try {
      const enabled = await SystemSettingsRepository.getBoolean('ai_resume_analysis', true);
      if (!enabled) {
        return res.status(503).json({
          success: false,
          message: 'Phân tích CV tạm tắt trên hệ thống.',
        });
      }

      const resumeText = req.body?.resumeText ? String(req.body.resumeText).trim() : '';
      if (!resumeText && !req.file) {
        return res.status(400).json({
          success: false,
          message: 'Cần file PDF hoặc văn bản CV.',
        });
      }

      if (req.file && req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          message: 'Phân tích AI hiện chỉ hỗ trợ file PDF. Vui lòng chuyển CV sang PDF.',
        });
      }

      const data = await ResumeAnalysisService.analyzeResumePreview(resumeText, req.file || null);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('public cv preview:', error);
      const msg =
        error.message === 'AI_ANALYSIS_FAILED'
          ? 'AI không phân tích được lúc này. Thử lại sau hoặc rút gọn nội dung CV.'
          : error.message || 'Phân tích CV thất bại';
      const code = error.statusCode || (msg.includes('PDF') ? 400 : 500);
      res.status(code).json({ success: false, message: msg });
    }
  }

  async interviewHint(req, res) {
    try {
      const { question, role, level } = req.body || {};
      const data = await PublicToolsService.generateInterviewHint({
        question,
        role,
        level,
      });
      res.json({ success: true, data });
    } catch (error) {
      logger.error('public interview hint:', error);
      const fail = error.message === 'INTERVIEW_HINT_FAILED';
      res.status(fail ? 503 : 400).json({
        success: false,
        message: fail
          ? 'Không tạo được gợi ý AI. Thử lại sau.'
          : error.message || 'Yêu cầu không hợp lệ',
      });
    }
  }
}

module.exports = new PublicToolsController();
