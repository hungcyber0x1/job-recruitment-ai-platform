const ChatbotService = require('../services/chatbot');
const AIService = require('../services/ai');
const SystemSettingsRepository = require('../models/SystemSettings');
const { checkUserQuota, incrementUserQuota } = require('../middlewares/rate-limiter');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadsRoot } = require('../config/paths');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsRoot, 'chatbot');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF and DOC files are allowed'));
  },
});

class ChatbotController {
  constructor() {
    this.sendMessage = this.sendMessage.bind(this);
    this.getHistory = this.getHistory.bind(this);
    this.createConversation = this.createConversation.bind(this);
    this.getConversations = this.getConversations.bind(this);
    this.renameConversation = this.renameConversation.bind(this);
    this.deleteConversation = this.deleteConversation.bind(this);
    this.clearHistory = this.clearHistory.bind(this);
    this.getSuggestedQuestions = this.getSuggestedQuestions.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.analyzeCV = this.analyzeCV.bind(this);
    this.generateCoverLetter = this.generateCoverLetter.bind(this);
    this.sendFeedback = this.sendFeedback.bind(this);
  }

  async _ensureChatbotEnabled(res) {
    const chatbotEnabled = await SystemSettingsRepository.getBoolean('ai_chatbot', true);
    if (!chatbotEnabled) {
      res.status(503).json({
        success: false,
        message: 'AI chatbot is currently disabled by admin settings',
      });
      return false;
    }
    return true;
  }

  async sendMessage(req, res, next) {
    try {
      if (!(await this._ensureChatbotEnabled(res))) return;

      const { message, conversationId } = req.body;
      const userId = req.user.id;

      if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }

      // Check daily quota
      const quota = await checkUserQuota(userId);
      if (!quota.allowed) {
        return res.status(429).json({
          success: false,
          message: quota.resetAt
            ? `Bạn đã dùng hết quota tin nhắn hôm nay (${quota.limit}/${quota.limit}). Vui lòng thử lại vào ngày mai.`
            : 'Bạn đã dùng hết quota tin nhắn hôm nay. Vui lòng thử lại vào ngày mai.',
          quota,
        });
      }

      const response = await ChatbotService.processMessage(userId, message, conversationId);

      // Increment quota after successful processing
      await incrementUserQuota(userId);

      res.json({
        success: true,
        data: response,
        quota: {
          remaining: Math.max(0, quota.remaining - 1),
          limit: quota.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { conversationId } = req.query;

      const history = await ChatbotService.getChatHistory(userId, conversationId);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  async createConversation(req, res, next) {
    try {
      if (!(await this._ensureChatbotEnabled(res))) return;

      const userId = req.user.id;
      const { title } = req.body;

      const conversation = await ChatbotService.createConversation(userId, title);
      res.json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req, res, next) {
    try {
      const userId = req.user.id;
      const conversations = await ChatbotService.getUserConversations(userId);
      res.json({ success: true, data: conversations });
    } catch (error) {
      next(error);
    }
  }

  async renameConversation(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
      }

      await ChatbotService.updateConversationTitle(userId, id, title);
      res.json({ success: true, message: 'Conversation renamed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async deleteConversation(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await ChatbotService.deleteConversation(userId, id);
      res.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async clearHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await ChatbotService.clearConversationMessages(userId, id);
      res.json({ success: true, message: 'Conversation history cleared' });
    } catch (error) {
      next(error);
    }
  }

  async getSuggestedQuestions(req, res, next) {
    try {
      if (!(await this._ensureChatbotEnabled(res))) return;

      const userId = req.user.id;
      const questions = await ChatbotService.getSuggestedQuestions(userId);
      res.json({ success: true, data: questions });
    } catch (error) {
      next(error);
    }
  }

  async uploadFile(req, res, next) {
    try {
      if (!(await this._ensureChatbotEnabled(res))) return;

      const userId = req.user.id;
      const { conversationId } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File is required' });
      }

      const fileData = {
        url: `/uploads/chatbot/${req.file.filename}`,
        type: req.file.mimetype,
        name: req.file.originalname,
      };

      const response = await ChatbotService.processFileUpload(userId, fileData, conversationId);
      res.json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze CV/resume file and extract structured data.
   * Accepts an optional job description to tailor improvement suggestions.
   */
  async analyzeCV(req, res, next) {
    try {
      if (!(await this._ensureChatbotEnabled(res))) return;

      const userId = req.user.id;
      const { conversationId, jobDescription } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'CV file is required' });
      }

      // Read the uploaded file
      const filePath = req.file.path;
      const cvText = await fs.promises.readFile(filePath, 'utf-8');

      // Perform CV analysis
      const analysis = await AIService.analyzeCV(cvText, jobDescription);

      // Clean up the uploaded file after processing
      try {
        await fs.promises.unlink(filePath);
      } catch (_) {}

      if (!analysis?.success) {
        return res.status(500).json({
          success: false,
          message: 'CV analysis failed. ' + (analysis?.error || ''),
        });
      }

      // Track analytics
      await ChatbotService._trackEvent(null, userId, 'cv_analyzed', {
        file_name: req.file.originalname,
      });

      res.json({
        success: true,
        data: {
          analysis: analysis.data,
          fileName: req.file.originalname,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate cover letter based on CV data and job description.
   */
  async generateCoverLetter(req, res, next) {
    try {
      if (!(await this._ensureChatbotEnabled(res))) return;

      const userId = req.user.id;
      const { cvData, jobDescription, candidateName } = req.body;

      if (!cvData || !jobDescription) {
        return res.status(400).json({
          success: false,
          message: 'CV data and job description are required',
        });
      }

      const coverLetter = await AIService.generateCoverLetter(cvData, jobDescription, candidateName);

      if (!coverLetter) {
        return res.status(500).json({
          success: false,
          message: 'Cover letter generation failed',
        });
      }

      // Track analytics
      await ChatbotService._trackEvent(null, userId, 'cover_letter_generated', {
        candidate_name: candidateName,
      });

      res.json({
        success: true,
        data: { coverLetter },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record user feedback on an AI message.
   */
  async sendFeedback(req, res, next) {
    try {
      const userId = req.user.id;
      const { messageId, isPositive } = req.body;

      if (!messageId) {
        return res.status(400).json({ success: false, message: 'Message ID is required' });
      }

      // Track feedback as analytics event
      await ChatbotService.recordFeedback(messageId, userId, Boolean(isPositive));

      res.json({ success: true, message: 'Feedback recorded' });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new ChatbotController();
controller.upload = upload;

module.exports = controller;
