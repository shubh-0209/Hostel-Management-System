import apiClient from './apiClient';

export const maintenanceService = {
  getMaintenanceRequests: async () => {
    return apiClient.get('/student/maintenance');
  },
  createMaintenanceRequest: async (data) => {
    return apiClient.post('/student/maintenance', data);
  },
  cancelMaintenanceRequest: async (id) => {
    return apiClient.patch(`/student/maintenance/${id}/cancel`);
  }
};
