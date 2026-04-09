const rateLimit = require('express-rate-limit');

const isDevelopment = process.env.NODE_ENV !== 'production';
const shouldSkipRateLimit = () => isDevelopment;

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

module.exports = { generalLimiter, authLimiter, aiLimiter, publicToolsLimiter };
