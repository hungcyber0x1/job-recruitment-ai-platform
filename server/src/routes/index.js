/**
 * Gom route API xử lý trực tiếp trên gateway (user, admin, AI tools, …)
 * và endpoint /ready kiểm tra DB. Feature flags đọc từ DB (mặc định an toàn).
 */
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { pool } = require('../config/database.config');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const UserRepository = require('../models/User');

const userRoutes = require('./user');
const applicationRoutes = require('./application');
const chatbotRoutes = require('./chatbot');
const adminRoutes = require('./admin');
const categoryRoutes = require('./category');
const adminChatbotRoutes = require('./admin-chatbot');
const skillRoutes = require('./skill');
const employerRoutes = require('./employer');
const publicCompanyRoutes = require('./company-public');
const notificationRoutes = require('./notification');
const messagingRoutes = require('./messaging');

// Tính năng AI (resume, career, interview) trên cùng API server.
const aiRoutes = require('./ai');
const resumeAnalysisRoutes = require('./resume-analysis');
const interviewPrepRoutes = require('./interview-prep');
const publicToolsRoutes = require('./public-tools');
const jobRoutes = require('./job');
const candidateRoutes = require('./candidate');
const SystemSettingsRepository = require('../models/SystemSettings');
const { buildFeatureCatalog } = require('../utils/feature-catalog');

const FEATURE_FLAG_KEYS = [
  'ai_chatbot',
  'ai_resume_analysis',
  'ai_moderation',
  'company_moderation_required',
  'experimental_analytics_cards',
];

const DEFAULT_FEATURE_FLAGS = {
  ai_chatbot: true,
  ai_resume_analysis: true,
  ai_moderation: true,
  company_moderation_required: true,
  experimental_analytics_cards: false,
};

router.get('/ready', async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    res.status(200).json({ ready: true, database: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ ready: false, database: 'error', timestamp: new Date().toISOString() });
  }
});

router.use('/users', userRoutes);
router.use('/ai', aiRoutes);
router.use('/categories', categoryRoutes);
router.use('/applications', applicationRoutes);
router.use('/chat', chatbotRoutes);
router.use('/employers', employerRoutes);
router.use('/companies', publicCompanyRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/chatbot', adminChatbotRoutes);
router.use('/admin/homepage', require('./admin-homepage'));
router.use('/homepage', require('./homepage'));
router.use('/skills', skillRoutes);
router.use('/blog', require('./blog'));
router.use('/newsletter', require('./newsletter'));
router.use('/notifications', notificationRoutes);
router.use('/messages', messagingRoutes);

// Công cụ công khai (trang landing — không auth)
router.use('/public/tools', publicToolsRoutes);

// AI Feature Routes (prefix cụ thể trước /candidates/profile)
router.use('/candidates/resume', resumeAnalysisRoutes);
router.use('/candidates/interview', interviewPrepRoutes);
router.use('/interview-prep', interviewPrepRoutes);
router.use('/candidates', candidateRoutes);
router.use('/jobs', jobRoutes);

router.get('/settings/feature-flags', async (_req, res, _next) => {
  try {
    const flags = await SystemSettingsRepository.getBooleansForKeys(FEATURE_FLAG_KEYS, true);
    res.json({ success: true, data: flags });
  } catch (error) {
    logger.error('Error loading feature flags:', error.message);
    res.json({ success: true, data: { ...DEFAULT_FEATURE_FLAGS } });
  }
});

// Debug endpoint - remove after debugging
router.get('/debug/db-users', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, role, status, deleted_at FROM users WHERE id IN (2,3,11) LIMIT 5'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug: decode the JWT from the Authorization header
router.get('/debug/decode-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) {
      return res.json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, jwtConfig.secret);
    const user = await UserRepository.findById(decoded.id);
    res.json({
      success: true,
      tokenPayload: decoded,
      userFromDB: user,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      name: error.name,
    });
  }
});

router.get('/features/catalog', async (_req, res, _next) => {
  try {
    const settings = await SystemSettingsRepository.findAll();
    const settingsMap = {};
    settings.forEach((item) => {
      settingsMap[item.setting_key] = item.setting_value;
    });

    const customPayload = await SystemSettingsRepository.getJSON('feature_catalog_payload', null);
    const enabled = await SystemSettingsRepository.getBoolean('feature_catalog_enabled', true);

    const catalog = buildFeatureCatalog({
      settingsMap,
      payload: enabled ? customPayload : null,
    });

    res.json({
      success: true,
      data: catalog,
      meta: {
        source: enabled && customPayload ? 'system_settings' : 'default',
      },
    });
  } catch (error) {
    logger.error('Error loading features catalog:', error.message);
    try {
      const catalog = buildFeatureCatalog({
        settingsMap: {},
        payload: null,
      });
      res.json({
        success: true,
        data: catalog,
        meta: {
          source: 'default_fallback',
        },
      });
    } catch {
      res.json({
        success: true,
        data: {
          features: [],
          categories: [],
        },
        meta: {
          source: 'empty_fallback',
        },
      });
    }
  }
});

router.get('/health', async (_req, res) => {
  let dbStatus = 'ok';
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
  } catch {
    dbStatus = 'error';
  }

  res.json({
    service: 'gateway-server',
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    database: dbStatus,
    architecture: 'monolith',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
