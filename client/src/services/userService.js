import api from './api';

const userService = {
  getProfile: () => api.get('users/profile'),
  getPreferences: () => api.get('users/preferences'),
  updateProfile: (data) => api.put('users/profile', data),
  updatePreferences: (data) => api.put('users/preferences', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    // Note: axios interceptor automatically removes Content-Type for FormData
    // to allow browser to set the correct multipart boundary
    return api.post('users/upload-avatar', formData);
  },
  getAllUsers: () => api.get('users/all'),
  getCandidateProfile: () => api.get('candidates/me'),
  getEmployerProfile: () => api.get('employers/me'),
};

export default userService;
