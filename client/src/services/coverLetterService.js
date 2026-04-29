import api from './api';

const coverLetterService = {
  // Get all cover letters
  getAll: () => api.get('cover-letters'),

  // Get a single cover letter
  getOne: (id) => api.get(`cover-letters/${id}`),

  // Create a new cover letter
  create: (data) => api.post('cover-letters', data),

  // Update a cover letter
  update: (id, data) => api.put(`cover-letters/${id}`, data),

  // Delete a cover letter
  delete: (id) => api.delete(`cover-letters/${id}`),

  // Set a cover letter as default
  setDefault: (id) => api.patch(`cover-letters/${id}/default`),
};

export default coverLetterService;
