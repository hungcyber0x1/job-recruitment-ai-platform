const logger = require('../utils/logger');

/**
 * Audit logging middleware – logs admin actions and critical operations.
 * Assumes req.user (populated by auth middleware) contains { id, role }.
 */
function auditMiddleware(req, res, next) {
  const userId = req.user ? req.user.id : 'anonymous';
  const role = req.user ? req.user.role : 'guest';
  const { method, originalUrl } = req;
  const timestamp = new Date().toISOString();

  // Only log admin or privileged actions
  if (role === 'admin' || role === 'recruiter') {
    logger.info({
      timestamp,
      userId,
      role,
      method,
      url: originalUrl,
      context: 'audit',
    });
  }
  next();
}

module.exports = { auditMiddleware };
