import api from './api';

const uploadService = {
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/candidates/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/candidates/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadCompanyLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/employers/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadProjectImage: (file) => {
    const formData = new FormData();
    formData.append('project_image', file);
    return api.post('/candidates/upload-project-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default uploadService;
