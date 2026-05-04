import api from './api';

const candidateService = {
  // ─── Existing ──────────────────────────────────────────────────────────────
  getProfile: () => api.get('candidates/profile'),
  updateProfile: (data) => api.put('candidates/profile', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('candidates/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Saved Jobs
  getSavedJobs: () => api.get('candidates/saved-jobs'),
  saveJob: (jobId) => api.post('candidates/saved-jobs', { job_id: jobId }),
  unsaveJob: (jobId) => api.delete(`candidates/saved-jobs/${jobId}`),

  // Saved Companies
  getSavedCompanies: () => api.get('candidates/saved-companies'),
  saveCompany: (companyId) => api.post('candidates/saved-companies', { company_id: companyId }),
  unsaveCompany: (companyId) => api.delete(`candidates/saved-companies/${companyId}`),
  checkCompanySaved: (companyId) => api.get(`candidates/saved-companies/${companyId}/check`),

  // ─── Phase 1.1: Full Profile ───────────────────────────────────────────────
  getFullProfile: () => api.get('candidates/full-profile'),

  // ─── Phase 1.1: Job Preferences ───────────────────────────────────────────
  updatePreferences: (data) => api.put('candidates/preferences', data),

  // ─── Phase 1.1: Skills ─────────────────────────────────────────────────────
  getSkills: () => api.get('candidates/skills'),
  addSkill: (data) => api.post('candidates/skills', data),
  updateSkill: (skillId, data) => api.put(`candidates/skills/${skillId}`, data),
  deleteSkill: (skillId) => api.delete(`candidates/skills/${skillId}`),

  // ─── Phase 1.1: Education ──────────────────────────────────────────────────
  getEducation: () => api.get('candidates/education'),
  addEducationItem: (data) => api.post('candidates/education', data),
  updateEducationItem: (eduId, data) => api.put(`candidates/education/${eduId}`, data),
  deleteEducationItem: (eduId) => api.delete(`candidates/education/${eduId}`),

  // ─── Phase 1.1: Experience ─────────────────────────────────────────────────
  getExperience: () => api.get('candidates/experience'),
  addExperienceItem: (data) => api.post('candidates/experience', data),
  updateExperienceItem: (expId, data) => api.put(`candidates/experience/${expId}`, data),
  deleteExperienceItem: (expId) => api.delete(`candidates/experience/${expId}`),

  // ─── Phase 1.1: Dashboard Stats ───────────────────────────────────────────
  getDashboardStats: () => api.get('candidates/dashboard-stats'),
};

export default candidateService;
