// src/features/customers/types/customer.types.ts

export interface Customer {
  id: number;
  customerName: string;
  mobile?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  openingBalance: number;
  openingBalanceType: 'CR' | 'DR';
  openingBalanceDate?: string;
  isSettled: boolean;
  settlementDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  customerName: string;
  mobile?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface UpdateCustomerDto {
  customerName: string;
  mobile?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  openingBalance: number;
  openingBalanceType: 'CR' | 'DR';
  openingBalanceDate?: string;
  isSettled: boolean;
}

export interface DeleteCustomerDto {
  password: string;
}

export interface CustomerBalance {
  customerId: number;
  customerName: string;
  balance: number;
  balanceType: 'CR' | 'DR';
  year?: number;
  openingBalance: number;
  lastTransactionDate?: string;
}