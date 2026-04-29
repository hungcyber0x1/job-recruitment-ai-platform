jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../src/models/UserPreference', () => ({
  findByUserId: jest.fn(),
  upsert: jest.fn(),
  mergeIntoUser: jest.fn((user, preferences) => ({ ...user, ...(preferences || {}) })),
  toPreferenceContract: jest.fn((preferences) => ({
    notification_preferences: preferences?.notification_preferences || {},
    email_frequency: preferences?.email_frequency || 'daily',
  })),
}));

const UserRepository = require('../../src/models/User');
const UserPreferenceRepository = require('../../src/models/UserPreference');
const UserService = require('../../src/services/user');

describe('UserService.updatePreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    UserRepository.findById.mockResolvedValue({
      id: 10,
      email: 'candidate@example.com',
      role: 'candidate',
      first_name: 'Linh',
      last_name: 'Tran',
      email_notifications: 1,
      push_notifications: 0,
    });
    UserPreferenceRepository.findByUserId.mockResolvedValue({
      notification_preferences: {
        application_update: true,
      },
      email_frequency: 'daily',
    });
  });

  it('accepts granular notification preferences from the candidate settings UI', async () => {
    await UserService.updatePreferences(10, {
      notification_preferences: {
        application_update: true,
        interview_invite: false,
      },
    });

    expect(UserRepository.update).not.toHaveBeenCalled();
    expect(UserPreferenceRepository.upsert).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        notification_preferences: expect.objectContaining({
          interview_invite: false,
        }),
      })
    );
  });

  it('updates legacy email and push flags without requiring granular preferences', async () => {
    await UserService.updatePreferences(10, {
      email_notifications: false,
      push_notifications: true,
    });

    expect(UserRepository.update).toHaveBeenCalledWith(10, {
      email_notifications: 0,
      push_notifications: 1,
    });
    expect(UserPreferenceRepository.upsert).not.toHaveBeenCalled();
  });

  it('accepts email frequency as a persisted user preference', async () => {
    await UserService.updatePreferences(10, { email_frequency: 'weekly' });

    expect(UserPreferenceRepository.upsert).toHaveBeenCalledWith(10, {
      email_frequency: 'weekly',
    });
  });

  it('returns stored preferences for settings screens before saving', async () => {
    const preferences = await UserService.getPreferences(10);

    expect(preferences).toEqual({
      email_notifications: true,
      push_notifications: false,
      notification_preferences: {
        application_update: true,
      },
      email_frequency: 'daily',
    });
  });
});
