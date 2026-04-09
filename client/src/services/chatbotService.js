import api from './api';

const chatbotService = {
  // Message operations
  sendMessage: (message, conversationId) => api.post('/chat/message', { message, conversationId }),

  getHistory: (conversationId) => api.get('/chat/history', { params: { conversationId } }),

  // Conversation management
  createConversation: (title) => api.post('/chat/conversations', { title }),

  getConversations: () => api.get('/chat/conversations'),

  renameConversation: (id, title) => api.put(`/chat/conversations/${id}`, { title }),

  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),

  clearHistory: (id) => api.delete(`/chat/conversations/${id}/messages`),

  // Suggested questions and file upload
  getSuggestedQuestions: () => api.get('/chat/suggested-questions'),

  uploadFile: (file, conversationId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }
    return api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default chatbotService;
