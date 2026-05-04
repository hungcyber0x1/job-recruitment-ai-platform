/**
 * Admin Routes — mounts admin dashboard endpoints.
 *
 * ⚠️   ROLE: Sử dụng 'admin'
 * ⚠️   TABLE: Sử dụng `company_profiles` thay vì `employers`
 */
const express = require('express');
const multer = require('multer');
const router = express.Router();
const AdminController = require('../controllers/admin');
const BlogController = require('../controllers/blog');
const CompanyController = require('../controllers/company');
const CategoryController = require('../controllers/category');
const SkillRepository = require('../models/Skill');
const { protect, authorize, requireAdminPermission } = require('../middlewares/auth');
const { ADMIN_PERMISSIONS } = require('../utils/admin-permissions');
const { validate } = require('../middlewares/validation');
const { jobValidator } = require('../validations/job');
const { idParamValidator } = require('../validations/common');

const backupUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const isJsonMime = file.mimetype === 'application/json' || file.mimetype === 'text/json';
    const isJsonFile = file.originalname && file.originalname.toLowerCase().endsWith('.json');

    if (isJsonMime || isJsonFile) {
      cb(null, true);
      return;
    }

    cb(new Error('Chi chap nhan file backup dinh dang JSON'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const path = require('path');
const { uploadsRoot } = require('../config/paths');

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = path.join(uploadsRoot, 'site-logos');
    if (!require('fs').existsSync(folder)) {
      require('fs').mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'site-logo-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const adminPermission = (permission) => [
  protect,
  authorize('admin'),
  requireAdminPermission(permission),
];

router.get('/stats', protect, authorize('admin'), AdminController.getDashboardStats);
router.get('/chart-stats', protect, authorize('admin'), AdminController.getChartStats);
router.get(
  '/analytics-dashboard',
  protect,
  authorize('admin'),
  AdminController.getAnalyticsDashboard
);

// Exports (MUST be before parametric :id routes to avoid shadowing)
router.get('/email-logs', protect, authorize('admin'), AdminController.getEmailLogs);
router.get('/tickets/export', protect, authorize('admin'), async (req, res, next) => {
  try {
    const tickets = await require('../models/SupportTicket').findAll({
      limit: 10000,
      offset: 0,
    });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=tickets-export-${Date.now()}.json`);
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
});
router.get('/users/export', protect, authorize('admin'), AdminController.exportUsers);
router.get('/jobs/export', protect, authorize('admin'), AdminController.exportJobs);
router.get('/applications/export', protect, authorize('admin'), AdminController.exportApplications);

// Users
router.get('/users/stats', protect, authorize('admin'), AdminController.getUsersStats);
router.get('/users', protect, authorize('admin'), AdminController.getAllUsers);
router.get('/users/:id', protect, authorize('admin'), AdminController.getUserById);
router.put('/users/:id', protect, authorize('admin'), AdminController.updateUser);
router.patch('/users/:id/status', protect, authorize('admin'), AdminController.updateUserStatus);
router.patch('/users/:id/lock', protect, authorize('admin'), AdminController.lockUser);
router.patch('/users/:id/unlock', protect, authorize('admin'), AdminController.unlockUser);
router.patch(
  '/users/:id/permissions',
  adminPermission(ADMIN_PERMISSIONS.ADMIN_PERMISSIONS),
  AdminController.updateUserPermissions
);
router.delete(
  '/users/:id',
  adminPermission(ADMIN_PERMISSIONS.USERS_DELETE),
  AdminController.deleteUser
);
router.delete(
  '/users/:id/hard',
  adminPermission(ADMIN_PERMISSIONS.USERS_DELETE),
  AdminController.hardDeleteUser
);
router.patch(
  '/users/:id/restore',
  adminPermission(ADMIN_PERMISSIONS.USERS_DELETE),
  AdminController.restoreUser
);
router.post(
  '/users/:id/reset-password',
  protect,
  authorize('admin'),
  AdminController.resetPassword
);
router.post('/users/:id/force-logout', protect, authorize('admin'), AdminController.forceLogout);
router.post(
  '/users/:id/resend-verification',
  protect,
  authorize('admin'),
  AdminController.resendVerification
);
router.get('/users/:id/activity', protect, authorize('admin'), AdminController.getUserActivity);
router.post(
  '/users/bulk-status',
  protect,
  authorize('admin'),
  AdminController.bulkUpdateUsersStatus
);

// Companies
router.get('/companies', protect, authorize('admin'), CompanyController.getAllCompanies);
router.post(
  '/companies/bulk-status',
  protect,
  authorize('admin'),
  CompanyController.bulkUpdateStatus
);
router.get('/companies/:id', protect, authorize('admin'), AdminController.getCompanyById);
router.patch('/companies/:id/verify', protect, authorize('admin'), CompanyController.verifyCompany);
router.patch('/companies/:id/flag', protect, authorize('admin'), CompanyController.flagCompany);
router.patch('/companies/:id/ban', protect, authorize('admin'), CompanyController.banCompany);
router.patch(
  '/companies/:id/restore',
  adminPermission(ADMIN_PERMISSIONS.COMPANIES_DELETE),
  CompanyController.restoreCompany
);
router.delete(
  '/companies/:id',
  adminPermission(ADMIN_PERMISSIONS.COMPANIES_DELETE),
  CompanyController.deleteCompany
);

// Jobs
router.get('/jobs', protect, authorize('admin'), AdminController.getAllJobs);
router.post(
  '/jobs',
  protect,
  authorize('admin'),
  jobValidator,
  validate,
  AdminController.createJob
);
router.post('/jobs/bulk-status', protect, authorize('admin'), AdminController.bulkUpdateJobsStatus);
router.get('/jobs/:id', protect, authorize('admin'), AdminController.getJobById);
router.post('/jobs/:id/duplicate', protect, authorize('admin'), AdminController.duplicateJob);
router.put(
  '/jobs/:id',
  protect,
  authorize('admin'),
  idParamValidator,
  jobValidator,
  validate,
  AdminController.updateJob
);
router.patch('/jobs/:id/status', protect, authorize('admin'), AdminController.updateJobStatus);
router.patch('/jobs/:id/flag', protect, authorize('admin'), AdminController.updateJobFlag);
router.delete(
  '/jobs/:id',
  adminPermission(ADMIN_PERMISSIONS.JOBS_DELETE),
  AdminController.deleteJob
);

// Applications
router.get('/applications', protect, authorize('admin'), AdminController.getAllApplications);
router.get('/applications/:id', protect, authorize('admin'), AdminController.getApplicationById);
router.get(
  '/applications/:id/history',
  protect,
  authorize('admin'),
  AdminController.getApplicationHistory
);
router.post(
  '/applications/bulk-status',
  protect,
  authorize('admin'),
  AdminController.bulkUpdateApplicationsStatus
);
router.patch(
  '/applications/:id/status',
  protect,
  authorize('admin'),
  AdminController.updateApplicationStatus
);
router.patch(
  '/applications/:id/internal-note',
  protect,
  authorize('admin'),
  AdminController.updateApplicationInternalNote
);

// Logs
router.get('/logs', protect, authorize('admin'), AdminController.getLogs);

// Support
router.get('/tickets', protect, authorize('admin'), AdminController.getTickets);
router.patch(
  '/tickets/:id/status',
  protect,
  authorize('admin'),
  AdminController.updateTicketStatus
);
router.get('/tickets/:id/messages', protect, authorize('admin'), AdminController.getTicketMessages);
router.post('/tickets/:id/reply', protect, authorize('admin'), AdminController.replyToTicket);

// Settings
router.get('/settings', protect, authorize('admin'), AdminController.getSettings);
router.put(
  '/settings',
  adminPermission(ADMIN_PERMISSIONS.SETTINGS_MANAGE),
  AdminController.updateSettings
);
router.post(
  '/settings/upload-logo',
  protect,
  authorize('admin'),
  requireAdminPermission(ADMIN_PERMISSIONS.SETTINGS_MANAGE),
  multer({
    storage: logoStorage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Chỉ chấp nhận file ảnh (PNG, SVG, JPG)'), false);
      }
    },
    limits: { fileSize: 2 * 1024 * 1024 },
  }).single('site_logo'),
  AdminController.uploadSiteLogo
);
router.post('/settings/smtp/test', protect, authorize('admin'), AdminController.testSmtpConnection);
router.post(
  '/settings/api/generate-key',
  protect,
  authorize('admin'),
  AdminController.generateApiKey
);

// Blog (quản trị nội dung)
router.get('/blog/posts', protect, authorize('admin'), BlogController.listAdmin);
router.post('/blog/posts', protect, authorize('admin'), BlogController.createAdmin);
router.post('/blog/posts/bulk-action', protect, authorize('admin'), BlogController.bulkActionAdmin);
router.put('/blog/posts/:id', protect, authorize('admin'), BlogController.updateAdmin);
router.patch(
  '/blog/posts/:id/status',
  protect,
  authorize('admin'),
  BlogController.updateStatusAdmin
);
router.delete(
  '/blog/posts/:id',
  adminPermission(ADMIN_PERMISSIONS.CONTENT_DELETE),
  BlogController.deleteAdmin
);

// Chatbot
router.get('/chatbot/stats', protect, authorize('admin'), AdminController.getChatStats);
router.get('/chatbot/sessions', protect, authorize('admin'), AdminController.getChatSessions);

// Categories (admin CRUD)
router.get('/categories', protect, authorize('admin'), CategoryController.getAllCategories);
router.post('/categories', protect, authorize('admin'), CategoryController.createCategory);
router.put('/categories/:id', protect, authorize('admin'), CategoryController.updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), CategoryController.deleteCategory);

// Skills (admin CRUD)
router.get('/skills', protect, authorize('admin'), async (req, res, next) => {
  try {
    const skills = await SkillRepository.findAll({
      search: req.query.search,
      includeInactive: true,
    });
    res.json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
});
router.post('/skills', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Skill name is required' });
    const skill = await SkillRepository.createManaged(req.body);
    res.status(201).json({ success: true, data: skill });
  } catch (error) {
    next(error);
  }
});
router.put('/skills/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const existing = await SkillRepository.findById(req.params.id, { includeInactive: true });
    if (!existing) return res.status(404).json({ success: false, message: 'Skill not found' });
    const skill = await SkillRepository.updateManaged(req.params.id, req.body);
    res.json({ success: true, data: skill });
  } catch (error) {
    next(error);
  }
});
router.delete('/skills/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await SkillRepository.delete(req.params.id);
    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// System
router.get('/backup', adminPermission(ADMIN_PERMISSIONS.BACKUP_MANAGE), AdminController.backupData);
router.post(
  '/restore',
  adminPermission(ADMIN_PERMISSIONS.BACKUP_MANAGE),
  backupUpload.single('backup'),
  AdminController.restoreData
);

module.exports = router;
