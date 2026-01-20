// src/features/customers/hooks/useCustomers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api/customersApi';
import type { CreateCustomerDto, UpdateCustomerDto } from '../types/customer.types';

export const useCustomers = (includeInactive = false) => {
  const queryClient = useQueryClient();

  // Get all customers
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers', includeInactive],
    queryFn: () => customersApi.getAll(includeInactive),
  });

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCustomerDto }) =>
      customersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  // Delete customer mutation - now accepts both id and password
  const deleteMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      customersApi.delete(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  // Settle customer mutation
  const settleMutation = useMutation({
    mutationFn: customersApi.settle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  return {
    customers,
    isLoading,
    error,
    createCustomer: createMutation.mutateAsync,
    updateCustomer: updateMutation.mutateAsync,
    deleteCustomer: deleteMutation.mutateAsync,
    settleCustomer: settleMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettling: settleMutation.isPending,
  };
};

// Hook for single customer
export const useCustomer = (id: number) => {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.getById(id),
    enabled: !!id,
  });
};

// Hook for customer balance
export const useCustomerBalance = (id: number, year?: number) => {
  return useQuery({
    queryKey: ['customers', id, 'balance', year],
    queryFn: () => customersApi.getBalance(id, year),
    enabled: !!id,
  });
};