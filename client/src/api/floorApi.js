import apiClient from './apiClient';

export const floorApi = {
  getByHostelId: (hostelId) => apiClient.get(`/hostels/${hostelId}/floors`),
  create: (data) => apiClient.post(`/hostels/${data.hostel_id}/floors`, data),
  update: (id, data) => apiClient.patch(`/floors/${id}`, data),
  delete: (id) => apiClient.delete(`/floors/${id}`)
};
