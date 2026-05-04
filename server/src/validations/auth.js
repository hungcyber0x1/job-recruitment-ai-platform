const { body } = require('express-validator');

const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-zA-Z])(?=.*(?:[0-9]|[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])).+$/;

exports.registerValidator = [
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false })
    .withMessage('Email không hợp lệ'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu phải từ 8 ký tự')
    .matches(PASSWORD_COMPLEXITY_REGEX)
    .withMessage('Mật khẩu phải chứa ít nhất một chữ cái và một số hoặc ký tự đặc biệt'),
  body('role').isIn(['candidate', 'recruiter']).withMessage('Role không hợp lệ'),
  body().custom((_, { req }) => {
    const firstName = req.body.first_name ?? req.body.firstName;
    if (!String(firstName ?? '').trim()) {
      throw new Error('Họ không được để trống');
    }
    return true;
  }),
  body().custom((_, { req }) => {
    const lastName = req.body.last_name ?? req.body.lastName;
    if (!String(lastName ?? '').trim()) {
      throw new Error('Tên không được để trống');
    }
    return true;
  }),
  body().custom((_, { req }) => {
    const roleVal = req.body.role;
    if (roleVal !== 'recruiter') {
      return true;
    }

    const companyName = req.body.company_name ?? req.body.companyName;
    if (!String(companyName ?? '').trim()) {
      throw new Error('Tên công ty là bắt buộc cho nhà tuyển dụng');
    }

    return true;
  }),
];

exports.loginValidator = [
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false })
    .withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
];
