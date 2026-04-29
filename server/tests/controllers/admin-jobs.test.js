jest.mock('../../src/models/Job', () => ({
  findWithDetails: jest.fn(),
  countAll: jest.fn(),
  countByStatus: jest.fn(),
  countFlagged: jest.fn(),
}));

const AdminController = require('../../src/controllers/admin');
const JobRepository = require('../../src/models/Job');

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('AdminController.getAllJobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns jobs with moderation stats for the admin job table', async () => {
    JobRepository.findWithDetails.mockResolvedValue({
      data: [{ id: 21, title: 'Backend Engineer', status: 'pending_review' }],
      total: 1,
    });
    JobRepository.countAll.mockResolvedValue(12);
    JobRepository.countFlagged.mockResolvedValue(2);
    JobRepository.countByStatus.mockImplementation(async (status) => {
      if (status === 'pending_review') return 3;
      if (status === 'published') return 7;
      return 0;
    });

    const req = { query: {} };
    const res = createResponse();
    const next = jest.fn();

    AdminController.getAllJobs(req, res, next);
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: [{ id: 21, title: 'Backend Engineer', status: 'pending_review' }],
        meta: expect.objectContaining({
          stats: {
            total: 12,
            pending: 3,
            published: 7,
            flagged: 2,
          },
        }),
      })
    );
  });
});
