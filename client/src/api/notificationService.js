import apiClient from './apiClient';

export const notificationService = {
  getNotifications: async () => {
    return apiClient.get('/student/notifications');
  },
  markRead: async (id) => {
    return apiClient.patch(`/student/notifications/${id}/read`);
  },
  markAllRead: async () => {
    return apiClient.patch('/student/notifications/read-all');
  }
};
