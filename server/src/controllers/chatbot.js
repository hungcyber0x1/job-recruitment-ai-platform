const ChatbotService = require('../services/chatbot');
const SystemSettingsRepository = require('../models/SystemSettings');
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

      const response = await ChatbotService.processMessage(userId, message, conversationId);
      res.json({ success: true, data: response });
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
}

const controller = new ChatbotController();
controller.upload = upload;

module.exports = controller;
