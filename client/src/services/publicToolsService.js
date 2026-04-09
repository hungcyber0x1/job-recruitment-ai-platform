import api from './api';
import { API_TIMEOUT_AI_CV_MS } from '../config';

const publicToolsService = {
  salaryEstimate: (body) => api.post('public/tools/salary-estimate', body),

  cvPreview: (file, onUploadProgress) => {
    const fd = new FormData();
    fd.append('resume', file);
    return api.post('public/tools/cv-preview', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      timeout: API_TIMEOUT_AI_CV_MS,
    });
  },
};

export default publicToolsService;
