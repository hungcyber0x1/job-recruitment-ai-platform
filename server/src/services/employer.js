/**
 * Employer Service — business logic for employer/recruiter profile management.
 *
 * ⚠️   TABLE: Sử dụng `company_profiles` thay vì `employers`
 * ⚠️   ROLE: Sử dụng 'recruiter' thay vì 'employer'
 */
const CompanyRepository = require('../models/Company');
const CandidateRepository = require('../models/Candidate');
const UserRepository = require('../models/User');
const AppError = require('../utils/errorHandler');
const { resolveRecruiterCompanyContext } = require('../utils/company-access');

const getActorId = (actor) => {
  const raw = typeof actor === 'object' ? actor?.id : actor;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeOptionalString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeListParam = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (value == null) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeCandidateFilters = (query = {}) => ({
  search: normalizeOptionalString(query.search ?? query.q),
  skills: normalizeListParam(query.skills ?? query.skill),
  location: normalizeOptionalString(query.location),
  level: normalizeOptionalString(query.level),
  salary: normalizeOptionalString(query.salary),
  folder: normalizeOptionalString(query.folder),
  sort: normalizeOptionalString(query.sort),
  page: query.page,
  limit: query.limit,
});

class EmployerService {
  async getCompanyForUser(actor) {
    const company = await resolveRecruiterCompanyContext(actor);
    if (!company) {
      throw new AppError('Company profile not found', 404);
    }
    return company;
  }

  async getProfile(actor) {
    return this.getCompanyForUser(actor);
  }

  async updateProfile(actor, data) {
    const actorId = getActorId(actor);
    const company = await this.getCompanyForUser(actor);

    if (!actorId || Number(company.user_id) !== actorId) {
      throw new AppError('Only the company owner can update this profile', 403);
    }

    const {
      first_name,
      last_name,
      email,
      gender,
      region,
      avatar_url,
      phone,
      location,
      address,
      company_name,
      company_logo,
      company_website,
      website,
      company_description,
      description,
      company_size,
      scale,
      industry,
      field,
      tax_code,
    } = data;

    const userData = {};
    const normalizedFirstName = normalizeOptionalString(first_name);
    const normalizedLastName = normalizeOptionalString(last_name);
    const normalizedEmail = normalizeOptionalString(email);
    const normalizedGender = normalizeOptionalString(gender);
    const normalizedRegion = normalizeOptionalString(region);

    if (normalizedFirstName !== undefined) userData.first_name = normalizedFirstName;
    if (normalizedLastName !== undefined) userData.last_name = normalizedLastName;
    if (normalizedEmail !== undefined) {
      if (!normalizedEmail) {
        throw new AppError('Email cannot be empty', 400);
      }
      userData.email = normalizedEmail;
    }
    if (normalizedGender !== undefined) userData.gender = normalizedGender;
    if (normalizedRegion !== undefined) userData.region = normalizedRegion;
    if (avatar_url !== undefined) {
      userData.avatar_url = normalizeOptionalString(avatar_url);
    }

    if (Object.keys(userData).length > 0) {
      await UserRepository.update(actorId, userData);
    }

    const canonicalCompanyData = {
      company_name,
      company_logo,
      company_website: company_website ?? website,
      company_description: company_description ?? description,
      company_size: company_size ?? scale,
      industry: industry ?? field,
      location: location ?? address,
      phone,
      tax_code,
    };

    const cleanedCompanyData = Object.entries(canonicalCompanyData).reduce((acc, [key, value]) => {
      const normalizedValue = normalizeOptionalString(value);
      if (normalizedValue !== undefined) {
        acc[key] = normalizedValue;
      }
      return acc;
    }, {});

    if (Object.keys(cleanedCompanyData).length > 0) {
      await CompanyRepository.update(company.id, cleanedCompanyData);
      const logo = cleanedCompanyData.company_logo;
      if (avatar_url === undefined && typeof logo === 'string') {
        await UserRepository.update(actorId, { avatar_url: logo.trim() || null });
      }
    }

    return await this.getProfile(actor);
  }

  async searchCandidates(actor, query = {}) {
    const company = await this.getCompanyForUser(actor);
    const filters = normalizeCandidateFilters(query);
    const result = await CandidateRepository.searchPublicForEmployer(company.id, filters);
    const savedTotal = await CandidateRepository.countEmployerSavedCandidates(company.id);

    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
      stats: {
        visibleCandidates: result.total,
        savedCandidates: savedTotal,
      },
    };
  }

  async getTalentPool(actor, query = {}) {
    const company = await this.getCompanyForUser(actor);
    const filters = normalizeCandidateFilters(query);
    const result = await CandidateRepository.getEmployerSavedCandidates(company.id, filters);
    const folderCounts = await CandidateRepository.getEmployerSavedFolderCounts(company.id);
    const savedTotal = folderCounts.reduce((sum, item) => sum + item.count, 0);

    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
      stats: {
        savedCandidates: savedTotal,
        folderCounts,
      },
    };
  }

  async saveCandidate(actor, candidateId, payload = {}) {
    const company = await this.getCompanyForUser(actor);
    const recruiterId = getActorId(actor);
    const parsedCandidateId = Number.parseInt(candidateId, 10);
    if (!Number.isFinite(parsedCandidateId) || parsedCandidateId <= 0) {
      throw new AppError('Invalid candidate id', 400);
    }

    const saved = await CandidateRepository.saveCandidateForEmployer({
      companyId: company.id,
      recruiterId,
      candidateId: parsedCandidateId,
      folder: payload.folder || 'general',
      notes: payload.notes,
    });

    if (!saved) throw new AppError('Candidate not found or not searchable', 404);
    return { candidate_id: parsedCandidateId, saved: true };
  }

  async updateSavedCandidate(actor, candidateId, payload = {}) {
    const company = await this.getCompanyForUser(actor);
    const parsedCandidateId = Number.parseInt(candidateId, 10);
    if (!Number.isFinite(parsedCandidateId) || parsedCandidateId <= 0) {
      throw new AppError('Invalid candidate id', 400);
    }

    const updated = await CandidateRepository.updateSavedCandidateForEmployer({
      companyId: company.id,
      candidateId: parsedCandidateId,
      folder: payload.folder,
      notes: payload.notes,
    });

    if (!updated) throw new AppError('Saved candidate not found', 404);
    return { candidate_id: parsedCandidateId, updated: true };
  }

  async removeSavedCandidate(actor, candidateId) {
    const company = await this.getCompanyForUser(actor);
    const parsedCandidateId = Number.parseInt(candidateId, 10);
    if (!Number.isFinite(parsedCandidateId) || parsedCandidateId <= 0) {
      throw new AppError('Invalid candidate id', 400);
    }

    await CandidateRepository.removeCandidateForEmployer(company.id, parsedCandidateId);
    return { candidate_id: parsedCandidateId, saved: false };
  }
}

module.exports = new EmployerService();
