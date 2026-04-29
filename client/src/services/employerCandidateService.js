import api from './api';

const employerCandidateService = {
  searchCandidates: (params = {}) => api.get('employers/candidates/search', { params }),
  getTalentPool: (params = {}) => api.get('employers/talent-pool', { params }),
  saveCandidate: (candidateId, data = {}) => api.post(`employers/talent-pool/${candidateId}`, data),
  updateSavedCandidate: (candidateId, data = {}) =>
    api.put(`employers/talent-pool/${candidateId}`, data),
  removeSavedCandidate: (candidateId) => api.delete(`employers/talent-pool/${candidateId}`),
};

export default employerCandidateService;
