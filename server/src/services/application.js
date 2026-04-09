const ApplicationRepository = require('../repositories/application');
const JobRepository = require('../repositories/job');
const SystemSettingsRepository = require('../repositories/system-settings');
const AppError = require('../utils/errorHandler');
const logger = require('../utils/logger');

class ApplicationService {
  async applyToJob(candidateId, jobId, applicationData) {
    const job = await JobRepository.findById(jobId);
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    if (job.status !== 'published') {
      throw new AppError('This job is no longer accepting applications', 400);
    }

    const existing = await ApplicationRepository.findByCandidateAndJob(candidateId, jobId);
    if (existing) {
      throw new AppError('You have already applied to this job', 400);
    }

    const applicationId = await ApplicationRepository.create({
      candidate_id: candidateId,
      job_id: jobId,
      resume_url: applicationData.resume_url,
      cover_letter: applicationData.cover_letter,
    });

    const aiScreeningEnabled = await SystemSettingsRepository.getBoolean(
      'ai_screening_enabled',
      true
    );

    if (aiScreeningEnabled) {
      this.triggerAIScreening(applicationId);
    }

    return applicationId;
  }

  async triggerAIScreening(applicationId) {
    try {
      const AIService = require('./ai');
      const application = await ApplicationRepository.findByIdWithDetails(applicationId);
      if (!application) return;

      const job = await JobRepository.findById(application.job_id);
      if (!job) return;

      const question = await AIService.generateScreeningQuestion(job);
      await ApplicationRepository.addScreeningResult(applicationId, question);
      await ApplicationRepository.updateStatus(
        applicationId,
        'screening',
        1,
        'AI Screening initiated'
      );
    } catch (error) {
      logger.error('AI screening trigger failed:', error);
    }
  }

  async getCandidateApplications(candidateId) {
    return await ApplicationRepository.findByCandidateId(candidateId);
  }

  async getCandidateNotifications(candidateId) {
    return await ApplicationRepository.getCandidateNotifications(candidateId);
  }

  async getCandidateApplication(applicationId, candidateId) {
    const application = await ApplicationRepository.findCandidateApplicationById(
      applicationId,
      candidateId
    );
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    return application;
  }

  async getCandidateApplicationHistory(applicationId, candidateId) {
    const application = await ApplicationRepository.findCandidateApplicationById(
      applicationId,
      candidateId
    );
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    return await ApplicationRepository.getHistory(applicationId);
  }

  async getJobApplications(jobId, employerId, isAdmin = false) {
    const job = await JobRepository.findById(jobId);
    if (!job) {
      throw new AppError('Job not found', 404);
    }
    if (!isAdmin && job.employer_id !== employerId) {
      throw new AppError('Not authorized to view these applications', 403);
    }
    return await ApplicationRepository.findByJobId(jobId);
  }

  async getApplication(applicationId, employerId, isAdmin = false) {
    const application = await ApplicationRepository.findByIdWithDetails(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (!isAdmin && application.employer_id !== employerId) {
      throw new AppError('Not authorized to view this application', 403);
    }

    return application;
  }

  async updateApplicationStatus(
    applicationId,
    employerId,
    userId,
    status,
    notes = null,
    isAdmin = false,
    data = {}
  ) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    const job = await JobRepository.findById(application.job_id);
    if (!job) {
      throw new AppError('Job not found', 404);
    }
    if (!isAdmin && job.employer_id !== employerId) {
      throw new AppError('Not authorized to update this application', 403);
    }

    return await ApplicationRepository.updateStatus(applicationId, status, userId, notes, {
      score: data.score,
    });
  }

  async addApplicationNote(applicationId, employerId, userId, notes, isAdmin = false) {
    if (!notes || !notes.trim()) {
      throw new AppError('Notes are required', 400);
    }

    const application = await ApplicationRepository.findById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    const job = await JobRepository.findById(application.job_id);
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    if (!isAdmin && job.employer_id !== employerId) {
      throw new AppError('Not authorized to add note to this application', 403);
    }

    return await ApplicationRepository.addHistoryNote(
      applicationId,
      userId,
      application.status,
      notes.trim()
    );
  }

  async getApplicationHistory(applicationId, employerId, isAdmin = false) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) throw new AppError('Application not found', 404);

    const job = await JobRepository.findById(application.job_id);
    if (!job) throw new AppError('Job not found', 404);
    if (!isAdmin && job.employer_id !== employerId) {
      throw new AppError('Not authorized to view history', 403);
    }

    return await ApplicationRepository.getHistory(applicationId);
  }

  async getScreeningResults(applicationId, employerId, isAdmin = false) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) throw new AppError('Application not found', 404);

    const job = await JobRepository.findById(application.job_id);
    if (!job) throw new AppError('Job not found', 404);
    if (!isAdmin && job.employer_id !== employerId) {
      throw new AppError('Not authorized to view screening results', 403);
    }

    return await ApplicationRepository.getScreeningResults(applicationId);
  }
}

module.exports = new ApplicationService();
