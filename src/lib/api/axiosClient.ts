// src/lib/api/axiosClient.ts
import axios from 'axios';
import { getAuthToken, handleUnauthorizedRedirect } from '@/lib/auth/tokenStorage';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự động logout khi token hết hạn / session bị revoke (401 từ jwt.strategy.ts)
axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorizedRedirect();
    }
    return Promise.reject(error);
  },
);

export default axiosClient;