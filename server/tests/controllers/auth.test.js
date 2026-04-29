jest.mock('../../src/services/auth', () => ({
  register: jest.fn(),
  login: jest.fn(),
  shouldIssueToken: jest.fn(),
  generateToken: jest.fn(),
  updatePassword: jest.fn(),
  unlinkOAuth: jest.fn(),
}));

jest.mock('../../src/utils/user-contract', () => ({
  toUserContract: jest.fn((user) => user),
}));

const AuthController = require('../../src/controllers/auth');
const AuthService = require('../../src/services/auth');

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a token for registrations that can start a session immediately', async () => {
    AuthService.register.mockResolvedValue({
      id: 5,
      role: 'candidate',
      status: 'active',
    });
    AuthService.shouldIssueToken.mockReturnValue(true);
    AuthService.generateToken.mockReturnValue('candidate-token');

    const req = {
      body: {
        email: 'candidate@test.com',
        password: 'secret123',
        role: 'candidate',
        first_name: 'Lan',
        last_name: 'Nguyen',
      },
    };
    const res = createResponse();
    const next = jest.fn();

    AuthController.register(req, res, next);
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          token: 'candidate-token',
          requires_approval: false,
        }),
      })
    );
  });

  it('does not return a token for pending employer registrations', async () => {
    AuthService.register.mockResolvedValue({
      id: 6,
      role: 'employer',
      status: 'pending',
    });
    AuthService.shouldIssueToken.mockReturnValue(false);

    const req = {
      body: {
        email: 'employer@test.com',
        password: 'secret123',
        role: 'employer',
        first_name: 'Anh',
        last_name: 'Tran',
        company_name: 'Acme Hiring',
      },
    };
    const res = createResponse();
    const next = jest.fn();

    AuthController.register(req, res, next);
    await flushPromises();

    expect(AuthService.generateToken).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          token: null,
          role: 'recruiter',
          requires_approval: true,
        }),
      })
    );
  });
});
