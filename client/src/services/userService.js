import api from './api';

const userService = {
  getProfile: () => api.get('users/profile'),
  updateProfile: (data) => api.put('users/profile', data),
  updatePreferences: (data) => api.put('users/preferences', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('users/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAllUsers: () => api.get('users/all'),
  getCandidateProfile: () => api.get('candidates/me'),
  getEmployerProfile: () => api.get('employers/me'),
};

export default userService;
