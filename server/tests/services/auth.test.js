jest.mock('../../src/models/User', () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  createAuthUser: jest.fn(),
  updatePassword: jest.fn(),
  recordSuccessfulLogin: jest.fn(),
  unlinkOAuth: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'signed-jwt-token'),
}));

jest.mock('../../src/config/jwt.config', () => ({
  secret: 'test-secret',
  expiresIn: '1h',
}));

jest.mock('../../src/config/database.config', () => ({
  pool: {
    getConnection: jest.fn(),
  },
}));

jest.mock('../../src/utils/user-contract', () => ({
  toUserContract: jest.fn((user) => ({
    id: user.id,
    role: user.role,
    status: user.status,
    email: user.email,
  })),
}));

const UserRepository = require('../../src/models/User');
const bcrypt = require('bcryptjs');
const AuthService = require('../../src/services/auth');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not issue a token for pending recruiter accounts', () => {
    expect(
      AuthService.shouldIssueToken({
        id: 101,
        role: 'recruiter',
        status: 'pending',
      })
    ).toBe(false);
  });

  it('does not issue a token for pending_verification recruiter accounts', () => {
    expect(
      AuthService.shouldIssueToken({
        id: 102,
        role: 'recruiter',
        status: 'pending_verification',
      })
    ).toBe(false);
  });

  it('blocks pending recruiters from logging in', async () => {
    UserRepository.findByEmail.mockResolvedValue({
      id: 8,
      email: 'pending@company.test',
      role: 'recruiter',
      status: 'pending', // Chỉ dùng status, không cần is_active
      password: 'hashed-password',
    });

    await expect(AuthService.login('pending@company.test', 'secret123')).rejects.toMatchObject({
      statusCode: 403,
      code: 'RECRUITER_PENDING_APPROVAL',
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('returns a token for active local accounts with valid credentials', async () => {
    UserRepository.findByEmail.mockResolvedValue({
      id: 12,
      email: 'candidate@test.com',
      role: 'candidate',
      status: 'active', // Chỉ dùng status, không cần is_active
      password: 'hashed-password',
    });
    bcrypt.compare.mockResolvedValue(true);
    UserRepository.recordSuccessfulLogin.mockResolvedValue(true);

    const result = await AuthService.login('candidate@test.com', 'secret123');

    expect(result.token).toBe('signed-jwt-token');
    expect(result.user).toMatchObject({
      id: 12,
      role: 'candidate',
      status: 'active',
      email: 'candidate@test.com',
      has_local_password: true,
    });
    expect(UserRepository.recordSuccessfulLogin).toHaveBeenCalledWith(12);
  });

  it('registers local users through schema-compatible repository helper', async () => {
    const connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn(),
    };
    const { pool } = require('../../src/config/database.config');
    pool.getConnection.mockResolvedValue(connection);
    UserRepository.findByEmail.mockResolvedValue(null);
    UserRepository.createAuthUser.mockResolvedValue({ insertId: 33, status: 'active' });
    UserRepository.findById.mockResolvedValue({
      id: 33,
      email: 'new-candidate@test.com',
      role: 'candidate',
      status: 'active',
      password: 'hashed-password',
    });
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashed-password');

    const result = await AuthService.register({
      email: 'new-candidate@test.com',
      password: 'Password@123',
      role: 'candidate',
      first_name: 'Lan',
      last_name: 'Nguyen',
    });

    expect(UserRepository.createAuthUser).toHaveBeenCalledWith(connection, {
      email: 'new-candidate@test.com',
      passwordHash: 'hashed-password',
      role: 'candidate',
      firstName: 'Lan',
      lastName: 'Nguyen',
      status: 'active',
    });
    expect(connection.commit).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 33,
      role: 'candidate',
      status: 'active',
      has_local_password: true,
    });
  });
});
