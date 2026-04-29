const ApplicationRepository = require('../models/Application');
const InterviewScheduleRepository = require('../models/InterviewSchedule');
const ApplicationOfferRepository = require('../models/ApplicationOffer');
const JobRepository = require('../models/Job');
const AppError = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { pool } = require('../config/database.config');
const { APP_STATUS_VALUES } = require('../utils/constants');
const { isDeadlinePassed } = require('../utils/deadline');

const isDuplicateApplicationError = (error) =>
  error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062;

/**
 * Application Service — Xử lý nghiệp vụ Application
 *
 * Pipeline: submitted → shortlisted → interview_scheduled → interviewed → offered → hired
 * Side paths: rejected (từ bất kỳ stage nào), withdrawn (candidate tự rút)
 *
 * Side-effects theo stage:
 *  interview_scheduled → tạo interview_schedule, gửi email + notification candidate
 *  offered            → tạo application_offer, gửi email + notification candidate
 *  hired              → auto-reject các đơn pending khác của candidate, gửi email
 *  rejected           → gửi email notification candidate
 *  withdrawn          → gửi email notification recruiter
 */
class ApplicationService {
  /**
   * Ứng viên nộp đơn vào một tin tuyển dụng đang mở.
   *
   * Quy tắc nghiệp vụ:
   * - Chỉ cho phép nộp vào job published, chưa bị xoá và công ty chưa bị xoá.
   * - Chặn job đã quá hạn nộp hồ sơ.
   * - Một ứng viên chỉ được nộp một lần cho cùng một job, nhưng được nộp nhiều job khác nhau.
   * - Lỗi unique key từ DB được chuẩn hoá thành lỗi validation thân thiện.
   */
  async applyToJob(candidateId, jobId, applicationData = {}) {
    const numericCandidateId = Number.parseInt(candidateId, 10);
    const numericJobId = Number.parseInt(jobId, 10);

    if (!Number.isInteger(numericCandidateId) || !Number.isInteger(numericJobId)) {
      throw new AppError('Invalid candidate or job id', 400);
    }

    const connection = await pool.getConnection();
    let applicationId = null;

    try {
      await connection.beginTransaction();

      const [jobRows] = await connection.query(
        `SELECT j.id, j.status, j.company_id, j.deadline, j.title, j.recruiter_id
         FROM jobs j
         JOIN company_profiles cp ON j.company_id = cp.id
         WHERE j.id = ?
           AND j.deleted_at IS NULL
           AND cp.deleted_at IS NULL
         LIMIT 1`,
        [numericJobId]
      );
      const job = jobRows[0];

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      if (job.status !== 'published') {
        throw new AppError('Job is not open for applications', 400);
      }

      if (isDeadlinePassed(job.deadline)) {
        throw new AppError('Application deadline has passed', 400);
      }

      const [existingRows] = await connection.query(
        'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?',
        [numericCandidateId, numericJobId]
      );

      if (existingRows.length > 0) {
        throw new AppError('You have already applied to this job', 400);
      }

      const [result] = await connection.query(
        `INSERT INTO applications (candidate_id, job_id, cover_letter, resume_url, status)
         VALUES (?, ?, ?, ?, 'submitted')`,
        [
          numericCandidateId,
          numericJobId,
          applicationData.cover_letter ?? applicationData.coverLetter ?? null,
          applicationData.resume_url ?? applicationData.resumeUrl ?? null,
        ]
      );

      applicationId = result.insertId;
      await connection.commit();
    } catch (error) {
      await connection.rollback();

      if (error instanceof AppError) {
        throw error;
      }

      if (isDuplicateApplicationError(error)) {
        throw new AppError('You have already applied to this job', 400);
      }

      throw error;
    } finally {
      connection.release();
    }

    this.triggerAIScreening(applicationId).catch((error) => {
      logger.warn(`AI screening failed for application ${applicationId}: ${error.message}`);
    });

    return applicationId;
  }

  /**
   * Chấm điểm sơ bộ hồ sơ sau khi ứng tuyển. Đây là side-effect bất đồng bộ,
   * không được làm hỏng luồng nộp đơn nếu AI/DB phụ trợ gặp lỗi.
   */
  async triggerAIScreening(applicationId) {
    try {
      const SystemSettingsRepository = require('../models/SystemSettings');
      if (typeof SystemSettingsRepository.getBoolean === 'function') {
        const enabled = await SystemSettingsRepository.getBoolean('ai_screening_enabled', true);
        if (!enabled) return null;
      }

      const application = await ApplicationRepository.findByIdWithDetails(applicationId);
      if (!application) return null;

      const job = await JobRepository.findById(application.job_id);
      if (!job) return null;

      const AIService = require('./ai');
      if (typeof AIService.generateContent !== 'function') return null;

      const prompt = `Bạn là chuyên gia tuyển dụng. Chấm điểm mức độ phù hợp giữa ứng viên và tin tuyển dụng theo thang 0-100.

Ứng viên:
- Tên: ${application.candidate_name || 'Ứng viên'}
- Giới thiệu: ${application.bio || ''}
- Kinh nghiệm: ${JSON.stringify(application.experience || '')}
- Học vấn: ${JSON.stringify(application.education || '')}
- Kỹ năng: ${(application.skills || []).map((skill) => skill.name).join(', ')}

Tin tuyển dụng:
- Tiêu đề: ${job.title || application.job_title || ''}
- Mô tả: ${job.description || ''}
- Yêu cầu: ${job.requirements || ''}

Trả về duy nhất JSON hợp lệ dạng: {"score": number, "summary": "tóm tắt ngắn bằng tiếng Việt"}`;

      const response = await AIService.generateContent(prompt);
      const cleaned = typeof AIService.cleanJsonResponse === 'function'
        ? AIService.cleanJsonResponse(response)
        : response;
      const parsed = JSON.parse(cleaned);
      const rawScore = Number(parsed.score ?? parsed.ai_score);
      const aiScore = Number.isFinite(rawScore)
        ? Math.max(0, Math.min(100, rawScore))
        : null;
      const aiSummary = parsed.summary ? String(parsed.summary).slice(0, 2000) : null;

      if (aiScore == null && !aiSummary) {
        return null;
      }

      await pool.query(
        'UPDATE applications SET ai_score = ?, ai_summary = ? WHERE id = ?',
        [aiScore, aiSummary, applicationId]
      );

      return { ai_score: aiScore, ai_summary: aiSummary };
    } catch (error) {
      logger.warn(`AI screening skipped for application ${applicationId}: ${error.message}`);
      return null;
    }
  }

  // ??? STATUS UPDATE (core with side-effects) (core with side-effects) ───────────────────────────────────

  /**
   * Cập nhật trạng thái đơn ứng tuyển với đầy đủ side-effects.
   *
   * @param {string|number} applicationId
   * @param {string|null}   companyId     — null nếu admin hoặc recruiter chưa có company profile
   * @param {number}        userId        — ID người thực hiện thay đổi
   * @param {string}        status        — Status mới
   * @param {string|null}   notes         — Ghi chú (lý do từ chối, nhận xét...)
   * @param {boolean}       isAdmin
   * @param {Object}        metadata      — Dữ liệu bổ sung tùy theo stage:
   *   interview_scheduled: { interview_type, scheduled_at, duration_minutes?, location?, candidate_note? }
   *   offered:             { salary_offered?, response_deadline?, start_date?, benefits?, offer_letter_url? }
   */
  async updateApplicationStatus(applicationId, companyId, userId, status, notes = null, isAdmin = false, metadata = {}) {
    if (!APP_STATUS_VALUES.includes(status)) {
      throw new AppError(`Invalid application status. Must be one of: ${APP_STATUS_VALUES.join(', ')}`, 400);
    }

    const application = await ApplicationRepository.findByIdWithDetails(applicationId);
    if (!application) throw new AppError('Application not found', 404);

    const job = await JobRepository.findById(application.job_id);
    if (!job) throw new AppError('Job not found', 404);

    if (!isAdmin && companyId == null) {
      throw new AppError('Company profile is required to update this application', 403);
    }

    if (!isAdmin && Number(job.company_id) !== Number(companyId)) {
      throw new AppError('Not authorized to update this application', 403);
    }

    const oldStatus = application.status;

    const isInterviewScheduling = status === 'interview_scheduled';
    const isInterviewReschedule = isInterviewScheduling && oldStatus === status;

    const VALID_TRANSITIONS = {
      submitted: ['shortlisted', 'interview_scheduled', 'rejected', 'withdrawn'],
      shortlisted: ['interview_scheduled', 'rejected', 'withdrawn'],
      interview_scheduled: ['interview_scheduled', 'interviewed', 'rejected', 'withdrawn'],
      interviewed: ['interview_scheduled', 'offered', 'rejected'],
      offered: ['hired', 'rejected', 'withdrawn'],
      hired: [],
      rejected: [],
      withdrawn: [],
    };

    // Cho phép recruiter lên lịch lại / thêm vòng phỏng vấn mới mà vẫn giữ status interview_scheduled.
    if (oldStatus === status && !isInterviewReschedule) {
      throw new AppError('Application is already in this status', 400);
    }

    const allowedNext = VALID_TRANSITIONS[oldStatus];
    if (!allowedNext || !allowedNext.includes(status)) {
      throw new AppError(
        `Không thể chuyển từ trạng thái "${oldStatus}" sang "${status}". Trình tự hợp lệ: submitted → shortlisted → interview_scheduled → interviewed → offered → hired (hoặc rejected từ bất kỳ bước nào).`,
        400
      );
    }

    // Stage-specific validation và metadata persistence
    await this._handleStageSideEffects(applicationId, status, userId, metadata, application, job);

    // Cập nhật status chính trong applications table
    await ApplicationRepository.updateStatus(applicationId, status, userId, notes, {});

    // Gửi email & notification theo stage
    await this._sendStatusNotifications(applicationId, oldStatus, status, notes, application, job, metadata).catch(err => {
      logger.error('Failed to send status notifications:', err);
    });

    return true;
  }

  /**
   * Xử lý side-effects theo từng stage (validate + lưu metadata).
   */
  async _handleStageSideEffects(applicationId, newStatus, userId, metadata, application, job) {
    switch (newStatus) {

      case 'interview_scheduled': {
        const scheduleableStatuses = ['submitted', 'shortlisted', 'interview_scheduled', 'interviewed'];
        if (!scheduleableStatuses.includes(application.status)) {
          throw new AppError('Không thể sắp lịch phỏng vấn cho hồ sơ ở trạng thái hiện tại', 400);
        }

        // Validate bắt buộc phải có ngày giờ và hình thức
        if (!metadata.scheduled_at) {
          throw new AppError('Vui lòng cung cấp ngày giờ phỏng vấn (scheduled_at)', 400);
        }
        if (!metadata.interview_type) {
          throw new AppError('Vui lòng cung cấp hình thức phỏng vấn (interview_type: online/offline/phone)', 400);
        }

        const scheduledAt = new Date(metadata.scheduled_at);
        if (Number.isNaN(scheduledAt.getTime())) {
          throw new AppError('Ngay gio phong van khong hop le', 400);
        }

        if (scheduledAt.getTime() <= Date.now()) {
          throw new AppError('Vui long chon thoi gian phong van trong tuong lai', 400);
        }

        const durationMinutes = Number(metadata.duration_minutes ?? 60);
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
          throw new AppError('Thoi luong phong van khong hop le', 400);
        }

        await InterviewScheduleRepository.create({
          application_id: applicationId,
          interview_type: metadata.interview_type,
          scheduled_at: metadata.scheduled_at,
          duration_minutes: durationMinutes,
          location: metadata.location ?? null,
          candidate_note: metadata.candidate_note ?? null,
          interviewer_note: metadata.interviewer_note ?? null,
          created_by: userId,
        });
        break;
      }

      case 'offered': {
        // Validate bắt buộc phải có ít nhất 1 thông tin offer
        // (salary có thể null = "Thỏa thuận" nhưng phải gọi route offer)
        await ApplicationOfferRepository.upsert({
          application_id: applicationId,
          salary_offered: metadata.salary_offered ?? null,
          salary_currency: metadata.salary_currency ?? 'VND',
          response_deadline: metadata.response_deadline ?? null,
          start_date: metadata.start_date ?? null,
          benefits: metadata.benefits ?? null,
          offer_letter_url: metadata.offer_letter_url ?? null,
          notes: metadata.offer_notes ?? null,
          created_by: userId,
        });
        break;
      }

      case 'hired': {
        // Auto-reject các đơn pending khác của cùng candidate
        const rejected = await ApplicationRepository.rejectOtherApplications(
          application.candidate_id,
          applicationId
        );
        if (rejected > 0) {
          logger.info(`Auto-rejected ${rejected} pending applications for candidate ${application.candidate_id} after hire.`);
        }

        // Cập nhật phản hồi offer thành accepted (nếu tồn tại)
        await ApplicationOfferRepository.recordResponse(applicationId, 'accepted').catch(() => { });
        break;
      }

      case 'rejected': {
        // Nếu có offer, cập nhật candidate_response = declined
        await ApplicationOfferRepository.recordResponse(applicationId, 'declined').catch(() => { });
        break;
      }

      case 'withdrawn': {
        // Không cần quyền recruiter — candidate route sẽ gọi trực tiếp
        break;
      }

      default:
        break;
    }
  }

  /**
   * Gửi email và notification cho candidate/recruiter sau khi status thay đổi.
   */
  async _sendStatusNotifications(applicationId, oldStatus, newStatus, notes, application, job, metadata) {
    const EmailService = require('./email');
    const NotificationService = require('./notification');

    // Lấy email candidate
    const candidateEmail = application.candidate_email;
    const candidateName = application.candidate_name || 'Ứng viên';
    const jobTitle = application.job_title || job.title;
    const companyName = application.company_name || 'Công ty';

    // Notification trong app (luôn gửi)
    if (application.user_id) {
      await NotificationService.notifyApplicationStatusChange(
        application.user_id,
        parseInt(applicationId, 10),
        oldStatus,
        newStatus,
        notes
      );
    }

    // Email theo từng stage
    switch (newStatus) {
      case 'interview_scheduled': {
        const schedule = await InterviewScheduleRepository.findLatestByApplication(applicationId);
        if (candidateEmail && schedule) {
          await EmailService.sendInterviewScheduled(candidateEmail, {
            candidateName,
            jobTitle,
            companyName,
            scheduledAt: schedule.scheduled_at,
            interviewType: schedule.interview_type,
            location: schedule.location,
            candidateNote: schedule.candidate_note,
            round: schedule.round,
          });
        }
        // Notification phỏng vấn riêng (có datetime details)
        if (application.user_id) {
          await NotificationService.notifyInterviewScheduled(
            application.user_id,
            parseInt(applicationId, 10),
            {
              date: schedule?.scheduled_at
                ? new Date(schedule.scheduled_at).toLocaleDateString('vi-VN')
                : null,
              time: schedule?.scheduled_at
                ? new Date(schedule.scheduled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : null,
              location: schedule?.location,
              type: schedule?.interview_type,
            }
          );
        }
        break;
      }

      case 'offered': {
        const offer = await ApplicationOfferRepository.findByApplication(applicationId);
        if (candidateEmail) {
          await EmailService.sendOfferReceived(candidateEmail, {
            candidateName,
            jobTitle,
            companyName,
            salaryOffered: offer?.salary_offered,
            responseDeadline: offer?.response_deadline,
            startDate: offer?.start_date,
            notes: offer?.notes,
          });
        }
        if (application.user_id) {
          await NotificationService.notifyOfferReceived(
            application.user_id,
            parseInt(applicationId, 10),
            { salary: offer?.salary_offered, deadline: offer?.response_deadline }
          );
        }
        break;
      }

      case 'hired': {
        if (candidateEmail) {
          await EmailService.sendApplicationHired(candidateEmail, { candidateName, jobTitle, companyName });
        }
        break;
      }

      case 'rejected': {
        if (candidateEmail) {
          await EmailService.sendApplicationRejected(candidateEmail, { candidateName, jobTitle, companyName, notes });
        }
        break;
      }

      case 'withdrawn': {
        // Gửi email cho recruiter
        if (job.recruiter_id) {
          const [recruiterRows] = await pool.query(
            'SELECT u.email, u.first_name FROM users u WHERE u.id = ?',
            [job.recruiter_id]
          );
          const recruiter = recruiterRows[0];
          if (recruiter?.email) {
            await EmailService.sendApplicationWithdrawn(recruiter.email, {
              recruiterName: recruiter.first_name,
              candidateName,
              jobTitle,
            });
          }
        }
        break;
      }

      default:
        break;
    }
  }

  // ─── CANDIDATE WITHDRAW ────────────────────────────────────────────────────────

  /**
   * Ứng viên tự rút đơn — chỉ được rút khi canWithdraw = true
   */
  async withdrawApplication(applicationId, candidateId) {
    const application = await ApplicationRepository.findCandidateApplicationById(applicationId, candidateId);
    if (!application) throw new AppError('Application not found', 404);

    const CANNOT_WITHDRAW = ['interviewed', 'hired', 'rejected', 'withdrawn'];
    if (CANNOT_WITHDRAW.includes(application.status)) {
      throw new AppError(`Không thể rút đơn ở trạng thái "${application.status}"`, 400);
    }

    await this.updateApplicationStatus(
      applicationId,
      null,     // companyId — bypass check khi candidate rút
      candidateId,
      'withdrawn',
      'Ứng viên tự rút đơn.',
      true,     // isAdmin flag để bypass company check
      {}
    );

    return true;
  }

  // ─── READ METHODS ──────────────────────────────────────────────────────────────

  async getCandidateApplications(candidateId) {
    return await ApplicationRepository.findByCandidateId(candidateId);
  }

  async getCandidateInterviewSchedules(candidateId) {
    return await InterviewScheduleRepository.findByCandidate(candidateId);
  }

  async getCandidateNotifications(candidateId) {
    return await ApplicationRepository.getCandidateNotifications(candidateId);
  }

  async getCandidateApplication(applicationId, candidateId) {
    const application = await ApplicationRepository.findCandidateApplicationById(applicationId, candidateId);
    if (!application) throw new AppError('Application not found', 404);

    // Enrich với interview + offer details
    application.interviews = await InterviewScheduleRepository.findByApplication(applicationId);
    application.offer = await ApplicationOfferRepository.findByApplication(applicationId);
    return application;
  }

  async getCandidateApplicationHistory(applicationId, candidateId) {
    const application = await ApplicationRepository.findCandidateApplicationById(applicationId, candidateId);
    if (!application) throw new AppError('Application not found', 404);
    return await ApplicationRepository.getHistory(applicationId);
  }

  async getJobApplications(jobId, companyId, isAdmin = false) {
    const job = await JobRepository.findById(jobId);
    if (!job) throw new AppError('Job not found', 404);
    if (!isAdmin && Number(job.company_id) !== Number(companyId)) throw new AppError('Not authorized to view these applications', 403);
    return await ApplicationRepository.findByJobId(jobId);
  }

  async getCompanyInterviewSchedules(companyId, isAdmin = false, filters = {}) {
    if (!isAdmin && companyId == null) {
      throw new AppError('Company profile is required to view interview schedules', 403);
    }

    return await InterviewScheduleRepository.findByCompany(companyId, filters, isAdmin);
  }

  async updateInterviewScheduleStatus(interviewId, companyId, userId, status, isAdmin = false) {
    const allowedStatuses = ['scheduled', 'completed', 'cancelled', 'no_show'];
    if (!allowedStatuses.includes(status)) {
      throw new AppError(`Invalid interview status. Must be one of: ${allowedStatuses.join(', ')}`, 400);
    }

    if (!isAdmin && companyId == null) {
      throw new AppError('Company profile is required to update interview schedules', 403);
    }

    const interview = await InterviewScheduleRepository.findByIdWithDetails(interviewId);
    if (!interview) throw new AppError('Interview schedule not found', 404);

    if (!isAdmin && Number(interview.company_id) !== Number(companyId)) {
      throw new AppError('Not authorized to update this interview schedule', 403);
    }

    if (interview.status === status) return interview;

    await InterviewScheduleRepository.updateStatus(interviewId, status);

    if (status === 'completed' && interview.application_status === 'interview_scheduled') {
      await ApplicationRepository.updateStatus(
        interview.application_id,
        'interviewed',
        userId,
        'Đã hoàn thành lịch phỏng vấn.',
        {}
      );
    } else {
      await pool.query(
        'INSERT INTO application_history (application_id, action, old_status, new_status, changed_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [
          interview.application_id,
          'interview_status_updated',
          interview.application_status,
          interview.application_status,
          userId,
          `Cập nhật lịch phỏng vấn #${interviewId}: ${status}`,
        ]
      );
    }

    return await InterviewScheduleRepository.findByIdWithDetails(interviewId);
  }

  async getApplication(applicationId, companyId, isAdmin = false) {
    const application = await ApplicationRepository.findByIdWithDetails(applicationId);
    if (!application) throw new AppError('Application not found', 404);

    if (isAdmin) {
      // Enrich
      application.interviews = await InterviewScheduleRepository.findByApplication(applicationId);
      application.offer = await ApplicationOfferRepository.findByApplication(applicationId);
      return application;
    }

    if (companyId == null) {
      throw new AppError('Company profile is required to view this application', 403);
    }

    if (Number(application.company_id) !== Number(companyId)) {
      throw new AppError('Not authorized to view this application', 403);
    }

    application.interviews = await InterviewScheduleRepository.findByApplication(applicationId);
    application.offer = await ApplicationOfferRepository.findByApplication(applicationId);
    return application;
  }

  async getApplicationHistory(applicationId, companyId, isAdmin = false) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) throw new AppError('Application not found', 404);

    const job = await JobRepository.findById(application.job_id);
    if (!job) throw new AppError('Job not found', 404);
    if (!isAdmin && companyId == null) {
      throw new AppError('Company profile is required to view history', 403);
    }

    if (!isAdmin && Number(job.company_id) !== Number(companyId)) {
      throw new AppError('Not authorized to view history', 403);
    }

    return await ApplicationRepository.getHistory(applicationId);
  }

  async addApplicationNote(applicationId, companyId, userId, notes, isAdmin = false) {
    if (!notes || !notes.trim()) throw new AppError('Notes are required', 400);

    const application = await ApplicationRepository.findById(applicationId);
    if (!application) throw new AppError('Application not found', 404);

    const job = await JobRepository.findById(application.job_id);
    if (!job) throw new AppError('Job not found', 404);
    if (!isAdmin && companyId == null) {
      throw new AppError('Company profile is required to add note to this application', 403);
    }

    if (!isAdmin && Number(job.company_id) !== Number(companyId)) {
      throw new AppError('Not authorized to add note to this application', 403);
    }

    return await ApplicationRepository.addHistoryNote(applicationId, userId, application.status, notes.trim());
  }

  async getInterviewSchedules(applicationId, companyId, isAdmin = false) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) throw new AppError('Application not found', 404);

    const job = await JobRepository.findById(application.job_id);
    if (!job) throw new AppError('Job not found', 404);
    if (!isAdmin && companyId == null) {
      throw new AppError('Company profile is required to view interview schedules', 403);
    }

    if (!isAdmin && Number(job.company_id) !== Number(companyId)) {
      throw new AppError('Not authorized', 403);
    }

    return await InterviewScheduleRepository.findByApplication(applicationId);
  }

  async getOfferDetails(applicationId, companyId, isAdmin = false) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) throw new AppError('Application not found', 404);

    const job = await JobRepository.findById(application.job_id);
    if (!job) throw new AppError('Job not found', 404);
    if (!isAdmin && companyId == null) {
      throw new AppError('Company profile is required to view offer details', 403);
    }

    if (!isAdmin && Number(job.company_id) !== Number(companyId)) {
      throw new AppError('Not authorized', 403);
    }

    return await ApplicationOfferRepository.findByApplication(applicationId);
  }
}

module.exports = new ApplicationService();
