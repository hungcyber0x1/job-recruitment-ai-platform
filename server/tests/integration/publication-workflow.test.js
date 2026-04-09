const request = require('supertest');

const authUsers = {
  'candidate-token': { id: 101, role: 'candidate', is_active: true },
  'admin-token': { id: 1, role: 'admin', is_active: true },
};

jest.mock('../../src/middlewares/auth', () => ({
  protect: (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = authUsers[token];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = user;
    next();
  },
  authorize:
    (...roles) =>
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      next();
    },
  authenticate: (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = authUsers[token];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = user;
    next();
  },
  isCandidate: () => (_req, _res, next) => next(),
  isEmployer: () => (_req, _res, next) => next(),
  isAdmin: () => (_req, _res, next) => next(),
}));

jest.mock('../../src/repositories/candidate', () => ({
  findByUserId: jest.fn(),
}));

jest.mock('../../src/repositories/job', () => ({
  findById: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock('../../src/repositories/application', () => ({
  findByCandidateAndJob: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../src/repositories/system-settings', () => ({
  getBoolean: jest.fn(),
}));

jest.mock('../../src/repositories/activity-log', () => ({
  create: jest.fn(),
}));

const CandidateRepository = require('../../src/repositories/candidate');
const JobRepository = require('../../src/repositories/job');
const ApplicationRepository = require('../../src/repositories/application');
const SystemSettingsRepository = require('../../src/repositories/system-settings');
const ActivityLogRepository = require('../../src/repositories/activity-log');
const app = require('../../src/app');

describe('Workflow integration: employer publish -> admin moderation -> candidate apply', () => {
  let jobStatus;
  let createdApplications;

  beforeEach(() => {
    jest.clearAllMocks();
    jobStatus = 'pending';
    createdApplications = [];

    CandidateRepository.findByUserId.mockResolvedValue({ id: 301, user_id: 101 });
    SystemSettingsRepository.getBoolean.mockResolvedValue(false);

    JobRepository.findById.mockImplementation(async (jobId) => {
      if (String(jobId) !== '501') {
        return null;
      }

      return {
        id: 501,
        title: 'Backend Engineer',
        status: jobStatus,
        employer_id: 401,
      };
    });

    JobRepository.updateStatus.mockImplementation(async (_jobId, status) => {
      jobStatus = status;
      return true;
    });

    ApplicationRepository.findByCandidateAndJob.mockImplementation(async (candidateId, jobId) => {
      return (
        createdApplications.find(
          (item) => item.candidate_id === Number(candidateId) && item.job_id === Number(jobId)
        ) || null
      );
    });

    ApplicationRepository.create.mockImplementation(async (payload) => {
      createdApplications.push({
        id: 900,
        candidate_id: Number(payload.candidate_id),
        job_id: Number(payload.job_id),
      });
      return 900;
    });

    ActivityLogRepository.create.mockResolvedValue(true);
  });

  test('candidate cannot apply while job is pending, but can apply after admin publishes it', async () => {
    const blockedApplyResponse = await request(app)
      .post('/api/applications/501')
      .set('Authorization', 'Bearer candidate-token')
      .send({
        resume_url: '/uploads/resume.pdf',
        cover_letter: 'Please review my profile.',
      });

    expect(blockedApplyResponse.status).toBe(400);
    expect(blockedApplyResponse.body.message).toBe('This job is no longer accepting applications');
    expect(ApplicationRepository.create).not.toHaveBeenCalled();

    const adminApproveResponse = await request(app)
      .patch('/api/admin/jobs/501/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'published' });

    expect(adminApproveResponse.status).toBe(200);
    expect(adminApproveResponse.body.success).toBe(true);
    expect(JobRepository.updateStatus).toHaveBeenCalledWith('501', 'published');
    expect(ActivityLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        adminCode: 1,
        action: 'UPDATE_JOB_STATUS',
        details: 'Updated job 501 status to published',
      })
    );

    const applyResponse = await request(app)
      .post('/api/applications/501')
      .set('Authorization', 'Bearer candidate-token')
      .send({
        resume_url: '/uploads/resume.pdf',
        cover_letter: 'Please review my profile.',
      });

    expect(applyResponse.status).toBe(201);
    expect(applyResponse.body.success).toBe(true);
    expect(applyResponse.body.data.id).toBe(900);
    expect(ApplicationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        candidate_id: 301,
        job_id: '501',
      })
    );
  });
});
