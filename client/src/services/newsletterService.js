import api from './api';

const newsletterService = {
  subscribe: (data) => api.post('newsletter/subscribe', data),
};

export default newsletterService;
