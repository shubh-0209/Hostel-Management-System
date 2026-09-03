import apiClient from './apiClient';

export const allocationService = {
  getMyAllocation: async () => {
    return apiClient.get('/student/allocation');
  },
  allocateBed: async (bedId) => {
    return apiClient.post('/student/allocation', { bed_id: bedId });
  }
};
