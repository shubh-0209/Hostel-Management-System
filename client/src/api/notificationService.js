import apiClient from './apiClient';

export const notificationService = {
  getNotifications: async () => {
    return apiClient.get('/student/notifications');
  }
};
