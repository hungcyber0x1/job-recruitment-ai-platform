jest.mock('../../src/models/Application', () => ({
  findByIdWithDetails: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock('../../src/models/InterviewSchedule', () => ({
  create: jest.fn(),
}));

jest.mock('../../src/models/ApplicationOffer', () => ({
  upsert: jest.fn(),
  recordResponse: jest.fn(),
}));

jest.mock('../../src/models/Job', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/models/SystemSettings', () => ({}));

jest.mock('../../src/config/database.config', () => ({
  pool: {
    getConnection: jest.fn(),
    query: jest.fn(),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

const ApplicationRepository = require('../../src/models/Application');
const JobRepository = require('../../src/models/Job');
const ApplicationService = require('../../src/services/application');

const buildApplication = (overrides = {}) => ({
  id: 21,
  job_id: 44,
  candidate_id: 9,
  status: 'submitted',
  user_id: 88,
  candidate_email: 'candidate@example.com',
  candidate_name: 'Test Candidate',
  job_title: 'Frontend Engineer',
  company_name: 'Acme Corp',
  ...overrides,
});

describe('ApplicationService.updateApplicationStatus transitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    ApplicationRepository.findByIdWithDetails.mockResolvedValue(buildApplication());
    ApplicationRepository.updateStatus.mockResolvedValue(true);
    JobRepository.findById.mockResolvedValue({
      id: 44,
      company_id: 5,
      title: 'Frontend Engineer',
    });

    jest.spyOn(ApplicationService, '_sendStatusNotifications').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows moving directly from submitted to shortlisted', async () => {
    await expect(
      ApplicationService.updateApplicationStatus(21, 5, 33, 'shortlisted', null, false, {})
    ).resolves.toBe(true);

    expect(ApplicationRepository.updateStatus).toHaveBeenCalledWith(
      21,
      'shortlisted',
      33,
      null,
      {}
    );
  });
});
