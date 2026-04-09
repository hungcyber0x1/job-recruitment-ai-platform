import api from './api';

export const getFeatureCatalog = () => api.get('features/catalog');

export default {
  getFeatureCatalog,
};
