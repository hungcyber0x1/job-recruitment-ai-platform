import api from './api';

const employerService = {
  getProfile: () => api.get('employers/profile'),
  updateProfile: (data) => api.put('employers/profile', data),
};

export default employerService;
