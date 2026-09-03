import apiClient from './apiClient';

export const bedApi = {
  getByRoomId: (roomId) => apiClient.get(`/rooms/${roomId}/beds`),
  create: (data) => apiClient.post(`/rooms/${data.room_id}/beds`, data),
  update: (id, data) => apiClient.patch(`/beds/${id}`, data),
  delete: (id) => apiClient.delete(`/beds/${id}`)
};
