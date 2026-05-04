/**
 * Application Controller — handles application HTTP requests.
 *
 * ⚠️   TABLE: Sử dụng `candidate_profiles` và `company_profiles`
 * ⚠️   ROLE: Sử dụng 'recruiter' thay vì 'employer'
 */
const ApplicationService = require('../services/application');
const CandidateRepository = require('../models/Candidate');
const notificationService = require('../services/notification');
const JobRepository = require('../models/Job');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { hasCompanyPermission, resolveRecruiterCompanyContext } = require('../utils/company-access');

class ApplicationController {
  async _getRecruiterScope(user) {
    const isAdmin = user.role === 'admin';
    const company = isAdmin ? null : await resolveRecruiterCompanyContext(user);
    return { isAdmin, company };
  }

  _ensureRecruiterPermission(res, user, permission, message) {
    if (!hasCompanyPermission(user, permission)) {
      return ApiResponse.forbidden(res, message);
    }

    return null;
  }

  // ─── Candidate: Nộp đơn ───────────────────────────────────────────────────
  apply = catchAsync(async (req, res) => {
    const candidate = await CandidateRepository.findByUserId(req.user.id);
    if (!candidate) return ApiResponse.forbidden(res, 'Only candidates can apply');

    const applicationId = await ApplicationService.applyToJob(
      candidate.id,
      req.params.jobId,
      req.body
    );

    // Notification cho candidate
    await notificationService.notifyApplicationSubmitted(
      req.user.id,
      applicationId,
      req.params.jobId
    );

    // Notification cho recruiter
    const job = await JobRepository.findById(req.params.jobId);
    if (job?.recruiter_id) {
      const candidateProfile = await CandidateRepository.findById(candidate.id);
      await notificationService.notifyNewApplicant(job.recruiter_id, applicationId, {
        candidate_name:
          `${candidateProfile?.first_name || ''} ${candidateProfile?.last_name || ''}`.trim() ||
          'Ứng viên',
        job_title: job.title,
        application_date: new Date().toLocaleDateString('vi-VN'),
      });
    }

    return ApiResponse.created(res, { id: applicationId });
  });

  // ─── Candidate: Rút đơn ───────────────────────────────────────────────────
  withdraw = catchAsync(async (req, res) => {
    const candidate = await CandidateRepository.findByUserId(req.user.id);
    if (!candidate) return ApiResponse.forbidden(res, 'Only candidates can withdraw applications');

    await ApplicationService.withdrawApplication(req.params.id, candidate.id);
    return ApiResponse.success(res, null, { message: 'Đơn ứng tuyển đã được rút thành công.' });
  });

  // ─── Candidate: Xóa đơn của mình ─────────────────────────────────────────
  deleteMyApplication = catchAsync(async (req, res) => {
    const candidate = await CandidateRepository.findByUserId(req.user.id);
    if (!candidate)
      return ApiResponse.forbidden(res, 'Only candidates can delete their applications');

    await ApplicationService.deleteCandidateApplication(req.params.id, candidate.id);
    return ApiResponse.success(res, null, { message: 'Đơn ứng tuyển đã được xóa thành công.' });
  });

  // ─── Candidate: Xem danh sách đơn ────────────────────────────────────────
  getMyApplications = catchAsync(async (req, res) => {
    const candidate = await CandidateRepository.findByUserId(req.user.id);
    if (!candidate)
      return ApiResponse.forbidden(res, 'Only candidates can view their applications');

    const applications = await ApplicationService.getCandidateApplications(candidate.id);
    return ApiResponse.success(res, applications);
  });

  getMyNotifications = catchAsync(async (req, res) => {
    const candidate = await CandidateRepository.findByUserId(req.user.id);
    if (!candidate) return ApiResponse.forbidden(res, 'Only candidates can view notifications');

    const notifications = await ApplicationService.getCandidateNotifications(candidate.id);
    return ApiResponse.success(res, notifications);
  });

  getMyInterviews = catchAsync(async (req, res) => {
    const candidate = await CandidateRepository.findByUserId(req.user.id);
    if (!candidate)
      return ApiResponse.forbidden(res, 'Only candidates can view interview schedules');

    const interviews = await ApplicationService.getCandidateInterviewSchedules(candidate.id);
    return ApiResponse.success(res, interviews);
  });

  getMyApplication = catchAsync(async (req, res) => {
    const candidate = await CandidateRepository.findByUserId(req.user.id);
    if (!candidate)
      return ApiResponse.forbidden(res, 'Only candidates can view their applications');

    const application = await ApplicationService.getCandidateApplication(
      req.params.id,
      candidate.id
    );
    return ApiResponse.success(res, application);
  });

  getMyApplicationHistory = catchAsync(async (req, res) => {
    const candidate = await CandidateRepository.findByUserId(req.user.id);
    if (!candidate)
      return ApiResponse.forbidden(res, 'Only candidates can view application history');

    const history = await ApplicationService.getCandidateApplicationHistory(
      req.params.id,
      candidate.id
    );
    return ApiResponse.success(res, history);
  });

  // ─── Recruiter/Admin: Xem danh sách ──────────────────────────────────────
  getJobApplications = catchAsync(async (req, res) => {
    const { isAdmin, company } = await this._getRecruiterScope(req.user);

    if (!isAdmin && !company) {
      return ApiResponse.forbidden(res, 'Vui lòng hoàn thiện hồ sơ công ty trước khi xem ứng viên');
    }

    if (!isAdmin) {
      const permissionError = this._ensureRecruiterPermission(
        res,
        req.user,
        'can_view_applications',
        'Bạn không có quyền xem hồ sơ ứng viên'
      );
      if (permissionError) return permissionError;
    }

    const applications = await ApplicationService.getJobApplications(
      req.params.jobId,
      company?.id,
      isAdmin
    );
    return ApiResponse.success(res, applications);
  });

  getApplication = catchAsync(async (req, res) => {
    const { isAdmin, company } = await this._getRecruiterScope(req.user);

    if (!isAdmin && !company) {
      return ApiResponse.forbidden(
        res,
        'Vui lòng hoàn thiện hồ sơ công ty trước khi xem hồ sơ ứng tuyển'
      );
    }

    if (!isAdmin) {
      const permissionError = this._ensureRecruiterPermission(
        res,
        req.user,
        'can_view_applications',
        'Bạn không có quyền xem hồ sơ ứng tuyển'
      );
      if (permissionError) return permissionError;
    }

    const application = await ApplicationService.getApplication(
      req.params.id,
      company?.id ?? null,
      isAdmin
    );
    return ApiResponse.success(res, application);
  });

  // ─── Recruiter/Admin: Cập nhật status ────────────────────────────────────
  /**
   * Body nhận được:
   * {
   *   status: string,
   *   notes?: string,
   *   // interview_scheduled metadata:
   *   scheduled_at?: string (ISO),
   *   interview_type?: 'online'|'offline'|'phone',
   *   duration_minutes?: number,
   *   location?: string,
   *   candidate_note?: string,
   *   // offered metadata:
   *   salary_offered?: number,
   *   response_deadline?: string (ISO date),
   *   start_date?: string (ISO date),
   *   benefits?: string,
   * }
   */
  updateStatus = catchAsync(async (req, res) => {
    const { isAdmin, company } = await this._getRecruiterScope(req.user);

    if (!isAdmin && !company) {
      return ApiResponse.forbidden(
        res,
        'Vui lòng hoàn thiện hồ sơ công ty trước khi cập nhật hồ sơ ứng tuyển'
      );
    }

    if (!isAdmin) {
      const permissionError = this._ensureRecruiterPermission(
        res,
        req.user,
        'can_manage_applications',
        'Bạn không có quyền cập nhật trạng thái hồ sơ'
      );
      if (permissionError) return permissionError;
    }

    await ApplicationService.updateApplicationStatus(
      req.params.id,
      company?.id ?? null,
      req.user.id,
      req.body.status,
      req.body.notes ?? null,
      isAdmin,
      req.body // pass full body as metadata — service sẽ destructure theo stage
    );

    return ApiResponse.success(res, null, { message: 'Trạng thái đã được cập nhật thành công.' });
  });

  getCompanyInterviews = catchAsync(async (req, res) => {
    const { isAdmin, company } = await this._getRecruiterScope(req.user);

    if (!isAdmin && !company) {
      return ApiResponse.forbidden(
        res,
        'Vui lòng hoàn thiện hồ sơ công ty trước khi xem lịch phỏng vấn'
      );
    }

    if (!isAdmin) {
      const permissionError = this._ensureRecruiterPermission(
        res,
        req.user,
        'can_view_applications',
        'Bạn không có quyền xem lịch phỏng vấn'
      );
      if (permissionError) return permissionError;
    }

    const interviews = await ApplicationService.getCompanyInterviewSchedules(
      company?.id ?? null,
      isAdmin,
      req.query
    );

    return ApiResponse.success(res, interviews);
  });

  updateInterviewStatus = catchAsync(async (req, res) => {
    const { isAdmin, company } = await this._getRecruiterScope(req.user);

    if (!isAdmin && !company) {
      return ApiResponse.forbidden(
        res,
        'Vui lòng hoàn thiện hồ sơ công ty trước khi cập nhật lịch phỏng vấn'
      );
    }

    if (!isAdmin) {
      const permissionError = this._ensureRecruiterPermission(
        res,
        req.user,
        'can_manage_applications',
        'Bạn không có quyền cập nhật lịch phỏng vấn'
      );
      if (permissionError) return permissionError;
    }

    const interview = await ApplicationService.updateInterviewScheduleStatus(
      req.params.interviewId,
      company?.id ?? null,
      req.user.id,
      req.body.status,
      isAdmin
    );

    return ApiResponse.success(res, interview, { message: 'Lịch phỏng vấn đã được cập nhật.' });
  });

  addNote = catchAsync(async (req, res) => {
    const { isAdmin, company } = await this._getRecruiterScope(req.user);

    if (!isAdmin && !company) {
      return ApiResponse.forbidden(
        res,
        'Vui lòng hoàn thiện hồ sơ công ty trước khi ghi chú hồ sơ'
      );
    }

    if (!isAdmin) {
      const permissionError = this._ensureRecruiterPermission(
        res,
        req.user,
        'can_manage_applications',
        'Bạn không có quyền ghi chú hồ sơ ứng tuyển'
      );
      if (permissionError) return permissionError;
    }

    const note = await ApplicationService.addApplicationNote(
      req.params.id,
      company?.id ?? null,
      req.user.id,
      req.body.notes,
      isAdmin
    );

    return ApiResponse.created(res, note, 'Ghi chú đã được thêm.');
  });

  getHistory = catchAsync(async (req, res) => {
    const { isAdmin, company } = await this._getRecruiterScope(req.user);

    if (!isAdmin && !company) {
      return ApiResponse.forbidden(
        res,
        'Vui lòng hoàn thiện hồ sơ công ty trước khi xem lịch sử hồ sơ'
      );
    }

    if (!isAdmin) {
      const permissionError = this._ensureRecruiterPermission(
        res,
        req.user,
        'can_view_applications',
        'Bạn không có quyền xem lịch sử hồ sơ'
      );
      if (permissionError) return permissionError;
    }

    const history = await ApplicationService.getApplicationHistory(
      req.params.id,
      company?.id ?? null,
      isAdmin
    );
    return ApiResponse.success(res, history);
  });

  // ─── NEW: Chi tiết lịch phỏng vấn ─────────────────────────────────────────
  getInterviews = catchAsync(async (req, res) => {
    const { isAdmin, company } = await this._getRecruiterScope(req.user);

    if (!isAdmin && !company) {
      return ApiResponse.forbidden(
        res,
        'Vui lòng hoàn thiện hồ sơ công ty trước khi xem lịch phỏng vấn'
      );
    }

    if (!isAdmin) {
      const permissionError = this._ensureRecruiterPermission(
        res,
        req.user,
        'can_view_applications',
        'Bạn không có quyền xem lịch phỏng vấn'
      );
      if (permissionError) return permissionError;
    }

    const interviews = await ApplicationService.getInterviewSchedules(
      req.params.id,
      company?.id ?? null,
      isAdmin
    );
    return ApiResponse.success(res, interviews);
  });

  // ─── NEW: Chi tiết offer ───────────────────────────────────────────────────
  getOffer = catchAsync(async (req, res) => {
    const { isAdmin, company } = await this._getRecruiterScope(req.user);

    if (!isAdmin && !company) {
      return ApiResponse.forbidden(res, 'Vui lòng hoàn thiện hồ sơ công ty trước khi xem offer');
    }

    if (!isAdmin) {
      const permissionError = this._ensureRecruiterPermission(
        res,
        req.user,
        'can_view_applications',
        'Bạn không có quyền xem offer'
      );
      if (permissionError) return permissionError;
    }

    const offer = await ApplicationService.getOfferDetails(
      req.params.id,
      company?.id ?? null,
      isAdmin
    );
    return ApiResponse.success(res, offer);
  });
}

module.exports = new ApplicationController();
