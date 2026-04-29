import api from './api';

const interviewPrepService = {
  // Get all saved interview prep resources
  getResources: () => api.get('interview-prep/resources'),

  // Get saved interview notes
  getNotes: () => api.get('interview-prep/notes'),

  // Save an interview note
  saveNote: (data) => api.post('interview-prep/notes', data),

  // Update an interview note
  updateNote: (id, data) => api.put(`interview-prep/notes/${id}`, data),

  // Delete an interview note
  deleteNote: (id) => api.delete(`interview-prep/notes/${id}`),

  // Get practice questions for a specific company
  getCompanyQuestions: (companyId) =>
    api.get(`interview-prep/company-questions/${companyId}`),

  // Save a practice session result
  savePracticeSession: (data) => api.post('interview-prep/practice-sessions', data),

  // Get practice session history
  getPracticeHistory: () => api.get('interview-prep/practice-sessions'),
};

export default interviewPrepService;
