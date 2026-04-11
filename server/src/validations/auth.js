const { body } = require('express-validator');

exports.registerValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải từ 6 ký tự'),
  /** Chỉ cho phép đăng ký công khai ứng viên / nhà tuyển dụng — không tạo admin qua API */
  body('role').isIn(['candidate', 'employer']).withMessage('Role không hợp lệ'),
  body('first_name').trim().notEmpty().withMessage('Họ không được để trống'),
  body('last_name').trim().notEmpty().withMessage('Tên không được để trống'),
  body('company_name')
    .if((value, { req }) => req.body.role === 'employer')
    .trim()
    .notEmpty()
    .withMessage('Tên công ty là bắt buộc cho nhà tuyển dụng'),
];

exports.loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
];
