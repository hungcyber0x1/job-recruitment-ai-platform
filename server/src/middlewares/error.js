const logger = require('../utils/logger');

/** Tránh ghi mật khẩu / token vào log khi lỗi. */
function redactForLog(body) {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }
  const out = { ...body };
  for (const key of Object.keys(out)) {
    const lower = key.toLowerCase();
    if (
      lower === 'password' ||
      lower === 'token' ||
      lower === 'refreshtoken' ||
      lower === 'authorization' ||
      lower.includes('password')
    ) {
      out[key] = '[REDACTED]';
    }
  }
  return out;
}

module.exports = (err, req, res, _next) => {
  // MySQL: trùng khóa / bản ghi đã tồn tại
  if (err.code === 'ER_DUP_ENTRY') {
    err.statusCode = 400;
    err.message = 'Dữ liệu đã tồn tại trong hệ thống';
  }

  // MySQL: khóa ngoại không tham chiếu được bản ghi
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    err.statusCode = 400;
    err.message = 'Dữ liệu tham chiếu không hợp lệ';
  }

  // Handle Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    err.statusCode = 400;
    err.message = 'File quá lớn. Giới hạn tối đa 5MB';
  }

  // JWT không hợp lệ / hết hạn: đây là lỗi xác thực phía client, không phải 500 server.
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    err.status = 'fail';
    err.isOperational = true;
    err.message = 'Token không hợp lệ, vui lòng đăng nhập lại';
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    err.status = 'fail';
    err.isOperational = true;
    err.message = 'Token đã hết hạn, vui lòng đăng nhập lại';
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (!err.code) {
    err.code = `ERR_${err.statusCode}`;
  }

  // Log error with more context for debugging
  logger.error(
    `${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    {
      stack: err.stack,
      body: redactForLog(req.body),
      params: req.params,
      query: req.query,
      user: req.user ? req.user.id : 'anonymous',
    }
  );

  const payload = {
    success: false,
    status: err.status,
    message: err.isOperational ? err.message : 'Hệ thống gặp lỗi. Vui lòng thử lại sau.',
    code: err.code,
  };

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({ ...payload, error: err, stack: err.stack });
  } else {
    if (err.isOperational) {
      payload.debug = { code: err.code };
    }
    res.status(err.statusCode).json(payload);
  }
};
