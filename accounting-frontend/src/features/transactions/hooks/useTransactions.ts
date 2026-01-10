// src/features/transactions/hooks/useTransactions.ts
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactionsApi';
import type { CreateTransactionDto, TransactionFilters, BulkDeleteRequest } from '../types/transaction.types';

export const useTransactions = (filters?: TransactionFilters) => {
  const queryClient = useQueryClient();

  // Get transactions with filters
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsApi.getAll(filters),
  });

  // Create credit mutation
  const createCreditMutation = useMutation({
    mutationFn: transactionsApi.createCredit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  // Create debit mutation
  const createDebitMutation = useMutation({
    mutationFn: transactionsApi.createDebit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      transactionsApi.delete(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: transactionsApi.bulkDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  return {
    transactions,
    isLoading,
    error,
    createCredit: createCreditMutation.mutateAsync,
    createDebit: createDebitMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    bulkDelete: bulkDeleteMutation.mutateAsync,
    isCreating: createCreditMutation.isPending || createDebitMutation.isPending,
    isDeleting: deleteMutation.isPending || bulkDeleteMutation.isPending,
  };
};

// Hook for customer transactions
export const useCustomerTransactions = (customerId: number, year?: number) => {
  return useQuery({
    queryKey: ['transactions', 'customer', customerId, year],
    queryFn: () => transactionsApi.getByCustomer(customerId, year),
    enabled: !!customerId,
  });
};

// Hook for bulk delete with selection management
export const useBulkDelete = () => {
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const toggleAll = (ids: number[]) => {
    setSelectedIds(prev =>
      prev.length === ids.length ? [] : ids
    );
  };

  const clearSelection = () => setSelectedIds([]);

  return {
    selectedIds,
    toggleSelection,
    toggleAll,
    clearSelection,
    hasSelection: selectedIds.length > 0,
    selectionCount: selectedIds.length,
  };
};
