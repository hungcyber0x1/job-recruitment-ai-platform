import api from './api';

const publicToolsService = {
  salaryEstimate: (body) => api.post('public/tools/salary-estimate', body),

  cvPreview: (file, onUploadProgress) => {
    const fd = new FormData();
    fd.append('resume', file);
    return api.post('public/tools/cv-preview', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },

  interviewHint: (body) => api.post('public/tools/interview-hint', body),
};

export default publicToolsService;
