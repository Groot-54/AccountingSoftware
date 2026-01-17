// src/features/customers/api/customersApi.ts
import api from '@/lib/api';
import type { 
  Customer, 
  CreateCustomerDto, 
  UpdateCustomerDto,
  DeleteCustomerDto,
  CustomerBalance 
} from '../types/customer.types';

export const customersApi = {
  // Get all customers
  getAll: async (includeInactive = false): Promise<Customer[]> => {
    const response = await api.get(`/customers?includeInactive=${includeInactive}`);
    return response.data;
  },

  // Get customer by ID
  getById: async (id: number): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create new customer
  create: async (data: CreateCustomerDto): Promise<{ customerId: number; success: boolean; message?: string }> => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  // Update customer
  update: async (id: number, data: UpdateCustomerDto): Promise<{ success: boolean; message?: string }> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  // Delete customer (requires password)
  delete: async (id: number, password: string): Promise<{ success: boolean; message?: string }> => {
    const response = await api.delete(`/customers/${id}`, {
      data: { password } as DeleteCustomerDto
    });
    return response.data;
  },

  // Get customer balance
  getBalance: async (id: number, year?: number): Promise<CustomerBalance> => {
    const yearParam = year ? `?year=${year}` : '';
    const response = await api.get(`/customers/${id}/balance${yearParam}`);
    return response.data;
  },

  // Settle customer
  settle: async (id: number): Promise<{ message: string }> => {
    const response = await api.post(`/customers/${id}/settle`);
    return response.data;
  }
};