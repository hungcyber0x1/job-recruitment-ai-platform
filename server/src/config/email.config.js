module.exports = {
  service: process.env.EMAIL_SERVICE || 'gmail', // Mặc định Gmail nếu không cấu hình
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  from: process.env.EMAIL_FROM || '"Job Recruitment AI" <no-reply@jobai.com>',
};
