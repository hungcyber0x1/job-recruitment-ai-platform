/**
 * Candidate Routes — mounts candidate profile, saved jobs, and upload endpoints.
 *
 * ⚠️   TABLE: Sử dụng `candidate_profiles`
 */
const express = require('express');
const router = express.Router();
const CandidateController = require('../controllers/candidate');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { verifyUploadSignature } = require('../middlewares/verify-upload-signature');

// ─── Existing routes ───────────────────────────────────────────────────────────

router.get('/profile', protect, authorize('candidate'), CandidateController.getProfile);
router.get('/me', protect, authorize('candidate'), CandidateController.getProfile);
router.put('/profile', protect, authorize('candidate'), CandidateController.updateProfile);
router.get('/privacy', protect, authorize('candidate'), CandidateController.getPrivacySettings);
router.put('/privacy', protect, authorize('candidate'), CandidateController.updatePrivacySettings);
router.put('/privacy/fields', protect, authorize('candidate'), CandidateController.updatePrivacyFields);
router.get('/cv-access-logs', protect, authorize('candidate'), CandidateController.getCvAccessLogs);
router.get('/saved-jobs', protect, authorize('candidate'), CandidateController.getSavedJobs);
router.post('/saved-jobs', protect, authorize('candidate'), CandidateController.saveJob);
router.delete('/saved-jobs/:jobId', protect, authorize('candidate'), CandidateController.unsaveJob);

// ─── Saved Companies ─────────────────────────────────────────────────────────
router.get('/saved-companies', protect, authorize('candidate'), CandidateController.getSavedCompanies);
router.post('/saved-companies', protect, authorize('candidate'), CandidateController.saveCompany);
router.delete('/saved-companies/:companyId', protect, authorize('candidate'), CandidateController.unsaveCompany);
router.get('/saved-companies/:companyId/check', protect, authorize('candidate'), CandidateController.checkCompanySaved);

router.post(
  '/upload-resume',
  protect,
  authorize('candidate'),
  upload.single('resume'),
  verifyUploadSignature,
  CandidateController.uploadResume
);
router.post(
  '/upload-avatar',
  protect,
  authorize('candidate'),
  upload.single('avatar'),
  verifyUploadSignature,
  CandidateController.uploadAvatar
);
router.post(
  '/upload-project-image',
  protect,
  authorize('candidate'),
  upload.single('project_image'),
  verifyUploadSignature,
  CandidateController.uploadProjectImage
);
router.post('/profile/sync-ai', protect, authorize('candidate'), CandidateController.syncAIProfile);

// ─── Phase 1.1: Full Profile ─────────────────────────────────────────────────

router.get('/full-profile', protect, authorize('candidate'), CandidateController.getFullProfile);

// ─── Phase 1.1: Job Preferences ───────────────────────────────────────────────

router.put('/preferences', protect, authorize('candidate'), CandidateController.updatePreferences);

// ─── Phase 1.1: Skills ───────────────────────────────────────────────────────

router.get('/skills', protect, authorize('candidate'), CandidateController.getSkills);
router.post('/skills', protect, authorize('candidate'), CandidateController.addSkill);
router.put('/skills/:skillId', protect, authorize('candidate'), CandidateController.updateSkill);
router.delete('/skills/:skillId', protect, authorize('candidate'), CandidateController.deleteSkill);

// ─── Phase 1.1: Education ─────────────────────────────────────────────────────

router.get('/education', protect, authorize('candidate'), CandidateController.getEducation);
router.post('/education', protect, authorize('candidate'), CandidateController.addEducationItem);
router.put('/education/:eduId', protect, authorize('candidate'), CandidateController.updateEducationItem);
router.delete('/education/:eduId', protect, authorize('candidate'), CandidateController.deleteEducationItem);

// ─── Phase 1.1: Experience ────────────────────────────────────────────────────

router.get('/experience', protect, authorize('candidate'), CandidateController.getExperience);
router.post('/experience', protect, authorize('candidate'), CandidateController.addExperienceItem);
router.put('/experience/:expId', protect, authorize('candidate'), CandidateController.updateExperienceItem);
router.delete('/experience/:expId', protect, authorize('candidate'), CandidateController.deleteExperienceItem);

// ─── Phase 1.1: Dashboard Stats ───────────────────────────────────────────────

router.get('/dashboard-stats', protect, authorize('candidate'), CandidateController.getDashboardStats);
router.get('/analytics/dashboard', protect, authorize('candidate'), CandidateController.getProfileAnalyticsDashboard);

module.exports = router;
