const { param, query } = require('express-validator');

exports.idParamValidator = [param('id').isInt().withMessage('ID must be an integer')];
exports.jobIdParamValidator = [param('jobId').isInt({ min: 1 }).withMessage('Job ID must be an integer')];

exports.paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];
