import { useState } from 'react';
import { Printer, Download, Calendar } from 'lucide-react';
import { useTransactions } from '../features/transactions/hooks/useTransactions';

export default function DatewiseReport() {
  const { transactions, isLoading } = useTransactions();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterApplied, setFilterApplied] = useState(false);

  const filteredTransactions = transactions?.filter(t => {
    if (!filterApplied) return false;
    
    const transDate = new Date(t.transactionDate);
    const matchesStartDate = !startDate || transDate >= new Date(startDate);
    const matchesEndDate = !endDate || transDate <= new Date(endDate);
    
    return matchesStartDate && matchesEndDate;
  }) || [];

  const totalCredit = filteredTransactions
    .filter(t => t.transactionType === 'CREDIT')
    .reduce((sum, t) => sum + t.creditAmount, 0);

  const totalDebit = filteredTransactions
    .filter(t => t.transactionType === 'DEBIT')
    .reduce((sum, t) => sum + t.debitAmount, 0);

  const netBalance = totalCredit - totalDebit;

  const groupedByCustomer = filteredTransactions.reduce((acc, t) => {
    const customerId = t.customerId;
    if (!acc[customerId]) {
      acc[customerId] = {
        customerName: t.customerName || 'Unknown',
        transactions: [],
        totalCredit: 0,
        totalDebit: 0,
      };
    }
    acc[customerId].transactions.push(t);
    if (t.transactionType === 'CREDIT') {
      acc[customerId].totalCredit += t.creditAmount;
    } else {
      acc[customerId].totalDebit += t.debitAmount;
    }
    return acc;
  }, {} as Record<number, any>);

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

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    setFilterApplied(true);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setFilterApplied(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      alert('No data to export');
      return;
    }

    let csv = 'Date,Customer,Type,Amount,Description,Running Balance\n';
    filteredTransactions.forEach(t => {
      const amount = t.transactionType === 'CREDIT' ? t.creditAmount : t.debitAmount;
      csv += `${formatDate(t.transactionDate)},"${t.customerName || 'Unknown'}",${t.transactionType},${amount},"${t.description || ''}",${t.runningBalance || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datewise_report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 print:hidden">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Date-wise Report</h1>
        <p className="text-gray-600">View transactions for a specific date range</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
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
              End Date *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mr-2"
            >
              <Calendar size={18} />
              Generate
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        {filterApplied && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Report Content */}
      {filterApplied ? (
        <div>
          {/* Date Range Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Report Period: {formatDate(startDate)} to {formatDate(endDate)}
            </h2>
            <p className="text-gray-600">Total Transactions: {filteredTransactions.length}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="text-sm text-gray-600 mb-1">Total Credit</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCredit)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {filteredTransactions.filter(t => t.transactionType === 'CREDIT').length} transactions
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <div className="text-sm text-gray-600 mb-1">Total Debit</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalDebit)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {filteredTransactions.filter(t => t.transactionType === 'DEBIT').length} transactions
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="text-sm text-gray-600 mb-1">Net Balance</div>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(netBalance))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {netBalance >= 0 ? 'Credit' : 'Debit'}
              </div>
            </div>
          </div>

          {/* Customer-wise Summary */}
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Customer-wise Summary</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Credit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Debit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(groupedByCustomer).map(([customerId, data]: [string, any]) => {
                  const net = data.totalCredit - data.totalDebit;
                  return (
                    <tr key={customerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {data.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.transactions.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(data.totalCredit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(data.totalDebit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={net >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(Math.abs(net))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* All Transactions */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">All Transactions</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.customerName || 'Unknown'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.transactionType === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(transaction.creditAmount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No transactions found for the selected date range
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Select Date Range
          </h3>
          <p className="text-gray-500">
            Choose start and end dates above and click Generate to view the report
          </p>
        </div>
      )}
    </div>
  );
}