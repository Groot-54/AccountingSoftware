// src/features/dashboard/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';

export const useDashboardOverview = (year?: number) => {
  return useQuery({
    queryKey: ['dashboard', 'overview', year],
    queryFn: () => dashboardApi.getOverview(year),
    staleTime: 30000, // 30 seconds
  });
};

export const useYearlySummary = (startYear?: number, endYear?: number) => {
  return useQuery({
    queryKey: ['dashboard', 'yearly-summary', startYear, endYear],
    queryFn: () => dashboardApi.getYearlySummary(startYear, endYear),
    staleTime: 60000, // 1 minute
  });
};

export const useTopCustomers = (limit = 10, orderBy: 'balance' | 'transactions' | 'recent' = 'balance') => {
  return useQuery({
    queryKey: ['dashboard', 'top-customers', limit, orderBy],
    queryFn: () => dashboardApi.getTopCustomers(limit, orderBy),
    staleTime: 30000,
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
    staleTime: 30000,
  });
};