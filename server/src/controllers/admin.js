const AppError = require('../utils/errorHandler');
const ApiResponse = require('../utils/ApiResponse');
const JobRepository = require('../models/Job');
const UserRepository = require('../models/User');
const ApplicationRepository = require('../models/Application');
const ActivityLogRepository = require('../models/ActivityLog');
const SupportTicketRepository = require('../models/SupportTicket');
const SystemSettingsRepository = require('../models/SystemSettings');
const ContentRepository = require('../models/Content');
const StatsRepository = require('../models/Stats');
const CompanyRepository = require('../models/Company');
const notificationService = require('../services/notification');
const catchAsync = require('../utils/catchAsync');
const AdminService = require('../services/admin');
const { jsonToCsv } = require('../utils/csvHelper');

class AdminController {
  // ─── Applications ────────────────────────────────────────────────────────────

  getAllApplications = catchAsync(async (req, res) => {
    const { search, status, page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    const { data: applications, total } = await ApplicationRepository.findAll({
      search, status,
      limit: parsedLimit,
      offset,
    });

    const [stats, grandTotal] = await Promise.all([
      ApplicationRepository.countByStatus(),
      ApplicationRepository.countAll(),
    ]);

    return ApiResponse.success(res, applications,
      {
        pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) },
        stats: { ...stats, total: grandTotal },
      }
    );
  });

  getApplicationById = catchAsync(async (req, res) => {
    const application = await ApplicationRepository.findByIdWithDetails(req.params.id);
    if (!application) return ApiResponse.notFound(res, 'Application');
    return ApiResponse.success(res, application);
  });

  updateApplicationStatus = catchAsync(async (req, res) => {
    const { status, notes, offer_details } = req.body;
    await AdminService.updateApplicationStatus(
      req.user.id, req.params.id, status, notes, offer_details,
      req.ip, req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: 'Application status updated successfully' });
  });

  updateApplicationInternalNote = catchAsync(async (req, res) => {
    await AdminService.updateApplicationInternalNote(
      req.user.id, req.params.id, req.body.note,
      req.ip, req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: 'Internal note updated successfully' });
  });

  bulkUpdateApplicationsStatus = catchAsync(async (req, res) => {
    const { ids, status, notes } = req.body;
    const count = await AdminService.bulkUpdateApplicationsStatus(
      req.user.id, ids, status, notes,
      req.ip, req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: `Updated ${count} applications successfully` });
  });

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  getDashboardStats = catchAsync(async (req, res) => {
    const data = await AdminService.getDashboardStats();
    return ApiResponse.success(res, data);
  });

  // ─── Users ──────────────────────────────────────────────────────────────────

  getAllUsers = catchAsync(async (req, res) => {
    const { 
      search, role, status, 
      start_date, end_date,  // Date range filters
      skills,               // Filter by skills
      sort_by, order,       // Sorting
      page = 1, limit = 10 
    } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    // Parse skills if it's a comma-separated string
    const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : undefined;

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

    return ApiResponse.success(res, users,
      { pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) } }
    );
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
      req.user.id, req.params.id, status,
      req.ip, req.headers['user-agent']
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
      req.user.id, req.params.id, req.body,
      req.ip, req.headers['user-agent']
    );
    if (!result) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, null, { message: 'User updated successfully' });
  });

  deleteUser = catchAsync(async (req, res) => {
    const result = await AdminService.deleteUser(
      req.user.id, req.params.id,
      req.ip, req.headers['user-agent']
    );
    if (!result) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, null, { message: 'User and related data deleted successfully' });
  });

  restoreUser = catchAsync(async (req, res) => {
    const result = await AdminService.restoreUser(
      req.user.id, req.params.id,
      req.ip, req.headers['user-agent']
    );
    if (!result) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, null, { message: 'User restored successfully' });
  });

  hardDeleteUser = catchAsync(async (req, res) => {
    const result = await AdminService.hardDeleteUser(
      req.user.id, req.params.id,
      req.ip, req.headers['user-agent']
    );
    if (!result) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, null, { message: 'User and related data permanently deleted' });
  });

  forceLogout = catchAsync(async (req, res) => {
    await AdminService.forceLogout(
      req.user.id, req.params.id,
      req.ip, req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: 'Đã đăng xuất tài khoản khỏi tất cả thiết bị' });
  });

  resetPassword = catchAsync(async (req, res) => {
    const { password } = req.body;
    if (!password) return ApiResponse.error(res, 400, 'Mật khẩu mới không được để trống');
    await AdminService.resetPassword(
      req.user.id, req.params.id, password,
      req.ip, req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: 'Đã đặt lại mật khẩu thành công' });
  });

  resendVerification = catchAsync(async (req, res) => {
    await AdminService.resendVerification(
      req.user.id, req.params.id,
      req.ip, req.headers['user-agent']
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

    return ApiResponse.success(res, logs,
      { pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) } }
    );
  });

  bulkUpdateUsersStatus = catchAsync(async (req, res) => {
    const { ids, status } = req.body;
    const count = await AdminService.bulkUpdateUsersStatus(
      req.user.id, ids, status,
      req.ip, req.headers['user-agent']
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
        req.user.id, req.params.id,
        req.ip, req.headers['user-agent']
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
        req.user.id, req.params.id,
        req.ip, req.headers['user-agent']
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
      req.user.id, req.params.id, permissions,
      req.ip, req.headers['user-agent']
    );
    if (!updated) return ApiResponse.notFound(res, 'User');
    return ApiResponse.success(res, null, { message: 'Đã cập nhật quyền thành công' });
  });

  // ─── Jobs ──────────────────────────────────────────────────────────────────

  getAllJobs = catchAsync(async (req, res) => {
    const { 
      search, status, type, flagged, 
      company_id,           // Filter by company
      category_id,         // Filter by category
      start_date, end_date, // Date range
      ai_risk,            // AI risk level
      sort_by, order,      // Sorting
      page = 1, limit = 10 
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

    return ApiResponse.success(res, jobsData,
      {
        pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) },
        stats: { total: totalJobs, pending: pendingJobs, published: publishedJobs, flagged: flaggedJobs },
      }
    );
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

    const oldStatus = job.status;

    const updated = await AdminService.updateJobStatus(
      req.user.id, req.params.id, status, rejection_reason,
      req.ip, req.headers['user-agent']
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
      req.user.id, ids, status, reason,
      req.ip, req.headers['user-agent']
    );
    return ApiResponse.success(res, null, { message: `Updated ${count} jobs successfully` });
  });

  duplicateJob = catchAsync(async (req, res) => {
    const result = await AdminService.duplicateJob(
      req.user.id, req.params.id,
      req.ip, req.headers['user-agent']
    );
    return ApiResponse.created(res, result, 'Job duplicated successfully');
  });

  updateJobFlag = catchAsync(async (req, res) => {
    const { flagged, note } = req.body;
    const updated = await AdminService.updateJobFlag(
      req.user.id, req.params.id, flagged, note,
      req.ip, req.headers['user-agent']
    );
    if (!updated) return ApiResponse.notFound(res, 'Job');
    return ApiResponse.success(res, null, {
      message: flagged ? 'Job flagged successfully' : 'Job flag removed',
    });
  });

  createJob = catchAsync(async (req, res) => {
    const result = await AdminService.createAdminJob(
      req.user.id, req.body,
      req.ip, req.headers['user-agent']
    );
    return ApiResponse.created(res, result);
  });

  updateJob = catchAsync(async (req, res) => {
    const result = await AdminService.updateAdminJob(
      req.user.id, req.params.id, req.body,
      req.ip, req.headers['user-agent']
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
    const [userGrowth, jobStats, applicationStats, weeklyActivity, userDistribution] = await Promise.all([
      StatsRepository.getUserGrowth(),
      StatsRepository.getJobStats(),
      StatsRepository.getApplicationDistribution(),
      StatsRepository.getWeeklyActivity(),
      StatsRepository.getUserDistribution(),
    ]);
    return ApiResponse.success(res, { userGrowth, jobStats, applicationStats, weeklyActivity, userDistribution });
  });

  // ─── Logs ──────────────────────────────────────────────────────────────────

  getLogs = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, search, adminId, startDate, endDate } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    const { data: logs, total } = await ActivityLogRepository.findAll({
      adminId, search, startDate, endDate,
      limit: parsedLimit,
      offset,
    });

    return ApiResponse.success(res, logs,
      { pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) } }
    );
  });

  // ─── Support Tickets ────────────────────────────────────────────────────────

  getTickets = catchAsync(async (req, res) => {
    const { status, priority, category, search, page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    const { data: tickets, total } = await SupportTicketRepository.findAll({
      status, priority, category, search,
      limit: parsedLimit,
      offset,
    });

    return ApiResponse.success(res, tickets,
      { pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) } }
    );
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
    for (const [key, value] of Object.entries(req.body)) {
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

  // ─── Content / Banners ─────────────────────────────────────────────────────

  getBanners = catchAsync(async (req, res) => {
    const banners = await ContentRepository.findAllBanners();
    return ApiResponse.success(res, banners);
  });

  createBanner = catchAsync(async (req, res) => {
    await ContentRepository.createBanner(req.body);
    return ApiResponse.success(res, null, { message: 'Banner created' });
  });

  deleteBanner = catchAsync(async (req, res) => {
    await ContentRepository.deleteBanner(req.params.id);
    return ApiResponse.success(res, null, { message: 'Banner deleted' });
  });

  // ─── Chat / AI ─────────────────────────────────────────────────────────────

  getChatStats = catchAsync(async (req, res) => {
    return ApiResponse.success(res, {
      totalSessions: 1250,
      totalUsers: 850,
      avgDuration: '5m 30s',
      satisfaction: 4.8,
      chartData: [
        { name: 'Mon', sessions: 120 }, { name: 'Tue', sessions: 132 },
        { name: 'Wed', sessions: 101 }, { name: 'Thu', sessions: 134 },
        { name: 'Fri', sessions: 90 },  { name: 'Sat', sessions: 230 },
        { name: 'Sun', sessions: 210 },
      ],
    });
  });

  getChatSessions = catchAsync(async (req, res) => {
    return ApiResponse.success(res, [
      { id: 1, user_name: 'Nguyen Van A', last_message: 'Lam sao de tao CV?', message_count: 5, created_at: new Date() },
      { id: 2, user_name: 'Tran Thi B', last_message: 'Tim viec IT o dau?', message_count: 3, created_at: new Date(Date.now() - 3600000) },
    ]);
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

    return ApiResponse.success(res, null, { message: 'Data restoration completed successfully (Simulation)' });
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

    return ApiResponse.success(res, logs,
      { pagination: { page: parseInt(page), limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) } }
    );
  });

  // ─── Exports (CSV - trả raw, không qua ApiResponse) ──────────────────────────

  exportUsers = catchAsync(async (req, res) => {
    const { data: users } = await UserRepository.findAllWithFilters({ limit: 10000, offset: 0 });
    const columns = [
      { header: 'ID', key: 'id' }, { header: 'Họ tên', key: 'full_name' },
      { header: 'Email', key: 'email' }, { header: 'Vai trò', key: 'role' },
      { header: 'Trạng thái', key: 'status' }, { header: 'Ngày tạo', key: 'created_at' },
      { header: 'Đăng nhập cuối', key: 'last_login_at' }, { header: 'Ghi chú', key: 'internal_notes' },
    ];
    const csv = jsonToCsv(users, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=users-export-${Date.now()}.csv`);
    return res.send(`\uFEFF${csv}`);
  });

  exportJobs = catchAsync(async (req, res) => {
    const { search, status, flagged } = req.query;
    const jobs = await JobRepository.findWithDetails({
      search, status: status || 'all', flagged: flagged === 'true',
      include_deleted: true, limit: 10000, offset: 0,
    });
    const jobsData = jobs.data || jobs;
    const columns = [
      { header: 'ID', key: 'id' }, { header: 'Tiêu đề', key: 'title' },
      { header: 'Công ty', key: 'company_name' }, { header: 'Danh mục', key: 'category_name' },
      { header: 'Địa điểm', key: 'location' }, { header: 'Trạng thái', key: 'status' },
      { header: 'Cảnh báo', accessor: (j) => (j.is_flagged ? 'Có' : 'Không') },
      { header: 'Số ứng tuyển', key: 'applicant_count' }, { header: 'Lượt xem', key: 'views' },
      { header: 'Ngày đăng', key: 'created_at' },
    ];
    const csv = jsonToCsv(jobsData, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=jobs-export-${Date.now()}.csv`);
    return res.send(`\uFEFF${csv}`);
  });

  exportApplications = catchAsync(async (req, res) => {
    const { data: applications } = await ApplicationRepository.findAll({ limit: 10000, offset: 0 });
    const columns = [
      { header: 'ID', key: 'id' }, { header: 'Ứng viên', key: 'candidate_name' },
      { header: 'Email', key: 'candidate_email' }, { header: 'Công việc', key: 'job_title' },
      { header: 'Công ty', key: 'company_name' }, { header: 'Trạng thái', key: 'status' },
      { header: 'Ngày nộp', key: 'applied_at' },
    ];
    const csv = jsonToCsv(applications, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=applications-export-${Date.now()}.csv`);
    return res.send(`\uFEFF${csv}`);
  });
}

module.exports = new AdminController();
