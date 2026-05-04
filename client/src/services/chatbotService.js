import api from './api';

const chatbotService = {
  // Message operations
  sendMessage: (message, conversationId) => api.post('chat/message', { message, conversationId }),

  getHistory: (conversationId) => api.get('chat/history', { params: { conversationId } }),

  // Conversation management
  createConversation: (title) => api.post('chat/conversations', { title }),

  getConversations: () => api.get('chat/conversations'),

  renameConversation: (id, title) => api.put(`chat/conversations/${id}`, { title }),

  deleteConversation: (id) => api.delete(`chat/conversations/${id}`),

  clearHistory: (id) => api.delete(`chat/conversations/${id}/messages`),

  // Suggested questions and file upload
  getSuggestedQuestions: () => api.get('chat/suggested-questions'),

  uploadFile: (file, conversationId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }
    return api.post('chat/upload', formData);
  },

  // CV Analysis & Cover Letter
  analyzeCV: (file, jobDescription = null, conversationId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }
    return api.post('chat/analyze-cv', formData);
  },

  generateCoverLetter: (cvData, jobDescription, candidateName) =>
    api.post('chat/cover-letter', { cvData, jobDescription, candidateName }),

  // Feedback
  sendFeedback: (messageId, isPositive) => api.post('chat/feedback', { messageId, isPositive }),
};

export default chatbotService;
