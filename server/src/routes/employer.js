/**
 * Employer Routes — mounts employer/recruiter profile endpoints.
 *
 * ⚠️   TABLE: Sử dụng `company_profiles`
 * ⚠️   ROLE: Sử dụng 'recruiter' thay vì 'employer'
 */
const express = require('express');
const router = express.Router();
const EmployerController = require('../controllers/employer');
const BlogController = require('../controllers/blog');
const CompanyMemberController = require('../controllers/companyMember');
const AuditController = require('../controllers/audit');
const CommunicationController = require('../controllers/communication');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { verifyUploadSignature } = require('../middlewares/verify-upload-signature');

// ─── Company Profile ───────────────────────────────────────────────────────────
router.get('/profile', protect, authorize('recruiter'), EmployerController.getProfile);
router.get('/me', protect, authorize('recruiter'), EmployerController.getProfile);
router.put('/profile', protect, authorize('recruiter'), EmployerController.updateProfile);
router.put('/me', protect, authorize('recruiter'), EmployerController.updateProfile);
router.post(
  '/upload-logo',
  protect,
  authorize('recruiter'),
  upload.single('logo'),
  verifyUploadSignature,
  EmployerController.uploadLogo
);

router.get(
  '/candidates/search',
  protect,
  authorize('recruiter'),
  EmployerController.searchCandidates
);
router.get('/talent-pool', protect, authorize('recruiter'), EmployerController.getTalentPool);
router.post(
  '/talent-pool/:candidateId',
  protect,
  authorize('recruiter'),
  EmployerController.saveCandidate
);
router.put(
  '/talent-pool/:candidateId',
  protect,
  authorize('recruiter'),
  EmployerController.updateSavedCandidate
);
router.delete(
  '/talent-pool/:candidateId',
  protect,
  authorize('recruiter'),
  EmployerController.removeSavedCandidate
);

// ─── Blog ─────────────────────────────────────────────────────────────────────
router.get('/blog/posts', protect, authorize('recruiter'), BlogController.listEmployer);
router.post('/blog/posts', protect, authorize('recruiter'), BlogController.createEmployer);
router.put('/blog/posts/:id', protect, authorize('recruiter'), BlogController.updateEmployer);
router.delete('/blog/posts/:id', protect, authorize('recruiter'), BlogController.deleteEmployer);

// ─── Team / Company Members ───────────────────────────────────────────────────
router.get('/team', protect, authorize('recruiter'), CompanyMemberController.listMembers);
router.post('/team/invite', protect, authorize('recruiter'), CompanyMemberController.inviteMember);
router.put(
  '/team/:userId/role',
  protect,
  authorize('recruiter'),
  CompanyMemberController.updateRole
);
router.put(
  '/team/:userId/permissions',
  protect,
  authorize('recruiter'),
  CompanyMemberController.updatePermissions
);
router.delete(
  '/team/:userId',
  protect,
  authorize('recruiter'),
  CompanyMemberController.removeMember
);
router.get(
  '/team/permissions',
  protect,
  authorize('recruiter'),
  CompanyMemberController.getMyPermissions
);

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get(
  '/audit/application/:applicationId',
  protect,
  authorize('recruiter'),
  AuditController.getApplicationAudit
);
router.get('/audit/job/:jobId', protect, authorize('recruiter'), AuditController.getJobAudit);
router.get(
  '/audit/communications',
  protect,
  authorize('recruiter'),
  AuditController.getCommunicationAudit
);
router.get('/audit/trail', protect, authorize('recruiter'), AuditController.getAuditTrail);

// ─── Communication ────────────────────────────────────────────────────────────
router.post(
  '/communications/send',
  protect,
  authorize('recruiter'),
  CommunicationController.sendEmail
);
router.post(
  '/communications/interview-invite',
  protect,
  authorize('recruiter'),
  CommunicationController.sendInterviewInvite
);
router.post(
  '/communications/rejection',
  protect,
  authorize('recruiter'),
  CommunicationController.sendRejection
);
router.post(
  '/communications/offer',
  protect,
  authorize('recruiter'),
  CommunicationController.sendOffer
);
router.post(
  '/communications/bulk',
  protect,
  authorize('recruiter'),
  CommunicationController.sendBulk
);
router.get(
  '/communications/history',
  protect,
  authorize('recruiter'),
  CommunicationController.getHistory
);
router.get(
  '/communications/templates',
  protect,
  authorize('recruiter'),
  CommunicationController.getTemplates
);
router.post(
  '/communications/templates',
  protect,
  authorize('recruiter'),
  CommunicationController.createTemplate
);
router.put(
  '/communications/templates/:id',
  protect,
  authorize('recruiter'),
  CommunicationController.updateTemplate
);
router.delete(
  '/communications/templates/:id',
  protect,
  authorize('recruiter'),
  CommunicationController.deleteTemplate
);

module.exports = router;
