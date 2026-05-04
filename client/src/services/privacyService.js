/**
 * Privacy Service - Quản lý quyền riêng tư ứng viên
 * Liên thông: CV visibility, recruiter access, data export, CV access logs
 */
import api from './api';

const privacyService = {
  // ─── Profile Visibility ───────────────────────────────────────────────
  getPrivacySettings: () => api.get('candidates/privacy'),

  updatePrivacySettings: (data) => api.put('candidates/privacy', data),

  // ─── Recruiter Search Visibility ─────────────────────────────────────
  setSearchable: (searchable) =>
    api.put('candidates/privacy', { profile_visible_to_recruiters: searchable }),

  // ─── Hide/Show sensitive fields ──────────────────────────────────────
  updateFieldVisibility: (fields) =>
    api.put('candidates/privacy/fields', { visible_fields: fields }),

  // ─── Data Export (GDPR) ────────────────────────────────────────────────
  requestDataExport: () => api.post('candidates/data-export'),

  getDataExportStatus: () => api.get('candidates/data-export/status'),

  downloadDataExport: (exportId) =>
    api.get(`candidates/data-export/${exportId}/download`, { responseType: 'blob' }),

  // ─── Data Deletion ────────────────────────────────────────────────────
  requestAccountDeletion: (password) => api.post('candidates/account-deletion', { password }),

  cancelAccountDeletion: () => api.delete('candidates/account-deletion'),

  // ─── CV Access Logs ────────────────────────────────────────────────────
  getCvAccessLogs: (params) => api.get('candidates/cv-access-logs', { params }),

  getRecruiterViews: () => api.get('candidates/recruiter-views'),
};

export default privacyService;
