import { useState } from 'react';
import { Printer, Download, Search } from 'lucide-react';
import { useCustomers } from '../features/customers/hooks/useCustomers';
import { useTransactions } from '../features/transactions/hooks/useTransactions';

export default function CustomerReport() {
  const { customers, isLoading: customersLoading } = useCustomers();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const selectedCustomer = customers?.find(c => c.id === parseInt(selectedCustomerId));
  
  const customerTransactions = transactions?.filter(t => {
    if (!selectedCustomerId) return false;
    if (t.customerId !== parseInt(selectedCustomerId)) return false;
    
    const transDate = new Date(t.transactionDate);
    const matchesStartDate = !startDate || transDate >= new Date(startDate);
    const matchesEndDate = !endDate || transDate <= new Date(endDate);
    
    return matchesStartDate && matchesEndDate;
  }) || [];

  const totalCredit = customerTransactions
    .filter(t => t.transactionType === 'CREDIT')
    .reduce((sum, t) => sum + t.creditAmount, 0);

  const totalDebit = customerTransactions
    .filter(t => t.transactionType === 'DEBIT')
    .reduce((sum, t) => sum + t.debitAmount, 0);

  const netBalance = totalCredit - totalDebit;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!selectedCustomer || customerTransactions.length === 0) {
      alert('No data to export');
      return;
    }

    let csv = 'Date,Type,Amount,Description,Running Balance\n';
    customerTransactions.forEach(t => {
      const amount = t.transactionType === 'CREDIT' ? t.creditAmount : t.debitAmount;
      csv += `${formatDate(t.transactionDate)},${t.transactionType},${amount},"${t.description || ''}",${t.runningBalance || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCustomer.customerName}_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (customersLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 print:hidden">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Customer Report</h1>
        <p className="text-gray-600">View complete transaction ledger for a customer</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a customer</option>
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customerName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handlePrint}
            disabled={!selectedCustomerId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Printer size={18} />
            Print
          </button>
          <button
            onClick={handleExport}
            disabled={!selectedCustomerId}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Content */}
      {selectedCustomer ? (
        <div>
          {/* Customer Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedCustomer.customerName}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mobile:</span>
                <span className="ml-2 font-medium">{selectedCustomer.mobile || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Address:</span>
                <span className="ml-2 font-medium">{selectedCustomer.address || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Opening Balance:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(selectedCustomer.openingBalance)} {selectedCustomer.openingBalanceType}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  selectedCustomer.isSettled ? 'bg-gray-100' : 'bg-green-100'
                }`}>
                  {selectedCustomer.isSettled ? 'Settled' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Total Credit</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCredit)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Total Debit</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalDebit)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Net Balance</div>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(netBalance))} {netBalance >= 0 ? 'Credit' : 'Debit'}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.transactionType === 'CREDIT'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {transaction.transactionType === 'DEBIT' ? formatCurrency(transaction.debitAmount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {transaction.transactionType === 'CREDIT' ? formatCurrency(transaction.creditAmount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.runningBalance || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {customerTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No transactions found for the selected period
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Select a Customer
          </h3>
          <p className="text-gray-500">
            Choose a customer from the dropdown above to view their transaction ledger
          </p>
        </div>
      )}
    </div>
  );
}