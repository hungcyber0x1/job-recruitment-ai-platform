const AppError = require('../utils/errorHandler');
const ApiResponse = require('../utils/ApiResponse');
const AdminChatbotService = require('../services/adminChatbot');
const JobRepository = require('../models/Job');
const UserRepository = require('../models/User');
const ApplicationRepository = require('../models/Application');
const ApplicationService = require('../services/application');
const ActivityLogRepository = require('../models/ActivityLog');
const SupportTicketRepository = require('../models/SupportTicket');
const SystemSettingsRepository = require('../models/SystemSettings');
const StatsRepository = require('../models/Stats');
const CompanyRepository = require('../models/Company');
const notificationService = require('../services/notification');
const catchAsync = require('../utils/catchAsync');
const AdminService = require('../services/admin');
const { jsonToCsv } = require('../utils/csvHelper');
const { APP_STATUS } = require('../utils/constants');

const ADMIN_APPLICATION_PIPELINE_STATS = {
  applied: [APP_STATUS.SUBMITTED],
  screening: [APP_STATUS.SHORTLISTED],
  interview: [APP_STATUS.INTERVIEW_SCHEDULED, APP_STATUS.INTERVIEWED],
  hired: [APP_STATUS.HIRED],
  rejected: [APP_STATUS.REJECTED],
};

function groupApplicationStats(stats = {}) {
  return Object.entries(ADMIN_APPLICATION_PIPELINE_STATS).reduce(
    (summary, [groupKey, statuses]) => {
      summary[groupKey] = statuses.reduce(
        (total, status) => total + Number(stats?.[status] || 0),
        0
      );
      return summary;
    },
    {}
  );
}

const BOOLEAN_SETTING_KEYS = new Set([
  'email_notifications_enabled',
  'two_factor_enabled',
  'ai_chatbot',
  'chatbot_scope_career_advice',
  'chatbot_scope_skill_suggestions',
  'chatbot_scope_job_orientation',
  'maintenance_mode',
  'allow_registration',
  'feature_catalog_enabled',
  'ai_resume_analysis',
  'ai_moderation',
  'ai_screening_enabled',
]);

const TEXT_SETTING_LIMITS = {
  site_name: 120,
  site_description: 250,
  site_logo_light: 500,
  site_logo_dark: 500,
  contact_email: 150,
  support_email: 150,
  email_sender_name: 100,
  chatbot_greeting: 250,
  primary_color: 20,
};

const EMAIL_SETTING_KEYS = new Set(['contact_email', 'support_email']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const SETTING_KEY_REGEX = /^[a-zA-Z0-9_.:-]+$/;

function normalizeBooleanSetting(value) {
  if (typeof value === 'boolean') return { value: value ? 'true' : 'false' };
  if (typeof value === 'number') return { value: value === 1 ? 'true' : 'false' };

  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return { value: 'true' };
  if (['false', '0', 'no', 'off'].includes(normalized)) return { value: 'false' };

  return { error: 'Giá trị bật/tắt không hợp lệ.' };
}

function normalizeSystemSettingInput(key, value) {
  if (!key || key.length > 100 || !SETTING_KEY_REGEX.test(key)) {
    return { error: `Khóa cấu hình không hợp lệ: ${key}` };
  }

  if (BOOLEAN_SETTING_KEYS.has(key)) {
    const result = normalizeBooleanSetting(value);
    if (result.error) return { error: `${key}: ${result.error}` };
    return { value: result.value };
  }

  if (key === 'session_timeout_minutes') {
    const minutes = Number(value);
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 1440) {
      return { error: 'Thời gian hết hạn phiên đăng nhập phải từ 15 đến 1440 phút.' };
    }
    return { value: String(minutes) };
  }

  if (key === 'primary_color') {
    const color = String(value ?? '').trim();
    if (!HEX_COLOR_REGEX.test(color)) {
      return { error: 'Màu chủ đạo phải là mã hex hợp lệ.' };
    }
    return { value: color };
  }

  if (EMAIL_SETTING_KEYS.has(key)) {
    const email = String(value ?? '').trim();
    if (email && !EMAIL_REGEX.test(email)) {
      return { error: `${key}: email không hợp lệ.` };
    }
    return { value: email };
  }

  const limit = TEXT_SETTING_LIMITS[key];
  if (limit) {
    const text = String(value ?? '').trim();
    if (text.length > limit) {
      return { error: `${key}: không được vượt quá ${limit} ký tự.` };
    }
    return { value: text };
  }

  if (typeof value === 'object' && value !== null) {
    const serialized = JSON.stringify(value);
    if (serialized.length > 20000) return { error: `${key}: dữ liệu cấu hình quá lớn.` };
    return { value: serialized };
  }

  const serialized = String(value ?? '');
  if (serialized.length > 20000) return { error: `${key}: dữ liệu cấu hình quá lớn.` };
  return { value: serialized };
}

class AdminController {
  // ─── Applications ────────────────────────────────────────────────────────────

  getAllApplications = catchAsync(async (req, res) => {
    const { search, status, page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    const { data: applications, total } = await ApplicationRepository.findAll({
      search,
      status,
      limit: parsedLimit,
      offset,
    });

    const [stats, grandTotal] = await Promise.all([
      ApplicationRepository.countByStatus(),
      ApplicationRepository.countAll(),
    ]);

    return ApiResponse.success(res, applications, {
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
      stats: { ...stats, ...groupApplicationStats(stats), total: grandTotal },
    });
  });

  getApplicationById = catchAsync(async (req, res) => {
    const application = await ApplicationRepository.findByIdWithDetails(req.params.id);
    if (!application) return ApiResponse.notFound(res, 'Application');
    return ApiResponse.success(res, application);
  });

  getApplicationHistory = catchAsync(async (req, res) => {
    const history = await ApplicationService.getApplicationHistory(req.params.id, null, true);
    return ApiResponse.success(res, history);
  });

  updateApplicationStatus = catchAsync(async (req, res) => {
    const { status, notes, offer_details, ...metadata } = req.body;
    await AdminService.updateApplicationStatus(
      req.user.id,
      req.params.id,
      status,
      notes,
      { ...metadata, offer_details },
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: 'Application status updated successfully' });
  });

  updateApplicationInternalNote = catchAsync(async (req, res) => {
    await AdminService.updateApplicationInternalNote(
      req.user.id,
      req.params.id,
      req.body.note,
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: 'Internal note updated successfully' });
  });

  bulkUpdateApplicationsStatus = catchAsync(async (req, res) => {
    const { ids, status, notes } = req.body;
    const count = await AdminService.bulkUpdateApplicationsStatus(
      req.user.id,
      ids,
      status,
      notes,
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.success(res, null, {
      message: `Updated ${count} applications successfully`,
    });
  });

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  getDashboardStats = catchAsync(async (req, res) => {
    const data = await AdminService.getDashboardStats();
    return ApiResponse.success(res, data);
  });

  getAnalyticsDashboard = catchAsync(async (req, res) => {
    const data = await AdminService.getAnalyticsDashboard({ range: req.query.range });
    return ApiResponse.success(res, data);
  });

  // ─── Users ──────────────────────────────────────────────────────────────────

  getAllUsers = catchAsync(async (req, res) => {
    const {
      search,
      role,
      status,
      start_date,
      end_date, // Date range filters
      skills, // Filter by skills
      sort_by,
      order, // Sorting
      page = 1,
      limit = 10,
    } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    // Parse skills if it's a comma-separated string
    const skillsArray = skills
      ? skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    const { data: users, total } = await UserRepository.findAllWithFilters({
      search,
      role,
      status,
      startDate: start_date,
      endDate: end_date,
      skills: skillsArray,
      sortBy: sort_by,
      order,
      limit: parsedLimit,
      offset,
    });

    return ApiResponse.success(res, users, {
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  });

  getUserById = catchAsync(async (req, res) => {
    const user = await UserRepository.findByIdWithDetails(req.params.id);
    if (!user) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, user);
  });

  updateUserStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;
    const targetId = parseInt(req.params.id, 10);
    const deactivating = status !== 'active';
    if (Number.isFinite(targetId) && targetId === req.user.id && deactivating) {
      return next(new AppError('Không thể vô hiệu hóa chính tài khoản đang đăng nhập.', 400));
    }
    const updated = await AdminService.updateUserStatus(
      req.user.id,
      req.params.id,
      status,
      req.ip,
      req.headers['user-agent']
    );
    if (!updated) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, null, { message: 'User status updated successfully' });
  });

  getUsersStats = catchAsync(async (req, res) => {
    const stats = await AdminService.getUsersStats();
    return ApiResponse.success(res, stats);
  });

  updateUser = catchAsync(async (req, res) => {
    const result = await AdminService.updateUser(
      req.user.id,
      req.params.id,
      req.body,
      req.ip,
      req.headers['user-agent']
    );
    if (!result) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, null, { message: 'User updated successfully' });
  });

  deleteUser = catchAsync(async (req, res) => {
    const result = await AdminService.deleteUser(
      req.user.id,
      req.params.id,
      req.ip,
      req.headers['user-agent']
    );
    if (!result) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, null, {
      message: 'User and related data deleted successfully',
    });
  });

  restoreUser = catchAsync(async (req, res) => {
    const result = await AdminService.restoreUser(
      req.user.id,
      req.params.id,
      req.ip,
      req.headers['user-agent']
    );
    if (!result) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, null, { message: 'User restored successfully' });
  });

  hardDeleteUser = catchAsync(async (req, res) => {
    const result = await AdminService.hardDeleteUser(
      req.user.id,
      req.params.id,
      req.ip,
      req.headers['user-agent']
    );
    if (!result) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, null, { message: 'User and related data permanently deleted' });
  });

  forceLogout = catchAsync(async (req, res) => {
    await AdminService.forceLogout(req.user.id, req.params.id, req.ip, req.headers['user-agent']);
    return ApiResponse.success(res, null, {
      message: 'Đã đăng xuất tài khoản khỏi tất cả thiết bị',
    });
  });

  resetPassword = catchAsync(async (req, res) => {
    const { password } = req.body;
    if (!password) return ApiResponse.error(res, 400, 'Mật khẩu mới không được để trống');
    await AdminService.resetPassword(
      req.user.id,
      req.params.id,
      password,
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: 'Đã đặt lại mật khẩu thành công' });
  });

  resendVerification = catchAsync(async (req, res) => {
    await AdminService.resendVerification(
      req.user.id,
      req.params.id,
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: 'Đã gửi lại email xác thực' });
  });

  getUserActivity = catchAsync(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    const { data: logs, total } = await ActivityLogRepository.findAll({
      userId: req.params.id,
      limit: parsedLimit,
      offset,
    });

    return ApiResponse.success(res, logs, {
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  });

  bulkUpdateUsersStatus = catchAsync(async (req, res) => {
    const { ids, status } = req.body;
    const count = await AdminService.bulkUpdateUsersStatus(
      req.user.id,
      ids,
      status,
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: `Updated ${count} users successfully` });
  });

  lockUser = catchAsync(async (req, res, next) => {
    const targetId = parseInt(req.params.id, 10);
    if (Number.isFinite(targetId) && targetId === req.user.id) {
      return next(new AppError('Không thể khóa chính tài khoản đang đăng nhập.', 400));
    }
    try {
      const updated = await AdminService.lockUser(
        req.user.id,
        req.params.id,
        req.ip,
        req.headers['user-agent']
      );
      if (!updated) return ApiResponse.notFound(res, 'User');
      return ApiResponse.success(res, null, { message: 'Đã khóa tài khoản thành công' });
    } catch (error) {
      next(error);
    }
  });

  unlockUser = catchAsync(async (req, res, next) => {
    try {
      const updated = await AdminService.unlockUser(
        req.user.id,
        req.params.id,
        req.ip,
        req.headers['user-agent']
      );
      if (!updated) return ApiResponse.notFound(res, 'User');
      return ApiResponse.success(res, null, { message: 'Đã mở khóa tài khoản thành công' });
    } catch (error) {
      next(error);
    }
  });

  updateUserPermissions = catchAsync(async (req, res) => {
    const { permissions } = req.body;
    const updated = await AdminService.updateUserPermissions(
      req.user.id,
      req.params.id,
      permissions,
      req.ip,
      req.headers['user-agent']
    );
    if (!updated) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, null, { message: 'Đã cập nhật quyền thành công' });
  });

  // ─── Jobs ──────────────────────────────────────────────────────────────────

  getAllJobs = catchAsync(async (req, res) => {
    const {
      search,
      status,
      type,
      flagged,
      company_id, // Filter by company
      category_id, // Filter by category
      industry, // Filter by industry/category name
      start_date,
      end_date, // Date range
      ai_risk, // AI risk level
      sort_by,
      order, // Sorting
      page = 1,
      limit = 10,
    } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    const [jobs, totalJobs, pendingJobs, publishedJobs, flaggedJobs] = await Promise.all([
      JobRepository.findWithDetails({
        search,
        status: status || 'all',
        type,
        flagged: flagged === 'true',
        companyId: company_id,
        categoryId: category_id,
        industry,
        startDate: start_date,
        endDate: end_date,
        aiRisk: ai_risk,
        sortBy: sort_by,
        order,
        include_deleted: req.query.include_deleted === 'true',
        limit: parsedLimit,
        offset,
      }),
      JobRepository.countAll(),
      JobRepository.countByStatus('pending_review'),
      JobRepository.countByStatus('published'),
      JobRepository.countFlagged(),
    ]);

    const jobsData = jobs.data || jobs;
    const total = jobs.total !== undefined ? jobs.total : jobsData.length;

    return ApiResponse.success(res, jobsData, {
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
      stats: {
        total: totalJobs,
        pending: pendingJobs,
        published: publishedJobs,
        flagged: flaggedJobs,
      },
    });
  });

  getJobById = catchAsync(async (req, res) => {
    const job = await JobRepository.findByIdWithDetails(req.params.id, { includeDeleted: true });
    if (!job) return ApiResponse.notFound(res, 'Job');
    return ApiResponse.success(res, job);
  });

  updateJobStatus = catchAsync(async (req, res) => {
    const { status, rejection_reason } = req.body;

    // Get job info before update
    const job = await JobRepository.findById(req.params.id);
    if (!job) return ApiResponse.notFound(res, 'Job');

    const updated = await AdminService.updateJobStatus(
      req.user.id,
      req.params.id,
      status,
      rejection_reason,
      req.ip,
      req.headers['user-agent']
    );
    if (!updated) return ApiResponse.notFound(res, 'Job');

    // Notify recruiter when job status changes
    if (job.recruiter_id) {
      if (status === 'published' || status === 'rejected') {
        const company = await CompanyRepository.findById(job.company_id);
        const companyName = company?.company_name || 'một công ty';

        if (status === 'published') {
          await notificationService.sendSystemNotification(
            job.recruiter_id,
            'Tin tuyển dụng đã được duyệt',
            `Tin tuyển dụng "${job.title}" của ${companyName} đã được đăng thành công.`,
            { job_id: job.id }
          );
        } else if (status === 'rejected') {
          await notificationService.sendSystemNotification(
            job.recruiter_id,
            'Tin tuyển dụng bị từ chối',
            `Tin tuyển dụng "${job.title}" của ${companyName} đã bị từ chối. Lý do: ${rejection_reason || 'Không có'}`
          );
        }
      }
    }

    return ApiResponse.success(res, null, { message: `Job status updated to ${status}` });
  });

  bulkUpdateJobsStatus = catchAsync(async (req, res) => {
    const { ids, status, reason } = req.body;
    const count = await AdminService.bulkUpdateJobsStatus(
      req.user.id,
      ids,
      status,
      reason,
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: `Updated ${count} jobs successfully` });
  });

  duplicateJob = catchAsync(async (req, res) => {
    const result = await AdminService.duplicateJob(
      req.user.id,
      req.params.id,
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.created(res, result, 'Job duplicated successfully');
  });

  updateJobFlag = catchAsync(async (req, res) => {
    const { flagged, note } = req.body;
    const updated = await AdminService.updateJobFlag(
      req.user.id,
      req.params.id,
      flagged,
      note,
      req.ip,
      req.headers['user-agent']
    );
    if (!updated) return ApiResponse.notFound(res, 'Job');
    return ApiResponse.success(res, null, {
      message: flagged ? 'Job flagged successfully' : 'Job flag removed',
    });
  });

  createJob = catchAsync(async (req, res) => {
    const result = await AdminService.createAdminJob(
      req.user.id,
      req.body,
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.created(res, result);
  });

  updateJob = catchAsync(async (req, res) => {
    const result = await AdminService.updateAdminJob(
      req.user.id,
      req.params.id,
      req.body,
      req.ip,
      req.headers['user-agent']
    );
    return ApiResponse.success(res, result, { message: 'Job updated' });
  });

  deleteJob = catchAsync(async (req, res) => {
    await JobRepository.delete(req.params.id);
    return ApiResponse.success(res, null, { message: 'Job deleted successfully' });
  });

  // ─── Companies ────────────────────────────────────────────────────────────────

  getCompanyById = catchAsync(async (req, res) => {
    const company = await CompanyRepository.findByIdWithDetails(req.params.id);
    if (!company) return ApiResponse.notFound(res, 'Company');
    return ApiResponse.success(res, company);
  });

  // ─── Analytics ──────────────────────────────────────────────────────────────

  getChartStats = catchAsync(async (req, res) => {
    const [
      userGrowth,
      jobStats,
      applicationStats,
      weeklyActivity,
      userDistribution,
      applicationTrend,
    ] = await Promise.all([
      StatsRepository.getUserGrowth(),
      StatsRepository.getJobStats(),
      StatsRepository.getApplicationDistribution(),
      StatsRepository.getWeeklyActivity(),
      StatsRepository.getUserDistribution(),
      StatsRepository.getApplicationTrend(),
    ]);
    return ApiResponse.success(res, {
      userGrowth,
      jobStats,
      applicationStats,
      weeklyActivity,
      userDistribution,
      applicationTrend,
    });
  });

  // ─── Logs ──────────────────────────────────────────────────────────────────

  getLogs = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, search, adminId, startDate, endDate } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    const { data: logs, total } = await ActivityLogRepository.findAll({
      adminId,
      search,
      startDate,
      endDate,
      limit: parsedLimit,
      offset,
    });

    return ApiResponse.success(res, logs, {
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  });

  // ─── Support Tickets ────────────────────────────────────────────────────────

  getTickets = catchAsync(async (req, res) => {
    const { status, priority, category, search, page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    const { data: tickets, total } = await SupportTicketRepository.findAll({
      status,
      priority,
      category,
      search,
      limit: parsedLimit,
      offset,
    });

    return ApiResponse.success(res, tickets, {
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  });

  updateTicketStatus = catchAsync(async (req, res) => {
    await SupportTicketRepository.updateStatus(req.params.id, req.body.status);
    return ApiResponse.success(res, null, { message: 'Updated' });
  });

  getTicketMessages = catchAsync(async (req, res) => {
    const messages = await SupportTicketRepository.getMessages(req.params.id);
    return ApiResponse.success(res, messages);
  });

  replyToTicket = catchAsync(async (req, res) => {
    const { message, isInternal } = req.body;
    await SupportTicketRepository.addMessage({
      ticketId: req.params.id,
      senderId: req.user.id,
      message,
      isInternal,
    });
    return ApiResponse.success(res, null, { message: 'Reply sent' });
  });

  // ─── Settings ───────────────────────────────────────────────────────────────

  getSettings = catchAsync(async (req, res) => {
    const settings = await SystemSettingsRepository.findAll();
    const settingsMap = {};
    settings.forEach((s) => (settingsMap[s.setting_key] = s.setting_value));
    return ApiResponse.success(res, settingsMap);
  });

  updateSettings = catchAsync(async (req, res) => {
    const entries = Object.entries(req.body || {});
    const errors = [];
    const normalizedEntries = [];

    for (const [key, value] of entries) {
      const normalized = normalizeSystemSettingInput(key, value);
      if (normalized.error) {
        errors.push(normalized.error);
        continue;
      }
      normalizedEntries.push([key, normalized.value]);
    }

    if (errors.length) {
      return ApiResponse.badRequest(res, 'Dữ liệu cấu hình không hợp lệ.', errors);
    }

    for (const [key, value] of normalizedEntries) {
      await SystemSettingsRepository.update(key, value);
    }

    return ApiResponse.success(res, null, { message: 'Settings updated' });
  });

  uploadSiteLogo = catchAsync(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 400, 'No logo file uploaded');
    }
    const logoType = req.body.logo_type || 'light';
    const url = `/uploads/site-logos/${req.file.filename}`;
    const settingKey = `site_logo_${logoType}`;
    await SystemSettingsRepository.update(settingKey, url);
    return ApiResponse.success(res, { url }, { message: 'Logo uploaded successfully' });
  });

  testSmtpConnection = catchAsync(async (req, res) => {
    const { host, port, user, password } = req.body;
    if (!host || !port || !password) {
      return ApiResponse.error(res, 400, 'Thiếu thông tin SMTP (host, port, password).');
    }
    try {
      // Attempt SMTP handshake — connect + EHLO + QUIT
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: { user: user || req.body.contact_email, pass: password },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });
      await transporter.verify();
      await SystemSettingsRepository.update('smtp_connected', 'true');
      return ApiResponse.success(res, { connected: true }, { message: 'SMTP kết nối thành công!' });
    } catch (err) {
      await SystemSettingsRepository.update('smtp_connected', 'false');
      return ApiResponse.error(res, 400, `SMTP thất bại: ${err.message}`);
    }
  });

  generateApiKey = catchAsync(async (req, res) => {
    const crypto = require('crypto');
    const apiKey = `${process.env.APP_NAME || 'HireBOT'}_${crypto.randomBytes(24).toString('hex')}`;
    await SystemSettingsRepository.update('api_key', apiKey);
    return ApiResponse.success(res, { api_key: apiKey }, { message: 'API Key đã được tạo.' });
  });

  // ─── Chat / AI ─────────────────────────────────────────────────────────────

  getChatStats = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    const analytics = await AdminChatbotService.getAnalytics({ startDate, endDate });

    return ApiResponse.success(res, {
      totalSessions: analytics.totalConversations,
      totalUsers: analytics.activeUsers,
      totalMessages: analytics.totalMessages,
      avgMessagesPerConversation: analytics.avgMessagesPerConversation,
      satisfaction: analytics.satisfaction,
      topIntents: analytics.topIntents,
      chartData: analytics.chartData,
    });
  });

  getChatSessions = catchAsync(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const result = await AdminChatbotService.getConversations({
      page: parsedPage,
      limit: parsedLimit,
    });

    return ApiResponse.success(res, result.data, {
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: result.meta.total,
        pages: Math.ceil(result.meta.total / parsedLimit),
      },
    });
  });

  // ─── Backup / Restore ───────────────────────────────────────────────────────

  backupData = catchAsync(async (req, res) => {
    const backup = await AdminService.generateBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${Date.now()}.json`);
    return res.json(backup);
  });

  restoreData = catchAsync(async (req, res) => {
    if (!req.file) return ApiResponse.error(res, 400, 'No backup file uploaded');

    const fs = require('fs').promises;
    let backupBuffer = req.file.buffer || (await fs.readFile(req.file.path));

    if (!backupBuffer) return ApiResponse.error(res, 400, 'Invalid backup file');

    const backupText = backupBuffer.toString('utf8').replace(/^\uFEFF/, '');
    let backupData;
    try {
      backupData = JSON.parse(backupText);
    } catch {
      if (req.file.path) await fs.unlink(req.file.path).catch(() => null);
      return ApiResponse.error(res, 400, 'Invalid JSON backup file');
    }

    if (req.file.path) await fs.unlink(req.file.path).catch(() => null);
    if (!backupData.data) return ApiResponse.error(res, 400, 'Invalid backup format');

    await ActivityLogRepository.create({
      adminCode: req.user.id,
      userId: null,
      action: 'SYSTEM_RESTORE',
      details: `Restored system data from backup version ${backupData.version || 'unknown'}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return ApiResponse.success(res, null, {
      message: 'Data restoration completed successfully (Simulation)',
    });
  });

  // ─── Email Logs ─────────────────────────────────────────────────────────────

  getEmailLogs = catchAsync(async (req, res) => {
    const { recipient, status, page = 1, limit = 20 } = req.query;
    const parsedLimit = parseInt(limit);
    const offset = (parseInt(page) - 1) * parsedLimit;

    const [logs, total] = await Promise.all([
      AdminService.getEmailLogs({ recipient, status, limit: parsedLimit, offset }),
      AdminService.getEmailLogCount({ recipient, status }),
    ]);

    return ApiResponse.success(res, logs, {
      pagination: {
        page: parseInt(page),
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  });

  // ─── Exports (CSV - trả raw, không qua ApiResponse) ──────────────────────────

  exportUsers = catchAsync(async (req, res) => {
    const { data: users } = await UserRepository.findAllWithFilters({ limit: 10000, offset: 0 });
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Họ tên', key: 'full_name' },
      { header: 'Email', key: 'email' },
      { header: 'Vai trò', key: 'role' },
      { header: 'Trạng thái', key: 'status' },
      { header: 'Ngày tạo', key: 'created_at' },
      { header: 'Đăng nhập cuối', key: 'last_login_at' },
      { header: 'Ghi chú', key: 'internal_notes' },
    ];
    const csv = jsonToCsv(users, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=users-export-${Date.now()}.csv`);
    return res.send(`\uFEFF${csv}`);
  });

  exportJobs = catchAsync(async (req, res) => {
    const { search, status, flagged } = req.query;
    const jobs = await JobRepository.findWithDetails({
      search,
      status: status || 'all',
      flagged: flagged === 'true',
      include_deleted: true,
      limit: 10000,
      offset: 0,
    });
    const jobsData = jobs.data || jobs;
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Tiêu đề', key: 'title' },
      { header: 'Công ty', key: 'company_name' },
      { header: 'Danh mục', key: 'category_name' },
      { header: 'Địa điểm', key: 'location' },
      { header: 'Trạng thái', key: 'status' },
      { header: 'Cảnh báo', accessor: (j) => (j.is_flagged ? 'Có' : 'Không') },
      { header: 'Số ứng tuyển', key: 'applicant_count' },
      { header: 'Lượt xem', key: 'views' },
      { header: 'Ngày đăng', key: 'created_at' },
    ];
    const csv = jsonToCsv(jobsData, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=jobs-export-${Date.now()}.csv`);
    return res.send(`\uFEFF${csv}`);
  });

  exportApplications = catchAsync(async (req, res) => {
    const { search, status } = req.query;
    const { data: applications } = await ApplicationRepository.findAll({
      search,
      status: status || 'all',
      limit: 10000,
      offset: 0,
    });
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Ứng viên', key: 'candidate_name' },
      { header: 'Email', key: 'candidate_email' },
      { header: 'Công việc', key: 'job_title' },
      { header: 'Công ty', key: 'company_name' },
      { header: 'Trạng thái', key: 'status' },
      { header: 'Ngày nộp', key: 'applied_at' },
    ];
    const csv = jsonToCsv(applications, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=applications-export-${Date.now()}.csv`
    );
    return res.send(`\uFEFF${csv}`);
  });
}

module.exports = new AdminController();
