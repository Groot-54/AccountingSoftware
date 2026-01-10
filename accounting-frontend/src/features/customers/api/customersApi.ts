// src/features/customers/api/customersApi.ts
import api from '@/lib/api';
import type { Customer, CreateCustomerDto, UpdateCustomerDto, CustomerBalance } from '../types/customer.types';

export const customersApi = {
  // Get all customers
  getAll: async (): Promise<Customer[]> => {
    const response = await api.get('/customers');
    return response.data;
  },

  // Get customer by ID
  getById: async (id: number): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create new customer
  create: async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  // Update customer
  update: async (id: number, data: UpdateCustomerDto): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  // Delete customer (soft delete)
  delete: async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  // Get customer balance
  getBalance: async (id: number, year?: number): Promise<CustomerBalance> => {
    const params = year ? { year } : {};
    const response = await api.get(`/customers/${id}/balance`, { params });
    return response.data;
  },

  // Toggle settlement status
  toggleSettlement: async (id: number): Promise<Customer> => {
    const response = await api.patch(`/customers/${id}/toggle-settlement`);
    return response.data;
  },

  // Search customers
  search: async (searchTerm: string): Promise<Customer[]> => {
    const response = await api.get('/customers/search', {
      params: { q: searchTerm }
    });
    return response.data;
  },
};