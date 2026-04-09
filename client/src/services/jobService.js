import api from './api';

export const jobService = {
  getJobs: (params) => api.get('jobs', { params }),
  getJob: (id) => api.get(`jobs/${id}`),
  getMyJobs: () => api.get('jobs/my-jobs'),
  createJob: (data) => api.post('jobs', data),
  updateJob: (id, data) => api.put(`jobs/${id}`, data),
  deleteJob: (id) => api.delete(`jobs/${id}`),
};

export default jobService;
