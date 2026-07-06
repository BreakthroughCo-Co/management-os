import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ApiClient as IApiClient } from '../api/ApiClient';

export interface WrappedAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete' | 'patch' | 'request'>, IApiClient {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  request<T = any>(config: AxiosRequestConfig): Promise<T>;
}

// Create an Axios instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // Retrieve googleAccessToken from useAuthStore and attach it as Authorization: Bearer <token>
    const { googleAccessToken } = useAuthStore.getState();
    if (googleAccessToken && config.url?.includes('googleapis')) {
      config.headers['Authorization'] = `Bearer ${googleAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
instance.interceptors.response.use(
  (response) => response.data,
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

export const ApiClient = instance as unknown as WrappedAxiosInstance;


