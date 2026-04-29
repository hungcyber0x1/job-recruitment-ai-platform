const { toUserContract } = require('../../src/utils/user-contract');

describe('toUserContract', () => {
  it('preserves password capability flags while stripping sensitive fields', () => {
    const result = toUserContract({
      id: 1,
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      password: '$2b$10$hash',
      oauth_provider: 'google',
      oauth_provider_id: 'oauth-123',
    });

    expect(result.password).toBeUndefined();
    expect(result.has_password).toBe(true);
    expect(result.has_oauth).toBe(true);
    expect(result.full_name).toBe('Admin User');
  });
});
