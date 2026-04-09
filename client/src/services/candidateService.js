import api from './api';

const candidateService = {
  getProfile: () => api.get('candidates/profile'),
  updateProfile: (data) => api.put('candidates/profile', data),
  getSavedJobs: () => api.get('candidates/saved-jobs'),
  saveJob: (jobId) => api.post('candidates/saved-jobs', { job_id: jobId }),
  unsaveJob: (jobId) => api.delete(`candidates/saved-jobs/${jobId}`),
};

export default candidateService;
