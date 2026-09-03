import { mockDashboardStats, mockActivities } from '../mocks/dashboard';
export const dashboardApi = {
  getStats: async () => ({ data: mockDashboardStats }),
  getRecentActivity: async () => ({ data: mockActivities })
};