// src/features/customers/types/customer.types.ts
export interface Customer {
  id: number;
  customerName: string;
  phone?: string;
  mobile?: string;
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
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export interface CustomerBalance {
  balance: number;
  type: 'CR' | 'DR';
  currentYearBalance: number;
  oldYearBalance: number;
}