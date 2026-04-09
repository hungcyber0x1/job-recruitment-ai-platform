jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

jest.mock('../../src/repositories/user', () => ({
  findById: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../../src/repositories/user');
const AuthService = require('../../src/services/auth');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generateToken signs JWT with user id and role', () => {
    jwt.sign.mockReturnValue('signed-token');

    const token = AuthService.generateToken({ id: 5, role: 'admin' });

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 5, role: 'admin' },
      expect.any(String),
      expect.objectContaining({ expiresIn: expect.any(String) })
    );
    expect(token).toBe('signed-token');
  });

  test('updatePassword hashes and persists the new password after verifying current password', async () => {
    UserRepository.findById.mockResolvedValue({ id: 7, password: 'stored-hash' });
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('new-hash');
    UserRepository.updatePassword.mockResolvedValue(true);

    const result = await AuthService.updatePassword(7, 'OldPassword@123', 'NewPassword@123');

    expect(result).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword@123', 'stored-hash');
    expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword@123', 'salt');
    expect(UserRepository.updatePassword).toHaveBeenCalledWith(7, 'new-hash');
  });

  test('updatePassword throws AppError when current password does not match', async () => {
    UserRepository.findById.mockResolvedValue({ id: 7, password: 'stored-hash' });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      AuthService.updatePassword(7, 'WrongPassword@123', 'NewPassword@123')
    ).rejects.toEqual(
      expect.objectContaining({
        message: 'Current password is incorrect',
        statusCode: 401,
      })
    );

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(UserRepository.updatePassword).not.toHaveBeenCalled();
  });

  test('updatePassword throws AppError when user does not exist', async () => {
    UserRepository.findById.mockResolvedValue(null);

    await expect(
      AuthService.updatePassword(999, 'OldPassword@123', 'NewPassword@123')
    ).rejects.toEqual(
      expect.objectContaining({
        message: 'User not found',
        statusCode: 404,
      })
    );
  });
});
