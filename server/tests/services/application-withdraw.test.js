jest.mock('../../src/models/Application', () => ({
  findCandidateApplicationById: jest.fn(),
}));

jest.mock('../../src/models/InterviewSchedule', () => ({}));
jest.mock('../../src/models/ApplicationOffer', () => ({}));
jest.mock('../../src/models/Job', () => ({}));
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
const ApplicationService = require('../../src/services/application');

describe('ApplicationService.withdrawApplication', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('moves a withdrawable application to withdrawn', async () => {
    ApplicationRepository.findCandidateApplicationById.mockResolvedValue({
      id: 3,
      job_id: 5,
      status: 'submitted',
    });
    const updateSpy = jest
      .spyOn(ApplicationService, 'updateApplicationStatus')
      .mockResolvedValue(true);

    await expect(ApplicationService.withdrawApplication(3, 11)).resolves.toBe(true);

    expect(updateSpy).toHaveBeenCalledWith(
      3,
      null,
      11,
      'withdrawn',
      expect.any(String),
      true,
      {}
    );
  });

  it('blocks withdrawal after interview is completed', async () => {
    ApplicationRepository.findCandidateApplicationById.mockResolvedValue({
      id: 4,
      job_id: 5,
      status: 'interviewed',
    });
    const updateSpy = jest.spyOn(ApplicationService, 'updateApplicationStatus');

    await expect(ApplicationService.withdrawApplication(4, 11)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
