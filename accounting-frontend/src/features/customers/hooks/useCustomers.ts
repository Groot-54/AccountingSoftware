// src/features/customers/hooks/useCustomers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api/customersApi';
import type { CreateCustomerDto, UpdateCustomerDto } from '../types/customer.types';

export const useCustomers = () => {
  const queryClient = useQueryClient();

  // Get all customers
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
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

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
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
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
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