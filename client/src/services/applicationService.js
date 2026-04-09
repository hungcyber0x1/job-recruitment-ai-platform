import api from './api';

export const applicationService = {
  apply: (jobId, data) => api.post(`applications/${jobId}`, data),
  getMyApplications: () => api.get('applications/my-applications'),
  getMyNotifications: () => api.get('applications/my-notifications'),
  getMyApplication: (id) => api.get(`applications/my-applications/${id}`),
  getMyApplicationHistory: (id) => api.get(`applications/my-applications/${id}/history`),
  getJobApplications: (jobId) => api.get(`applications/job/${jobId}`),
  getApplication: (id) => api.get(`applications/${id}`),
  getApplicationHistory: (id) => api.get(`applications/${id}/history`),
  updateStatus: (id, status, notes) => api.put(`applications/${id}/status`, { status, notes }),
  addNote: (id, notes) => api.post(`applications/${id}/notes`, { notes }),
};

export default applicationService;
