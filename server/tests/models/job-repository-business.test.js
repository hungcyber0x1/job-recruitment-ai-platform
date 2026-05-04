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

describe('JobRepository business filters and mutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds text location filters across job, taxonomy, address, and company location', () => {
    const { whereSql, params } = JobRepository.buildFilterClauses({
      publicOnly: true,
      location: '  Hà Nội  ',
    });

    expect(whereSql).toContain('j.location LIKE ?');
    expect(whereSql).toContain('j.address LIKE ?');
    expect(whereSql).toContain('l.name LIKE ?');
    expect(whereSql).toContain('cp.location LIKE ?');
    expect(params).toEqual(['%Hà Nội%', '%Hà Nội%', '%Hà Nội%', '%Hà Nội%']);
  });

  it('keeps location joins in both list and count queries when filtering by location text', async () => {
    pool.query
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([[{ id: 1, title: 'Backend Engineer' }]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    await expect(
      JobRepository.findWithDetails({ publicOnly: true, location: 'Đà Nẵng', limit: 10 })
    ).resolves.toEqual({ data: [{ id: 1, title: 'Backend Engineer' }], total: 1 });

    expect(pool.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('LEFT JOIN locations l ON j.location_id = l.id'),
      ['%Đà Nẵng%', '%Đà Nẵng%', '%Đà Nẵng%', '%Đà Nẵng%', 10]
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('LEFT JOIN locations l ON j.location_id = l.id'),
      ['%Đà Nẵng%', '%Đà Nẵng%', '%Đà Nẵng%', '%Đà Nẵng%']
    );
  });

  it('preserves the original published_at timestamp when publishing a job again', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await expect(JobRepository.updateStatus(42, 'published')).resolves.toBe(true);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('published_at = COALESCE(published_at, NOW())'),
      ['published', 42]
    );
    expect(pool.query.mock.calls[0][0]).toContain('rejection_reason = NULL');
  });

  it('preserves published_at for bulk publish operations', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 2 }]);

    await expect(JobRepository.bulkUpdateStatus([10, 11], 'published')).resolves.toBe(2);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('published_at = COALESCE(published_at, NOW())'),
      ['published', [10, 11]]
    );
    expect(pool.query.mock.calls[0][0]).toContain('rejection_reason = NULL');
  });

  it('duplicates a job using the numeric insert id returned by BaseRepository.create', async () => {
    pool.query
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([
        [
          {
            id: 7,
            company_id: 3,
            recruiter_id: 9,
            title: 'Backend Engineer',
            slug: 'backend-engineer',
            description: 'Build APIs',
            status: 'published',
            views: 12,
            applications_count: 4,
            created_at: '2026-01-01',
            updated_at: '2026-01-02',
          },
        ],
      ])
      .mockResolvedValueOnce([{ insertId: 99 }])
      .mockResolvedValueOnce([[{ skill_id: 5, is_required: 1 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([[{ id: 99, title: 'Backend Engineer (Copy)' }]]);

    await expect(JobRepository.duplicate(7)).resolves.toEqual({
      id: 99,
      title: 'Backend Engineer (Copy)',
    });

    expect(pool.query).toHaveBeenNthCalledWith(
      5,
      'INSERT INTO job_skills (job_id, skill_id, is_required) VALUES ?',
      [[[99, 5, 1]]]
    );
    expect(pool.query).toHaveBeenNthCalledWith(7, expect.stringContaining('WHERE j.id = ?'), [99]);
  });
});
