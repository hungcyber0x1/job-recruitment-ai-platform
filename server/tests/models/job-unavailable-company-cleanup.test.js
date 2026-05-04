jest.mock('../../src/config/database.config', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

const { pool } = require('../../src/config/database.config');
const JobRepository = require('../../src/models/Job');

describe('JobRepository unavailable company cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('soft-deletes jobs whose company profile no longer exists', async () => {
    pool.query.mockResolvedValue([{ affectedRows: 2 }]);

    await expect(JobRepository.cleanupUnavailableCompanyJobs()).resolves.toBe(2);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('LEFT JOIN company_profiles cp ON j.company_id = cp.id')
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('cp.id IS NULL OR cp.deleted_at IS NOT NULL')
    );
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("j.status = 'closed'"));
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('j.deleted_at IS NULL'));
  });

  it('does not return direct job lookups when the company is unavailable', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[]]);

    await expect(JobRepository.findById(10)).resolves.toBeUndefined();

    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('LEFT JOIN company_profiles cp ON j.company_id = cp.id')
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('JOIN company_profiles cp ON j.company_id = cp.id'),
      [10]
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('cp.deleted_at IS NULL'),
      [10]
    );
  });

  it('runs cleanup before returning a public job detail', async () => {
    pool.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ id: 10, title: 'Backend Engineer', company_id: 3 }]]);

    await expect(JobRepository.findByIdWithDetails(10, { publicOnly: true })).resolves.toEqual(
      expect.objectContaining({ id: 10 })
    );

    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('LEFT JOIN company_profiles cp ON j.company_id = cp.id')
    );
    expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining('WHERE j.id = ?'), [10]);
  });
});
