const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const UserRepository = require('../models/User');

/**
 * Xác thực JWT token
 * Alias: authenticate
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
    const user = await UserRepository.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'No user found with this id' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    const { password: _pw, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    // Chuyển lỗi JWT cho middleware lỗi toàn cục (JsonWebTokenError, TokenExpiredError, …)
    return next(err);
  }
};

/**
 * Kiểm tra role
 * Alias: isCandidate, isEmployer, isAdmin
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// ─── Aliases (để tương thích với các route dùng tên khác nhau) ───────────────
const authenticate = protect;
const isCandidate = authorize('candidate');
const isEmployer = authorize('employer');
const isAdmin = authorize('admin');

module.exports = {
  protect,
  authorize,
  authenticate,
  isCandidate,
  isEmployer,
  isAdmin,
};
