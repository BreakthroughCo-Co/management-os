import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Create an Axios instance
export const ApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
ApiClient.interceptors.request.use(
  (config) => {
    // You can attach tokens here if interacting with a custom backend
    // const { googleAccessToken } = useAuthStore.getState();
    // if (googleAccessToken && config.url?.includes('googleapis')) {
    //   config.headers['Authorization'] = `Bearer ${googleAccessToken}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
ApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("401 Unauthorized - Token expired or invalid.");
      // Trigger token expiration logic or re-auth prompt
      const { logout } = useAuthStore.getState();
      
      // Optionally show an alert or custom notification
      alert("Session expired or unauthorized. Please sign in again.");
      
      logout();
      window.location.href = '/login'; // Redirect to login page or handle in router
    }
    return Promise.reject(error);
  }
);
