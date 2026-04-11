const { body } = require('express-validator');

exports.applicationValidator = [
  body('cover_letter').isLength({ min: 20 }).withMessage('Thư giới thiệu phải ít nhất 20 ký tự'),
  body('resume_url').notEmpty().withMessage('Bạn phải tải lên CV'),
];

exports.updateStatusValidator = [
  body('status')
    .isIn(['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'])
    .withMessage('Trạng thái không hợp lệ'),
];
