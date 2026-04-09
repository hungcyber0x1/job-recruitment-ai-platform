import api from './api';

const resumeService = {
  analyzeJobMatch: (jobId) => {
    return api.post('/candidates/resume/match-job', { jobId });
  },

  getLatestAnalysis: () => {
    return api.get('/candidates/resume/analysis');
  },
};

export default resumeService;
