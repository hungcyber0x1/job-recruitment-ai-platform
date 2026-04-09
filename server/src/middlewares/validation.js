const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const errorList = errors.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));

  const firstError = errorList[0]?.message || 'Dữ liệu không hợp lệ';

  res.status(400).json({
    success: false,
    message: firstError,
    errors: errorList,
  });
};
