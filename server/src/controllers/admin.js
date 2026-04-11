const AppError = require('../utils/errorHandler');
const JobRepository = require('../models/Job');
const UserRepository = require('../models/User');
const ApplicationRepository = require('../models/Application');
const ActivityLogRepository = require('../models/ActivityLog');
const SupportTicketRepository = require('../models/SupportTicket');
const SystemSettingsRepository = require('../models/SystemSettings');
const ContentRepository = require('../models/Content');
const StatsRepository = require('../models/Stats');
const CompanyRepository = require('../models/Company');
const catchAsync = require('../utils/catchAsync');
const AdminService = require('../services/admin');

class AdminController {
  getAllApplications = catchAsync(async (req, res) => {
    const { search, status, page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);
    const offset = (parseInt(page) - 1) * parsedLimit;

    const applications = await ApplicationRepository.findAll({
      search,
      status,
      limit: parsedLimit,
      offset,
    });

    res.json({
      success: true,
      data: applications,
    });
  });

  getDashboardStats = catchAsync(async (req, res) => {
    const data = await AdminService.getDashboardStats();
    res.json({ success: true, data });
  });

  getAllUsers = catchAsync(async (req, res) => {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);
    const offset = (parseInt(page) - 1) * parsedLimit;

    const users = await UserRepository.findAllWithFilters({
      search,
      role,
      status,
      limit: parsedLimit,
      offset,
    });
    const total = await UserRepository.countWithFilters({ search, role, status });

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  getUserById = catchAsync(async (req, res) => {
    const user = await UserRepository.findByIdWithDetails(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  });

  updateUserStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const targetId = parseInt(id, 10);
    const deactivating = status !== 'active';
    if (Number.isFinite(targetId) && targetId === req.user.id && deactivating) {
      return next(new AppError('Không thể vô hiệu hóa chính tài khoản đang đăng nhập.', 400));
    }

    const updated = await AdminService.updateUserStatus(
      req.user.id,
      id,
      status,
      req.ip,
      req.headers['user-agent']
    );
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User status updated successfully' });
  });

  getAllJobs = catchAsync(async (req, res) => {
    const { search, status, type, flagged, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const jobs = await JobRepository.findWithDetails({
      search,
      status: status || 'all',
      type,
      flagged: flagged === 'true',
      include_deleted: true,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: jobs.data || jobs,
      pagination: jobs.total !== undefined ? { total: jobs.total } : undefined,
    });
  });

  getJobById = catchAsync(async (req, res) => {
    const job = await JobRepository.findByIdWithDetails(req.params.id, { includeDeleted: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  });

  getCompanyById = catchAsync(async (req, res) => {
    const company = await CompanyRepository.findByIdWithDetails(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company });
  });

  getChartStats = catchAsync(async (req, res) => {
    const [userGrowth, jobStats, applicationStats] = await Promise.all([
      StatsRepository.getUserGrowth(),
      StatsRepository.getJobStats(),
      StatsRepository.getApplicationDistribution(),
    ]);

    res.json({
      success: true,
      data: { userGrowth, jobStats, applicationStats },
    });
  });

  updateJobStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await AdminService.updateJobStatus(
      req.user.id,
      id,
      status,
      req.ip,
      req.headers['user-agent']
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Job not found' });

    res.json({ success: true, message: `Job status updated to ${status}` });
  });

  deleteJob = catchAsync(async (req, res) => {
    await JobRepository.delete(req.params.id);
    res.json({ success: true, message: 'Job deleted successfully' });
  });

  getLogs = catchAsync(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const logs = await ActivityLogRepository.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json({ success: true, data: logs });
  });

  getTickets = catchAsync(async (req, res) => {
    const { status, priority, page = 1, limit = 10 } = req.query;
    const tickets = await SupportTicketRepository.findAll({
      status,
      priority,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    res.json({ success: true, data: tickets });
  });

  updateTicketStatus = catchAsync(async (req, res) => {
    await SupportTicketRepository.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, message: 'Updated' });
  });

  getTicketMessages = catchAsync(async (req, res) => {
    const messages = await SupportTicketRepository.getMessages(req.params.id);
    res.json({ success: true, data: messages });
  });

  replyToTicket = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { message, isInternal } = req.body;
    await SupportTicketRepository.addMessage({
      ticketId: id,
      senderId: req.user.id,
      message,
      isInternal,
    });
    res.json({ success: true, message: 'Reply sent' });
  });

  getSettings = catchAsync(async (req, res) => {
    const settings = await SystemSettingsRepository.findAll();
    const settingsMap = {};
    settings.forEach((s) => (settingsMap[s.setting_key] = s.setting_value));
    res.json({ success: true, data: settingsMap });
  });

  updateSettings = catchAsync(async (req, res) => {
    for (const [key, value] of Object.entries(req.body)) {
      await SystemSettingsRepository.update(key, value);
    }
    res.json({ success: true, message: 'Settings updated' });
  });

  getBanners = catchAsync(async (req, res) => {
    const banners = await ContentRepository.findAllBanners();
    res.json({ success: true, data: banners });
  });

  createBanner = catchAsync(async (req, res) => {
    await ContentRepository.createBanner(req.body);
    res.json({ success: true, message: 'Banner created' });
  });

  deleteBanner = catchAsync(async (req, res) => {
    await ContentRepository.deleteBanner(req.params.id);
    res.json({ success: true, message: 'Banner deleted' });
  });

  getChatStats = catchAsync(async (req, res) => {
    // Placeholder stats
    res.json({
      success: true,
      data: {
        totalSessions: 1250,
        totalUsers: 850,
        avgDuration: '5m 30s',
        satisfaction: 4.8,
        chartData: [
          { name: 'Mon', sessions: 120 },
          { name: 'Tue', sessions: 132 },
          { name: 'Wed', sessions: 101 },
          { name: 'Thu', sessions: 134 },
          { name: 'Fri', sessions: 90 },
          { name: 'Sat', sessions: 230 },
          { name: 'Sun', sessions: 210 },
        ],
      },
    });
  });

  getChatSessions = catchAsync(async (req, res) => {
    // Placeholder sessions
    res.json({
      success: true,
      data: [
        {
          id: 1,
          user_name: 'Nguyen Van A',
          last_message: 'Lam sao de tao CV?',
          message_count: 5,
          created_at: new Date(),
        },
        {
          id: 2,
          user_name: 'Tran Thi B',
          last_message: 'Tim viec IT o dau?',
          message_count: 3,
          created_at: new Date(Date.now() - 3600000),
        },
      ],
    });
  });

  backupData = catchAsync(async (req, res) => {
    const backup = await AdminService.generateBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${Date.now()}.json`);
    res.json(backup);
  });

  restoreData = catchAsync(async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No backup file uploaded' });
    }

    const fs = require('fs').promises;
    let backupBuffer = req.file.buffer || (await fs.readFile(req.file.path));

    if (!backupBuffer)
      return res.status(400).json({ success: false, message: 'Invalid backup file' });

    const backupText = backupBuffer.toString('utf8').replace(/^\uFEFF/, '');
    let backupData;
    try {
      backupData = JSON.parse(backupText);
    } catch {
      if (req.file.path) await fs.unlink(req.file.path).catch(() => null);
      return res.status(400).json({ success: false, message: 'Invalid JSON backup file' });
    }

    if (req.file.path) await fs.unlink(req.file.path).catch(() => null);
    if (!backupData.data)
      return res.status(400).json({ success: false, message: 'Invalid backup format' });

    await ActivityLogRepository.create({
      adminCode: req.user.id,
      userId: null,
      action: 'SYSTEM_RESTORE',
      details: `Restored system data from backup version ${backupData.version || 'unknown'}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Data restoration completed successfully (Simulation)' });
  });
}

module.exports = new AdminController();
