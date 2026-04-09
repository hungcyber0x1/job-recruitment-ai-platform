const AppError = require('../utils/errorHandler');
const JobRepository = require('../repositories/job');
const UserRepository = require('../repositories/user');
const ApplicationRepository = require('../repositories/application');
const ActivityLogRepository = require('../repositories/activity-log');
const SupportTicketRepository = require('../repositories/support-ticket');
const SystemSettingsRepository = require('../repositories/system-settings');
const ContentRepository = require('../repositories/content');
const StatsRepository = require('../repositories/stats');
const CompanyRepository = require('../repositories/company');

class AdminController {
  async getAllApplications(req, res, next) {
    try {
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
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const [
        usersCount,
        jobsCount,
        applicationsCount,
        openTickets,
        pendingJobs,
        flaggedJobs,
        unverifiedCompanies,
        applicationsByStatus,
      ] = await Promise.all([
        UserRepository.countAll(),
        JobRepository.countAll(),
        ApplicationRepository.countAll(),
        SupportTicketRepository.countByStatus('open'),
        JobRepository.countByStatus('pending'),
        JobRepository.countFlagged(),
        CompanyRepository.countByVerification(false),
        ApplicationRepository.countByStatus(),
      ]);

      res.json({
        success: true,
        data: {
          users: usersCount,
          jobs: jobsCount,
          applications: applicationsCount,
          tickets: openTickets,
          moderation: {
            pendingJobs,
            flaggedJobs,
            unverifiedCompanies,
          },
          pipeline: {
            pending: applicationsByStatus.pending || 0,
            screening: applicationsByStatus.screening || 0,
            reviewed: applicationsByStatus.reviewed || 0,
            shortlisted: applicationsByStatus.shortlisted || 0,
            interviewing: applicationsByStatus.interviewing || 0,
            offered: applicationsByStatus.offered || 0,
            hired: applicationsByStatus.hired || 0,
            rejected: applicationsByStatus.rejected || 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
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
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await UserRepository.findByIdWithDetails(req.params.id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const targetId = parseInt(id, 10);
      const deactivating = status !== 'active';
      if (Number.isFinite(targetId) && targetId === req.user.id && deactivating) {
        return next(
          new AppError(
            'Không thể vô hiệu hóa chính tài khoản đang đăng nhập. Nhờ admin khác bật lại hoặc cập nhật is_active trong database.',
            400
          )
        );
      }

      const updated = await UserRepository.updateStatus(id, status);

      await ActivityLogRepository.create({
        adminCode: req.user.id,
        userId: id,
        action: 'UPDATE_USER_STATUS',
        details: `Updated user ${id} status to ${status}`,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({
        success: true,
        message: 'User status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllJobs(req, res, next) {
    try {
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
    } catch (error) {
      next(error);
    }
  }

  async getJobById(req, res, next) {
    try {
      const job = await JobRepository.findByIdWithDetails(req.params.id, { includeDeleted: true });

      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  async getCompanyById(req, res, next) {
    try {
      const company = await CompanyRepository.findByIdWithDetails(req.params.id);

      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      res.json({ success: true, data: company });
    } catch (error) {
      next(error);
    }
  }

  async getChartStats(req, res, next) {
    try {
      const [userGrowth, jobStats, applicationStats] = await Promise.all([
        StatsRepository.getUserGrowth(),
        StatsRepository.getJobStats(),
        StatsRepository.getApplicationDistribution(),
      ]);

      res.json({
        success: true,
        data: {
          userGrowth,
          jobStats,
          applicationStats,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateJobStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const valid = ['draft', 'pending', 'published', 'rejected', 'closed'].includes(status);
      if (!valid) return res.status(400).json({ success: false, message: 'Invalid status' });

      const updated = await JobRepository.updateStatus(id, status);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      await ActivityLogRepository.create({
        adminCode: req.user.id,
        userId: null,
        action: 'UPDATE_JOB_STATUS',
        details: `Updated job ${id} status to ${status}`,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: `Job status updated to ${status}`,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteJob(req, res, next) {
    try {
      const { id } = req.params;
      await JobRepository.delete(id);
      res.json({ success: true, message: 'Job deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      const logs = await ActivityLogRepository.findAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  async getTickets(req, res, next) {
    try {
      const { status, priority, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      const tickets = await SupportTicketRepository.findAll({
        status,
        priority,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
      res.json({ success: true, data: tickets });
    } catch (error) {
      next(error);
    }
  }

  async updateTicketStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await SupportTicketRepository.updateStatus(id, status);
      res.json({ success: true, message: 'Updated' });
    } catch (error) {
      next(error);
    }
  }

  async getTicketMessages(req, res, next) {
    try {
      const { id } = req.params;
      const messages = await SupportTicketRepository.getMessages(id);
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  async replyToTicket(req, res, next) {
    try {
      const { id } = req.params;
      const { message, isInternal } = req.body;
      await SupportTicketRepository.addMessage({
        ticketId: id,
        senderId: req.user.id,
        message,
        isInternal,
      });
      res.json({ success: true, message: 'Reply sent' });
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req, res, next) {
    try {
      const settings = await SystemSettingsRepository.findAll();
      const settingsMap = {};
      settings.forEach((s) => (settingsMap[s.setting_key] = s.setting_value));
      res.json({ success: true, data: settingsMap });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = req.body;
      for (const [key, value] of Object.entries(settings)) {
        await SystemSettingsRepository.update(key, value);
      }
      res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
      next(error);
    }
  }

  async getBanners(req, res, next) {
    try {
      const banners = await ContentRepository.findAllBanners();
      res.json({ success: true, data: banners });
    } catch (error) {
      next(error);
    }
  }

  async createBanner(req, res, next) {
    try {
      await ContentRepository.createBanner(req.body);
      res.json({ success: true, message: 'Banner created' });
    } catch (error) {
      next(error);
    }
  }

  async deleteBanner(req, res, next) {
    try {
      const { id } = req.params;
      await ContentRepository.deleteBanner(id);
      res.json({ success: true, message: 'Banner deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getChatStats(req, res, next) {
    try {
      const stats = {
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
      };
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getChatSessions(req, res, next) {
    try {
      const sessions = [
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
        {
          id: 3,
          user_name: 'Le Van C',
          last_message: 'Cam on chatbot',
          message_count: 12,
          created_at: new Date(Date.now() - 7200000),
        },
      ];
      res.json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  }

  async backupData(req, res, next) {
    try {
      const users = await UserRepository.findAll();
      const jobs = await JobRepository.findAll();
      const applications = await ApplicationRepository.findAll();
      const companies = await require('../repositories/company').findAllWithFilters({});

      const sanitizedUsers = users.map((u) => {
        const { password: _password, phone: _phone, address: _address, ...safeUser } = u;
        return safeUser;
      });

      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.1',
        data: {
          users: sanitizedUsers,
          jobs,
          applications,
          companies,
        },
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=backup-${Date.now()}.json`);
      res.json(backup);
    } catch (error) {
      next(error);
    }
  }

  async restoreData(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No backup file uploaded' });
      }

      const fs = require('fs').promises;
      let backupBuffer = req.file.buffer;

      if (!backupBuffer && req.file.path) {
        backupBuffer = await fs.readFile(req.file.path);
      }

      if (!backupBuffer) {
        return res.status(400).json({ success: false, message: 'Invalid backup file' });
      }

      const backupText = backupBuffer.toString('utf8').replace(/^\uFEFF/, '');
      let backupData;
      try {
        backupData = JSON.parse(backupText);
      } catch {
        if (req.file.path) {
          await fs.unlink(req.file.path).catch(() => null);
        }
        return res.status(400).json({ success: false, message: 'Invalid JSON backup file' });
      }

      if (req.file.path) {
        await fs.unlink(req.file.path).catch(() => null);
      }

      if (!backupData.data) {
        return res.status(400).json({ success: false, message: 'Invalid backup format' });
      }

      await ActivityLogRepository.create({
        adminCode: req.user.id,
        userId: null,
        action: 'SYSTEM_RESTORE',
        details: `Restored system data from backup version ${backupData.version || 'unknown'}`,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ success: true, message: 'Data restoration completed successfully (Simulation)' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
