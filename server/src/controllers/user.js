const UserService = require('../services/user');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

class UserController {
  getProfile = catchAsync(async (req, res) => {
    const user = await UserService.getUserProfile(req.user.id);
    return ApiResponse.success(res, user);
  });

  getAllUsers = catchAsync(async (req, res) => {
    const users = await UserService.getAllUsers();
    return ApiResponse.success(res, users);
  });

  getPreferences = catchAsync(async (req, res) => {
    const preferences = await UserService.getPreferences(req.user.id);
    return ApiResponse.success(res, preferences);
  });

  update = catchAsync(async (req, res) => {
    const user = await UserService.updateUser(req.user.id, req.body);
    return ApiResponse.success(res, user);
  });

  updatePreferences = catchAsync(async (req, res) => {
    const user = await UserService.updatePreferences(req.user.id, req.body);
    return ApiResponse.success(res, user);
  });

  uploadAvatar = catchAsync(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 400, 'No file uploaded');
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await UserService.updateUserAvatar(req.user.id, avatarUrl);
    return ApiResponse.success(res, { avatar_url: user.avatar_url }, { message: 'Avatar uploaded successfully' });
  });
}

module.exports = new UserController();
