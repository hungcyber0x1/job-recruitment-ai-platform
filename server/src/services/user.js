const UserRepository = require('../models/User');

class UserService {
  async getUserProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updatePreferences(userId, body) {
    const allowed = ['email_notifications', 'push_notifications'];
    const safe = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        safe[key] = body[key] === true || body[key] === 1 || body[key] === '1' ? 1 : 0;
      }
    }
    if (Object.keys(safe).length === 0) {
      const err = new Error('No valid preference fields');
      err.statusCode = 400;
      throw err;
    }
    await UserRepository.update(userId, safe);
    const user = await UserRepository.findById(userId);
    const { password: _p, ...rest } = user;
    return rest;
  }

  async updateUser(userId, updateData) {
    const allowedFields = ['first_name', 'last_name', 'phone', 'address', 'avatar_url'];
    const safeData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        safeData[field] = updateData[field];
      }
    }
    if (Object.keys(safeData).length === 0) {
      const err = new Error('No valid fields to update');
      err.statusCode = 400;
      throw err;
    }
    return await UserRepository.update(userId, safeData);
  }

  async updateUserAvatar(userId, avatarUrl) {
    return await UserRepository.update(userId, { avatar_url: avatarUrl });
  }

  async getAllUsers() {
    const users = await UserRepository.findAll();
    return users.map(({ password: _pw, password_hash: _ph, ...safe }) => safe);
  }
}

module.exports = new UserService();
