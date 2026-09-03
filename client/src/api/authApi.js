import { mockUsers } from '../mocks/users';
// import apiClient from './apiClient';

export const authApi = {
  getUserProfile: async (email) => {
    const user = mockUsers.find(u => u.email === email);
    return { data: user || null };
  }
};