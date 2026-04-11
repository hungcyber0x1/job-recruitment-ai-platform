const JobRepository = require('../models/Job');
const EmployerRepository = require('../models/Employer');
const SystemSettingsRepository = require('../models/SystemSettings');
const { isDeadlineDateBeforeToday } = require('../utils/deadline');
const logger = require('../utils/logger');
const AIService = require('./ai');

const MAX_EMBEDDING_INPUT_CHARS = 5000;

const JOB_TYPE_MAP = {
  full_time: 'full-time',
  part_time: 'part-time',
};

class JobService {
  assertPublishDeadline(status, deadline) {
    if (status !== 'published' || !deadline) return;
    if (isDeadlineDateBeforeToday(deadline)) {
      const err = new Error('Hạn nộp hồ sơ không được chọn ngày đã qua.');
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }
  }

  normalizeJobData(jobData = {}) {
    const normalizedType = JOB_TYPE_MAP[jobData.type] || jobData.type;
    const experienceRequired = jobData.experience_required || jobData.experience_level || null;

    return {
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements || null,
      benefits: jobData.benefits || null,
      salary_min: jobData.salary_min ?? null,
      salary_max: jobData.salary_max ?? null,
      category_id: jobData.category_id ?? null,
      location: jobData.location || null,
      type: normalizedType || null,
      status: jobData.status || 'draft',
      deadline: jobData.deadline || null,
      education_required: jobData.education_required || 'any',
      experience_required: experienceRequired,
      job_embedding: jobData.job_embedding ?? null,
    };
  }

  async enforcePublishRules(employerId, jobData = {}) {
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

    const employer = await EmployerRepository.findById(employerId);
    if (!employer || !employer.is_verified) {
      return {
        ...jobData,
        status: 'pending',
      };
    }

    return jobData;
  }

  async getAllJobs(filters) {
    return await JobRepository.findWithDetails(filters);
  }

  /**
   * @param {number} id
   * @param {{ allowDeleted?: boolean }} [options] — employer/admin khi sửa/xóa cần allowDeleted: true
   */
  async getJobById(id, options = {}) {
    const includeDeleted = options.allowDeleted === true;
    const job = await JobRepository.findByIdWithDetails(id, { includeDeleted });
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }
    return job;
  }

  async getJobsByEmployer(employerId) {
    return await JobRepository.findByEmployer(employerId);
  }

  async createJob(employerId, jobData) {
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

    const moderatedJobData = await this.enforcePublishRules(employerId, jobData);
    const normalizedJobData = this.normalizeJobData({
      ...moderatedJobData,
      employer_id: employerId,
      job_embedding: embedding ? JSON.stringify(embedding) : null,
    });
    this.assertPublishDeadline(normalizedJobData.status, normalizedJobData.deadline);

    const jobId = await JobRepository.create({
      ...normalizedJobData,
      employer_id: employerId,
    });

    if (normalizedJobData.status === 'published') {
      this.triggerModeration(jobId);
    }

    return jobId;
  }

  async updateJob(id, jobData) {
    const currentJob = await this.getJobById(id, { allowDeleted: true });

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

    const moderatedJobData = await this.enforcePublishRules(currentJob.employer_id, jobData);
    const normalizedJobData = this.normalizeJobData(moderatedJobData);
    const definedJobData = Object.fromEntries(
      Object.entries(normalizedJobData).filter(([, value]) => value !== undefined)
    );

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

    return updated;
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
