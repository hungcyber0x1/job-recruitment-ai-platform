const rateLimit = require('express-rate-limit');
const { pool } = require('../config/database.config');

const isDevelopment = process.env.NODE_ENV !== 'production';
const shouldSkipRateLimit = () => isDevelopment;

/**
 * Get or create per-user daily quota record.
 */
async function getOrCreateDailyQuota(userId) {
  const today = new Date().toISOString().split('T')[0];
  try {
    const [rows] = await pool.query(
      `SELECT * FROM chatbot_daily_quotas
       WHERE user_id = ? AND quota_date = ?`,
      [userId, today]
    );
    if (rows.length > 0) {
      return rows[0];
    }
    await pool.query(
      `INSERT INTO chatbot_daily_quotas (user_id, quota_date, messages_used)
       VALUES (?, ?, 0)`,
      [userId, today]
    );
    const [newRows] = await pool.query(
      `SELECT * FROM chatbot_daily_quotas
       WHERE user_id = ? AND quota_date = ?`,
      [userId, today]
    );
    return newRows[0] || null;
  } catch {
    return null;
  }
}

/**
 * Per-user daily message quota (default 50 messages/day).
 * Premium users can be given higher limits via system settings.
 */
async function checkUserQuota(userId) {
  try {
    const quota = await getOrCreateDailyQuota(userId);
    const maxMessages = parseInt(process.env.CHATBOT_DAILY_QUOTA || '50', 10);

    if (quota && quota.messages_used >= maxMessages) {
      return {
        allowed: false,
        used: quota.messages_used,
        limit: maxMessages,
        remaining: 0,
        resetAt: new Date(new Date().toISOString().split('T')[0] + 'T23:59:59.999Z'),
      };
    }

    return {
      allowed: true,
      used: quota?.messages_used || 0,
      limit: maxMessages,
      remaining: maxMessages - (quota?.messages_used || 0),
    };
  } catch {
    // If quota table doesn't exist, allow
    return { allowed: true, used: 0, limit: 50, remaining: 50 };
  }
}

/**
 * Increment user's daily message count.
 */
async function incrementUserQuota(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO chatbot_daily_quotas (user_id, quota_date, messages_used)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE messages_used = messages_used + 1`,
      [userId, today]
    );
  } catch {
    // Non-critical, ignore if table doesn't exist
  }
}

/**
 * Custom rate limit handler that checks per-user quota.
 */
function createQuotaHandler(getUserId) {
  return async (req, _res, next) => {
    if (shouldSkipRateLimit()) return next();

    const userId = getUserId ? getUserId(req) : null;
    if (!userId) return next();

    const quota = await checkUserQuota(userId);
    req.chatbotQuota = quota;

    if (!quota.allowed) {
      const error = new Error(
        `Bạn đã sử dụng hết quota tin nhắn hôm nay (${quota.limit} tin). Vui lòng quay lại vào ngày mai hoặc nâng cấp tài khoản.`
      );
      error.statusCode = 429;
      error.quota = quota;
      return next(error);
    }

    next();
  };
}

/**
 * Middleware to increment quota after successful message processing.
 */
async function recordMessage(userId) {
  await incrementUserQuota(userId);
}

/**
 * General API limiter - cho cac route thong thuong
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Qua nhieu yeu cau, vui long thu lai sau 15 phut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

/**
 * Newsletter limiter - chống spam đăng ký email công khai.
 */
const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDevelopment ? 200 : 5,
  message: {
    success: false,
    message: 'Bạn đăng ký bản tin quá nhiều lần. Vui lòng thử lại sau 1 giờ.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

/**
 * Auth limiter - chan brute-force login/register
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Qua nhieu lan dang nhap that bai. Vui long thu lai sau 15 phut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: shouldSkipRateLimit,
});

/**
 * AI limiter - bao ve cac endpoint ton kem
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Ban dang su dung tinh nang AI qua nhanh. Vui long thu lai sau 1 phut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

/**
 * Messaging limiter - chống spam tin nhắn tuyển dụng.
 */
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDevelopment ? 200 : 30,
  message: {
    success: false,
    message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

/**
 * Công cụ công khai (không đăng nhập) — hạn chế lạm dụng AI / API
 */
const publicToolsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDevelopment ? 200 : 8,
  message: {
    success: false,
    message: 'Bạn đang gọi công cụ công khai quá nhanh. Vui lòng thử lại sau 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

module.exports = {
  generalLimiter,
  authLimiter,
  aiLimiter,
  messageLimiter,
  publicToolsLimiter,
  newsletterLimiter,
  checkUserQuota,
  incrementUserQuota,
  createQuotaHandler,
  recordMessage,
};
