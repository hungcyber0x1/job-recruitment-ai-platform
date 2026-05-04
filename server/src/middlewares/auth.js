const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const UserRepository = require('../models/User');
const AppError = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { USER_STATUS } = require('../utils/constants');
const {
  getAdminPreset,
  getEffectiveAdminPermissions,
  hasAdminPermission,
} = require('../utils/admin-permissions');
const {
  attachCompanyContextToUser,
  resolveRecruiterCompanyContext,
} = require('../utils/company-access');

function normalizeRole(role) {
  return String(role ?? '')
    .trim()
    .toLowerCase();
}

/**
 * Xác thực JWT token
 * Alias: authenticate
 *
 * ⚠️  STATUS: Chỉ dùng cột `status`, không fallback về `is_active`
 */
const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    logger.info(`[protect] decoded token: id=${decoded.id}, email=${decoded.email}`);
    const user = await UserRepository.findById(decoded.id);
    logger.info(
      `[protect] findById(${decoded.id}) returned:`,
      user ? `${user.email} (${user.role}) status=${user.status}` : 'NULL'
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'No user found with this id' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'No user found with this id' });
    }

    // Derive effective status từ cột status (không dùng is_active)
    const rawStatus = String(user.status || '')
      .trim()
      .toLowerCase();
    const effectiveStatus = rawStatus || USER_STATUS.ACTIVE;

    if (effectiveStatus === USER_STATUS.SUSPENDED || effectiveStatus === USER_STATUS.BANNED) {
      throw new AppError('Tài khoản đang bị tạm ngưng hoặc cấm', 403);
    }

    // Allow pending users to access /me (to show status on frontend), block others
    const normalizedRole = normalizeRole(user.role);

    if (
      effectiveStatus === USER_STATUS.PENDING_VERIFICATION &&
      normalizedRole === 'recruiter' &&
      !req.path.includes('/me')
    ) {
      throw new AppError('Tai khoan nha tuyen dung dang cho quan tri vien phe duyet', 403);
    }

    const { password: _pw, ...safeUser } = user;
    const normalizedUser = {
      ...safeUser,
      role: normalizedRole || safeUser.role,
    };
    let enrichedUser = normalizedUser;
    if (normalizedUser.role === 'recruiter') {
      const companyContext = await resolveRecruiterCompanyContext(normalizedUser);
      enrichedUser = attachCompanyContextToUser(normalizedUser, companyContext);
    }

    req.user = {
      ...enrichedUser,
      permissions: getEffectiveAdminPermissions(normalizedUser),
      admin_preset: getAdminPreset(normalizedUser),
    };
    next();
  } catch (err) {
    // Add debug info to the error for logging
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      err.debugInfo = {
        reason: err.name,
        message: err.message,
      };
    }
    // Chuyển lỗi JWT cho middleware lỗi toàn cục (JsonWebTokenError, TokenExpiredError, …)
    return next(err);
  }
};

const requireAdminPermission = (permission) => (req, res, next) => {
  if (!req.user || normalizeRole(req.user.role) !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  if (!hasAdminPermission(req.user, permission)) {
    return res.status(403).json({
      success: false,
      message: 'Admin permission required for this action',
      requiredPermission: permission,
    });
  }

  return next();
};

/**
 * Kiểm tra role
 * Alias: isCandidate, isRecruiter, isAdmin
 */
const authorize = (...roles) => {
  const normalizedRoles = roles.map((role) => normalizeRole(role));

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user info or role found',
        debug: {
          hasReqUser: !!req.user,
          userRole: req.user?.role,
          normalizedRoles,
        },
      });
    }

    const currentRole = normalizeRole(req.user.role);

    if (!normalizedRoles.includes(currentRole)) {
      console.error(
        `[authorize] ❌ 403 — userRole="${req.user.role}", currentRole="${currentRole}", expected=${JSON.stringify(normalizedRoles)}, path=${req.path}, userId=${req.user?.id}`
      );
      logger.error(
        `403 - Role "${currentRole}" not in ${JSON.stringify(normalizedRoles)} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
        { path: req.path, userId: req.user?.id, userRole: req.user.role }
      );
      return res.status(403).json({
        success: false,
        message: `User role "${req.user.role}" (normalized: "${currentRole}") is not authorized to access this route. Expected one of: ${normalizedRoles.join(', ')}`,
        debug: {
          userRole: req.user.role,
          currentRole,
          normalizedRoles,
        },
      });
    }
    console.log(`[authorize] ✅ userId=${req.user.id} role="${currentRole}" path=${req.path}`);
    next();
  };
};

// ─── Aliases ────────────────────────────────────────────────────────────────
const authenticate = protect;
const isCandidate = authorize('candidate');
const isRecruiter = authorize('recruiter');
const isAdmin = authorize('admin');

module.exports = {
  protect,
  authorize,
  requireAdminPermission,
  authenticate,
  isCandidate,
  isRecruiter,
  isAdmin,
};
