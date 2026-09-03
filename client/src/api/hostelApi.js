import apiClient from './apiClient';

export const hostelApi = {
  getAll: () => apiClient.get('/hostels'),
  getById: (id) => apiClient.get(`/hostels/${id}`),
  create: (data) => apiClient.post('/hostels', data),
  update: (id, data) => apiClient.patch(`/hostels/${id}`, data),
  delete: (id) => apiClient.delete(`/hostels/${id}`)
};
