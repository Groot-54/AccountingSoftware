// src/pages/DatewiseReport.tsx - REFACTORED
import { useState } from 'react';
import { Download, Printer, Calendar, Search } from 'lucide-react';
import { useDateWiseReport } from '../features/reports/hooks/useReports';
import { formatCurrency, formatDate, getBalanceColor } from '@/lib/utils';

import {
  Button,
  Input,
  Table,
  Card,
  Badge,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';

export default function DatewiseReport() {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: report, isLoading } = useDateWiseReport(startDate, endDate);

  const handlePrint = () => window.print();

  const handleExport = () => {
    if (!report) return;

    const headers = ['Date', 'Customer', 'Description', 'Type', 'Credit', 'Debit', 'Balance', 'Balance Type'];
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
      ['Date-Wise Report'],
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
      render: (e: any) => e.description || '-',
    },
    {
      key: 'transactionType',
      header: 'Type',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (e: any) => (
        <Badge variant={e.transactionType === 'Credit' ? 'success' : 'error'}>
          {e.transactionType}
        </Badge>
      ),
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
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading report..." />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Date-Wise Report"
        description="All transactions within date range"
        actions={
          <>
            <Button variant="secondary" icon={Printer} onClick={handlePrint} disabled={!report}>
              Print
            </Button>
            <Button variant="success" icon={Download} onClick={handleExport} disabled={!report}>
              Export CSV
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <Input
            label="Search"
            placeholder="Customer or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={20} />}
          />
        </div>
      </Card>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card padding="sm" className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Transactions</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{report.totalTransactions}</p>
          </Card>

          <Card padding="sm" className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Credit</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
              {formatCurrency(report.totalCredit)}
            </p>
          </Card>

          <Card padding="sm" className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Debit</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
              {formatCurrency(report.totalDebit)}
            </p>
          </Card>

          <Card padding="sm" className={`border-2 ${
            report.netAmount >= 0 
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          }`}>
            <p className={`text-sm font-medium ${
              report.netAmount >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'
            }`}>
              Net Amount
            </p>
            <p className={`text-2xl font-bold mt-1 ${
              report.netAmount >= 0 ? 'text-purple-900 dark:text-purple-100' : 'text-orange-900 dark:text-orange-100'
            }`}>
              {formatCurrency(Math.abs(report.netAmount))}
            </p>
            <p className={`text-xs mt-1 ${
              report.netAmount >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'
            }`}>
              {report.netAmount >= 0 ? 'Surplus' : 'Deficit'}
            </p>
          </Card>
        </div>
      )}

      {/* Report Table */}
      {!report || report.entries.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No transactions found"
          description="There are no transactions in the selected date range"
        />
      ) : (
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
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No transactions found matching your search
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredEntries.map((entry) => (
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
                      <td colSpan={4} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
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
                  </>
                )}
              </tbody>
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