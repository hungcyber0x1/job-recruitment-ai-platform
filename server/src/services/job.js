/**
 * Job Service — business logic for job management.
 *
 * ⚠️   TABLE: Sử dụng `company_profiles` thay vì `employers`
 * ⚠️   FK: `company_id` (FK đến company_profiles) và `recruiter_id` (FK đến users)
 * ⚠️   STATUS: Sử dụng 'draft', 'pending_review', 'approved', 'rejected', 'published', 'expired', 'closed', 'suspended'
 */
const JobRepository = require('../models/Job');
const CompanyRepository = require('../models/Company');
const SystemSettingsRepository = require('../models/SystemSettings');
const { isDeadlineDateBeforeToday } = require('../utils/deadline');
const logger = require('../utils/logger');
const AIService = require('./ai');
const AppError = require('../utils/errorHandler');

const MAX_EMBEDDING_INPUT_CHARS = 5000;

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const JOB_TYPE_ALIASES = {
  'full-time': 'full_time',
  fulltime: 'full_time',
  full_time: 'full_time',
  'part-time': 'part_time',
  parttime: 'part_time',
  part_time: 'part_time',
  contract: 'contract',
  internship: 'internship',
  freelance: 'freelance',
  remote: 'remote',
};

function normalizeJobType(value) {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  return JOB_TYPE_ALIASES[normalized] || normalized;
}

function normalizeOptionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numericValue =
    typeof value === 'string' ? Number(value.replace(/,/g, '').trim()) : Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeBooleanFlag(value) {
  if (value === true || value === 1) return 1;
  if (value === false || value === 0) return 0;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return 1;
    if (['0', 'false', 'no', 'off', ''].includes(normalized)) return 0;
  }

  return 0;
}

function normalizeVacancies(value) {
  const numericValue = Number.parseInt(value, 10);
  if (!Number.isFinite(numericValue) || numericValue < 1) {
    return 1;
  }

  return Math.min(numericValue, 9999);
}

class JobService {
  assertPublishDeadline(status, deadline) {
    if (status !== 'published' || !deadline) return;
    if (isDeadlineDateBeforeToday(deadline)) {
      throw new AppError('Hạn nộp hồ sơ không được chọn ngày đã qua.', 400);
    }
  }

  normalizeJobData(jobData = {}, isUpdate = false) {
    const data = {
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements,
      benefits: jobData.benefits,
      salary_min: jobData.salary_min,
      salary_max: jobData.salary_max,
      salary_display: jobData.salary_display,
      salary_negotiable: jobData.salary_negotiable,
      vacancies: jobData.vacancies,
      category_id: jobData.category_id,
      location: jobData.location,
      address: jobData.address,
      job_type: normalizeJobType(jobData.job_type || jobData.type),
      status: jobData.status,
      education_required: jobData.education_required,
      deadline: jobData.deadline,
      job_embedding: jobData.job_embedding,
    };

    if (isUpdate) {
      const definedData = Object.fromEntries(
        Object.entries(data).filter(([key, _value]) => {
          if (key === 'job_type' && hasOwn(jobData, 'type')) {
            return true;
          }
          return hasOwn(jobData, key);
        })
      );

      if (hasOwn(definedData, 'salary_min')) {
        definedData.salary_min = normalizeOptionalNumber(definedData.salary_min);
      }
      if (hasOwn(definedData, 'salary_max')) {
        definedData.salary_max = normalizeOptionalNumber(definedData.salary_max);
      }
      if (hasOwn(definedData, 'salary_negotiable')) {
        definedData.salary_negotiable = normalizeBooleanFlag(definedData.salary_negotiable);
      }
      if (hasOwn(definedData, 'vacancies')) {
        definedData.vacancies = normalizeVacancies(definedData.vacancies);
      }
      if (hasOwn(definedData, 'job_type')) {
        definedData.job_type = normalizeJobType(definedData.job_type);
      }

      return definedData;
    }

    return {
      ...data,
      requirements: data.requirements || null,
      benefits: data.benefits || null,
      salary_min: normalizeOptionalNumber(data.salary_min),
      salary_max: normalizeOptionalNumber(data.salary_max),
      salary_negotiable: normalizeBooleanFlag(data.salary_negotiable),
      vacancies: normalizeVacancies(data.vacancies),
      category_id: data.category_id ?? null,
      location: data.location || null,
      address: data.address || null,
      status: data.status || 'draft',
      deadline: data.deadline || null,
      education_required: data.education_required || 'any',
      job_embedding: data.job_embedding ?? null,
    };
  }

  async enforcePublishRules(companyId, recruiterId, jobData = {}) {
    if (jobData.status !== 'published') {
      return jobData;
    }

    const companyModerationRequired = await SystemSettingsRepository.getBoolean(
      'company_moderation_required',
      true
    );

    if (!companyModerationRequired) {
      return jobData;
    }

    const company = await CompanyRepository.findById(companyId);
    if (!company || !company.is_verified) {
      return { ...jobData, status: 'pending_review' };
    }

    return jobData;
  }

  async getAllJobs(filters) {
    return await JobRepository.findWithDetails(filters);
  }

  async getJobById(id, options = {}) {
    const includeDeleted = options.allowDeleted === true;
    const job = await JobRepository.findByIdWithDetails(id, { includeDeleted });
    if (!job) {
      throw new AppError('Job not found', 404);
    }
    return job;
  }

  async getJobsByCompany(companyId) {
    return await JobRepository.findByCompany(companyId);
  }

  async createJob(companyId, recruiterId, jobData) {
    let embedding = null;
    try {
      const aiModerationEnabled = await SystemSettingsRepository.getBoolean('ai_moderation', true);
      if (aiModerationEnabled) {
        const textToEmbed = `${jobData.title} ${jobData.description} ${jobData.requirements || ''}`;
        embedding = await AIService.embedContent(
          textToEmbed.substring(0, MAX_EMBEDDING_INPUT_CHARS)
        );
      }
    } catch (err) {
      logger.warn(`Job embedding generation failed: ${err.message}`);
    }

    const moderatedJobData = await this.enforcePublishRules(companyId, recruiterId, jobData);
    const normalizedJobData = this.normalizeJobData({
      ...moderatedJobData,
      job_embedding: embedding ? JSON.stringify(embedding) : null,
    });
    this.assertPublishDeadline(normalizedJobData.status, normalizedJobData.deadline);

    const jobId = await JobRepository.create({
      ...normalizedJobData,
      company_id: companyId,
      recruiter_id: recruiterId,
    });

    if (normalizedJobData.status === 'published') {
      this.triggerModeration(jobId);
    }

    return { id: jobId, status: normalizedJobData.status };
  }

  async updateJob(id, jobData, options = {}) {
    const currentJob = await this.getJobById(id, { allowDeleted: true });
    const targetCompanyId = options.companyId ?? currentJob.company_id;

    if (jobData.title || jobData.description || jobData.requirements) {
      try {
        const textToEmbed = `${jobData.title || ''} ${jobData.description || ''} ${jobData.requirements || ''}`;
        if (textToEmbed.trim().length > 10) {
          const emb = await AIService.embedContent(
            textToEmbed.substring(0, MAX_EMBEDDING_INPUT_CHARS)
          );
          jobData.job_embedding = JSON.stringify(emb);
        }
      } catch (err) {
        logger.warn(`Job embedding update failed: ${err.message}`);
      }
    }

    const moderatedJobData = await this.enforcePublishRules(targetCompanyId, options.recruiterId, jobData);
    const definedJobData = this.normalizeJobData(moderatedJobData, true);
    if (options.companyId != null && options.companyId !== currentJob.company_id) {
      definedJobData.company_id = options.companyId;
    }

    const nextStatus = Object.prototype.hasOwnProperty.call(definedJobData, 'status')
      ? definedJobData.status
      : currentJob.status;
    const nextDeadline = Object.prototype.hasOwnProperty.call(definedJobData, 'deadline')
      ? definedJobData.deadline
      : currentJob.deadline;
    this.assertPublishDeadline(nextStatus, nextDeadline);

    const updated = await JobRepository.update(id, definedJobData);

    if (definedJobData.status === 'published') {
      this.triggerModeration(id);
    }

    return { updated, status: nextStatus };
  }

  async triggerModeration(jobId) {
    try {
      const aiModerationEnabled = await SystemSettingsRepository.getBoolean('ai_moderation', true);
      if (!aiModerationEnabled) {
        return;
      }

      const job = await JobRepository.findByIdWithDetails(jobId, { includeDeleted: true });
      if (!job) return;

      const moderation = await AIService.moderateJob(job);
      await JobRepository.flagJob(jobId, moderation.isFlagged, moderation.note);
    } catch (error) {
      logger.error(`Moderation trigger failed: ${error.message}`);
    }
  }

  async deleteJob(id) {
    return await JobRepository.delete(id);
  }
}

module.exports = new JobService();
