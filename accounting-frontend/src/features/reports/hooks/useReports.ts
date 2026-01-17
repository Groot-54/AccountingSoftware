// src/features/reports/hooks/useReports.ts
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reportsApi';

export const useYearWiseReport = (year: number) => {
  return useQuery({
    queryKey: ['reports', 'year-wise', year],
    queryFn: () => reportsApi.getYearWiseReport(year),
    enabled: !!year,
  });
};

export const useCustomerLedger = (
  customerId: number,
  params?: { startDate?: string; endDate?: string; year?: number }
) => {
  return useQuery({
    queryKey: ['reports', 'customer-ledger', customerId, params],
    queryFn: () => reportsApi.getCustomerLedger(customerId, params),
    enabled: !!customerId,
  });
};

export const useDateWiseReport = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['reports', 'date-wise', startDate, endDate],
    queryFn: () => reportsApi.getDateWiseReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

export const useCustomerSummary = (params?: {
  startDate?: string;
  endDate?: string;
  year?: number;
}) => {
  return useQuery({
    queryKey: ['reports', 'customer-summary', params],
    queryFn: () => reportsApi.getCustomerSummary(params),
  });
};

export const useAvailableYears = () => {
  return useQuery({
    queryKey: ['reports', 'available-years'],
    queryFn: reportsApi.getAvailableYears,
    staleTime: 300000, // 5 minutes
  });
};