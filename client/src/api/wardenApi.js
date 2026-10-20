import apiClient from './apiClient';

export const wardenApi = {
  // Dashboard Stats
  getDashboardStats: () => apiClient.get('/warden/dashboard-stats'),
  
  // Outing Management
  getOutings: (status) => apiClient.get('/warden/outings', { params: { status } }),
  updateOutingStatus: (id, data) => apiClient.patch(`/warden/outings/${id}/status`, data),
  checkoutRequest: (id) => apiClient.patch(`/warden/outings/${id}/checkout`),
  returnRequest: (id) => apiClient.patch(`/warden/outings/${id}/return`),
  
  // Maintenance Management
  getMaintenanceRequests: (status) => apiClient.get('/warden/maintenance', { params: { status } }),
  createMaintenanceRequest: (data) => apiClient.post('/warden/maintenance', data), // Helper
  updateMaintenanceStatus: (id, status) => apiClient.patch(`/warden/maintenance/${id}`, { status }),
  
  // Occupancy Reports
  getOccupancyReport: () => apiClient.get('/warden/reports/occupancy'),
};
