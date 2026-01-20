// src/pages/ExpenseList.tsx - WITH EDIT FUNCTIONALITY
import { useState } from 'react';
import { Trash2, Calendar, Edit2 } from 'lucide-react';
import { useTransactions, useDeleteTransaction, useUpdateTransaction } from '../features/transactions/hooks/useTransactions';
import { useCustomers } from '../features/customers/hooks/useCustomers';
import { formatCurrency, formatDate, getBalanceColor } from '@/lib/utils';

import {
  Button,
  Input,
  Select,
  Table,
  Badge,
  EmptyState,
  LoadingSpinner,
  Card,
} from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { PasswordModal } from '@/components/shared/PasswordModal';
import { TransactionEditModal } from '@/components/shared/TransactionEditModal';

export default function ExpenseList() {
  const currentYear = new Date().getFullYear();
  
  const [filters, setFilters] = useState({
    customerId: '',
    year: currentYear.toString(),
    type: '' as '' | 'Credit' | 'Debit',
    searchTerm: ''
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    ids: number[];
  }>({ isOpen: false, ids: [] });

  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    transaction: any | null;
  }>({ isOpen: false, transaction: null });

  const { customers } = useCustomers();
  const { data: transactions, isLoading } = useTransactions({
    customerId: filters.customerId ? Number(filters.customerId) : undefined,
    year: filters.year ? Number(filters.year) : undefined,
    type: filters.type || undefined
  });
  const { mutateAsync: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();
  const { mutateAsync: updateTransaction, isPending: isUpdating } = useUpdateTransaction();

  const filteredTransactions = transactions?.filter(t => {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        t.customerName.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map(t => t.id));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteClick = (id?: number) => {
    if (id) {
      setDeleteModalState({ isOpen: true, ids: [id] });
    } else if (selectedIds.length > 0) {
      setDeleteModalState({ isOpen: true, ids: selectedIds });
    }
  };

  const handleDeleteConfirm = async (password: string) => {
    for (const id of deleteModalState.ids) {
      await deleteTransaction({ id, password });
    }
    setDeleteModalState({ isOpen: false, ids: [] });
    setSelectedIds([]);
  };

  const handleEditClick = (transaction: any) => {
    setEditModalState({
      isOpen: true,
      transaction: {
        id: transaction.id,
        transactionDate: transaction.transactionDate,
        description: transaction.description,
        amount: transaction.transactionType === 'Credit' ? transaction.creditAmount : transaction.debitAmount,
        remark: transaction.remark,
        transactionType: transaction.transactionType
      }
    });
  };

  const handleEditSave = async (id: number, data: any) => {
    await updateTransaction({ id, data });
    setEditModalState({ isOpen: false, transaction: null });
  };

  const handleClearFilters = () => {
    setFilters({
      customerId: '',
      year: currentYear.toString(),
      type: '',
      searchTerm: ''
    });
  };

  // Table columns
  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
          onChange={handleSelectAll}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      headerClassName: 'text-left w-12',
      render: (transaction: any) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(transaction.id)}
          onChange={() => handleSelectOne(transaction.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      key: 'transactionDate',
      header: 'Date',
      headerClassName: 'text-left',
      className: 'text-gray-900 dark:text-gray-100',
      render: (t: any) => formatDate(t.transactionDate),
    },
    {
      key: 'customerName',
      header: 'Customer',
      headerClassName: 'text-left',
      className: 'font-medium text-gray-900 dark:text-gray-100',
    },
    {
      key: 'description',
      header: 'Description',
      headerClassName: 'text-left',
      className: 'text-gray-600 dark:text-gray-400',
      render: (t: any) => t.description || '-',
    },
    {
      key: 'transactionType',
      header: 'Type',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (t: any) => (
        <Badge variant={t.transactionType === 'Credit' ? 'success' : 'error'}>
          {t.transactionType}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (t: any) => (
        <span className={`font-medium ${t.transactionType === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
          {t.transactionType === 'Credit' ? '+' : '-'}
          {formatCurrency(t.transactionType === 'Credit' ? t.creditAmount : t.debitAmount)}
        </span>
      ),
    },
    {
      key: 'runningBalance',
      header: 'Balance',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (t: any) => (
        <span className={`font-medium ${getBalanceColor(t.runningBalance >= 0 ? 'CR' : 'DR')}`}>
          {formatCurrency(Math.abs(t.runningBalance))}{' '}
          <span className="text-xs">{t.runningBalance >= 0 ? 'CR' : 'DR'}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (t: any) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleEditClick(t)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title="Edit transaction"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => handleDeleteClick(t.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            title="Delete transaction"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading transactions..." />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Transaction List"
        description="View and manage all transactions"
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-gray-600 dark:text-gray-400">🔍</span>
          <h2 className="font-medium text-gray-800 dark:text-gray-100">Filters</h2>
          <button
            onClick={handleClearFilters}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Customer"
            value={filters.customerId}
            onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
            options={[
              { value: '', label: 'All Customers' },
              ...(customers?.map(c => ({ value: c.id, label: c.customerName })) || [])
            ]}
          />

          <Select
            label="Year"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            options={[
              { value: '', label: 'All Years' },
              ...Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => ({
                value: year,
                label: year.toString()
              }))
            ]}
          />

          <Select
            label="Type"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as '' | 'Credit' | 'Debit' })}
            options={[
              { value: '', label: 'All Types' },
              { value: 'Credit', label: 'Credit' },
              { value: 'Debit', label: 'Debit' }
            ]}
          />

          <Input
            label="Search"
            placeholder="Customer or description..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
          />
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800" padding="md">
          <div className="flex items-center justify-between">
            <p className="text-blue-900 dark:text-blue-100 font-medium">
              {selectedIds.length} transaction{selectedIds.length > 1 ? 's' : ''} selected
            </p>
            <Button variant="danger" icon={Trash2} onClick={() => handleDeleteClick()}>
              Delete Selected
            </Button>
          </div>
        </Card>
      )}

      {/* Transactions Table */}
      <Table
        columns={columns}
        data={filteredTransactions}
        keyExtractor={(t) => t.id}
        emptyState={
          <EmptyState
            icon={Calendar}
            title="No transactions found"
            description={
              filters.searchTerm || filters.customerId || filters.type
                ? 'Try adjusting your filters'
                : 'Start by creating a credit or debit entry'
            }
          />
        }
      />

      {/* Delete Confirmation Modal */}
      <PasswordModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, ids: [] })}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        description={`You are about to delete ${deleteModalState.ids.length} transaction${deleteModalState.ids.length > 1 ? 's' : ''}. This will recalculate all running balances. Enter your password to confirm:`}
        confirmButtonText="Delete"
        isLoading={isDeleting}
      />

      {/* Edit Transaction Modal */}
      <TransactionEditModal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState({ isOpen: false, transaction: null })}
        transaction={editModalState.transaction}
        onSave={handleEditSave}
        isLoading={isUpdating}
      />
    </div>
  );
}