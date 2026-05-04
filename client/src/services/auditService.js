/**
 * Employer Audit Service - Xem audit trail cho recruiter
 */
import api from './api';

const auditService = {
  // ─── Application Audit ─────────────────────────────────────────────────
  getApplicationAudit: (applicationId, params) =>
    api.get(`employers/audit/application/${applicationId}`, { params }),

  // ─── Job Audit ────────────────────────────────────────────────────────
  getJobAudit: (jobId, params) => api.get(`employers/audit/job/${jobId}`, { params }),

  // ─── Communication Audit ────────────────────────────────────────────────
  getCommunicationAudit: (params) => api.get('employers/audit/communications', { params }),

  // ─── Full Audit Trail ─────────────────────────────────────────────────
  getAuditTrail: (params) => api.get('employers/audit/trail', { params }),

  // ─── Action Labels (mirrors server constants) ─────────────────────────
  getActionLabels: () => ({
    application_status_change: 'Đổi trạng thái ứng viên',
    application_note_added: 'Thêm ghi chú',
    application_email_sent: 'Gửi email',
    application_shortlisted: 'Shortlist ứng viên',
    application_rejected: 'Từ chối hồ sơ',
    application_interview_scheduled: 'Lên lịch phỏng vấn',
    job_created: 'Tạo tin tuyển dụng',
    job_updated: 'Sửa tin tuyển dụng',
    job_cloned: 'Nhân bản tin',
    job_status_change: 'Đổi trạng thái tin',
    job_submitted_for_approval: 'Gửi duyệt tin',
    job_approved: 'Duyệt tin',
    job_rejected: 'Từ chối tin',
    company_member_invited: 'Mời thành viên',
    company_member_removed: 'Xóa thành viên',
    company_member_role_changed: 'Đổi vai trò thành viên',
    company_profile_updated: 'Cập nhật hồ sơ công ty',
  }),
};

export default auditService;
