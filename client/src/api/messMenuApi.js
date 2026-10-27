import apiClient from './apiClient';

export const messMenuApi = {
  getMenu: (params = {}) => apiClient.get('/mess-menu', { params }),
  getById: (id) => apiClient.get(`/mess-menu/${id}`),
  create: (data) => apiClient.post('/mess-menu', data),
  update: (id, data) => apiClient.put(`/mess-menu/${id}`, data),
  delete: (id) => apiClient.delete(`/mess-menu/${id}`),
};

export default messMenuApi;
