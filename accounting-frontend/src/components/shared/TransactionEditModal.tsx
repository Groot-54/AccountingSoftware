// src/components/shared/TransactionEditModal.tsx - NEW FILE
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { getTodayDate } from '@/lib/utils';

interface Transaction {
  id: number;
  transactionDate: string;
  description?: string;
  amount: number;
  remark?: string;
  transactionType: 'Credit' | 'Debit';
}

export interface TransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (id: number, data: {
    transactionDate: string;
    description?: string;
    amount: number;
    remark?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    transactionDate: '',
    amount: '',
    description: '',
    remark: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  // Load transaction data when modal opens
  useEffect(() => {
    if (transaction && isOpen) {
      setFormData({
        transactionDate: transaction.transactionDate.split('T')[0],
        amount: transaction.amount.toString(),
        description: transaction.description || '',
        remark: transaction.remark || ''
      });
      setErrors({});
      setError('');
    }
  }, [transaction, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Transaction date is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (parseFloat(formData.amount) > 10000000) {
      newErrors.amount = 'Amount cannot exceed ₹1 crore';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction) return;
    if (!validateForm()) return;

    setError('');

    try {
      await onSave(transaction.id, {
        transactionDate: formData.transactionDate,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        remark: formData.remark || undefined,
      });

      onClose();
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      setError(err?.response?.data?.message || 'Failed to update transaction');
    }
  };

  if (!transaction) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Edit ${transaction.transactionType} Transaction`}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <Input
            type="date"
            label="Transaction Date"
            required
            value={formData.transactionDate}
            onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
            max={getTodayDate()}
            error={errors.transactionDate}
          />

          <Input
            type="number"
            step="0.01"
            min="0"
            label="Amount (₹)"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={errors.amount}
            leftIcon={<span className="text-gray-500">₹</span>}
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Transaction description"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Remark / Notes
            </label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows={3}
              placeholder="Additional notes (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            fullWidth
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};