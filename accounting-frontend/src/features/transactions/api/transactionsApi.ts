// src/features/transactions/api/transactionsApi.ts
import api from '@/lib/api';
import type { 
  Transaction, 
  CreateTransactionDto, 
  UpdateTransactionDto,
  TransactionFilters,
  BulkDeleteRequest 
} from '../types/transaction.types';

export const transactionsApi = {
  // Get all transactions with filters
  getAll: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const response = await api.get('/transactions', { params: filters });
    return response.data;
  },

  // Get transaction by ID
  getById: async (id: number): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  // Create credit transaction
  createCredit: async (data: Omit<CreateTransactionDto, 'type'>): Promise<Transaction> => {
    const response = await api.post('/transactions/credit', {
      ...data,
      type: 'CREDIT'
    });
    return response.data;
  },

  // Create debit transaction
  createDebit: async (data: Omit<CreateTransactionDto, 'type'>): Promise<Transaction> => {
    const response = await api.post('/transactions/debit', {
      ...data,
      type: 'DEBIT'
    });
    return response.data;
  },

  // Update transaction
  update: async (id: number, data: UpdateTransactionDto): Promise<Transaction> => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  // Delete single transaction (requires password confirmation)
  delete: async (id: number, password: string): Promise<void> => {
    await api.delete(`/transactions/${id}`, {
      headers: { 'X-Password-Confirmation': password }
    });
  },

  // Bulk delete transactions (requires password confirmation)
  bulkDelete: async (data: BulkDeleteRequest): Promise<void> => {
    await api.post('/transactions/bulk-delete', data);
  },

  // Get customer transactions
  getByCustomer: async (customerId: number, year?: number): Promise<Transaction[]> => {
    const params = year ? { year } : {};
    const response = await api.get(`/customers/${customerId}/transactions`, { params });
    return response.data;
  },

  // Get year-wise transactions
  getByYear: async (year: number): Promise<Transaction[]> => {
    const response = await api.get('/transactions', {
      params: { year }
    });
    return response.data;
  },

  // Get transactions by date range
  getByDateRange: async (startDate: string, endDate: string): Promise<Transaction[]> => {
    const response = await api.get('/transactions', {
      params: { startDate, endDate }
    });
    return response.data;
  },
};