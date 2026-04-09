const express = require('express');
const multer = require('multer');
const router = express.Router();
const AdminController = require('../controllers/admin');
const BlogController = require('../controllers/blog');
const CompanyController = require('../controllers/company');
const CategoryController = require('../controllers/category');
const SkillRepository = require('../repositories/skill');
const { protect, authorize } = require('../middlewares/auth');

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

router.get('/stats', protect, authorize('admin'), AdminController.getDashboardStats);
router.get('/chart-stats', protect, authorize('admin'), AdminController.getChartStats);

// Exports (MUST be before parametric :id routes to avoid shadowing)
router.get('/logs/export', protect, authorize('admin'), async (req, res, next) => {
  try {
    const logs = await require('../repositories/activity-log').findAll({ limit: 10000, offset: 0 });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=logs-export-${Date.now()}.json`);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});
router.get('/tickets/export', protect, authorize('admin'), async (req, res, next) => {
  try {
    const tickets = await require('../repositories/support-ticket').findAll({
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
router.get('/users/export', protect, authorize('admin'), async (req, res, next) => {
  try {
    const users = await require('../repositories/user').findAllWithFilters({
      limit: 10000,
      offset: 0,
    });
    const sanitized = users.map(({ password: _pw, ...rest }) => rest);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=users-export-${Date.now()}.json`);
    res.json({ success: true, data: sanitized });
  } catch (error) {
    next(error);
  }
});
router.get('/jobs/export', protect, authorize('admin'), async (req, res, next) => {
  try {
    const jobs = await require('../repositories/job').findAll();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=jobs-export-${Date.now()}.json`);
    res.json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
});
router.get('/applications/export', protect, authorize('admin'), async (req, res, next) => {
  try {
    const applications = await require('../repositories/application').findAll({
      limit: 10000,
      offset: 0,
    });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=applications-export-${Date.now()}.json`
    );
    res.json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
});

// Users
router.get('/users', protect, authorize('admin'), AdminController.getAllUsers);
router.get('/users/:id', protect, authorize('admin'), AdminController.getUserById);
router.patch('/users/:id/status', protect, authorize('admin'), AdminController.updateUserStatus);

// Companies
router.get('/companies', protect, authorize('admin'), CompanyController.getAllCompanies);
router.get('/companies/:id', protect, authorize('admin'), AdminController.getCompanyById);
router.patch('/companies/:id/verify', protect, authorize('admin'), CompanyController.verifyCompany);
router.delete('/companies/:id', protect, authorize('admin'), CompanyController.deleteCompany);

// Jobs
router.get('/jobs', protect, authorize('admin'), AdminController.getAllJobs);
router.get('/jobs/:id', protect, authorize('admin'), AdminController.getJobById);
router.patch('/jobs/:id/status', protect, authorize('admin'), AdminController.updateJobStatus);
router.delete('/jobs/:id', protect, authorize('admin'), AdminController.deleteJob);

// Applications
router.get('/applications', protect, authorize('admin'), AdminController.getAllApplications);

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
router.put('/settings', protect, authorize('admin'), AdminController.updateSettings);

// Blog (quản trị nội dung)
router.get('/blog/posts', protect, authorize('admin'), BlogController.listAdmin);
router.post('/blog/posts', protect, authorize('admin'), BlogController.createAdmin);
router.put('/blog/posts/:id', protect, authorize('admin'), BlogController.updateAdmin);
router.delete('/blog/posts/:id', protect, authorize('admin'), BlogController.deleteAdmin);

// Content
router.get('/banners', protect, authorize('admin'), AdminController.getBanners);
router.post('/banners', protect, authorize('admin'), AdminController.createBanner);
router.delete('/banners/:id', protect, authorize('admin'), AdminController.deleteBanner);

// Chatbot
router.get('/chatbot/stats', protect, authorize('admin'), AdminController.getChatStats);
router.get('/chatbot/sessions', protect, authorize('admin'), AdminController.getChatSessions);

// Categories (admin CRUD)
router.post('/categories', protect, authorize('admin'), CategoryController.createCategory);
router.put('/categories/:id', protect, authorize('admin'), CategoryController.updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), CategoryController.deleteCategory);

// Skills (admin CRUD)
router.post('/skills', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Skill name is required' });
    const id = await SkillRepository.create({ name, category: category || null });
    const skill = await SkillRepository.findById(id);
    res.status(201).json({ success: true, data: skill });
  } catch (error) {
    next(error);
  }
});
router.put('/skills/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const existing = await SkillRepository.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Skill not found' });
    const skill = await SkillRepository.update(req.params.id, req.body);
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
router.get('/backup', protect, authorize('admin'), AdminController.backupData);
router.post(
  '/restore',
  protect,
  authorize('admin'),
  backupUpload.single('backup'),
  AdminController.restoreData
);

module.exports = router;
