import apiClient from './apiClient';

export const outingService = {
  getOutings: async () => {
    return apiClient.get('/student/outings');
  },
  createOuting: async (data) => {
    return apiClient.post('/student/outings', data);
  }
};
