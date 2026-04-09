const { body } = require('express-validator');

exports.updateUserValidator = [
  body('first_name').optional().notEmpty().withMessage('Họ không được để trống'),
  body('last_name').optional().notEmpty().withMessage('Tên không được để trống'),
  body('phone').optional().isMobilePhone().withMessage('Số điện thoại không hợp lệ'),
];

exports.changePasswordValidator = [
  body('oldPassword').notEmpty().withMessage('Mật khẩu cũ không được để trống'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải từ 6 ký tự'),
];
