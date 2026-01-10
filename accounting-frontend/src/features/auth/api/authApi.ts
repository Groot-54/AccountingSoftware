// src/features/auth/api/authApi.ts
import api from '@/lib/api';
import type { LoginCredentials, LoginResponse, PasswordChangeRequest, User } from '../types/auth.types';

export const authApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  // Refresh token
  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Change password
  changePassword: async (data: PasswordChangeRequest): Promise<void> => {
    await api.post('/auth/change-password', data);
  },

  // Verify password (for delete operations)
  verifyPassword: async (password: string): Promise<boolean> => {
    const response = await api.post('/auth/verify-password', { password });
    return response.data.valid;
  },
};