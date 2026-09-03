import apiClient from './apiClient';

export const studentService = {
  getProfile: async () => {
    return apiClient.get('/student/profile');
  },
  updateProfile: async (data) => {
    return apiClient.patch('/student/profile', data);
  },
  getHostels: async () => {
    return apiClient.get('/student/hostels');
  },
  getHostel: async (hostelId) => {
    return apiClient.get(`/student/hostels/${hostelId}`);
  }
};
