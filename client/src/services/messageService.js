import api from './api';

export const messageService = {
  getConversations: (params = {}) => api.get('messages/conversations', { params }),
  getConversation: (id, params = {}) => api.get(`messages/conversations/${id}`, { params }),
  openByApplication: (applicationId) =>
    api.get(`messages/conversations/by-application/${applicationId}`),
  startConversation: (payload = {}) => api.post('messages/conversations', payload),
  sendMessage: (conversationId, payload) => {
    const body = typeof payload === 'string' ? { body: payload } : payload;
    return api.post(`messages/conversations/${conversationId}/messages`, body);
  },
  sendAttachment: (conversationId, file, body = '') => {
    const formData = new FormData();
    formData.append('message_attachment', file);
    if (body) formData.append('body', body);
    return api.post(`messages/conversations/${conversationId}/attachments`, formData);
  },
  sendInterviewInvite: (conversationId, payload = {}) =>
    api.post(`messages/conversations/${conversationId}/interview-invite`, payload),
  sendJobInfo: (conversationId, payload = {}) =>
    api.post(`messages/conversations/${conversationId}/job-info`, payload),
  markRead: (conversationId) => api.post(`messages/conversations/${conversationId}/read`),
  archiveConversation: (conversationId, archived = true) =>
    api.post(`messages/conversations/${conversationId}/archive`, { archived }),
  deleteConversation: (conversationId) => api.delete(`messages/conversations/${conversationId}`),
  blockConversation: (conversationId, blocked = true) =>
    api.post(`messages/conversations/${conversationId}/block`, { blocked }),
};

export default messageService;
