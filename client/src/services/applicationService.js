import api from './api';

export const applicationService = {
  // ─── Candidate ─────────────────────────────────────────────────────────────
  apply: (jobId, data) => api.post(`applications/${jobId}`, data),
  getMyApplications: () => api.get('applications/my-applications'),
  getMyInterviews: () => api.get('applications/my-interviews'),
  getMyNotifications: () => api.get('applications/my-notifications'),
  getMyApplication: (id) => api.get(`applications/my-applications/${id}`),
  getMyApplicationHistory: (id) => api.get(`applications/my-applications/${id}/history`),

  /** Candidate tự rút đơn */
  withdraw: (id) => api.post(`applications/${id}/withdraw`),

  // ─── Recruiter / Admin ─────────────────────────────────────────────────────
  getJobApplications: (jobId) => api.get(`applications/job/${jobId}`),
  getApplication: (id) => api.get(`applications/${id}`),
  getApplicationHistory: (id) => api.get(`applications/${id}/history`),
  getCompanyInterviews: (params = {}) => api.get('applications/interviews', { params }),
  updateInterviewStatus: (id, status) => api.patch(`applications/interviews/${id}/status`, { status }),

  /**
   * Cập nhật status với metadata theo stage.
   * @param {string|number} id
   * @param {string} status
   * @param {Object} metadata - tùy theo stage:
   *   interview_scheduled: { scheduled_at, interview_type, duration_minutes?, location?, candidate_note? }
   *   offered:             { salary_offered?, response_deadline?, start_date?, benefits? }
   * @param {string|null} notes
   */
  updateStatus: (id, status, metadata = {}, notes = null) =>
    api.put(`applications/${id}/status`, { status, notes, ...metadata }),

  addNote: (id, notes) => api.post(`applications/${id}/notes`, { notes }),

  /** Lấy tất cả lịch phỏng vấn của một đơn */
  getInterviews: (id) => api.get(`applications/${id}/interviews`),

  /** Lấy chi tiết offer của một đơn */
  getOffer: (id) => api.get(`applications/${id}/offer`),
};

export default applicationService;
