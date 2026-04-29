const AuthService = require('../services/auth');
const catchAsync = require('../utils/catchAsync');
const { toUserContract } = require('../utils/user-contract');
const ApiResponse = require('../utils/ApiResponse');
const {
  getAdminPreset,
  getEffectiveAdminPermissions,
} = require('../utils/admin-permissions');

function normalizeRole(role) {
  const normalizedRole = String(role ?? '').trim().toLowerCase();
  return normalizedRole === 'employer' ? 'recruiter' : normalizedRole;
}

class AuthController {
  buildAuthUserData(user) {
    const normalizedRole = normalizeRole(user?.role);
    const normalizedUser = {
      ...user,
      role: normalizedRole,
    };
    return {
      ...toUserContract(normalizedUser),
      role: normalizedRole,
      permissions: getEffectiveAdminPermissions(normalizedUser),
      admin_preset: getAdminPreset(normalizedUser),
      has_local_password: Boolean(user?.has_local_password ?? user?.password),
    };
  }

  register = catchAsync(async (req, res) => {
    const {
      email,
      password,
      role,
      first_name: firstNameSnake,
      last_name: lastNameSnake,
      firstName,
      lastName,
      company_name: companyNameSnake,
      companyName,
    } = req.body;

    if (!email || !password || !role) {
      return ApiResponse.error(res, 400, 'Missing required fields');
    }

    const first_name = firstNameSnake || firstName;
    const last_name = lastNameSnake || lastName;
    const company_name = companyNameSnake || companyName;

    const user = await AuthService.register({
      email,
      password,
      role,
      first_name,
      last_name,
      company_name,
    });

    const shouldIssueToken = AuthService.shouldIssueToken(user);
    const token = shouldIssueToken ? AuthService.generateToken(user) : null;
    const normalizedRole = normalizeRole(user?.role);
    const requiresApproval =
      !shouldIssueToken &&
      normalizedRole === 'recruiter' &&
      ['pending', 'pending_verification'].includes(String(user?.status ?? '').trim().toLowerCase());

    const payload = {
      ...this.buildAuthUserData(user),
      token,
      requires_approval: requiresApproval,
    };

    const message = requiresApproval
      ? 'Đăng ký thành công. Tài khoản nhà tuyển dụng đang chờ quản trị viên phê duyệt.'
      : 'Đăng ký tài khoản thành công';

    return ApiResponse.created(res, payload, message);
  });

  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await AuthService.login(email, password);

    return ApiResponse.success(res, {
      ...this.buildAuthUserData(user),
      token,
    });
  });

  getMe = catchAsync(async (req, res) => {
    const UserRepository = require('../models/User');
    const UserPreferenceRepository = require('../models/UserPreference');
    const full = await UserRepository.findById(req.user.id);

    if (!full) {
      return ApiResponse.unauthorized(res, 'User not found');
    }

    const preferences = await UserPreferenceRepository.findByUserId(req.user.id);
    return ApiResponse.success(
      res,
      this.buildAuthUserData(UserPreferenceRepository.mergeIntoUser(full, preferences))
    );
  });

  unlinkOAuth = catchAsync(async (req, res) => {
    await AuthService.unlinkOAuth(req.user.id);
    return ApiResponse.success(res, null, { message: 'Da huy lien ket mang xa hoi' });
  });

  updatePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ApiResponse.error(res, 400, 'currentPassword and newPassword are required');
    }

    await AuthService.updatePassword(req.user.id, currentPassword, newPassword);
    return ApiResponse.success(res, null, { message: 'Password updated successfully' });
  });
}

module.exports = new AuthController();
