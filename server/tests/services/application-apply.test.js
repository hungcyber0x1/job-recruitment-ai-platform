jest.mock('../../src/models/Application', () => ({}));
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

const { pool } = require('../../src/config/database.config');
const ApplicationService = require('../../src/services/application');

const isActiveJobLookup = (sql) =>
  sql.includes('FROM jobs j') &&
  sql.includes('JOIN company_profiles cp ON j.company_id = cp.id') &&
  sql.includes('cp.deleted_at IS NULL');

const buildConnection = () => ({
  beginTransaction: jest.fn(),
  query: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
});

describe('ApplicationService.applyToJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ApplicationService, 'triggerAIScreening').mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows the same candidate to apply to different jobs from different companies', async () => {
    const connection = buildConnection();
    pool.getConnection.mockResolvedValue(connection);

    connection.query.mockImplementation(async (sql, params) => {
      if (isActiveJobLookup(sql)) {
        if (Number(params[0]) === 101) {
          return [[{ id: 101, status: 'published', company_id: 11, deadline: null }]];
        }
        if (Number(params[0]) === 202) {
          return [[{ id: 202, status: 'published', company_id: 22, deadline: null }]];
        }
      }

      if (sql === 'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?') {
        return [[]];
      }

      if (sql.includes('INSERT INTO applications')) {
        if (Number(params[1]) === 101) {
          return [{ insertId: 9001 }];
        }
        if (Number(params[1]) === 202) {
          return [{ insertId: 9002 }];
        }
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    await expect(
      ApplicationService.applyToJob(7, 101, { cover_letter: 'First application' })
    ).resolves.toBe(9001);

    await expect(
      ApplicationService.applyToJob(7, 202, { cover_letter: 'Second application' })
    ).resolves.toBe(9002);

    expect(connection.query).toHaveBeenCalledWith(
      'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?',
      [7, 101]
    );
    expect(connection.query).toHaveBeenCalledWith(
      'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?',
      [7, 202]
    );
    expect(connection.commit).toHaveBeenCalledTimes(2);
    expect(connection.rollback).not.toHaveBeenCalled();
  });

  it('blocks duplicate applications to the same job before inserting', async () => {
    const connection = buildConnection();
    pool.getConnection.mockResolvedValue(connection);

    connection.query.mockImplementation(async (sql) => {
      if (isActiveJobLookup(sql)) {
        return [[{ id: 101, status: 'published', company_id: 11, deadline: null }]];
      }

      if (sql === 'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?') {
        return [[{ id: 55 }]];
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    await expect(ApplicationService.applyToJob(7, 101)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Bạn đã ứng tuyển tin tuyển dụng này',
    });

    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });

  it('normalizes duplicate key errors from the database into a friendly validation error', async () => {
    const connection = buildConnection();
    pool.getConnection.mockResolvedValue(connection);

    connection.query.mockImplementation(async (sql) => {
      if (isActiveJobLookup(sql)) {
        return [[{ id: 101, status: 'published', company_id: 11, deadline: null }]];
      }

      if (sql === 'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?') {
        return [[]];
      }

      if (sql.includes('INSERT INTO applications')) {
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        throw error;
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    await expect(ApplicationService.applyToJob(7, 101, {})).rejects.toMatchObject({
      statusCode: 400,
      message: 'Bạn đã ứng tuyển tin tuyển dụng này',
    });

    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });

  it('blocks applications to jobs whose company has been deleted', async () => {
    const connection = buildConnection();
    pool.getConnection.mockResolvedValue(connection);

    connection.query.mockImplementation(async (sql) => {
      if (isActiveJobLookup(sql)) {
        return [[]];
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    await expect(ApplicationService.applyToJob(7, 101)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Không tìm thấy tin tuyển dụng',
    });

    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });

  it('rejects non-positive and partially numeric ids before opening a transaction', async () => {
    await expect(ApplicationService.applyToJob('7abc', 101)).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(ApplicationService.applyToJob(7, 0)).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  it('trims empty optional cover letter and resume url before inserting', async () => {
    const connection = buildConnection();
    pool.getConnection.mockResolvedValue(connection);

    connection.query.mockImplementation(async (sql) => {
      if (isActiveJobLookup(sql)) {
        return [[{ id: 101, status: 'published', company_id: 11, deadline: null }]];
      }

      if (sql === 'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?') {
        return [[]];
      }

      if (sql.includes('INSERT INTO applications')) {
        return [{ insertId: 9003 }];
      }

      throw new Error(`Unexpected query: ${sql}`);
    });

    await expect(
      ApplicationService.applyToJob(7, 101, { cover_letter: '   ', resume_url: '   ' })
    ).resolves.toBe(9003);

    expect(connection.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO applications'),
      [7, 101, null, null]
    );
  });
});
