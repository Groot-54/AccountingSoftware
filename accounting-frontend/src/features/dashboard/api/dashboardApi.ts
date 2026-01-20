// src/features/dashboard/api/dashboardApi.ts
import api from '@/lib/api';
import type {
  DashboardOverview,
  YearlySummary,
  TopCustomer,
  DashboardStats
} from '../types/dashboard.types';

export const dashboardApi = {
  // Get dashboard overview
  getOverview: async (year?: number): Promise<DashboardOverview> => {
    const yearParam = year ? `?year=${year}` : '';
    const response = await api.get(`/dashboard/overview${yearParam}`);
    return response.data;
  },

  // Get yearly summary
  getYearlySummary: async (startYear?: number, endYear?: number): Promise<YearlySummary[]> => {
    const params = new URLSearchParams();
    if (startYear) params.append('startYear', startYear.toString());
    if (endYear) params.append('endYear', endYear.toString());
    
    const queryString = params.toString();
    const response = await api.get(`/dashboard/yearly-summary${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  // Get top customers
  getTopCustomers: async (limit = 10, orderBy: 'balance' | 'transactions' | 'recent' = 'balance'): Promise<TopCustomer[]> => {
    const response = await api.get(`/dashboard/top-customers?limit=${limit}&orderBy=${orderBy}`);
    return response.data;
  },

  // Get dashboard stats
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};