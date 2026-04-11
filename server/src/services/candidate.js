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
  if (skills === undefined) {
    return undefined;
  }

  if (skills === null) {
    return JSON.stringify([]);
  }

  if (Array.isArray(skills)) {
    return JSON.stringify(
      skills.map((skill) => (typeof skill === 'string' ? skill.trim() : '')).filter(Boolean)
    );
  }

  if (typeof skills === 'string') {
    const normalized = skills.trim();

    if (!normalized) {
      return JSON.stringify([]);
    }

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

class CandidateService {
  async getProfile(userId) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }
    return candidate;
  }

  async updateProfile(userId, data) {
    const candidate = await CandidateRepository.findByUserId(userId);
    if (!candidate) {
      const error = new Error('Candidate profile not found');
      error.statusCode = 404;
      throw error;
    }

    const { first_name, last_name, email, ...candidateData } = data;

    // Update user info if provided
    const userData = compactObject({ first_name, last_name, email });
    if (Object.keys(userData).length > 0) {
      await UserRepository.update(userId, userData);
    }

    // Update candidate info
    const sanitizedCandidateData = sanitizeCandidateData(candidateData);
    if (Object.keys(sanitizedCandidateData).length > 0) {
      await CandidateRepository.update(candidate.id, sanitizedCandidateData);
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

    if (Object.keys(updateData).length > 0) {
      await CandidateRepository.update(candidate.id, updateData);
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
}

module.exports = new CandidateService();
module.exports._private = {
  sanitizeCandidateData,
  normalizeJsonField,
  normalizeSkills,
};
