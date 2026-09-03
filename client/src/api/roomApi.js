import apiClient from './apiClient';

export const roomApi = {
  getByFloorId: (floorId) => apiClient.get(`/floors/${floorId}/rooms`),
  create: (data) => apiClient.post(`/floors/${data.floor_id}/rooms`, data),
  update: (id, data) => apiClient.patch(`/rooms/${id}`, data),
  delete: (id) => apiClient.delete(`/rooms/${id}`)
};
