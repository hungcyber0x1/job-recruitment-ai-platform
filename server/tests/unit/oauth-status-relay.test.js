const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/auth/oauth/status', () => {
  it('returns success and provider flags (local OAuth config)', async () => {
    const res = await request(app).get('/api/auth/oauth/status');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.providers).toMatchObject({
      google: expect.any(Boolean),
      facebook: expect.any(Boolean),
      github: expect.any(Boolean),
    });
  });
});
