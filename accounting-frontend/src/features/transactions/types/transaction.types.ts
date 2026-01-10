// src/features/transactions/types/transaction.types.ts
export interface Transaction {
  id: number;
  customerId: number;
  customerName?: string;
  transactionDate: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  transactionType: 'DEBIT' | 'CREDIT';
  financialYear: number;
  remark?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  customerId: number;
  transactionDate: string;
  description?: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  remark?: string;
}

export interface UpdateTransactionDto {
  transactionDate?: string;
  description?: string;
  amount?: number;
  remark?: string;
}

export interface TransactionFilters {
  customerId?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  type?: 'DEBIT' | 'CREDIT';
}

export interface BulkDeleteRequest {
  transactionIds: number[];
  password: string;
}