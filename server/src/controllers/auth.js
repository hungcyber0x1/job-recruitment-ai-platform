const AuthService = require('../services/auth');
const catchAsync = require('../utils/catchAsync');

class AuthController {
  register = catchAsync(async (req, res) => {
    const { email, password, role, first_name, last_name, company_name } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user = await AuthService.register({
      email,
      password,
      role,
      first_name,
      last_name,
      company_name,
    });

    const token = AuthService.generateToken(user);

    res.status(201).json({
      success: true,
      token,
      data: user,
      message: 'Đăng ký tài khoản thành công',
    });
  });

  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await AuthService.login(email, password);

    res.status(200).json({
      success: true,
      token,
      data: user,
    });
  });

  getMe = catchAsync(async (req, res) => {
    const UserRepository = require('../models/User');
    const full = await UserRepository.findById(req.user.id);
    if (!full) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    const { password, ...userWithoutPassword } = full;
    res.json({
      success: true,
      data: { ...userWithoutPassword, has_local_password: !!password },
    });
  });

  unlinkOAuth = catchAsync(async (req, res) => {
    await AuthService.unlinkOAuth(req.user.id);
    res.json({ success: true, message: 'Đã hủy liên kết mạng xã hội' });
  });

  updatePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'currentPassword and newPassword are required',
      });
    }

    await AuthService.updatePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, message: 'Password updated successfully' });
  });
}

module.exports = new AuthController();
