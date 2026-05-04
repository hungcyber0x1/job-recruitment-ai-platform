/**
 * Admin Tool Executor
 * Thực thi các admin tools được gọi bởi chatbot.
 * Tất cả write actions đều được audit log.
 *
 * Approach: dispatch thủ công từng tool thay vì dynamic method call.
 * Đảm bảo type safety và đúng method signatures.
 */
const AdminService = require('./admin');
const AdminChatbotService = require('./adminChatbot');
const UserRepository = require('../models/User');
const JobRepository = require('../models/Job');
const ApplicationRepository = require('../models/Application');
const CompanyRepository = require('../models/Company');
const ActivityLogRepository = require('../models/ActivityLog');
const AuditLogRepository = require('../models/AuditLog');
const SystemSettingsRepository = require('../models/SystemSettings');
const StatsRepository = require('../models/Stats');
const SupportTicketRepository = require('../models/SupportTicket');
const BlogRepository = require('../models/Blog');
const CategoryRepository = require('../models/Category');
const { pool } = require('../config/database.config');
const logger = require('../utils/logger');

/**
 * Execute an admin tool with the given arguments.
 * @param {string} toolName - The name of the tool
 * @param {object} args - Arguments from intent detector
 * @param {object} context - Execution context (adminId, ip, userAgent)
 * @returns {Promise<object>} { success, data or error }
 */
async function executeAdminTool(toolName, args = {}, context = {}) {
  try {
    switch (toolName) {
      // ── Dashboard & Stats ──────────────────────────────────────────
      case 'get_dashboard_stats':
        return await handleDashboardStats(args);

      case 'get_chart_stats':
        return await handleChartStats(args);

      case 'get_platform_health':
        return await handlePlatformHealth(args);

      // ── Users (Read) ───────────────────────────────────────────────
      case 'list_users':
        return await handleListUsers(args);

      case 'get_user_detail':
        return await handleGetUserDetail(args);

      case 'get_user_activity':
        return await handleGetUserActivity(args);

      // ── Users (Write) ──────────────────────────────────────────────
      case 'update_user_status':
        return await handleUpdateUserStatus(args, context);

      case 'lock_user':
        return await handleLockUser(args, context);

      case 'unlock_user':
        return await handleUnlockUser(args, context);

      // ── Jobs (Read) ───────────────────────────────────────────────
      case 'list_jobs':
        return await handleListJobs(args);

      case 'get_job_detail':
        return await handleGetJobDetail(args);

      // ── Jobs (Write) ───────────────────────────────────────────────
      case 'update_job_status':
        return await handleUpdateJobStatus(args, context);

      case 'flag_job':
        return await handleFlagJob(args, context);

      // ── Applications (Read) ──────────────────────────────────────
      case 'list_applications':
        return await handleListApplications(args);

      case 'get_application_detail':
        return await handleGetApplicationDetail(args);

      // ── Companies (Read) ────────────────────────────────────────
      case 'list_companies':
        return await handleListCompanies(args);

      // ── Companies (Write) ───────────────────────────────────────
      case 'verify_company':
        return await handleVerifyCompany(args, context);

      case 'flag_company':
        return await handleFlagCompany(args, context);

      // ── Logs (Read) ─────────────────────────────────────────────
      case 'get_activity_logs':
        return await handleGetActivityLogs(args);

      case 'get_audit_trail':
        return await handleGetAuditTrail(args);

      // ── Support (Read) ─────────────────────────────────────────
      case 'list_support_tickets':
        return await handleListTickets(args);

      // ── Chatbot (Read) ─────────────────────────────────────────
      case 'get_chatbot_analytics':
        return await handleChatbotAnalytics(args);

      case 'get_chatbot_conversations':
        return await handleChatbotConversations(args);

      case 'get_conversation_detail':
        return await handleGetConversationDetail(args);

      case 'get_chatbot_templates':
        return await handleChatbotTemplates(args);

      case 'get_chatbot_config':
        return await handleChatbotConfig(args);

      // ── Chatbot (Write) ─────────────────────────────────────────
      case 'update_chatbot_config':
        return await handleUpdateChatbotConfig(args, context);

      // ── Settings & Content ───────────────────────────────────────
      case 'get_system_settings':
        return await handleGetSystemSettings(args);

      case 'list_blog_posts':
        return await handleListBlogPosts(args);

      case 'list_categories':
        return await handleListCategories(args);

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    logger.error(`Admin tool execution failed: ${toolName}`, {
      error: error.message,
      stack: error.stack,
      tool: toolName,
    });
    return { success: false, error: formatError(error) };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════════════════════

async function handleDashboardStats(_args) {
  const [
    userGrowth,
    jobStats,
    applicationDistribution,
    weeklyActivity,
    userDistribution,
    [[{ total: appTotal }]],
    [[{ total: userTotal }]],
    [[{ total: jobTotal }]],
    [[{ total: companyTotal }]],
  ] = await Promise.all([
    StatsRepository.getUserGrowth(),
    StatsRepository.getJobStats(),
    StatsRepository.getApplicationDistribution(),
    StatsRepository.getWeeklyActivity(),
    StatsRepository.getUserDistribution(),
    pool.query('SELECT COUNT(*) as total FROM applications'),
    pool.query('SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL'),
    pool.query('SELECT COUNT(*) as total FROM jobs WHERE deleted_at IS NULL'),
    pool.query('SELECT COUNT(*) as total FROM company_profiles WHERE deleted_at IS NULL'),
  ]);

  return {
    success: true,
    data: {
      userGrowth: (userGrowth || []).slice(-6),
      jobStats,
      applicationStats: {
        distribution: applicationDistribution || [],
        total: appTotal || 0,
      },
      weeklyActivity: (weeklyActivity || []).slice(-4),
      userDistribution,
      summary: {
        totalApplications: appTotal || 0,
        totalUsers: userTotal || 0,
        totalJobs: jobTotal || 0,
        totalCompanies: companyTotal || 0,
      },
    },
  };
}

async function handleChartStats(_args) {
  const [
    userGrowth,
    jobStats,
    applicationDistribution,
    weeklyActivity,
    userDistribution,
    [[{ total: appTotal }]],
  ] = await Promise.all([
    StatsRepository.getUserGrowth(),
    StatsRepository.getJobStats(),
    StatsRepository.getApplicationDistribution(),
    StatsRepository.getWeeklyActivity(),
    StatsRepository.getUserDistribution(),
    pool.query('SELECT COUNT(*) as total FROM applications'),
  ]);

  return {
    success: true,
    data: {
      userGrowth,
      jobStats,
      applicationStats: {
        distribution: applicationDistribution || [],
        total: appTotal || 0,
      },
      weeklyActivity,
      userDistribution,
    },
  };
}

async function handlePlatformHealth(_args) {
  const [
    [[{ total: totalUsers }]],
    [[{ total: pendingJobs }]],
    [[{ total: flaggedJobs }]],
    [[{ total: activeToday }]],
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) as total FROM users WHERE status = ?', ['active']),
    pool.query('SELECT COUNT(*) as total FROM jobs WHERE status = ?', ['pending_review']),
    pool.query('SELECT COUNT(*) as total FROM jobs WHERE flagged = ?', [1]),
    pool.query(
      'SELECT COUNT(DISTINCT user_id) as total FROM activity_logs WHERE DATE(created_at) = CURDATE()'
    ),
  ]);

  return {
    success: true,
    data: {
      activeUsersToday: activeToday || 0,
      pendingJobApprovals: pendingJobs || 0,
      flaggedJobsToReview: flaggedJobs || 0,
      totalActiveUsers: totalUsers || 0,
      status: 'healthy',
    },
  };
}

async function handleListUsers(args) {
  const { search, role, status, page = 1, limit = 20 } = args;
  const { data, total } = await UserRepository.findAllWithFilters({
    search,
    role,
    status,
    sortBy: 'created_at',
    order: 'desc',
    limit: parseInt(limit, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
  });
  return {
    success: true,
    data: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      items: (data || []).map(summarizeUser),
      hasMore: total > parseInt(limit, 10),
    },
  };
}

async function handleGetUserDetail(args) {
  const user = await UserRepository.findByIdWithDetails(args.user_id);
  if (!user) return { success: false, error: 'User not found' };
  return { success: true, data: summarizeUser(user) };
}

async function handleGetUserActivity(args) {
  const { user_id, page = 1, limit = 20 } = args;
  const { data, total } = await ActivityLogRepository.findAll({
    userId: user_id ? String(user_id) : undefined,
    limit: parseInt(limit, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
  });
  return {
    success: true,
    data: {
      total,
      page: parseInt(page, 10),
      items: (data || []).slice(0, 20).map(summarizeActivity),
      hasMore: total > 20,
    },
  };
}

async function handleUpdateUserStatus(args, context) {
  const { user_id, status, reason } = args;
  const { adminId, ip, userAgent } = context;
  if (!user_id) return { success: false, error: 'user_id is required' };
  if (!status) return { success: false, error: 'status is required' };
  const result = await AdminService.updateUserStatus(adminId, user_id, status, ip, userAgent);
  return {
    success: true,
    data: { message: `User ${user_id} status updated to ${status}`, reason: reason || null },
  };
}

async function handleLockUser(args, context) {
  const { user_id, reason } = args;
  const { adminId, ip, userAgent } = context;
  if (!user_id) return { success: false, error: 'user_id is required' };
  await AdminService.lockUser(adminId, user_id, ip, userAgent);
  return {
    success: true,
    data: { message: `User ${user_id} has been locked`, reason: reason || null },
  };
}

async function handleUnlockUser(args, context) {
  const { user_id } = args;
  const { adminId, ip, userAgent } = context;
  if (!user_id) return { success: false, error: 'user_id is required' };
  await AdminService.unlockUser(adminId, user_id, ip, userAgent);
  return { success: true, data: { message: `User ${user_id} has been unlocked` } };
}

async function handleListJobs(args) {
  const { search, status, flagged, page = 1, limit = 20 } = args;
  const { data, total } = await JobRepository.findWithDetails({
    search,
    status: status || 'all',
    flagged: flagged !== undefined ? flagged : null,
    limit: parseInt(limit, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    sortBy: 'created_at',
    order: 'desc',
  });
  return {
    success: true,
    data: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      items: (data || []).map(summarizeJob),
      hasMore: total > parseInt(limit, 10),
    },
  };
}

async function handleGetJobDetail(args) {
  const job = await JobRepository.findByIdWithDetails(args.job_id);
  if (!job) return { success: false, error: 'Job not found' };
  return { success: true, data: summarizeJob(job) };
}

async function handleUpdateJobStatus(args, context) {
  const { job_id, status, reason } = args;
  const { adminId, ip, userAgent } = context;
  if (!job_id) return { success: false, error: 'job_id is required' };
  if (!status) return { success: false, error: 'status is required' };
  await AdminService.updateJobStatus(adminId, job_id, status, reason || null, ip, userAgent);
  return {
    success: true,
    data: { message: `Job ${job_id} status updated to ${status}`, reason: reason || null },
  };
}

async function handleFlagJob(args, context) {
  const { job_id, flagged, reason } = args;
  const { adminId, ip, userAgent } = context;
  if (!job_id) return { success: false, error: 'job_id is required' };
  await AdminService.updateJobFlag(
    adminId,
    job_id,
    flagged !== false,
    reason || null,
    ip,
    userAgent
  );
  return {
    success: true,
    data: { message: `Job ${job_id} ${flagged === false ? 'unflagged' : 'flagged'}` },
  };
}

async function handleListApplications(args) {
  const { search, status, page = 1, limit = 20 } = args;
  const { data, total } = await ApplicationRepository.findAll({
    search,
    status: status || undefined,
    limit: parseInt(limit, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
  });
  return {
    success: true,
    data: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      items: (data || []).map(summarizeApplication),
      hasMore: total > parseInt(limit, 10),
    },
  };
}

async function handleGetApplicationDetail(args) {
  const app = await ApplicationRepository.findByIdWithDetails(args.application_id);
  if (!app) return { success: false, error: 'Application not found' };
  return { success: true, data: summarizeApplication(app) };
}

async function handleListCompanies(args) {
  const { search, verified, flagged, page = 1, limit = 20 } = args;
  const { data, total } = await CompanyRepository.findAllWithFilters({
    search,
    verified: verified !== undefined ? verified : null,
    flagged: flagged !== undefined ? flagged : null,
    limit: parseInt(limit, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    sortBy: 'created_at',
    order: 'desc',
  });
  return {
    success: true,
    data: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      items: (data || []).map(summarizeCompany),
      hasMore: total > parseInt(limit, 10),
    },
  };
}

async function handleVerifyCompany(args, context) {
  const { company_id, verified, reason } = args;
  const { adminId, ip, userAgent } = context;
  if (!company_id) return { success: false, error: 'company_id is required' };
  await AdminService.verifyCompany(
    adminId,
    company_id,
    verified !== false,
    reason || null,
    ip,
    userAgent
  );
  return {
    success: true,
    data: { message: `Company ${company_id} ${verified === false ? 'unverified' : 'verified'}` },
  };
}

async function handleFlagCompany(args, context) {
  const { company_id, flagged, reason } = args;
  const { adminId, ip, userAgent } = context;
  if (!company_id) return { success: false, error: 'company_id is required' };
  await AdminService.updateCompanyFlag(
    adminId,
    company_id,
    flagged !== false,
    reason || null,
    ip,
    userAgent
  );
  return {
    success: true,
    data: { message: `Company ${company_id} ${flagged === false ? 'unflagged' : 'flagged'}` },
  };
}

async function handleGetActivityLogs(args) {
  const { user_id, action, page = 1, limit = 50 } = args;
  const { data, total } = await ActivityLogRepository.findAll({
    adminId: user_id ? String(user_id) : undefined,
    search: action,
    limit: parseInt(limit, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
  });
  return {
    success: true,
    data: {
      total,
      page: parseInt(page, 10),
      items: (data || []).slice(0, 30).map(summarizeActivity),
      hasMore: total > 30,
    },
  };
}

async function handleGetAuditTrail(args) {
  const { target_type, target_id, page = 1, limit = 50 } = args;
  const rows = await AuditLogRepository.getAuditTrail({
    targetType: target_type,
    targetId: target_id,
    limit: parseInt(limit, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
  });
  return { success: true, data: (rows || []).slice(0, 30) };
}

async function handleListTickets(args) {
  const { status, page = 1, limit = 20 } = args;
  const { data, total } = await SupportTicketRepository.findAll({
    status,
    limit: parseInt(limit, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
  });
  return {
    success: true,
    data: {
      total,
      page: parseInt(page, 10),
      items: (data || []).map(summarizeTicket),
      hasMore: total > parseInt(limit, 10),
    },
  };
}

async function handleChatbotAnalytics(args) {
  const data = await AdminChatbotService.getAnalytics(args);
  return { success: true, data };
}

async function handleChatbotConversations(args) {
  const result = await AdminChatbotService.getConversations(args);
  return { success: true, data: result };
}

async function handleGetConversationDetail(args) {
  const data = await AdminChatbotService.getConversationDetail(args);
  return { success: true, data };
}

async function handleChatbotTemplates(_args) {
  const data = await AdminChatbotService.getTemplates();
  return { success: true, data };
}

async function handleChatbotConfig(_args) {
  const data = await AdminChatbotService.getConfigurations();
  return { success: true, data };
}

async function handleUpdateChatbotConfig(args, context) {
  const { adminId, ip, userAgent } = context;
  const { config_key, config_value } = args;
  if (!config_key) return { success: false, error: 'config_key is required' };
  if (config_value === undefined) return { success: false, error: 'config_value is required' };
  await AdminChatbotService.updateConfigurations(adminId, ip, userAgent, {
    [config_key]: config_value,
  });
  return { success: true, data: { message: `Config ${config_key} updated to ${config_value}` } };
}

async function handleGetSystemSettings(_args) {
  const settings = await SystemSettingsRepository.findAll();
  const grouped = {};
  for (const s of settings || []) {
    const category = s.setting_key.split('_')[0] || 'general';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({ key: s.setting_key, value: s.setting_value, type: s.type });
  }
  return { success: true, data: grouped };
}

async function handleListBlogPosts(args) {
  const { status, page = 1, limit = 20 } = args;
  const { data, total } = await BlogRepository.findAll({
    status: status || undefined,
    limit: parseInt(limit, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
  });
  return {
    success: true,
    data: {
      total,
      page: parseInt(page, 10),
      items: (data || []).map(summarizeBlog),
      hasMore: total > parseInt(limit, 10),
    },
  };
}

async function handleListCategories(_args) {
  const categories = (await CategoryRepository.findAll) ? CategoryRepository.findAll() : [];
  return {
    success: true,
    data: (categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c.job_count || 0,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════
// SUMMARIZERS
// ═══════════════════════════════════════════════════════════════════

function summarizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
    email: u.email,
    role: u.role,
    status: u.status,
    created: u.created_at || u.createdAt,
    lastLogin: u.last_login_at || u.lastLoginAt,
  };
}

function summarizeJob(j) {
  if (!j) return null;
  return {
    id: j.id,
    title: j.title,
    company: j.company?.name || j.employer?.company_name || j.company_name,
    status: j.status,
    applications: j.application_count || j.applicationsCount || 0,
    flagged: j.flagged,
    created: j.created_at || j.createdAt,
  };
}

function summarizeApplication(a) {
  if (!a) return null;
  return {
    id: a.id,
    candidate: a.candidate?.full_name || a.user?.full_name || a.full_name,
    job: a.job?.title || a.job_title,
    status: a.status,
    applied: a.created_at || a.createdAt,
  };
}

function summarizeCompany(c) {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name || c.company_name,
    verified: c.is_verified || c.verified,
    flagged: c.flagged,
    jobs: c.job_count || 0,
    created: c.created_at || c.createdAt,
  };
}

function summarizeActivity(a) {
  if (!a) return null;
  return {
    id: a.id,
    action: a.action,
    user: a.user_email || a.admin_email || a.email,
    details: typeof a.details === 'string' ? a.details : JSON.stringify(a.details),
    created: a.created_at,
  };
}

function summarizeTicket(t) {
  if (!t) return null;
  return {
    id: t.id,
    subject: t.subject,
    user: t.user_email || t.email,
    status: t.status,
    priority: t.priority,
    created: t.created_at,
  };
}

function summarizeBlog(b) {
  if (!b) return null;
  return {
    id: b.id,
    title: b.title,
    status: b.status,
    author: b.author_name || b.author?.name,
    created: b.created_at || b.createdAt,
  };
}

// ═══════════════════════════════════════════════════════════════════
// ERROR FORMATTER
// ═══════════════════════════════════════════════════════════════════

function formatError(error) {
  const msg = error.message || String(error);
  if (msg.includes('not found') || msg.includes('Not found') || msg.includes('NOT_FOUND'))
    return `Không tìm thấy: ${msg}`;
  if (msg.includes('unauthorized') || msg.includes('Unauthorized') || msg.includes('FORBIDDEN'))
    return 'Bạn không có quyền thực hiện thao tác này.';
  if (msg.includes('duplicate') || msg.includes('Duplicate')) return `Trùng lặp: ${msg}`;
  if (msg.includes('validation') || msg.includes('Validation'))
    return `Dữ liệu không hợp lệ: ${msg}`;
  return msg;
}

module.exports = { executeAdminTool };
