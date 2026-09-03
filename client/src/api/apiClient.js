import axios from 'axios';
import { supabase } from '../lib/supabase.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Express backend returns { success: true, message: '...', data: ... }
    // We want to return the raw JSON object from axios (response.data)
    return response.data;
  },
  (error) => {
    // If the server responded with an error message, throw it directly
    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
