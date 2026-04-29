import api from './api';

const cacheStore = new Map();
const CACHE_MAX_SIZE = 200; // Prevent unbounded memory growth

const buildCacheKey = (url, params) => `${url}:${JSON.stringify(params || {})}`;

const pruneExpiredCache = () => {
  const now = Date.now();
  if (cacheStore.size < CACHE_MAX_SIZE) return;
  // Prune expired entries when cache grows large
  for (const [key, value] of cacheStore) {
    if (value.expiresAt < now) cacheStore.delete(key);
  }
  // If still too large, evict oldest entries
  if (cacheStore.size > CACHE_MAX_SIZE) {
    const entries = Array.from(cacheStore.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    for (let i = 0; i < CACHE_MAX_SIZE / 4; i++) {
      cacheStore.delete(entries[i][0]);
    }
  }
};

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
  invalidateAdminCache(
    (key) =>
      key.startsWith('categories:') ||
      key.startsWith('skills:') ||
      key.startsWith('admin/categories:') ||
      key.startsWith('admin/skills:')
  );
};

const cachedGet = (url, params, ttlMs = 15000) => {
  pruneExpiredCache(); // Prevent unbounded cache growth
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
  getUsersStats: () => api.get('admin/users/stats'),
  getUsers: (params) => api.get('admin/users', { params }),
  getUser: (id) => api.get(`admin/users/${id}`),
  updateUser: async (id, data) => {
    const response = await api.put(`admin/users/${id}`, data);
    invalidateStatsCache();
    return response;
  },
  updateUserStatus: async (id, status) => {
    const response = await api.patch(`admin/users/${id}/status`, { status });
    invalidateStatsCache();
    return response;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`admin/users/${id}`);
    invalidateStatsCache();
    return response;
  },
  restoreUser: async (id) => {
    const response = await api.patch(`admin/users/${id}/restore`);
    invalidateStatsCache();
    return response;
  },
  hardDeleteUser: async (id) => {
    const response = await api.delete(`admin/users/${id}/hard`);
    invalidateStatsCache();
    return response;
  },
  forceLogout: async (id) => {
    const response = await api.post(`admin/users/${id}/force-logout`);
    return response;
  },
  resetPassword: async (id, password) => {
    const response = await api.post(`admin/users/${id}/reset-password`, { password });
    return response;
  },
  resendVerificationEmail: async (id) => {
    const response = await api.post(`admin/users/${id}/resend-verification`);
    return response;
  },
  getUserActivity: (id, params) => api.get(`admin/users/${id}/activity`, { params }),
  bulkUpdateUsersStatus: async (ids, status) => {
    const response = await api.post('admin/users/bulk-status', { ids, status });
    invalidateStatsCache();
    return response;
  },
  lockUser: async (id) => {
    const response = await api.patch(`admin/users/${id}/lock`);
    invalidateStatsCache();
    return response;
  },
  unlockUser: async (id) => {
    const response = await api.patch(`admin/users/${id}/unlock`);
    invalidateStatsCache();
    return response;
  },
  updateUserPermissions: async (id, permissions) => {
    const response = await api.patch(`admin/users/${id}/permissions`, { permissions });
    invalidateStatsCache();
    return response;
  },

  // Companies
  getCompanies: (params) => api.get('admin/companies', { params }),
  getCompany: (id) => api.get(`admin/companies/${id}`),
  verifyCompany: async (id, isVerified, note) => {
    const response = await api.patch(`admin/companies/${id}/verify`, { is_verified: isVerified, note });
    invalidateStatsCache();
    return response;
  },
  flagCompany: async (id, flagged, note) => {
    const response = await api.patch(`admin/companies/${id}/flag`, { flagged, note });
    invalidateStatsCache();
    return response;
  },
  deleteCompany: async (id) => {
    const response = await api.delete(`admin/companies/${id}`);
    invalidateStatsCache();
    return response;
  },
  restoreCompany: async (id) => {
    const response = await api.patch(`admin/companies/${id}/restore`);
    invalidateStatsCache();
    return response;
  },
  banCompany: async (id) => {
    const response = await api.patch(`admin/companies/${id}/ban`);
    invalidateStatsCache();
    return response;
  },
  bulkUpdateCompaniesStatus: async (ids, status) => {
    const response = await api.post('admin/companies/bulk-status', { ids, status });
    invalidateStatsCache();
    return response;
  },

  // Jobs
  getJobs: (params) => api.get('admin/jobs', { params }),
  getJob: (id) => api.get(`admin/jobs/${id}`),
  updateJobStatus: async (id, status, rejectionReason = null) => {
    const response = await api.patch(`admin/jobs/${id}/status`, { 
      status, 
      rejection_reason: rejectionReason 
    });
    invalidateStatsCache();
    return response;
  },
  duplicateJob: async (id) => {
    const response = await api.post(`admin/jobs/${id}/duplicate`);
    invalidateStatsCache();
    return response;
  },
  bulkUpdateJobsStatus: async (ids, status, reason = null) => {
    const response = await api.post('admin/jobs/bulk-status', { ids, status, reason });
    invalidateStatsCache();
    return response;
  },
  updateJobFlag: async (id, flagged, note) => {
    const response = await api.patch(`admin/jobs/${id}/flag`, { flagged, note });
    invalidateStatsCache();
    return response;
  },
  deleteJob: async (id) => {
    const response = await api.delete(`admin/jobs/${id}`);
    invalidateStatsCache();
    return response;
  },
  createJob: async (data) => {
    const response = await api.post('admin/jobs', data);
    invalidateStatsCache();
    return response;
  },
  updateJob: async (id, data) => {
    const response = await api.put(`admin/jobs/${id}`, data);
    invalidateStatsCache();
    return response;
  },

  // Applications
  getApplications: (params) => api.get('admin/applications', { params }),
  getApplication: (id) => api.get(`admin/applications/${id}`),
  getApplicationHistory: (id) => api.get(`applications/${id}/history`),
  updateApplicationStatus: async (id, status, notes = '', offerDetails = null) => {
    const response = await api.patch(`admin/applications/${id}/status`, { 
      status, 
      notes, 
      offer_details: offerDetails 
    });
    invalidateStatsCache();
    return response;
  },
  updateApplicationInternalNote: async (id, note) => {
    const response = await api.patch(`admin/applications/${id}/internal-note`, { note });
    return response;
  },
  bulkUpdateApplicationsStatus: async (ids, status, notes = '') => {
    const response = await api.post('admin/applications/bulk-status', { ids, status, notes });
    invalidateStatsCache();
    return response;
  },

  // Blogs & Moderation
  getBlogPosts: (params) => api.get('admin/blog/posts', { params }),
  updateBlogPostStatus: async (id, status, rejectionReason = null) => {
    const response = await api.patch(`admin/blog/posts/${id}/status`, { 
      status, 
      rejection_reason: rejectionReason 
    });
    invalidateStatsCache();
    return response;
  },
  bulkUpdateBlogPostsStatus: async (ids, action, status) => {
    const response = await api.post('admin/blog/posts/bulk-action', { 
      ids, 
      action, 
      status 
    });
    invalidateStatsCache();
    return response;
  },
  updateBlogPostFlag: async (id, isFlagged) => {
    // Reusing the update method pattern or status update
    const response = await api.patch(`admin/blog/posts/${id}/status`, { 
      is_flagged: isFlagged 
    });
    invalidateStatsCache();
    return response;
  },

  // Support
  getTickets: (params) => api.get('admin/tickets', { params }),
  updateTicketStatus: (id, status) => api.patch(`admin/tickets/${id}/status`, { status }),
  getTicketMessages: (id) => api.get(`admin/tickets/${id}/messages`),
  replyToTicket: (id, data) => api.post(`admin/tickets/${id}/reply`, data),

  // Logs
  getLogs: (params) => api.get('admin/logs', { params }),

  // Settings
  getSettings: () => cachedGet('admin/settings', undefined, 30000),
  updateSettings: async (data) => {
    const response = await api.put('admin/settings', data);
    invalidateSettingsCache();
    invalidateStatsCache();
    return response;
  },

  // Site logo upload
  uploadSiteLogo: (formData) =>
    api.post('admin/settings/upload-logo', formData),

  // SMTP test
  testSmtp: (config) => api.post('/admin/settings/smtp/test', config),

  // Generate API key
  generateApiKey: () => api.post('/admin/settings/api/generate-key'),

  // Categories
  getCategories: (params = { include_inactive: true }) =>
    cachedGet('admin/categories', params, 120000),
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
  getSkills: (params = { include_inactive: true }) => cachedGet('admin/skills', params, 120000),
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

  // Generic content CRUD — no backend routes exist yet
  // getContent: (type, params) => api.get(`admin/content/${type}`, { params }),
  // createContent: (type, data) => api.post(`admin/content/${type}`, data),
  // updateContent: (type, id, data) => api.put(`admin/content/${type}/${id}`, data),
  // deleteContent: (type, id) => api.delete(`admin/content/${type}/${id}`),

  // System
  backup: () => api.get('/admin/backup', { responseType: 'blob' }),
  restore: (formData) => api.post('admin/restore', formData),

  // SMTP & API Settings (fully implemented in backend)
  // Tickets
  exportTickets: (params) => api.get('/admin/tickets/export', { params, responseType: 'blob' }),
  exportUsers: (params) => api.get('/admin/users/export', { params, responseType: 'blob' }),
  exportJobs: (params) => api.get('/admin/jobs/export', { params, responseType: 'blob' }),
  exportApplications: (params) =>
    api.get('/admin/applications/export', { params, responseType: 'blob' }),
  // Email Logs
  getEmailLogs: (params) => api.get('admin/email-logs', { params }),
};

export default adminService;
