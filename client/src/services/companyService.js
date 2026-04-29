import api from './api';

const companyService = {
  getCompanies: (params) => api.get('companies', { params }),
  getCompany: (id) => api.get(`companies/${id}`),
};

export default companyService;
