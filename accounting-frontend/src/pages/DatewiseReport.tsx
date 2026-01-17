import { useState } from 'react';
import { FileText, Download, Printer, Calendar, Search } from 'lucide-react';
import { useDateWiseReport } from '../features/reports/hooks/useReports';

export default function DatewiseReport() {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: report, isLoading } = useDateWiseReport(startDate, endDate);

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
    if (!report) return;

    const headers = [
      'Date',
      'Customer',
      'Description',
      'Type',
      'Credit',
      'Debit',
      'Balance',
      'Balance Type'
    ];

    const rows = report.entries.map(e => [
      formatDate(e.date),
      e.customerName,
      e.description || '-',
      e.transactionType,
      e.creditAmount.toFixed(2),
      e.debitAmount.toFixed(2),
      e.balance.toFixed(2),
      e.balanceType
    ]);

    const csvContent = [
      [`Date-Wise Report`],
      [`Period: ${formatDate(startDate)} to ${formatDate(endDate)}`],
      [`Total Transactions: ${report.totalTransactions}`],
      [],
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datewise-report-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredEntries = report?.entries.filter(e =>
    e.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Date-Wise Report</h1>
              <p className="text-gray-600">All transactions within date range</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              disabled={!report}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={handleExport}
              disabled={!report}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Customer or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{report.totalTransactions}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Total Credit</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {formatCurrency(report.totalCredit)}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Total Debit</p>
            <p className="text-2xl font-bold text-red-900 mt-1">
              {formatCurrency(report.totalDebit)}
            </p>
          </div>

          <div className={`border rounded-lg p-4 ${
            report.netAmount >= 0 
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <p className={`text-sm font-medium ${
              report.netAmount >= 0 ? 'text-purple-600' : 'text-orange-600'
            }`}>
              Net Amount
            </p>
            <p className={`text-2xl font-bold mt-1 ${
              report.netAmount >= 0 ? 'text-purple-900' : 'text-orange-900'
            }`}>
              {formatCurrency(Math.abs(report.netAmount))}
            </p>
            <p className={`text-xs mt-1 ${
              report.netAmount >= 0 ? 'text-purple-600' : 'text-orange-600'
            }`}>
              {report.netAmount >= 0 ? 'Surplus' : 'Deficit'}
            </p>
          </div>
        </div>
      )}

      {/* Report Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
          Loading report...
        </div>
      ) : !report || report.entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No transactions found</p>
          <p className="text-sm mt-1">There are no transactions in the selected date range</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Credit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No transactions found matching your search
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.customerName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.description || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          entry.transactionType === 'Credit'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.transactionType}
                        </span>
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
                    </tr>
                  ))
                )}
              </tbody>
              {filteredEntries.length > 0 && (
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm text-gray-900">
                      TOTAL ({filteredEntries.length} transactions)
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      {formatCurrency(filteredEntries.reduce((sum, e) => sum + e.creditAmount, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      {formatCurrency(filteredEntries.reduce((sum, e) => sum + e.debitAmount, 0))}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

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