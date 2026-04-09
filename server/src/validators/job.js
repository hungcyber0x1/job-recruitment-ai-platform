const { body } = require('express-validator');

exports.jobValidator = [
  body('title').notEmpty().withMessage('Tiêu đề không được để trống'),
  body('description').notEmpty().withMessage('Mô tả không được để trống'),
  body('location').notEmpty().withMessage('Địa điểm không được để trống'),
  body('type')
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'remote'])
    .withMessage('Loại công việc không hợp lệ'),
  body('salary_min').optional().isNumeric().withMessage('Lương phải là số'),
  body('salary_max').optional().isNumeric().withMessage('Lương phải là số'),
];
