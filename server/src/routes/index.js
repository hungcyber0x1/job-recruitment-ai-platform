/**
 * Gom route API xử lý trực tiếp trên gateway (user, admin, AI tools, …)
 * và endpoint /ready kiểm tra DB. Feature flags đọc từ DB (mặc định an toàn).
 */
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { pool } = require('../config/database.config');

const userRoutes = require('./user');
const applicationRoutes = require('./application');
const chatbotRoutes = require('./chatbot');
const adminRoutes = require('./admin');
const categoryRoutes = require('./category');
const adminChatbotRoutes = require('./admin-chatbot');
const skillRoutes = require('./skill');
const employerRoutes = require('./employer');

// Tính năng AI (resume, career, interview) trên cùng API server.
const resumeAnalysisRoutes = require('./resume-analysis');
const careerPathRoutes = require('./career-path');
const interviewPrepRoutes = require('./interview-prep');
const publicToolsRoutes = require('./public-tools');
const jobRoutes = require('./job');
const candidateRoutes = require('./candidate');
const SystemSettingsRepository = require('../models/SystemSettings');
const { buildFeatureCatalog } = require('../utils/feature-catalog');

const FEATURE_FLAG_KEYS = [
  'ai_chatbot',
  'ai_resume_analysis',
  'ai_job_matching',
  'ai_moderation',
  'ai_career_roadmap',
  'ai_screening_enabled',
  'company_moderation_required',
  'experimental_analytics_cards',
];

const DEFAULT_FEATURE_FLAGS = {
  ai_chatbot: true,
  ai_resume_analysis: true,
  ai_job_matching: true,
  ai_moderation: true,
  ai_career_roadmap: true,
  ai_screening_enabled: true,
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
router.use('/categories', categoryRoutes);
router.use('/applications', applicationRoutes);
router.use('/chat', chatbotRoutes);
router.use('/employers', employerRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/chatbot', adminChatbotRoutes);
router.use('/skills', skillRoutes);
router.use('/blog', require('./blog'));

// Công cụ công khai (trang landing — không auth)
router.use('/public/tools', publicToolsRoutes);

// AI Feature Routes (prefix cụ thể trước /candidates/profile)
router.use('/candidates/resume', resumeAnalysisRoutes);
router.use('/candidates/career-path', careerPathRoutes);
router.use('/candidates/interview', interviewPrepRoutes);
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
