import api from './api';

const adminChatbotService = {
  // Analytics
  getAnalytics: (params) => api.get('/admin/chatbot/analytics', { params }),

  // Configurations
  getConfigurations: () => api.get('/admin/chatbot/configurations'),

  updateConfigurations: (data) => api.put('/admin/chatbot/configurations', data),

  // Conversations
  getAllConversations: (params) => api.get('/admin/chatbot/conversations', { params }),

  getConversationById: (id) => api.get(`/admin/chatbot/conversations/${id}`),

  deleteConversation: (id) => api.delete(`/admin/chatbot/conversations/${id}`),

  // Templates
  getTemplates: () => api.get('/admin/chatbot/templates'),

  createTemplate: (data) => api.post('/admin/chatbot/templates', data),

  updateTemplate: (id, data) => api.put(`/admin/chatbot/templates/${id}`, data),

  deleteTemplate: (id) => api.delete(`/admin/chatbot/templates/${id}`),

  // Export
  exportConversations: (params) =>
    api.get('/admin/chatbot/export', {
      params,
      responseType: 'blob',
    }),
};

export default adminChatbotService;
