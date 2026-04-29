import api from './api';

const resumeService = {
  getLatestAnalysis: () => {
    return api.get('/candidates/resume/analysis');
  },
};

export default resumeService;
