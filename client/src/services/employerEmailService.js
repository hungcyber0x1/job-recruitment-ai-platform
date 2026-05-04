/**
 * Employer Communication Service - Quản lý email gửi cho recruiter
 * Bao gồm: interview invites, rejections, offers, templates
 */
import api from './api';

const employerEmailService = {
  // ─── Email Templates ────────────────────────────────────────────────────
  getTemplates: () => api.get('employers/communications/templates'),

  createTemplate: (data) => api.post('employers/communications/templates', data),

  updateTemplate: (id, data) => api.put(`employers/communications/templates/${id}`, data),

  deleteTemplate: (id) => api.delete(`employers/communications/templates/${id}`),

  // ─── Send Email Actions ────────────────────────────────────────────────
  sendInterviewInvite: (data) => api.post('employers/communications/interview-invite', data),

  sendRejection: (data) => api.post('employers/communications/rejection', data),

  sendOffer: (data) => api.post('employers/communications/offer', data),

  sendBulkEmail: (data) => api.post('employers/communications/bulk', data),

  sendCustomEmail: (data) => api.post('employers/communications/send', data),

  // ─── Communication History ──────────────────────────────────────────────
  getEmailHistory: (params) => api.get('employers/communications/history', { params }),

  getEmailDetails: (id) => api.get(`employers/communications/${id}`),

  // ─── Pre-built Templates ────────────────────────────────────────────────
  getTemplatePlaceholders: () => ({
    candidate_name: 'Tên ứng viên',
    job_title: 'Vị trí tuyển dụng',
    company_name: 'Tên công ty',
    interview_date: 'Ngày phỏng vấn',
    interview_time: 'Giờ phỏng vấn',
    interview_location: 'Địa điểm phỏng vấn',
    interview_notes: 'Ghi chú phỏng vấn',
    offer_salary: 'Mức lương offer',
    offer_start_date: 'Ngày bắt đầu',
    offer_deadline: 'Hạn chót nhận offer',
  }),

  // ─── Quick Send ────────────────────────────────────────────────────────
  quickSend: (applicationId, templateType) =>
    api.post('employers/communications/quick-send', {
      application_id: applicationId,
      template_type: templateType,
    }),

  // ─── Mark as Read / Archive ─────────────────────────────────────────────
  markRead: (id) => api.patch(`employers/communications/${id}/read`),

  archiveCommunication: (id) => api.patch(`employers/communications/${id}/archive`),
};

export default employerEmailService;
