const request = require('supertest');

describe('Health check and database connectivity', () => {
  jest.setTimeout(20000);

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('GET /api/health returns ok when database ping succeeds', async () => {
    const release = jest.fn();
    const ping = jest.fn().mockResolvedValue();
    const getConnection = jest.fn().mockResolvedValue({ ping, release });

    jest.doMock('../../src/config/database.config', () => ({
      pool: { getConnection },
      connectDB: jest.fn(),
    }));

    const app = require('../../src/app');
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.service).toBe('gateway-server');
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('ok');
    expect(response.headers['x-request-id']).toBeDefined();
    expect(getConnection).toHaveBeenCalledTimes(1);
    expect(ping).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  test('GET /api/health returns degraded when database ping fails', async () => {
    const getConnection = jest.fn().mockRejectedValue(new Error('db down'));

    jest.doMock('../../src/config/database.config', () => ({
      pool: { getConnection },
      connectDB: jest.fn(),
    }));

    const app = require('../../src/app');
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.service).toBe('gateway-server');
    expect(response.body.status).toBe('degraded');
    expect(response.body.database).toBe('error');
    expect(getConnection).toHaveBeenCalledTimes(1);
  });

  test('GET /api/ready returns 200 when database ping succeeds', async () => {
    const release = jest.fn();
    const ping = jest.fn().mockResolvedValue();
    const getConnection = jest.fn().mockResolvedValue({ ping, release });

    jest.doMock('../../src/config/database.config', () => ({
      pool: { getConnection },
      connectDB: jest.fn(),
    }));

    const app = require('../../src/app');
    const response = await request(app).get('/api/ready');

    expect(response.status).toBe(200);
    expect(response.body.ready).toBe(true);
    expect(response.body.database).toBe('ok');
    expect(ping).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  test('GET /api/ready returns 503 when database ping fails', async () => {
    const getConnection = jest.fn().mockRejectedValue(new Error('db down'));

    jest.doMock('../../src/config/database.config', () => ({
      pool: { getConnection },
      connectDB: jest.fn(),
    }));

    const app = require('../../src/app');
    const response = await request(app).get('/api/ready');

    expect(response.status).toBe(503);
    expect(response.body.ready).toBe(false);
    expect(response.body.database).toBe('error');
  });
});
