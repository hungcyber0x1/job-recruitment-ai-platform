/**
 * User Service — business logic for user management.
 *
 * ⚠️   TABLE: Sử dụng `candidate_profiles` và `company_profiles`
 */
const UserRepository = require('../models/User');
const UserPreferenceRepository = require('../models/UserPreference');
const AppError = require('../utils/errorHandler');
const { toUserContract } = require('../utils/user-contract');

function toTinyBool(value) {
  return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
}

class UserService {
  async getUserProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    const preferences = await UserPreferenceRepository.findByUserId(userId);
    return toUserContract(UserPreferenceRepository.mergeIntoUser(user, preferences));
  }

  async getPreferences(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const preferences = await UserPreferenceRepository.findByUserId(userId);
    return {
      email_notifications: Boolean(user.email_notifications),
      push_notifications: Boolean(user.push_notifications),
      ...UserPreferenceRepository.toPreferenceContract(preferences),
    };
  }

  async updatePreferences(userId, body) {
    const allowed = ['email_notifications', 'push_notifications'];
    const safe = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        safe[key] = toTinyBool(body[key]);
      }
    }

    const preferencePayload = {};
    if (body.notification_preferences !== undefined) {
      preferencePayload.notification_preferences = body.notification_preferences;
    }
    if (body.email_frequency !== undefined) {
      preferencePayload.email_frequency = body.email_frequency;
    }

    if (Object.keys(safe).length === 0 && Object.keys(preferencePayload).length === 0) {
      throw new AppError('No valid preference fields', 400);
    }

    if (Object.keys(safe).length > 0) {
      await UserRepository.update(userId, safe);
    }
    if (Object.keys(preferencePayload).length > 0) {
      await UserPreferenceRepository.upsert(userId, preferencePayload);
    }

    const user = await UserRepository.findById(userId);
    const preferences = await UserPreferenceRepository.findByUserId(userId);
    return toUserContract(UserPreferenceRepository.mergeIntoUser(user, preferences));
  }

  async updateUser(userId, updateData) {
    const allowedFields = [
      'first_name',
      'last_name',
      'phone',
      'address',
      'avatar_url',
      'gender',
      'region',
    ];
    const safeData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        safeData[field] = updateData[field];
      }
    }
    if (updateData.name !== undefined) {
      const parts = updateData.name.trim().split(/\s+/);
      if (parts.length >= 1) safeData.first_name = parts[0];
      if (parts.length >= 2) safeData.last_name = parts.slice(1).join(' ');
      else if (parts.length === 1) safeData.last_name = '';
    }
    if (Object.keys(safeData).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }
    await UserRepository.update(userId, safeData);
    const updatedUser = await UserRepository.findById(userId);
    return toUserContract(updatedUser);
  }

  async updateUserAvatar(userId, avatarUrl) {
    const updated = await UserRepository.updateAvatar(userId, avatarUrl);
    if (!updated) {
      throw new AppError('User not found', 404);
    }
    const updatedUser = await UserRepository.findById(userId);
    return toUserContract(updatedUser);
  }

  async getAllUsers() {
    const users = await UserRepository.findAll();
    return users.map((user) => toUserContract(user));
  }
}

module.exports = new UserService();
