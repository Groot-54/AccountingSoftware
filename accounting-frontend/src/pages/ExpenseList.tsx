import { useState } from 'react';
import { Trash2, Search, Filter, Calendar, X, AlertCircle } from 'lucide-react';
import { useTransactions, useDeleteTransaction } from '../features/transactions/hooks/useTransactions';
import { useCustomers } from '../features/customers/hooks/useCustomers';

export default function ExpenseList() {
  const currentYear = new Date().getFullYear();
  
  const [filters, setFilters] = useState({
    customerId: '',
    year: currentYear.toString(),
    type: '' as '' | 'Credit' | 'Debit',
    searchTerm: ''
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    ids: number[];
  }>({ open: false, ids: [] });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { customers } = useCustomers();
  const { data: transactions, isLoading } = useTransactions({
    customerId: filters.customerId ? Number(filters.customerId) : undefined,
    year: filters.year ? Number(filters.year) : undefined,
    type: filters.type || undefined
  });
  const { mutateAsync: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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
      setDeleteModal({ open: true, ids: [id] });
    } else if (selectedIds.length > 0) {
      setDeleteModal({ open: true, ids: selectedIds });
    }
    setError('');
  };

  const handleDeleteConfirm = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      setError('');
      
      // Delete all selected transactions
      for (const id of deleteModal.ids) {
        await deleteTransaction({ id, password });
      }

      setDeleteModal({ open: false, ids: [] });
      setPassword('');
      setSelectedIds([]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid password or deletion failed');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      customerId: '',
      year: currentYear.toString(),
      type: '',
      searchTerm: ''
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Transaction List</h1>
        <p className="text-gray-600">View and manage all transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="font-medium text-gray-800">Filters</h2>
          <button
            onClick={handleClearFilters}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              value={filters.customerId}
              onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Customers</option>
              {customers?.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.customerName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Years</option>
              {Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as '' | 'Credit' | 'Debit' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Customer or description..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <p className="text-blue-900 font-medium">
            {selectedIds.length} transaction{selectedIds.length > 1 ? 's' : ''} selected
          </p>
          <button
            onClick={() => handleDeleteClick()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
            Delete Selected
          </button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-900">No transactions found</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {filters.searchTerm || filters.customerId || filters.type
                        ? 'Try adjusting your filters'
                        : 'Start by creating a credit or debit entry'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(transaction.id)}
                        onChange={() => handleSelectOne(transaction.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.transactionType === 'Credit'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={`font-medium ${
                        transaction.transactionType === 'Credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transactionType === 'Credit' ? '+' : '-'}
                        {formatCurrency(
                          transaction.transactionType === 'Credit'
                            ? transaction.creditAmount
                            : transaction.debitAmount
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={`font-medium ${
                        transaction.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(Math.abs(transaction.runningBalance))}{' '}
                        <span className="text-xs">
                          {transaction.runningBalance >= 0 ? 'CR' : 'DR'}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDeleteClick(transaction.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <p className="text-gray-600 mb-4">
              You are about to delete <strong>{deleteModal.ids.length}</strong>{' '}
              transaction{deleteModal.ids.length > 1 ? 's' : ''}. This will recalculate all
              running balances. Enter your password to confirm:
            </p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleDeleteConfirm()}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModal({ open: false, ids: [] });
                  setPassword('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting || !password}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}