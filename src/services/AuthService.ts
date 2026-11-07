// src/services/AuthService.ts
import { apiClient } from '@/lib/api/ApiClient';
import { useUserStore } from '@/store/useUserStore';
import { setAuthToken, clearAuthTokens } from '@/lib/auth/tokenStorage';

export const AuthService = {
  async registerShelter(payload: {
    email: string;
    password: string;
    name: string;
    phone: string;
    address: string;
    lat?: number;
    lng?: number;
  }) {
    const res = await apiClient.post<{ accessToken?: string; message: string; user: any }>(
      '/auth/register-shelter-direct',
      payload,
    );
    if (res?.accessToken) {
      setAuthToken(res.accessToken);
    }
    return res;
  },

  async verifyOtp(email: string, otp: string) {
    const res = await apiClient.post('/auth/verify-otp', { email, otp });
    const token = res?.accessToken || res?.access_token;
    if (token) {
      setAuthToken(token);
      useUserStore.getState().setUser(res.user);
      return res.user;
    }
    throw new Error('Xác thực thất bại');
  },

  async login(email: string, password: string) {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res?.accessToken) {
      setAuthToken(res.accessToken);
      useUserStore.getState().setUser(res.user);
      return res;
    }
    throw new Error('Đăng nhập thất bại');
  },

  logout() {
    clearAuthTokens();
    useUserStore.getState().logout();
    window.location.href = '/login';
  },
};