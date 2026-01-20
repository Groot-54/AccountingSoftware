// src/features/transactions/api/transactionsApi.ts - FIXED VERSION
import api from '@/lib/api';
import type {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  DeleteTransactionDto
} from '../types/transaction.types';

export const transactionsApi = {
  // Get all transactions
  getAll: async (params?: {
    customerId?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
    type?: 'Credit' | 'Debit';
  }): Promise<Transaction[]> => {
    const queryParams = new URLSearchParams();
    if (params?.customerId) queryParams.append('customerId', params.customerId.toString());
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.type) queryParams.append('type', params.type);

    const queryString = queryParams.toString();
    const response = await api.get(`/transactions${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  // Get transaction by ID
  getById: async (id: number): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  // Create credit transaction
  createCredit: async (data: CreateTransactionDto): Promise<{ id: number; message: string }> => {
    const response = await api.post('/transactions/credit', data);
    return response.data;
  },

  // Create debit transaction
  createDebit: async (data: CreateTransactionDto): Promise<{ id: number; message: string }> => {
    const response = await api.post('/transactions/debit', data);
    return response.data;
  },

  // Update transaction
  update: async (id: number, data: UpdateTransactionDto): Promise<{ message: string }> => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  // Delete transaction - FIXED: Proper password in request body
  delete: async (id: number, password: string): Promise<{ message: string }> => {
    console.log('Deleting transaction:', { id, hasPassword: !!password });
    
    try {
      const response = await api.delete(`/transactions/${id}`, {
        data: { 
          password: password.trim() // Ensure no whitespace
        }
      });
      
      console.log('Delete response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Delete transaction error:', error.response || error);
      throw error;
    }
  },

  // Get transactions by customer
  getByCustomer: async (customerId: number, year?: number): Promise<Transaction[]> => {
    const yearParam = year ? `?year=${year}` : '';
    const response = await api.get(`/transactions/customer/${customerId}${yearParam}`);
    return response.data;
  }
};