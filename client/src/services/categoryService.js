import api from './api';

const categoryService = {
  getAllCategories: () => api.get('/categories'),
  getCategory: (id) => api.get(`/categories/${id}`),
};

export default categoryService;
