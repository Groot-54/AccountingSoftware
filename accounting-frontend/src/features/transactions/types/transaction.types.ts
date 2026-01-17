// src/features/transactions/types/transaction.types.ts
export interface Transaction {
  id: number;
  customerId: number;
  customerName: string;
  transactionDate: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  transactionType: 'Credit' | 'Debit';
  financialYear: number;
  remark?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  customerId: number;
  transactionDate: string;
  amount: number;
  description?: string;
  type: 'Credit' | 'Debit';
  remark?: string;
}

export interface UpdateTransactionDto {
  transactionDate?: string;
  description?: string;
  amount?: number;
  remark?: string;
}

export interface DeleteTransactionDto {
  password: string;
}