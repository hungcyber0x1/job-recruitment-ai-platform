jest.mock('../../src/models/Application', () => ({
  findByIdWithDetails: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock('../../src/models/InterviewSchedule', () => ({
  create: jest.fn(),
}));

jest.mock('../../src/models/ApplicationOffer', () => ({}));

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
const InterviewScheduleRepository = require('../../src/models/InterviewSchedule');
const JobRepository = require('../../src/models/Job');
const ApplicationService = require('../../src/services/application');

const buildApplication = (overrides = {}) => ({
  id: 12,
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

const buildJob = (overrides = {}) => ({
  id: 44,
  company_id: 5,
  title: 'Frontend Engineer',
  ...overrides,
});

describe('ApplicationService.updateApplicationStatus interview scheduling', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    ApplicationRepository.findByIdWithDetails.mockResolvedValue(buildApplication());
    ApplicationRepository.updateStatus.mockResolvedValue(true);
    InterviewScheduleRepository.create.mockResolvedValue({ id: 101 });
    JobRepository.findById.mockResolvedValue(buildJob());

    jest.spyOn(ApplicationService, '_sendStatusNotifications').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows scheduling an interview directly from submitted', async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await expect(
      ApplicationService.updateApplicationStatus(12, 5, 33, 'interview_scheduled', null, false, {
        scheduled_at: scheduledAt,
        interview_type: 'online',
        duration_minutes: 45,
        location: 'https://meet.example.com/room',
        candidate_note: 'Join 10 minutes early',
      })
    ).resolves.toBe(true);

    expect(InterviewScheduleRepository.create).toHaveBeenCalledWith({
      application_id: 12,
      interview_type: 'online',
      scheduled_at: scheduledAt,
      duration_minutes: 45,
      location: 'https://meet.example.com/room',
      candidate_note: 'Join 10 minutes early',
      interviewer_note: null,
      created_by: 33,
    });

    expect(ApplicationRepository.updateStatus).toHaveBeenCalledWith(
      12,
      'interview_scheduled',
      33,
      null,
      {}
    );
  });

  it('allows rescheduling when the application is already interview_scheduled', async () => {
    const scheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    ApplicationRepository.findByIdWithDetails.mockResolvedValue(
      buildApplication({ status: 'interview_scheduled' })
    );

    await expect(
      ApplicationService.updateApplicationStatus(
        12,
        5,
        33,
        'interview_scheduled',
        'Rescheduled round 2',
        false,
        {
          scheduled_at: scheduledAt,
          interview_type: 'offline',
          duration_minutes: 60,
          location: 'Floor 5 meeting room',
        }
      )
    ).resolves.toBe(true);

    expect(InterviewScheduleRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        application_id: 12,
        interview_type: 'offline',
        scheduled_at: scheduledAt,
        duration_minutes: 60,
        location: 'Floor 5 meeting room',
        created_by: 33,
      })
    );

    expect(ApplicationRepository.updateStatus).toHaveBeenCalledWith(
      12,
      'interview_scheduled',
      33,
      'Rescheduled round 2',
      {}
    );
  });

  it('rejects interview schedules in the past', async () => {
    const scheduledAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    await expect(
      ApplicationService.updateApplicationStatus(12, 5, 33, 'interview_scheduled', null, false, {
        scheduled_at: scheduledAt,
        interview_type: 'phone',
        duration_minutes: 30,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Vui lòng chọn thời gian phỏng vấn trong tương lai',
    });

    expect(InterviewScheduleRepository.create).not.toHaveBeenCalled();
    expect(ApplicationRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('rejects unsupported interview types before creating a schedule', async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await expect(
      ApplicationService.updateApplicationStatus(12, 5, 33, 'interview_scheduled', null, false, {
        scheduled_at: scheduledAt,
        interview_type: 'onsite',
        duration_minutes: 60,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Hình thức phỏng vấn phải là online, offline hoặc phone',
    });

    expect(InterviewScheduleRepository.create).not.toHaveBeenCalled();
    expect(ApplicationRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('rejects invalid interview durations before creating a schedule', async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await expect(
      ApplicationService.updateApplicationStatus(12, 5, 33, 'interview_scheduled', null, false, {
        scheduled_at: scheduledAt,
        interview_type: 'online',
        duration_minutes: 5,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Thời lượng phỏng vấn phải từ 15 đến 480 phút',
    });

    expect(InterviewScheduleRepository.create).not.toHaveBeenCalled();
    expect(ApplicationRepository.updateStatus).not.toHaveBeenCalled();
  });
});
