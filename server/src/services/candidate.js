/**
 * Candidate Service — business logic for candidate profile management.
 */
const CandidateRepository = require('../models/Candidate');
const UserRepository = require('../models/User');

const compactObject = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );

const CANDIDATE_COLUMNS = new Set([
  'bio',
  'experience_years',
  'current_job_title',
  'education_level',
  'education',
  'experience',
  'location',
  'resume_url',
  'projects',
  'phone',
  'profile_visibility',
  // Phase 1.1
  'job_search_status',
  'expected_salary_min',
  'expected_salary_max',
  'salary_currency',
  'preferred_job_types',
  'preferred_locations',
  'willing_to_relocate',
  'languages',
  'certifications',
  'social_links',
]);

const normalizeJsonField = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (Array.isArray(value) || typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
};

const sanitizeCandidateData = (payload) => {
  const normalized = {
    ...payload,
    education: normalizeJsonField(payload.education),
    experience: normalizeJsonField(payload.experience),
    projects: normalizeJsonField(payload.projects),
    // Phase 1.1 JSON fields
    preferred_job_types: normalizeJsonField(payload.preferred_job_types),
    preferred_locations: normalizeJsonField(payload.preferred_locations),
    languages: normalizeJsonField(payload.languages),
    certifications: normalizeJsonField(payload.certifications),
    social_links: normalizeJsonField(payload.social_links),
  };

  const filtered = compactObject(
    Object.fromEntries(Object.entries(normalized).filter(([key]) => CANDIDATE_COLUMNS.has(key)))
  );

  if (filtered.profile_visibility != null) {
    const v = String(filtered.profile_visibility).toLowerCase();
    if (v === 'public' || v === 'private') {
      filtered.profile_visibility = v;
    } else {
      delete filtered.profile_visibility;
    }
  }

  return filtered;
};

const normalizeSkills = (skills) => {
  if (skills === undefined) return undefined;
  if (skills === null) return JSON.stringify([]);
  if (Array.isArray(skills)) {
    return JSON.stringify(
      skills.map((skill) => (typeof skill === 'string' ? skill.trim() : '')).filter(Boolean)
    );
  }
  if (typeof skills === 'string') {
    const normalized = skills.trim();
    if (!normalized) return JSON.stringify([]);
    try {
      const parsed = JSON.parse(normalized);
      return Array.isArray(parsed)
        ? JSON.stringify(parsed.filter(Boolean))
        : JSON.stringify([normalized]);
    } catch {
      return JSON.stringify(
        normalized
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
      );
    }
  }
  return JSON.stringify([]);
};

const withCandidateFieldAliases = (payload = {}) => {
  const normalizedLocation = payload.location ?? payload.address;
  return {
    ...payload,
    current_job_title: payload.current_job_title ?? payload.title,
    location: normalizedLocation,
  };
};

const preferFilledString = (...values) => {
  for (const value of values) {
    if (value == null) continue;
    const normalized = String(value).trim();
    if (normalized) {
      return normalized;
    }
  }
  return '';
};

const parseStructuredValue = (value, fallbackValue) => {
  if (value === undefined || value === null || value === '') return fallbackValue;
  if (Array.isArray(fallbackValue)) {
    if (Array.isArray(value)) return value;
  }
  if (
    fallbackValue &&
    typeof fallbackValue === 'object' &&
    !Array.isArray(fallbackValue) &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(fallbackValue)) {
        return Array.isArray(parsed) ? parsed : fallbackValue;
      }
      if (fallbackValue && typeof fallbackValue === 'object' && !Array.isArray(fallbackValue)) {
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? parsed
          : fallbackValue;
      }
      return parsed;
    } catch {
      return fallbackValue;
    }
  }
  return value;
};

const toCandidateProfileContract = (candidate = {}) => {
  const education = parseStructuredValue(candidate.education, []);
  const experience = parseStructuredValue(candidate.experience, []);
  const projects = parseStructuredValue(candidate.projects, []);
  const preferredJobTypes = parseStructuredValue(candidate.preferred_job_types, []);
  const preferredLocations = parseStructuredValue(candidate.preferred_locations, []);
  const languages = parseStructuredValue(candidate.languages, []);
  const certifications = parseStructuredValue(candidate.certifications, []);
  const socialLinks = parseStructuredValue(candidate.social_links, {});
  const targetIndustries = parseStructuredValue(candidate.target_industries, []);

  return {
    ...candidate,
    education,
    experience,
    projects,
    preferred_job_types: preferredJobTypes,
    preferred_locations: preferredLocations,
    languages,
    certifications,
    social_links: socialLinks,
    target_industries: targetIndustries,
    title: preferFilledString(candidate.current_job_title),
    phone: preferFilledString(candidate.phone, candidate.user_phone),
    location: preferFilledString(candidate.location, candidate.user_address),
  };
};

const toFullCandidateProfileContract = (candidate = {}) => {
  const base = toCandidateProfileContract(candidate);
  const education = parseStructuredValue(base.education, []);
  const experience = parseStructuredValue(base.experience, []);
  const projects = parseStructuredValue(base.projects, []);
  const preferredJobTypes = parseStructuredValue(base.preferred_job_types, []);
  const preferredLocations = parseStructuredValue(base.preferred_locations, []);
  const languages = parseStructuredValue(base.languages, []);
  const certifications = parseStructuredValue(base.certifications, []);
  const socialLinks = parseStructuredValue(base.social_links, {});
  const targetIndustries = parseStructuredValue(base.target_industries, []);
  const yearsOfExperience = base.years_of_experience ?? base.experience_years ?? null;

  return {
    ...base,
    education,
    experience,
    experiences: Array.isArray(base.experiences) ? base.experiences : experience,
    projects,
    preferred_job_types: preferredJobTypes,
    preferred_locations: preferredLocations,
    languages,
    certifications,
    social_links: socialLinks,
    target_industries: targetIndustries,
    years_of_experience: yearsOfExperience,
  };
};

class CandidateService {
  async getProfile(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return toCandidateProfileContract(candidate);
  }

  async updateProfile(userId, data) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }

    const normalizedInput = withCandidateFieldAliases(data);
    const {
      first_name,
      last_name,
      email,
      gender,
      region,
      phone,
      location,
      title: _title,
      address: _address,
      current_job_title,
      ...candidateData
    } = normalizedInput;

    const userData = compactObject({
      first_name,
      last_name,
      email,
      gender,
      region,
      phone,
      address: location,
    });
    if (Object.keys(userData).length > 0) {
      await UserRepository.update(userId, userData);
    }

    const cleanedCandidateData = {
      ...candidateData,
      current_job_title,
      phone,
      location,
    };

    const sanitizedCandidateData = sanitizeCandidateData(cleanedCandidateData);
    if (Object.prototype.hasOwnProperty.call(cleanedCandidateData, 'resume_url')) {
      const normalizedResumeUrl =
        cleanedCandidateData.resume_url == null
          ? null
          : String(cleanedCandidateData.resume_url).trim();
      sanitizedCandidateData.resume_url = normalizedResumeUrl || null;
    }

    const supportedCandidateData =
      typeof CandidateRepository.filterSupportedFields === 'function'
        ? await CandidateRepository.filterSupportedFields(sanitizedCandidateData)
        : sanitizedCandidateData;

    if (Object.keys(supportedCandidateData).length > 0) {
      await CandidateRepository.update(candidate.id, supportedCandidateData);
    }

    return await this.getProfile(userId);
  }

  async syncAIProfile(userId, { skills, role_level }) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }

    const updateData = sanitizeCandidateData({
      current_job_title: typeof role_level === 'string' ? role_level : undefined,
    });

    const supportedUpdateData =
      typeof CandidateRepository.filterSupportedFields === 'function'
        ? await CandidateRepository.filterSupportedFields(updateData)
        : updateData;

    if (Object.keys(supportedUpdateData).length > 0) {
      await CandidateRepository.update(candidate.id, supportedUpdateData);
    }

    if (skills) {
      const normalizedSkills = normalizeSkills(skills);
      try {
        const parsed = JSON.parse(normalizedSkills);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await CandidateRepository.syncSkills(candidate.id, parsed);
        }
      } catch {
        /* skip if invalid */
      }
    }

    return await this.getProfile(userId);
  }

  async getSavedJobs(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.getSavedJobs(candidate.id);
  }

  async saveJob(userId, jobId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.saveJob(candidate.id, jobId);
  }

  async unsaveJob(userId, jobId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.unsaveJob(candidate.id, jobId);
  }

  async isJobSaved(userId, jobId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      return false;
    }
    return await CandidateRepository.isJobSaved(candidate.id, jobId);
  }

  // ─── Saved Companies ──────────────────────────────────────────────────────

  async getSavedCompanies(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.getSavedCompanies(candidate.id);
  }

  async saveCompany(userId, companyId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.saveCompany(candidate.id, companyId);
  }

  async unsaveCompany(userId, companyId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.unsaveCompany(candidate.id, companyId);
  }

  async isCompanySaved(userId, companyId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) return false;
    return await CandidateRepository.isCompanySaved(candidate.id, companyId);
  }

  // ─── Phase 1.1: Full Profile ──────────────────────────────────────────────

  async getFullProfile(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    const full = await CandidateRepository.findByIdFull(candidate.id);
    if (!full) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }

    const skills = await CandidateRepository.getSkillsWithLevels(candidate.id);
    const education = await CandidateRepository.getEducation(candidate.id);
    const experience = await CandidateRepository.getExperience(candidate.id);
    const languages = await CandidateRepository.getLanguages(candidate.id);
    const certifications = await CandidateRepository.getCertifications(candidate.id);
    const socialLinks = await CandidateRepository.getSocialLinks(candidate.id);

    return toFullCandidateProfileContract({
      ...full,
      skills,
      education,
      experience,
      languages,
      certifications,
      social_links: socialLinks,
    });
  }

  // ─── Phase 1.1: Job Preferences ───────────────────────────────────────────

  async updatePreferences(userId, data) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }

    await CandidateRepository.updatePreferences(candidate.id, data);
    await CandidateRepository.updateLastActive(candidate.id);

    return await this.getFullProfile(userId);
  }

  // ─── Phase 1.1: Skills ───────────────────────────────────────────────────

  async getSkills(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.getSkillsWithLevels(candidate.id);
  }

  async addSkill(userId, { skill_id, proficiency_level, years_experience, is_primary }) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.addSkill(candidate.id, parseInt(skill_id, 10), {
      proficiency_level,
      years_experience,
      is_primary,
    });
  }

  async updateSkill(userId, skillId, { proficiency_level, years_experience, is_primary }) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    const existing = await CandidateRepository.getSkillById(candidate.id, skillId);
    if (!existing) {
      const error = new Error('Skill not found');
      error.statusCode = 404;
      throw error;
    }
    await CandidateRepository.updateSkill(candidate.id, skillId, {
      proficiency_level,
      years_experience,
      is_primary,
    });
    return await CandidateRepository.getSkillById(candidate.id, skillId);
  }

  async deleteSkill(userId, skillId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.removeSkill(candidate.id, skillId);
  }

  // ─── Phase 1.1: Education ─────────────────────────────────────────────────

  async getEducation(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.getEducation(candidate.id);
  }

  async addEducation(userId, item) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.addEducation(candidate.id, item);
  }

  async updateEducation(userId, eduId, data) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.updateEducation(candidate.id, eduId, data);
  }

  async deleteEducation(userId, eduId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.deleteEducation(candidate.id, eduId);
  }

  // ─── Phase 1.1: Experience ────────────────────────────────────────────────

  async getExperience(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.getExperience(candidate.id);
  }

  async addExperience(userId, item) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.addExperience(candidate.id, item);
  }

  async updateExperience(userId, expId, data) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.updateExperience(candidate.id, expId, data);
  }

  async deleteExperience(userId, expId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.deleteExperience(candidate.id, expId);
  }

  // ─── Phase 1.1: Dashboard Stats ────────────────────────────────────────────

  async getDashboardStats(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.getDashboardStats(candidate.id);
  }

  async getProfileAnalyticsDashboard(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await CandidateRepository.getProfileAnalyticsDashboard(candidate.id);
  }
}

module.exports = new CandidateService();
module.exports._private = {
  sanitizeCandidateData,
  normalizeJsonField,
  normalizeSkills,
  toCandidateProfileContract,
  toFullCandidateProfileContract,
  withCandidateFieldAliases,
  preferFilledString,
  parseStructuredValue,
};
