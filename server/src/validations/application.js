const { body } = require('express-validator');
const { APPLICATION_STATUSES } = require('../models/Application');

exports.applicationValidator = [
  body('cover_letter').isLength({ min: 20 }).withMessage('Thư giới thiệu phải ít nhất 20 ký tự'),
  body('resume_url').notEmpty().withMessage('Bạn phải tải lên CV'),
];

/**
 * Validator cho PUT /:id/status
 * Kiểm tra status hợp lệ + metadata bắt buộc theo từng stage.
 */
exports.updateStatusValidator = [
  body('status')
    .isIn(APPLICATION_STATUSES)
    .withMessage('Trạng thái không hợp lệ'),

  // Khi chuyển sang interview_scheduled: bắt buộc scheduled_at và interview_type
  body('scheduled_at')
    .if(body('status').equals('interview_scheduled'))
    .notEmpty().withMessage('Vui lòng nhập ngày giờ phỏng vấn (scheduled_at)')
    .isISO8601().withMessage('Định dạng ngày giờ không hợp lệ (ISO 8601)'),

  body('interview_type')
    .if(body('status').equals('interview_scheduled'))
    .notEmpty().withMessage('Vui lòng chọn hình thức phỏng vấn')
    .isIn(['online', 'offline', 'phone']).withMessage('Hình thức phỏng vấn phải là: online, offline, hoặc phone'),

  // Khi chuyển sang offered: salary_offered tùy chọn nhưng nếu có phải là số
  body('salary_offered')
    .if(body('status').equals('offered'))
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage('Mức lương phải là số nguyên không âm'),

  body('response_deadline')
    .if(body('status').equals('offered'))
    .optional({ nullable: true })
    .isISO8601().withMessage('Hạn phản hồi phải là ngày hợp lệ (ISO 8601)'),
];
