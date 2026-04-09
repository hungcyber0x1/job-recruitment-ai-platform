jest.mock('../../src/middlewares/auth', () => ({
  protect: (req, _res, next) => {
    req.user = { id: 1, role: 'admin', is_active: true };
    next();
  },
  authorize: () => (_req, _res, next) => next(),
  authenticate: (req, _res, next) => {
    req.user = { id: 1, role: 'admin', is_active: true };
    next();
  },
  isCandidate: () => (_req, _res, next) => next(),
  isEmployer: () => (_req, _res, next) => next(),
  isAdmin: () => (_req, _res, next) => next(),
}));

jest.mock('../../src/repositories/user', () => ({
  countAll: jest.fn(),
  countWithFilters: jest.fn(),
  findAllWithFilters: jest.fn(),
  updateStatus: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../src/repositories/job', () => ({
  countAll: jest.fn(),
  countByStatus: jest.fn(),
  countFlagged: jest.fn(),
  findWithDetails: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock('../../src/repositories/application', () => ({
  countAll: jest.fn(),
  countByStatus: jest.fn(),
}));

jest.mock('../../src/repositories/support-ticket', () => ({
  countByStatus: jest.fn(),
  findAll: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock('../../src/repositories/company', () => ({
  countByVerification: jest.fn(),
  verifyCompany: jest.fn(),
  findAllWithFilters: jest.fn(),
}));

jest.mock('../../src/repositories/stats', () => ({
  getUserGrowth: jest.fn(),
  getJobStats: jest.fn(),
  getApplicationDistribution: jest.fn(),
}));

jest.mock('../../src/repositories/activity-log', () => ({
  create: jest.fn(),
}));

jest.mock('../../src/repositories/system-settings', () => ({
  findAll: jest.fn(),
  update: jest.fn(),
  getBoolean: jest.fn(),
}));

const request = require('supertest');

const UserRepository = require('../../src/repositories/user');
const JobRepository = require('../../src/repositories/job');
const ApplicationRepository = require('../../src/repositories/application');
const SupportTicketRepository = require('../../src/repositories/support-ticket');
const CompanyRepository = require('../../src/repositories/company');
const StatsRepository = require('../../src/repositories/stats');
const ActivityLogRepository = require('../../src/repositories/activity-log');
const SystemSettingsRepository = require('../../src/repositories/system-settings');
const app = require('../../src/app');

describe('Admin API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    UserRepository.countAll.mockResolvedValue(12);
    JobRepository.countAll.mockResolvedValue(7);
    ApplicationRepository.countAll.mockResolvedValue(30);
    SupportTicketRepository.countByStatus.mockResolvedValue(4);
    JobRepository.countByStatus.mockResolvedValue(2);
    JobRepository.countFlagged.mockResolvedValue(3);
    CompanyRepository.countByVerification.mockResolvedValue(5);
    ApplicationRepository.countByStatus.mockResolvedValue({
      pending: 10,
      screening: 6,
      reviewed: 5,
      shortlisted: 3,
      interviewing: 2,
      offered: 1,
      hired: 1,
      rejected: 2,
    });

    StatsRepository.getUserGrowth.mockResolvedValue([{ name: 'Jan', users: 8 }]);
    StatsRepository.getJobStats.mockResolvedValue([{ name: 'Jan', jobs: 3 }]);
    StatsRepository.getApplicationDistribution.mockResolvedValue([
      { name: 'full-time', value: 11 },
      { name: 'remote', value: 5 },
    ]);

    JobRepository.findWithDetails.mockResolvedValue({
      data: [{ id: 21, title: 'Senior Backend Engineer', is_flagged: 1 }],
      total: 1,
    });
    JobRepository.updateStatus.mockResolvedValue(true);

    CompanyRepository.verifyCompany.mockResolvedValue(true);

    SupportTicketRepository.findAll.mockResolvedValue([
      { id: 9, subject: 'Need help', status: 'open', priority: 'high' },
    ]);
    SupportTicketRepository.updateStatus.mockResolvedValue(true);

    SystemSettingsRepository.findAll.mockResolvedValue([
      { setting_key: 'ai_chatbot', setting_value: 'true' },
      { setting_key: 'company_moderation_required', setting_value: 'false' },
    ]);
    SystemSettingsRepository.update.mockResolvedValue(true);
  });

  test('GET /api/admin/stats returns moderation and pipeline stats', async () => {
    const response = await request(app).get('/api/admin/stats');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      users: 12,
      jobs: 7,
      applications: 30,
      tickets: 4,
      moderation: {
        pendingJobs: 2,
        flaggedJobs: 3,
        unverifiedCompanies: 5,
      },
      pipeline: {
        pending: 10,
        screening: 6,
        reviewed: 5,
        shortlisted: 3,
        interviewing: 2,
        offered: 1,
        hired: 1,
        rejected: 2,
      },
    });
    expect(CompanyRepository.countByVerification).toHaveBeenCalledWith(false);
  });

  test('GET /api/admin/chart-stats returns chart datasets from stats repository', async () => {
    const response = await request(app).get('/api/admin/chart-stats');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.userGrowth).toEqual([{ name: 'Jan', users: 8 }]);
    expect(response.body.data.jobStats).toEqual([{ name: 'Jan', jobs: 3 }]);
    expect(response.body.data.applicationStats).toEqual([
      { name: 'full-time', value: 11 },
      { name: 'remote', value: 5 },
    ]);
  });

  test('GET /api/admin/jobs forwards flagged filter to repository', async () => {
    const response = await request(app).get('/api/admin/jobs?flagged=true&page=2&limit=10');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(JobRepository.findWithDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'all',
        flagged: true,
        limit: 10,
        offset: 10,
      })
    );
    expect(response.body.data).toHaveLength(1);
  });

  test('PATCH /api/admin/jobs/:id/status updates job status and writes activity log', async () => {
    const response = await request(app)
      .patch('/api/admin/jobs/21/status')
      .send({ status: 'published' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(JobRepository.updateStatus).toHaveBeenCalledWith('21', 'published');
    expect(ActivityLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        adminCode: 1,
        action: 'UPDATE_JOB_STATUS',
        details: 'Updated job 21 status to published',
      })
    );
  });

  test('PATCH /api/admin/companies/:id/verify updates verification state', async () => {
    const response = await request(app)
      .patch('/api/admin/companies/8/verify')
      .send({ is_verified: true });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(CompanyRepository.verifyCompany).toHaveBeenCalledWith('8', true);
  });

  test('GET /api/admin/tickets returns filtered support tickets', async () => {
    const response = await request(app).get('/api/admin/tickets?status=open&priority=high');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(SupportTicketRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'open',
        priority: 'high',
        limit: 10,
        offset: 0,
      })
    );
    expect(response.body.data[0]).toMatchObject({ id: 9, status: 'open', priority: 'high' });
  });

  test('PATCH /api/admin/tickets/:id/status updates ticket status', async () => {
    const response = await request(app)
      .patch('/api/admin/tickets/9/status')
      .send({ status: 'resolved' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(SupportTicketRepository.updateStatus).toHaveBeenCalledWith('9', 'resolved');
  });

  test('GET /api/admin/settings returns settings as a key-value map', async () => {
    const response = await request(app).get('/api/admin/settings');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      ai_chatbot: 'true',
      company_moderation_required: 'false',
    });
  });

  test('PUT /api/admin/settings updates each setting entry', async () => {
    const response = await request(app)
      .put('/api/admin/settings')
      .send({ ai_chatbot: 'false', company_moderation_required: 'true' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(SystemSettingsRepository.update).toHaveBeenCalledWith('ai_chatbot', 'false');
    expect(SystemSettingsRepository.update).toHaveBeenCalledWith(
      'company_moderation_required',
      'true'
    );
  });
});
