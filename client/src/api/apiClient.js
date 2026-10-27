import axios from 'axios';
import { supabase } from '../lib/supabase.js';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isBrowser = typeof window !== 'undefined';
  const isLocal = isBrowser
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    : !import.meta.env.PROD;

  // On any deployed non-localhost domain, never allow localhost fallback
  if (!isLocal) {
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return 'https://hms-backend-ea83.onrender.com/api/v1';
  }

  return envUrl || 'http://localhost:3000/api/v1';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
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
