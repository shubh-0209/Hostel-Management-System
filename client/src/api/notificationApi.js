import { mockNotifications } from '../mocks/notifications';
export const notificationApi = {
  getNotifications: async () => ({ data: mockNotifications })
};