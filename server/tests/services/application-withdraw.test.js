jest.mock('../../src/models/Application', () => ({
  findCandidateApplicationById: jest.fn(),
  deleteByCandidateId: jest.fn(),
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

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetAllMocks();
});

describe('ApplicationService.withdrawApplication', () => {
  it('moves a withdrawable application to withdrawn', async () => {
    ApplicationRepository.findCandidateApplicationById.mockResolvedValue({
      id: 3,
      job_id: 5,
      user_id: 101,
      status: 'submitted',
    });
    const updateSpy = jest
      .spyOn(ApplicationService, 'updateApplicationStatus')
      .mockResolvedValue(true);

    await expect(ApplicationService.withdrawApplication(3, 11)).resolves.toBe(true);

    expect(updateSpy).toHaveBeenCalledWith(
      3,
      null,
      101,
      'withdrawn',
      expect.any(String),
      true,
      expect.objectContaining({ candidateWithdrawalToken: expect.any(Symbol) })
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

describe('ApplicationService.deleteCandidateApplication', () => {
  it('deletes only an application owned by the candidate', async () => {
    ApplicationRepository.findCandidateApplicationById.mockResolvedValue({
      id: 7,
      candidate_id: 11,
      job_id: 5,
      status: 'submitted',
    });
    ApplicationRepository.deleteByCandidateId.mockResolvedValue(true);

    await expect(ApplicationService.deleteCandidateApplication(7, 11)).resolves.toBe(true);

    expect(ApplicationRepository.findCandidateApplicationById).toHaveBeenCalledWith(7, 11);
    expect(ApplicationRepository.deleteByCandidateId).toHaveBeenCalledWith(7, 11);
  });

  it('blocks deleting another candidate application', async () => {
    ApplicationRepository.findCandidateApplicationById.mockResolvedValue(null);

    await expect(ApplicationService.deleteCandidateApplication(7, 11)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(ApplicationRepository.deleteByCandidateId).not.toHaveBeenCalled();
  });
});
