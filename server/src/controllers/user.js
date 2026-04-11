const UserService = require('../services/user');

class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await UserService.getUserProfile(req.user.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const users = await UserService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await UserService.updateUser(req.user.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const user = await UserService.updatePreferences(req.user.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const user = await UserService.updateUserAvatar(req.user.id, avatarUrl);
      res.json({
        success: true,
        data: { avatar_url: user.avatar_url },
        message: 'Avatar uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
