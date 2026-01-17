import { useState, useEffect } from 'react';
import { FileText, Download, Printer, Calendar } from 'lucide-react';
import { useCustomerLedger, useAvailableYears } from '../features/reports/hooks/useReports';
import { useCustomers } from '../features/customers/hooks/useCustomers';

export default function CustomerReport() {
  const currentYear = new Date().getFullYear();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'year' | 'dateRange'>('year');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { customers } = useCustomers();
  const { data: yearsData } = useAvailableYears();

  const params = filterType === 'year'
    ? { year: selectedYear }
    : { startDate, endDate };

  const { data: ledger, isLoading } = useCustomerLedger(
    selectedCustomerId || 0,
    params
  );

  // Set first customer as default
  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

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

  const handlePrint = () => {
    window.print();
  };

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Customer Ledger</h1>
              <p className="text-gray-600">Detailed transaction history</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              disabled={!ledger}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={handleExport}
              disabled={!ledger}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Customer
              </label>
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a customer</option>
                {customers?.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerName} {customer.mobile ? `(${customer.mobile})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'year' | 'dateRange')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="year">By Year</option>
                <option value="dateRange">Date Range</option>
              </select>
            </div>

            {filterType === 'year' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {yearsData?.years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Customer Info & Summary */}
      {ledger && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-3">{ledger.customerName}</h2>
              {ledger.mobile && (
                <p className="text-gray-600 flex items-center gap-2">
                  <span className="font-medium">Mobile:</span> {ledger.mobile}
                </p>
              )}
              {ledger.address && (
                <p className="text-gray-600 flex items-center gap-2">
                  <span className="font-medium">Address:</span> {ledger.address}
                </p>
              )}
              <p className="text-gray-600 flex items-center gap-2 mt-2">
                <Calendar size={16} />
                <span className="font-medium">Period:</span>
                {filterType === 'year' ? `Year ${selectedYear}` : `${formatDate(startDate)} to ${formatDate(endDate)}`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium">Opening Balance</p>
                <p className={`text-lg font-bold mt-1 ${
                  ledger.openingBalanceType === 'CR' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(ledger.openingBalance)} {ledger.openingBalanceType}
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-600 font-medium">Closing Balance</p>
                <p className={`text-lg font-bold mt-1 ${
                  ledger.closingBalanceType === 'CR' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(ledger.closingBalance)} {ledger.closingBalanceType}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-600 font-medium">Total Credit</p>
                <p className="text-lg font-bold text-green-900 mt-1">
                  {formatCurrency(ledger.totalCredit)}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-600 font-medium">Total Debit</p>
                <p className="text-lg font-bold text-red-900 mt-1">
                  {formatCurrency(ledger.totalDebit)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Entries Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
          Loading ledger...
        </div>
      ) : !selectedCustomerId ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">Select a customer to view ledger</p>
        </div>
      ) : ledger && ledger.entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No transactions found</p>
          <p className="text-sm mt-1">This customer has no transactions in the selected period</p>
        </div>
      ) : ledger ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remark
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="bg-blue-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">-</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Opening Balance</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`font-medium ${
                      ledger.openingBalanceType === 'CR' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(ledger.openingBalance)} {ledger.openingBalanceType}
                    </span>
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
                {ledger.entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {entry.description || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                      {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                      {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={`font-medium ${
                        entry.balanceType === 'CR' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(entry.balance)} {entry.balanceType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {entry.remark || '-'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="px-4 py-3 text-sm">TOTAL</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">
                    {formatCurrency(ledger.totalCredit)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">
                    {formatCurrency(ledger.totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={
                      ledger.closingBalanceType === 'CR' ? 'text-green-600' : 'text-red-600'
                    }>
                      {formatCurrency(ledger.closingBalance)} {ledger.closingBalanceType}
                    </span>
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

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