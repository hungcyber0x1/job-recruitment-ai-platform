jest.mock('../../src/services/resume-analysis', () => ({
  analyzeResume: jest.fn(),
  analyzeJobMatch: jest.fn(),
  getAnalysis: jest.fn(),
  compareWithMarket: jest.fn(),
}));

jest.mock('../../src/repositories/candidate', () => ({
  findByUserId: jest.fn(),
}));

jest.mock('../../src/repositories/system-settings', () => ({
  getBoolean: jest.fn(),
}));

const controller = require('../../src/controllers/resume-analysis');
const ResumeAnalysisService = require('../../src/services/resume-analysis');
const CandidateRepository = require('../../src/repositories/candidate');
const SystemSettingsRepository = require('../../src/repositories/system-settings');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ResumeAnalysisController feature flags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CandidateRepository.findByUserId.mockResolvedValue({ id: 11 });
  });

  test('returns 503 when ai_resume_analysis is disabled', async () => {
    SystemSettingsRepository.getBoolean.mockResolvedValue(false);
    const req = {
      user: { id: 99 },
      body: { resumeText: 'resume content' },
      file: null,
    };
    const res = createRes();

    await controller.analyzeResume(req, res);

    expect(SystemSettingsRepository.getBoolean).toHaveBeenCalledWith('ai_resume_analysis', true);
    expect(ResumeAnalysisService.analyzeResume).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Resume analysis is currently disabled by admin settings',
    });
  });

  test('returns 503 when ai_job_matching is disabled', async () => {
    SystemSettingsRepository.getBoolean.mockResolvedValue(false);
    const req = {
      user: { id: 99 },
      body: { jobId: 22 },
    };
    const res = createRes();

    await controller.analyzeJobMatch(req, res);

    expect(SystemSettingsRepository.getBoolean).toHaveBeenCalledWith('ai_job_matching', true);
    expect(ResumeAnalysisService.analyzeJobMatch).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Job matching is currently disabled by admin settings',
    });
  });
});
