import api from './api';

const cacheStore = new Map();

const buildCacheKey = (url, params) => `${url}:${JSON.stringify(params || {})}`;

const invalidateAdminCache = (matcher) => {
  Array.from(cacheStore.keys()).forEach((key) => {
    if (matcher(key)) {
      cacheStore.delete(key);
    }
  });
};

const invalidateStatsCache = () => {
  invalidateAdminCache(
    (key) => key.startsWith('admin/stats:') || key.startsWith('admin/chart-stats:')
  );
};

const invalidateSettingsCache = () => {
  invalidateAdminCache((key) => key.startsWith('admin/settings:'));
};

const invalidateTaxonomyCache = () => {
  invalidateAdminCache((key) => key.startsWith('categories:') || key.startsWith('skills:'));
};

const cachedGet = (url, params, ttlMs = 15000) => {
  const key = buildCacheKey(url, params);
  const now = Date.now();
  const cached = cacheStore.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = api.get(url, params ? { params } : undefined).catch((error) => {
    cacheStore.delete(key);
    throw error;
  });

  cacheStore.set(key, {
    expiresAt: now + ttlMs,
    promise,
  });

  return promise;
};

const adminService = {
  getStats: () => cachedGet('admin/stats', undefined, 30000),
  getChartStats: () => cachedGet('admin/chart-stats', undefined, 30000),
  getServiceHealth: () => cachedGet('health', undefined, 10000),

  // Users
  getUsers: (params) => api.get('admin/users', { params }),
  getUser: (id) => api.get(`admin/users/${id}`),
  updateUserStatus: async (id, status) => {
    const response = await api.patch(`admin/users/${id}/status`, { status });
    invalidateStatsCache();
    return response;
  },

  // Companies
  getCompanies: (params) => api.get('admin/companies', { params }),
  getCompany: (id) => api.get(`admin/companies/${id}`),
  verifyCompany: async (id, isVerified) => {
    const response = await api.patch(`admin/companies/${id}/verify`, { is_verified: isVerified });
    invalidateStatsCache();
    return response;
  },
  deleteCompany: async (id) => {
    const response = await api.delete(`admin/companies/${id}`);
    invalidateStatsCache();
    return response;
  },

  // Jobs
  getJobs: (params) => api.get('admin/jobs', { params }),
  getJob: (id) => api.get(`admin/jobs/${id}`),
  updateJobStatus: async (id, status) => {
    const response = await api.patch(`admin/jobs/${id}/status`, { status });
    invalidateStatsCache();
    return response;
  },
  deleteJob: async (id) => {
    const response = await api.delete(`admin/jobs/${id}`);
    invalidateStatsCache();
    return response;
  },

  // Applications
  getApplications: (params) => api.get('admin/applications', { params }),
  getApplication: (id) => api.get(`applications/${id}`),

  // Logs
  getLogs: (params) => api.get('admin/logs', { params }),

  // Support
  getTickets: (params) => api.get('admin/tickets', { params }),
  updateTicketStatus: (id, status) => api.patch(`admin/tickets/${id}/status`, { status }),
  getTicketMessages: (id) => api.get(`admin/tickets/${id}/messages`),
  replyToTicket: (id, data) => api.post(`admin/tickets/${id}/reply`, data),

  // Settings
  getSettings: () => cachedGet('admin/settings', undefined, 30000),
  updateSettings: async (data) => {
    const response = await api.put('admin/settings', data);
    invalidateSettingsCache();
    invalidateStatsCache();
    return response;
  },

  // Categories
  getCategories: () => cachedGet('categories', undefined, 120000),
  createCategory: async (data) => {
    const response = await api.post('admin/categories', data);
    invalidateTaxonomyCache();
    return response;
  },
  updateCategory: async (id, data) => {
    const response = await api.put(`admin/categories/${id}`, data);
    invalidateTaxonomyCache();
    return response;
  },
  deleteCategory: async (id) => {
    const response = await api.delete(`admin/categories/${id}`);
    invalidateTaxonomyCache();
    return response;
  },

  // Skills
  getSkills: (params) => cachedGet('skills', params, 120000),
  createSkill: async (data) => {
    const response = await api.post('admin/skills', data);
    invalidateTaxonomyCache();
    return response;
  },
  updateSkill: async (id, data) => {
    const response = await api.put(`admin/skills/${id}`, data);
    invalidateTaxonomyCache();
    return response;
  },
  deleteSkill: async (id) => {
    const response = await api.delete(`admin/skills/${id}`);
    invalidateTaxonomyCache();
    return response;
  },

  // Chatbot
  getChatStats: (params) => api.get('admin/chatbot/stats', { params }),
  getChatSessions: (params) => api.get('admin/chatbot/sessions', { params }),

  // Content
  getBanners: () => api.get('admin/banners'),
  createBanner: (data) => api.post('admin/banners', data),
  deleteBanner: (id) => api.delete(`admin/banners/${id}`),

  // Generic for other content
  getContent: (type, params) => api.get(`admin/content/${type}`, { params }),
  createContent: (type, data) => api.post(`admin/content/${type}`, data),
  updateContent: (type, id, data) => api.put(`admin/content/${type}/${id}`, data),
  deleteContent: (type, id) => api.delete(`admin/content/${type}/${id}`),

  // System
  backup: () => api.get('/admin/backup', { responseType: 'blob' }),
  restore: (formData) =>
    api.post('/admin/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // SMTP & API Settings
  testSmtp: (config) => api.post('/admin/settings/smtp/test', config),
  generateApiKey: () => api.post('/admin/settings/api/generate-key'),

  // Logs
  exportLogs: (params) => api.get('/admin/logs/export', { params, responseType: 'blob' }),

  // Tickets
  exportTickets: (params) => api.get('/admin/tickets/export', { params, responseType: 'blob' }),
  exportUsers: (params) => api.get('/admin/users/export', { params, responseType: 'blob' }),
  exportJobs: (params) => api.get('/admin/jobs/export', { params, responseType: 'blob' }),
  exportApplications: (params) =>
    api.get('/admin/applications/export', { params, responseType: 'blob' }),
};

export default adminService;
