import api from './api';

const profileAnalyticsService = {
  // Get profile view analytics
  getProfileViews: () => api.get('candidates/analytics/views'),

  // Get recruiter interest metrics
  getRecruiterInterest: () => api.get('candidates/analytics/recruiter-interest'),

  // Get profile search appearance stats
  getSearchAppearance: () => api.get('candidates/analytics/search-appearance'),

  // Get full analytics dashboard
  getDashboard: () => api.get('candidates/analytics/dashboard'),
};

export default profileAnalyticsService;
