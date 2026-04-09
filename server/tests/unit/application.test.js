jest.mock('../../src/repositories/application', () => ({
  findByCandidateAndJob: jest.fn(),
  create: jest.fn(),
  findByIdWithDetails: jest.fn(),
  addScreeningResult: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock('../../src/repositories/job', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/repositories/system-settings', () => ({
  getBoolean: jest.fn(),
}));

const ApplicationRepository = require('../../src/repositories/application');
const JobRepository = require('../../src/repositories/job');
const SystemSettingsRepository = require('../../src/repositories/system-settings');
const ApplicationService = require('../../src/services/application');

describe('ApplicationService feature flags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    JobRepository.findById.mockResolvedValue({ id: 7, status: 'published' });
    ApplicationRepository.findByCandidateAndJob.mockResolvedValue(null);
    ApplicationRepository.create.mockResolvedValue(101);
    SystemSettingsRepository.getBoolean.mockResolvedValue(true);
  });

  test('does not trigger AI screening when ai_screening_enabled is false', async () => {
    SystemSettingsRepository.getBoolean.mockResolvedValue(false);
    const triggerSpy = jest.spyOn(ApplicationService, 'triggerAIScreening').mockResolvedValue();

    const applicationId = await ApplicationService.applyToJob(5, 7, {
      resume_url: '/uploads/resume.pdf',
      cover_letter: 'Cover letter',
    });

    expect(applicationId).toBe(101);
    expect(SystemSettingsRepository.getBoolean).toHaveBeenCalledWith('ai_screening_enabled', true);
    expect(triggerSpy).not.toHaveBeenCalled();
  });

  test('triggers AI screening when ai_screening_enabled is true', async () => {
    const triggerSpy = jest.spyOn(ApplicationService, 'triggerAIScreening').mockResolvedValue();

    await ApplicationService.applyToJob(5, 7, {
      resume_url: '/uploads/resume.pdf',
      cover_letter: 'Cover letter',
    });

    expect(triggerSpy).toHaveBeenCalledWith(101);
  });

  test('rejects applications to unpublished jobs before checking feature flags', async () => {
    JobRepository.findById.mockResolvedValue({ id: 7, status: 'pending' });

    await expect(
      ApplicationService.applyToJob(5, 7, {
        resume_url: '/uploads/resume.pdf',
        cover_letter: 'Cover letter',
      })
    ).rejects.toMatchObject({
      message: 'This job is no longer accepting applications',
      statusCode: 400,
    });

    expect(SystemSettingsRepository.getBoolean).not.toHaveBeenCalled();
  });
});
