// src/features/reports/api/reportsApi.ts
import api from '@/lib/api';
import type {
  YearWiseReport,
  CustomerLedger,
  DateWiseReport,
  CustomerSummaryReport
} from '../types/reports.types';

export const reportsApi = {
  // Get year-wise report
  getYearWiseReport: async (year: number): Promise<YearWiseReport> => {
    const response = await api.get(`/reports/year-wise?year=${year}`);
    return response.data;
  },

  // Get customer ledger
  getCustomerLedger: async (
    customerId: number,
    params?: {
      startDate?: string;
      endDate?: string;
      year?: number;
    }
  ): Promise<CustomerLedger> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.year) queryParams.append('year', params.year.toString());

    const queryString = queryParams.toString();
    const response = await api.get(
      `/reports/customer-ledger/${customerId}${queryString ? '?' + queryString : ''}`
    );
    return response.data;
  },

  // Get date-wise report
  getDateWiseReport: async (startDate: string, endDate: string): Promise<DateWiseReport> => {
    const response = await api.get(
      `/reports/date-wise?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  },

  // Get customer summary
  getCustomerSummary: async (params?: {
    startDate?: string;
    endDate?: string;
    year?: number;
  }): Promise<CustomerSummaryReport> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.year) queryParams.append('year', params.year.toString());

    const queryString = queryParams.toString();
    const response = await api.get(
      `/reports/customer-summary${queryString ? '?' + queryString : ''}`
    );
    return response.data;
  },

  // Get available years
  getAvailableYears: async (): Promise<{ years: number[] }> => {
    const response = await api.get('/reports/available-years');
    return response.data;
  }
};