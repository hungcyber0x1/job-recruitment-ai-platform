/** JWT — production bắt buộc JWT_SECRET; dev cho phép default kèm cảnh báo một lần. */
const isProd = process.env.NODE_ENV === 'production';
const raw = process.env.JWT_SECRET;
const trimmed = typeof raw === 'string' ? raw.trim() : '';

let secret;
if (trimmed.length > 0) {
  secret = trimmed;
} else if (isProd) {
  throw new Error(
    'JWT_SECRET is required in production. Set a strong secret (e.g. openssl rand -hex 32).'
  );
} else {
  secret = 'dev-insecure-jwt-secret-set-JWT_SECRET-in-env';
  if (!globalThis.__JWT_DEV_WARN__) {
    globalThis.__JWT_DEV_WARN__ = true;
    console.warn('[config] JWT_SECRET is not set; using insecure development default.');
  }
}

module.exports = {
  secret,
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieExpiresIn: process.env.JWT_COOKIE_EXPIRES_IN || 7, // days
};
