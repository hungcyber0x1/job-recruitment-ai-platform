const request = require('supertest');

const authUsers = {
  'candidate-token': { id: 101, role: 'candidate', is_active: true },
  'employer-token': { id: 201, role: 'employer', is_active: true },
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

jest.mock('../../src/repositories/employer', () => ({
  findByUserId: jest.fn(),
}));

jest.mock('../../src/repositories/job', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/repositories/system-settings', () => ({
  getBoolean: jest.fn(),
}));

jest.mock('../../src/services/ai', () => ({
  generateScreeningQuestion: jest.fn(),
}));

jest.mock('../../src/repositories/application', () => ({
  create: jest.fn(),
  findByCandidateAndJob: jest.fn(),
  findByCandidateId: jest.fn(),
  findCandidateApplicationById: jest.fn(),
  findByJobId: jest.fn(),
  findById: jest.fn(),
  findByIdWithDetails: jest.fn(),
  updateStatus: jest.fn(),
  getHistory: jest.fn(),
  findAll: jest.fn(),
  getCandidateNotifications: jest.fn(),
  addHistoryNote: jest.fn(),
  getScreeningResults: jest.fn(),
  addScreeningResult: jest.fn(),
}));

const CandidateRepository = require('../../src/repositories/candidate');
const EmployerRepository = require('../../src/repositories/employer');
const JobRepository = require('../../src/repositories/job');
const SystemSettingsRepository = require('../../src/repositories/system-settings');
const ApplicationRepository = require('../../src/repositories/application');
const AIService = require('../../src/services/ai');
const app = require('../../src/app');

describe('Workflow integration: candidate apply -> employer pipeline -> admin moderation', () => {
  let applications;
  let history;
  let nextApplicationId;

  beforeEach(() => {
    jest.clearAllMocks();

    applications = [];
    history = [];
    nextApplicationId = 900;

    CandidateRepository.findByUserId.mockImplementation(async (userId) => {
      if (userId === 101) {
        return { id: 301, user_id: 101, bio: 'Backend candidate' };
      }
      return null;
    });

    EmployerRepository.findByUserId.mockImplementation(async (userId) => {
      if (userId === 201) {
        return { id: 401, user_id: 201, company_name: 'Tech Corp' };
      }
      return null;
    });

    JobRepository.findById.mockImplementation(async (jobId) => {
      if (String(jobId) === '501') {
        return {
          id: 501,
          title: 'Backend Engineer',
          status: 'published',
          employer_id: 401,
        };
      }
      return null;
    });

    SystemSettingsRepository.getBoolean.mockResolvedValue(false);
    AIService.generateScreeningQuestion.mockResolvedValue('Tell me about your backend experience.');

    ApplicationRepository.findByCandidateAndJob.mockImplementation(async (candidateId, jobId) => {
      return (
        applications.find(
          (item) => item.candidate_id === Number(candidateId) && item.job_id === Number(jobId)
        ) || null
      );
    });

    ApplicationRepository.create.mockImplementation(async (payload) => {
      const id = nextApplicationId++;
      applications.push({
        id,
        ...payload,
        candidate_id: Number(payload.candidate_id),
        job_id: Number(payload.job_id),
        status: 'pending',
        applied_at: '2026-03-13T10:00:00.000Z',
      });
      return id;
    });

    ApplicationRepository.findByCandidateId.mockImplementation(async (candidateId) => {
      return applications
        .filter((item) => item.candidate_id === Number(candidateId))
        .map((item) => ({
          ...item,
          job_title: 'Backend Engineer',
          company_name: 'Tech Corp',
          company_logo: null,
          employment_type: 'full-time',
          location: 'Ho Chi Minh City',
        }));
    });

    ApplicationRepository.findCandidateApplicationById.mockImplementation(
      async (applicationId, candidateId) => {
        const application = applications.find(
          (item) => item.id === Number(applicationId) && item.candidate_id === Number(candidateId)
        );
        if (!application) return null;
        return {
          ...application,
          job_id: 501,
          job_title: 'Backend Engineer',
          company_name: 'Tech Corp',
        };
      }
    );

    ApplicationRepository.findByJobId.mockImplementation(async (jobId) => {
      return applications
        .filter((item) => item.job_id === Number(jobId))
        .map((item) => ({
          ...item,
          first_name: 'Candidate',
          last_name: 'One',
          email: 'candidate1@gmail.com',
        }));
    });

    ApplicationRepository.findById.mockImplementation(async (applicationId) => {
      return applications.find((item) => item.id === Number(applicationId)) || null;
    });

    ApplicationRepository.findByIdWithDetails.mockImplementation(async (applicationId) => {
      const application = applications.find((item) => item.id === Number(applicationId));
      if (!application) return null;
      return {
        ...application,
        employer_id: 401,
        candidate_name: 'Candidate One',
        candidate_email: 'candidate1@gmail.com',
        job_title: 'Backend Engineer',
      };
    });

    ApplicationRepository.updateStatus.mockImplementation(
      async (applicationId, status, changedBy, notes = null) => {
        const application = applications.find((item) => item.id === Number(applicationId));
        if (!application) return false;
        const oldStatus = application.status;
        application.status = status;
        history.unshift({
          application_id: Number(applicationId),
          changed_by: changedBy,
          old_status: oldStatus,
          new_status: status,
          notes,
          created_at: '2026-03-13T10:05:00.000Z',
        });
        return true;
      }
    );

    ApplicationRepository.getHistory.mockImplementation(async (applicationId) => {
      return history.filter((item) => item.application_id === Number(applicationId));
    });

    ApplicationRepository.findAll.mockImplementation(async ({ status }) => {
      return applications
        .filter((item) => !status || item.status === status)
        .map((item) => ({
          ...item,
          candidate_name: 'Candidate One',
          candidate_email: 'candidate1@gmail.com',
          job_title: 'Backend Engineer',
          company_name: 'Tech Corp',
        }));
    });

    ApplicationRepository.getCandidateNotifications.mockResolvedValue([]);
    ApplicationRepository.addHistoryNote.mockResolvedValue({ id: 1, notes: 'note' });
    ApplicationRepository.getScreeningResults.mockResolvedValue([]);
    ApplicationRepository.addScreeningResult.mockResolvedValue(true);
  });

  test('candidate applies, employer moves pipeline, admin reviews screening, candidate sees history', async () => {
    const applyResponse = await request(app)
      .post('/api/applications/501')
      .set('Authorization', 'Bearer candidate-token')
      .send({
        resume_url: '/uploads/resume.pdf',
        cover_letter: 'I am interested in this role.',
      });

    expect(applyResponse.status).toBe(201);
    expect(applyResponse.body.success).toBe(true);
    const applicationId = applyResponse.body.data.id;
    expect(applicationId).toBe(900);

    const employerListResponse = await request(app)
      .get('/api/applications/job/501')
      .set('Authorization', 'Bearer employer-token');

    expect(employerListResponse.status).toBe(200);
    expect(employerListResponse.body.data).toHaveLength(1);
    expect(employerListResponse.body.data[0]).toMatchObject({
      id: applicationId,
      status: 'pending',
      candidate_id: 301,
    });

    const employerStatusResponse = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Authorization', 'Bearer employer-token')
      .send({ status: 'screening', notes: 'Employer sent to AI screening' });

    expect(employerStatusResponse.status).toBe(200);
    expect(employerStatusResponse.body.success).toBe(true);

    const adminQueueResponse = await request(app)
      .get('/api/admin/applications?status=screening')
      .set('Authorization', 'Bearer admin-token');

    expect(adminQueueResponse.status).toBe(200);
    expect(adminQueueResponse.body.data).toHaveLength(1);
    expect(adminQueueResponse.body.data[0]).toMatchObject({
      id: applicationId,
      status: 'screening',
      candidate_name: 'Candidate One',
    });

    const adminReviewResponse = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'reviewed', notes: 'Admin moderation reviewed screening output' });

    expect(adminReviewResponse.status).toBe(200);
    expect(adminReviewResponse.body.success).toBe(true);

    const candidateApplicationsResponse = await request(app)
      .get('/api/applications/my-applications')
      .set('Authorization', 'Bearer candidate-token');

    expect(candidateApplicationsResponse.status).toBe(200);
    expect(candidateApplicationsResponse.body.data[0]).toMatchObject({
      id: applicationId,
      status: 'reviewed',
    });

    const candidateHistoryResponse = await request(app)
      .get(`/api/applications/my-applications/${applicationId}/history`)
      .set('Authorization', 'Bearer candidate-token');

    expect(candidateHistoryResponse.status).toBe(200);
    expect(candidateHistoryResponse.body.data).toHaveLength(2);
    expect(candidateHistoryResponse.body.data[0]).toMatchObject({
      new_status: 'reviewed',
      notes: 'Admin moderation reviewed screening output',
    });
    expect(candidateHistoryResponse.body.data[1]).toMatchObject({
      old_status: 'pending',
      new_status: 'screening',
      notes: 'Employer sent to AI screening',
    });
  });

  test('candidate apply triggers AI screening automatically when ai_screening_enabled is on', async () => {
    SystemSettingsRepository.getBoolean.mockResolvedValue(true);

    const applyResponse = await request(app)
      .post('/api/applications/501')
      .set('Authorization', 'Bearer candidate-token')
      .send({
        resume_url: '/uploads/resume.pdf',
        cover_letter: 'Please review my profile.',
      });

    expect(applyResponse.status).toBe(201);
    expect(applyResponse.body.success).toBe(true);

    await new Promise((resolve) => setImmediate(resolve));

    expect(AIService.generateScreeningQuestion).toHaveBeenCalledWith(
      expect.objectContaining({ id: 501, title: 'Backend Engineer' })
    );
    expect(ApplicationRepository.addScreeningResult).toHaveBeenCalledWith(
      900,
      'Tell me about your backend experience.'
    );
    expect(ApplicationRepository.updateStatus).toHaveBeenCalledWith(
      900,
      'screening',
      1,
      'AI Screening initiated'
    );

    const candidateApplicationsResponse = await request(app)
      .get('/api/applications/my-applications')
      .set('Authorization', 'Bearer candidate-token');

    expect(candidateApplicationsResponse.status).toBe(200);
    expect(candidateApplicationsResponse.body.data[0]).toMatchObject({
      id: 900,
      status: 'screening',
    });
  });
});
