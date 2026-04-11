const JobRepository = require('../models/Job');
const UserRepository = require('../models/User');
const ApplicationRepository = require('../models/Application');
const ActivityLogRepository = require('../models/ActivityLog');
const SupportTicketRepository = require('../models/SupportTicket');
const CompanyRepository = require('../models/Company');
const AppError = require('../utils/errorHandler');

class AdminService {
  async getDashboardStats() {
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

    return {
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
    };
  }

  async updateUserStatus(adminId, userId, status, ip, userAgent) {
    const updated = await UserRepository.updateStatus(userId, status);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: userId,
        action: 'UPDATE_USER_STATUS',
        details: `Updated user ${userId} status to ${status}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async updateJobStatus(adminId, jobId, status, ip, userAgent) {
    const valid = ['draft', 'pending', 'published', 'rejected', 'closed'].includes(status);
    if (!valid) throw new AppError('Invalid status', 400);

    const updated = await JobRepository.updateStatus(jobId, status);

    if (updated) {
      await ActivityLogRepository.create({
        adminCode: adminId,
        userId: null,
        action: 'UPDATE_JOB_STATUS',
        details: `Updated job ${jobId} status to ${status}`,
        ip,
        userAgent,
      });
    }

    return updated;
  }

  async generateBackup() {
    const users = await UserRepository.findAll();
    const jobs = await JobRepository.findAll();
    const applications = await ApplicationRepository.findAll();
    const companies = await CompanyRepository.findAllWithFilters({});

    const sanitizedUsers = users.map((u) => {
      const { password: _password, phone: _phone, address: _address, ...safeUser } = u;
      return safeUser;
    });

    return {
      timestamp: new Date().toISOString(),
      version: '1.2',
      data: {
        users: sanitizedUsers,
        jobs,
        applications,
        companies,
      },
    };
  }
}

module.exports = new AdminService();
