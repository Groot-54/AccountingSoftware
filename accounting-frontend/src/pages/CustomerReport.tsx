// src/pages/CustomerReport.tsx - WITH EDIT/DELETE FUNCTIONALITY
import { useState, useEffect } from 'react';
import { Download, Printer, Calendar, Edit2, Trash2 } from 'lucide-react';
import { useCustomerLedger, useAvailableYears } from '../features/reports/hooks/useReports';
import { useCustomers } from '../features/customers/hooks/useCustomers';
import { useUpdateTransaction, useDeleteTransaction } from '../features/transactions/hooks/useTransactions';
import { formatCurrency, formatDate, getBalanceColor } from '@/lib/utils';

import {
  Button,
  Select,
  Input,
  Table,
  Card,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { PasswordModal } from '@/components/shared/PasswordModal';
import { TransactionEditModal } from '@/components/shared/TransactionEditModal';

export default function CustomerReport() {
  const currentYear = new Date().getFullYear();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'year' | 'dateRange'>('year');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    transaction: any | null;
  }>({ isOpen: false, transaction: null });

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    transactionId: number | null;
  }>({ isOpen: false, transactionId: null });

  const { customers } = useCustomers();
  const { data: yearsData } = useAvailableYears();

  const params = filterType === 'year' ? { year: selectedYear } : { startDate, endDate };
  const { data: ledger, isLoading } = useCustomerLedger(selectedCustomerId || 0, params);

  const { mutateAsync: updateTransaction, isPending: isUpdating } = useUpdateTransaction();
  const { mutateAsync: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();

  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const handleEditClick = (entry: any) => {
    setEditModalState({
      isOpen: true,
      transaction: {
        id: entry.id,
        transactionDate: entry.date,
        description: entry.description,
        amount: entry.creditAmount > 0 ? entry.creditAmount : entry.debitAmount,
        remark: entry.remark,
        transactionType: entry.creditAmount > 0 ? 'Credit' : 'Debit'
      }
    });
  };

  const handleEditSave = async (id: number, data: any) => {
    await updateTransaction({ id, data });
    setEditModalState({ isOpen: false, transaction: null });
  };

  const handleDeleteClick = (transactionId: number) => {
    setDeleteModalState({ isOpen: true, transactionId });
  };

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteModalState.transactionId) return;
    
    await deleteTransaction({ 
      id: deleteModalState.transactionId, 
      password 
    });
    
    setDeleteModalState({ isOpen: false, transactionId: null });
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    if (!ledger) return;

    const headers = ['Date', 'Description', 'Credit', 'Debit', 'Balance', 'Type', 'Remark'];
    const rows = ledger.entries.map(e => [
      formatDate(e.date),
      e.description || '-',
      e.creditAmount.toFixed(2),
      e.debitAmount.toFixed(2),
      e.balance.toFixed(2),
      e.balanceType,
      e.remark || '-'
    ]);

    const csvContent = [
      [`Customer Ledger - ${ledger.customerName}`],
      [`Period: ${filterType === 'year' ? `Year ${selectedYear}` : `${startDate} to ${endDate}`}`],
      [],
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-ledger-${ledger.customerName}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Table columns
  const columns = [
    {
      key: 'date',
      header: 'Date',
      headerClassName: 'text-left',
      className: 'text-gray-900 dark:text-gray-100',
      render: (e: any) => formatDate(e.date),
    },
    {
      key: 'description',
      header: 'Description',
      headerClassName: 'text-left',
      className: 'text-gray-900 dark:text-gray-100',
      render: (e: any) => e.description || '-',
    },
    {
      key: 'creditAmount',
      header: 'Credit',
      headerClassName: 'text-right',
      className: 'text-right text-green-600',
      render: (e: any) => e.creditAmount > 0 ? formatCurrency(e.creditAmount) : '-',
    },
    {
      key: 'debitAmount',
      header: 'Debit',
      headerClassName: 'text-right',
      className: 'text-right text-red-600',
      render: (e: any) => e.debitAmount > 0 ? formatCurrency(e.debitAmount) : '-',
    },
    {
      key: 'balance',
      header: 'Balance',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (e: any) => (
        <span className={`font-medium ${getBalanceColor(e.balanceType)}`}>
          {formatCurrency(e.balance)} {e.balanceType}
        </span>
      ),
    },
    {
      key: 'remark',
      header: 'Remark',
      headerClassName: 'text-left',
      className: 'text-gray-500 dark:text-gray-400',
      render: (e: any) => e.remark || '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (e: any) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleEditClick(e)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title="Edit transaction"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => handleDeleteClick(e.id)}
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
    return <LoadingSpinner fullScreen text="Loading ledger..." />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Customer Ledger"
        description="Detailed transaction history"
        actions={
          <>
            <Button variant="secondary" icon={Printer} onClick={handlePrint} disabled={!ledger}>
              Print
            </Button>
            <Button variant="success" icon={Download} onClick={handleExport} disabled={!ledger}>
              Export CSV
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Select Customer"
            value={selectedCustomerId || ''}
            onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
            options={[
              { value: '', label: 'Select a customer' },
              ...(customers?.map(c => ({
                value: c.id,
                label: `${c.customerName}${c.mobile ? ` (${c.mobile})` : ''}`
              })) || [])
            ]}
          />

          <Select
            label="Filter Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'year' | 'dateRange')}
            options={[
              { value: 'year', label: 'By Year' },
              { value: 'dateRange', label: 'Date Range' }
            ]}
          />

          {filterType === 'year' ? (
            <Select
              label="Select Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              options={yearsData?.years.map(year => ({ value: year, label: year.toString() })) || []}
            />
          ) : (
            <>
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}
        </div>
      </Card>

      {/* Customer Info & Summary */}
      {ledger && (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">{ledger.customerName}</h2>
              {ledger.mobile && <p className="text-gray-600 dark:text-gray-400">Mobile: {ledger.mobile}</p>}
              {ledger.address && <p className="text-gray-600 dark:text-gray-400">Address: {ledger.address}</p>}
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-2">
                <Calendar size={16} />
                Period: {filterType === 'year' ? `Year ${selectedYear}` : `${formatDate(startDate)} to ${formatDate(endDate)}`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Opening Balance</p>
                <p className={`text-lg font-bold mt-1 ${getBalanceColor(ledger.openingBalanceType)}`}>
                  {formatCurrency(ledger.openingBalance)} {ledger.openingBalanceType}
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Closing Balance</p>
                <p className={`text-lg font-bold mt-1 ${getBalanceColor(ledger.closingBalanceType)}`}>
                  {formatCurrency(ledger.closingBalance)} {ledger.closingBalanceType}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Total Credit</p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100 mt-1">
                  {formatCurrency(ledger.totalCredit)}
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">Total Debit</p>
                <p className="text-lg font-bold text-red-900 dark:text-red-100 mt-1">
                  {formatCurrency(ledger.totalDebit)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Ledger Table */}
      {!selectedCustomerId ? (
        <EmptyState
          icon={Calendar}
          title="Select a customer to view ledger"
          description="Choose a customer from the dropdown above"
        />
      ) : ledger && ledger.entries.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No transactions found"
          description="This customer has no transactions in the selected period"
        />
      ) : ledger ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.headerClassName}`}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Opening Balance Row */}
                <tr className="bg-blue-50 dark:bg-blue-900/20">
                  <td className="px-4 py-3 text-sm font-medium">-</td>
                  <td className="px-4 py-3 text-sm font-medium">Opening Balance</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`font-medium ${getBalanceColor(ledger.openingBalanceType)}`}>
                      {formatCurrency(ledger.openingBalance)} {ledger.openingBalanceType}
                    </span>
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                </tr>

                {/* Transactions */}
                {ledger.entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 text-sm ${col.className}`}>
                        {col.render ? col.render(entry) : (entry as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-gray-100 dark:bg-gray-900 font-bold">
                  <td className="px-4 py-3 text-sm">TOTAL</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">
                    {formatCurrency(ledger.totalCredit)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">
                    {formatCurrency(ledger.totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={getBalanceColor(ledger.closingBalanceType)}>
                      {formatCurrency(ledger.closingBalance)} {ledger.closingBalanceType}
                    </span>
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Edit Transaction Modal */}
      <TransactionEditModal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState({ isOpen: false, transaction: null })}
        transaction={editModalState.transaction}
        onSave={handleEditSave}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <PasswordModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, transactionId: null })}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        description="This will delete the transaction and recalculate running balances. Enter your password to confirm:"
        confirmButtonText="Delete"
        isLoading={isDeleting}
      />

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}