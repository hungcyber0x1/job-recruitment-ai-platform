/**
 * Candidate Controller — handles candidate-specific HTTP requests.
 *
 * ⚠️   TABLE: Sử dụng `candidate_profiles`
 */
const CandidateService = require('../services/candidate');
const UserService = require('../services/user');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

const DEFAULT_PRIVACY_VISIBLE_FIELDS = ['skills', 'experience', 'education'];
const PRIVACY_BOOLEAN_KEYS = [
  'profile_visible_to_recruiters',
  'show_cv_to_recruiters',
  'allow_recruiter_messages',
  'show_applications_public',
];

const normalizePrivacyVisibility = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized === 'public' || normalized === 'private' ? normalized : null;
};

const resolveProfileVisibility = (body = {}) => {
  if (typeof body.profile_visible_to_recruiters === 'boolean') {
    return body.profile_visible_to_recruiters ? 'public' : 'private';
  }
  return normalizePrivacyVisibility(body.profile_visibility);
};

const sanitizeVisibleFields = (fields) => {
  if (!Array.isArray(fields)) return DEFAULT_PRIVACY_VISIBLE_FIELDS;
  return [
    ...new Set(
      fields
        .filter((field) => typeof field === 'string' && field.trim())
        .map((field) => field.trim())
    ),
  ];
};

const buildPrivacyOverrides = (body = {}) => {
  const overrides = {};
  PRIVACY_BOOLEAN_KEYS.forEach((key) => {
    if (typeof body[key] === 'boolean') {
      overrides[key] = body[key];
    }
  });

  const visibility = resolveProfileVisibility(body);
  if (visibility) {
    overrides.profile_visibility = visibility;
    overrides.profile_visible_to_recruiters = visibility === 'public';
  }

  if (Array.isArray(body.visible_fields)) {
    overrides.visible_fields = sanitizeVisibleFields(body.visible_fields);
  }

  return overrides;
};

const toPrivacySettingsResponse = (profile = {}, overrides = {}) => {
  const profileVisibility = normalizePrivacyVisibility(profile.profile_visibility) || 'public';
  const profileVisible = profileVisibility === 'public';

  return {
    profile_visibility: profileVisibility,
    profile_visible_to_recruiters: profileVisible,
    show_cv_to_recruiters: profileVisible,
    allow_recruiter_messages: true,
    show_applications_public: false,
    visible_fields: DEFAULT_PRIVACY_VISIBLE_FIELDS,
    last_updated: profile.updated_at || profile.updatedAt || null,
    ...overrides,
  };
};

const CandidateController = {
  // ─── Existing handlers ───────────────────────────────────────────────────────

  getProfile: catchAsync(async (req, res) => {
    const profile = await CandidateService.getProfile(req.user.id);
    return ApiResponse.success(res, profile);
  }),

  updateProfile: catchAsync(async (req, res) => {
    const profile = await CandidateService.updateProfile(req.user.id, req.body);
    return ApiResponse.success(res, profile);
  }),

  getPrivacySettings: catchAsync(async (req, res) => {
    const profile = await CandidateService.getProfile(req.user.id);
    return ApiResponse.success(res, toPrivacySettingsResponse(profile));
  }),

  updatePrivacySettings: catchAsync(async (req, res) => {
    const visibility = resolveProfileVisibility(req.body);
    const profile = visibility
      ? await CandidateService.updateProfile(req.user.id, { profile_visibility: visibility })
      : await CandidateService.getProfile(req.user.id);

    return ApiResponse.success(
      res,
      toPrivacySettingsResponse(profile, buildPrivacyOverrides(req.body)),
      { message: 'Privacy settings updated successfully' }
    );
  }),

  updatePrivacyFields: catchAsync(async (req, res) => {
    const profile = await CandidateService.getProfile(req.user.id);
    return ApiResponse.success(
      res,
      toPrivacySettingsResponse(profile, {
        visible_fields: sanitizeVisibleFields(req.body?.visible_fields),
      }),
      { message: 'Privacy fields updated successfully' }
    );
  }),

  getCvAccessLogs: catchAsync(async (req, res) => {
    const rawLimit = Number(req.query?.limit);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 50) : 10;

    return ApiResponse.success(res, [], {
      pagination: { page: 1, limit, total: 0, totalPages: 0 },
    });
  }),

  uploadResume: catchAsync(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 400, 'No file uploaded');
    }
    const resumeUrl = `/uploads/cvs/${req.file.filename}`;
    const profile = await CandidateService.updateProfile(req.user.id, { resume_url: resumeUrl });
    return ApiResponse.success(res, profile, { message: 'Resume uploaded successfully' });
  }),

  uploadAvatar: catchAsync(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 400, 'No file uploaded');
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await UserService.updateUserAvatar(req.user.id, avatarUrl);
    return ApiResponse.success(
      res,
      { avatar_url: user.avatar_url },
      { message: 'Avatar uploaded successfully' }
    );
  }),

  uploadProjectImage: catchAsync(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 400, 'No file uploaded');
    }
    const imageUrl = `/uploads/projects/${req.file.filename}`;
    return ApiResponse.success(
      res,
      { url: imageUrl },
      { message: 'Project image uploaded successfully' }
    );
  }),

  syncAIProfile: catchAsync(async (req, res) => {
    const { skills, role_level } = req.body;
    const result = await CandidateService.syncAIProfile(req.user.id, { skills, role_level });
    return ApiResponse.success(res, result, {
      message: 'Profile synced with AI analysis successfully',
    });
  }),

  getSavedJobs: catchAsync(async (req, res) => {
    const jobs = await CandidateService.getSavedJobs(req.user.id);
    return ApiResponse.success(res, jobs);
  }),

  saveJob: catchAsync(async (req, res) => {
    const { job_id } = req.body;
    if (!job_id) {
      return ApiResponse.error(res, 400, 'job_id is required');
    }
    await CandidateService.saveJob(req.user.id, job_id);
    return ApiResponse.success(res, null, { message: 'Job saved successfully' });
  }),

  unsaveJob: catchAsync(async (req, res) => {
    const { jobId } = req.params;
    if (!jobId) {
      return ApiResponse.error(res, 400, 'jobId is required');
    }
    await CandidateService.unsaveJob(req.user.id, parseInt(jobId, 10));
    return ApiResponse.success(res, null, { message: 'Job removed from saved list' });
  }),

  // ─── Saved Companies ────────────────────────────────────────────────────────

  getSavedCompanies: catchAsync(async (req, res) => {
    const companies = await CandidateService.getSavedCompanies(req.user.id);
    return ApiResponse.success(res, companies);
  }),

  saveCompany: catchAsync(async (req, res) => {
    const { company_id } = req.body;
    if (!company_id) {
      return ApiResponse.error(res, 400, 'company_id is required');
    }
    await CandidateService.saveCompany(req.user.id, parseInt(company_id, 10));
    return ApiResponse.success(res, null, { message: 'Company saved successfully' });
  }),

  unsaveCompany: catchAsync(async (req, res) => {
    const { companyId } = req.params;
    if (!companyId) {
      return ApiResponse.error(res, 400, 'companyId is required');
    }
    await CandidateService.unsaveCompany(req.user.id, parseInt(companyId, 10));
    return ApiResponse.success(res, null, { message: 'Company removed from saved list' });
  }),

  checkCompanySaved: catchAsync(async (req, res) => {
    const { companyId } = req.params;
    const saved = await CandidateService.isCompanySaved(req.user.id, parseInt(companyId, 10));
    return ApiResponse.success(res, { saved });
  }),

  // ─── Phase 1.1: Full Profile ────────────────────────────────────────────────

  getFullProfile: catchAsync(async (req, res) => {
    const profile = await CandidateService.getFullProfile(req.user.id);
    return ApiResponse.success(res, profile);
  }),

  // ─── Phase 1.1: Job Preferences ──────────────────────────────────────────────

  updatePreferences: catchAsync(async (req, res) => {
    const profile = await CandidateService.updatePreferences(req.user.id, req.body);
    return ApiResponse.success(res, profile, { message: 'Preferences updated successfully' });
  }),

  // ─── Phase 1.1: Skills ──────────────────────────────────────────────────────

  getSkills: catchAsync(async (req, res) => {
    const skills = await CandidateService.getSkills(req.user.id);
    return ApiResponse.success(res, skills);
  }),

  addSkill: catchAsync(async (req, res) => {
    let { skill_id, proficiency_level, years_experience, is_primary } = req.body;
    const { name } = req.body;

    if (!skill_id && !name) {
      return ApiResponse.error(res, 400, 'skill_id hoặc name là bắt buộc');
    }

    if (!skill_id && name) {
      const SkillModel = require('../models/Skill');
      let existingSkill = await SkillModel.findByName(name.trim());
      if (!existingSkill) {
        existingSkill = await SkillModel.createManaged({ name: name.trim() });
      }
      skill_id = existingSkill.id;
    }

    const skill = await CandidateService.addSkill(req.user.id, {
      skill_id,
      proficiency_level,
      years_experience,
      is_primary,
    });
    return ApiResponse.success(res, skill, { message: 'Skill added successfully' }, 201);
  }),

  updateSkill: catchAsync(async (req, res) => {
    const { skillId } = req.params;
    if (!skillId) {
      return ApiResponse.error(res, 400, 'skillId is required');
    }
    const { proficiency_level, years_experience, is_primary } = req.body;
    const skill = await CandidateService.updateSkill(req.user.id, parseInt(skillId, 10), {
      proficiency_level,
      years_experience,
      is_primary,
    });
    return ApiResponse.success(res, skill, { message: 'Skill updated successfully' });
  }),

  deleteSkill: catchAsync(async (req, res) => {
    const { skillId } = req.params;
    if (!skillId) {
      return ApiResponse.error(res, 400, 'skillId is required');
    }
    await CandidateService.deleteSkill(req.user.id, parseInt(skillId, 10));
    return ApiResponse.success(res, null, { message: 'Skill removed successfully' });
  }),

  // ─── Phase 1.1: Education ───────────────────────────────────────────────────

  getEducation: catchAsync(async (req, res) => {
    const items = await CandidateService.getEducation(req.user.id);
    return ApiResponse.success(res, items);
  }),

  addEducationItem: catchAsync(async (req, res) => {
    const item = await CandidateService.addEducation(req.user.id, req.body);
    return ApiResponse.success(res, item, { message: 'Education added successfully' }, 201);
  }),

  updateEducationItem: catchAsync(async (req, res) => {
    const { eduId } = req.params;
    if (!eduId) {
      return ApiResponse.error(res, 400, 'eduId is required');
    }
    const item = await CandidateService.updateEducation(req.user.id, eduId, req.body);
    if (!item) {
      return ApiResponse.error(res, 404, 'Education item not found');
    }
    return ApiResponse.success(res, item, { message: 'Education updated successfully' });
  }),

  deleteEducationItem: catchAsync(async (req, res) => {
    const { eduId } = req.params;
    if (!eduId) {
      return ApiResponse.error(res, 400, 'eduId is required');
    }
    const deleted = await CandidateService.deleteEducation(req.user.id, eduId);
    if (!deleted) {
      return ApiResponse.error(res, 404, 'Education item not found');
    }
    return ApiResponse.success(res, null, { message: 'Education removed successfully' });
  }),

  // ─── Phase 1.1: Experience ─────────────────────────────────────────────────

  getExperience: catchAsync(async (req, res) => {
    const items = await CandidateService.getExperience(req.user.id);
    return ApiResponse.success(res, items);
  }),

  addExperienceItem: catchAsync(async (req, res) => {
    const item = await CandidateService.addExperience(req.user.id, req.body);
    return ApiResponse.success(res, item, { message: 'Experience added successfully' }, 201);
  }),

  updateExperienceItem: catchAsync(async (req, res) => {
    const { expId } = req.params;
    if (!expId) {
      return ApiResponse.error(res, 400, 'expId is required');
    }
    const item = await CandidateService.updateExperience(req.user.id, expId, req.body);
    if (!item) {
      return ApiResponse.error(res, 404, 'Experience not found');
    }
    return ApiResponse.success(res, item, { message: 'Experience updated successfully' });
  }),

  deleteExperienceItem: catchAsync(async (req, res) => {
    const { expId } = req.params;
    if (!expId) {
      return ApiResponse.error(res, 400, 'expId is required');
    }
    const deleted = await CandidateService.deleteExperience(req.user.id, expId);
    if (!deleted) {
      return ApiResponse.error(res, 404, 'Experience not found');
    }
    return ApiResponse.success(res, null, { message: 'Experience removed successfully' });
  }),

  // ─── Phase 1.1: Dashboard Stats ─────────────────────────────────────────────

  getDashboardStats: catchAsync(async (req, res) => {
    const stats = await CandidateService.getDashboardStats(req.user.id);
    return ApiResponse.success(res, stats);
  }),

  getProfileAnalyticsDashboard: catchAsync(async (req, res) => {
    const dashboard = await CandidateService.getProfileAnalyticsDashboard(req.user.id);
    return ApiResponse.success(res, dashboard);
  }),
};

module.exports = CandidateController;
