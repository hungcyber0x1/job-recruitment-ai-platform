const { body } = require('express-validator');
const { pool } = require('../config/database.config');

const optionalNullable = { nullable: true, checkFalsy: true };
const ALLOWED_JOB_TYPES = [
  'full-time',
  'part-time',
  'full_time',
  'part_time',
  'contract',
  'internship',
  'remote',
  'freelance',
];
let categoryColumnsCache = null;

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const numericValue =
    typeof value === 'string' ? Number(value.replace(/,/g, '').trim()) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const getCategoryColumns = async () => {
  if (categoryColumnsCache) return categoryColumnsCache;

  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'categories'
       AND COLUMN_NAME IN ('deleted_at', 'is_active')`
  );
  categoryColumnsCache = new Set(rows.map((row) => row.COLUMN_NAME));
  return categoryColumnsCache;
};

const assertCategoryExists = async (value) => {
  const columns = await getCategoryColumns();
  let query = 'SELECT id FROM categories WHERE id = ?';

  if (columns.has('deleted_at')) {
    query += ' AND deleted_at IS NULL';
  }

  if (columns.has('is_active')) {
    query += ' AND is_active = 1';
  }

  query += ' LIMIT 1';

  const [rows] = await pool.query(query, [value]);
  if (rows.length === 0) {
    throw new Error('Linh vuc/nghanh nghe khong ton tai hoac da bi xoa');
  }

  return true;
};

exports.jobValidator = [
  body('title').notEmpty().withMessage('Tieu de khong duoc de trong'),
  body('description').notEmpty().withMessage('Mo ta khong duoc de trong'),
  body('requirements').notEmpty().withMessage('Yeu cau ung vien khong duoc de trong'),
  body('benefits').notEmpty().withMessage('Quyen loi khong duoc de trong'),
  body('location').notEmpty().withMessage('Dia diem khong duoc de trong'),
  body('type')
    .custom((value, { req }) => {
      const jobType = value ?? req.body.job_type;
      if (ALLOWED_JOB_TYPES.includes(jobType)) return true;
      throw new Error('Loai cong viec khong hop le');
    }),
  body('category_id')
    .notEmpty().withMessage('Linh vuc/nghanh nghe khong duoc de trong')
    .isInt({ min: 1 }).withMessage('Linh vuc/nghanh nghe khong hop le')
    .custom(assertCategoryExists),
  body('salary_min')
    .optional(optionalNullable)
    .custom((value) => {
      const salaryMin = toNumberOrNull(value);
      if (salaryMin === null || salaryMin >= 0) return true;
      throw new Error('Luong toi thieu phai la so khong am');
    }),
  body('salary_max')
    .optional(optionalNullable)
    .custom((value, { req }) => {
      const salaryMax = toNumberOrNull(value);
      if (salaryMax !== null && salaryMax < 0) {
        throw new Error('Luong toi da phai la so khong am');
      }

      const salaryMin = toNumberOrNull(req.body.salary_min);
      if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
        throw new Error('Luong toi thieu khong duoc lon hon luong toi da');
      }

      return true;
    }),
  body('salary_negotiable')
    .optional({ nullable: true })
    .isIn([0, 1, '0', '1', true, false, 'true', 'false'])
    .withMessage('Luong thoa thuan phai la 0 hoac 1'),
  body('vacancies')
    .optional(optionalNullable)
    .isInt({ min: 1, max: 9999 })
    .withMessage('So luong tuyen dung phai tu 1 den 9999'),
  body('deadline')
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Han nop phai la dinh dang ngay hop le (YYYY-MM-DD)')
    .custom((value) => {
      if (!value) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(value);
      if (deadlineDate < today) {
        throw new Error('Han nop khong the la ngay trong qua');
      }
      return true;
    }),
];
