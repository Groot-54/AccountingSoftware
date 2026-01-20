// src/features/transactions/hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactionsApi';
import type { CreateTransactionDto, UpdateTransactionDto } from '../types/transaction.types';

export const useTransactions = (params?: {
  customerId?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  type?: 'Credit' | 'Debit';
}) => {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => transactionsApi.getAll(params),
  });
};

export const useTransaction = (id: number) => {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
  });
};

export const useCustomerTransactions = (customerId: number, year?: number) => {
  return useQuery({
    queryKey: ['transactions', 'customer', customerId, year],
    queryFn: () => transactionsApi.getByCustomer(customerId, year),
    enabled: !!customerId,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, data }: { type: 'credit' | 'debit'; data: CreateTransactionDto }) => {
      if (type === 'credit') {
        return transactionsApi.createCredit(data);
      } else {
        return transactionsApi.createDebit(data);
      }
    },
    onSuccess: () => {
      // Invalidate all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransactionDto }) =>
      transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      transactionsApi.delete(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};