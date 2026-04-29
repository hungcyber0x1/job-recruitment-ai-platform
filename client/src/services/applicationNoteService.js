import api from './api';

const applicationNoteService = {
  // Get note for a specific application
  getNote: (applicationId) =>
    api.get(`applications/${applicationId}/candidate-note`),

  // Save/update note for a specific application
  saveNote: (applicationId, data) =>
    api.put(`applications/${applicationId}/candidate-note`, data),

  // Delete note for a specific application
  deleteNote: (applicationId) =>
    api.delete(`applications/${applicationId}/candidate-note`),
};

export default applicationNoteService;
