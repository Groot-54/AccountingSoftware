// src/pages/Dashboard.tsx - REFACTORED
import { useState } from 'react';
import { Users, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useDashboardOverview, useDashboardStats } from '../features/dashboard/hooks/useDashboard';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/utils';

import {
  Button,
  Table,
  Select,
  EmptyState,
  LoadingSpinner,
  Badge,
} from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(selectedYear);
  const { data: stats } = useDashboardStats();

  // Table columns for recent transactions
  const columns = [
    {
      key: 'customerName',
      header: 'Customer',
      headerClassName: 'text-left',
      className: 'font-medium text-gray-900 dark:text-gray-100',
    },
    {
      key: 'transactionDate',
      header: 'Date',
      headerClassName: 'text-left',
      render: (t: any) => (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Calendar size={14} />
          {formatDate(t.transactionDate)}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      headerClassName: 'text-left',
      className: 'text-gray-600 dark:text-gray-400',
      render: (t: any) => t.description || '-',
    },
    {
      key: 'amount',
      header: 'Amount',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (t: any) => (
        <span className={`font-medium ${t.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
          {t.type === 'Credit' ? '+' : '-'}{formatCurrency(t.amount)}
        </span>
      ),
    },
    {
      key: 'runningBalance',
      header: 'Running Balance',
      headerClassName: 'text-right',
      className: 'text-right font-medium text-gray-900 dark:text-gray-100',
      render: (t: any) => (
        <>
          {formatCurrency(Math.abs(t.runningBalance))}{' '}
          <span className="text-xs text-gray-500">{t.runningBalance >= 0 ? 'CR' : 'DR'}</span>
        </>
      ),
    },
  ];

  if (overviewLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        description="Overview of your accounting system"
        icon={TrendingUp}
        actions={
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            options={Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => ({
              value: year,
              label: `Year ${year}`
            }))}
          />
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Customers"
          value={overview?.totalCustomers || 0}
          subtitle={`${overview?.activeCustomers || 0} active`}
          icon={Users}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          trend={stats?.growth.customerGrowth ? {
            value: stats.growth.customerGrowth,
            label: 'from last month'
          } : undefined}
          onClick={() => navigate('/customers')}
        />

        <StatCard
          title="Total Credit"
          value={formatCurrency(overview?.totalCredit || 0)}
          subtitle="This year"
          icon={TrendingUp}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          trend={stats?.growth.creditGrowth ? {
            value: stats.growth.creditGrowth,
            label: 'from last month'
          } : undefined}
        />

        <StatCard
          title="Total Debit"
          value={formatCurrency(overview?.totalDebit || 0)}
          subtitle="This year"
          icon={TrendingDown}
          iconBgColor="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-600 dark:text-red-400"
          trend={stats?.growth.debitGrowth ? {
            value: stats.growth.debitGrowth,
            label: 'from last month'
          } : undefined}
        />

        <StatCard
          title="Net Balance"
          value={formatCurrency(Math.abs(overview?.netBalance || 0))}
          subtitle={(overview?.netBalance || 0) >= 0 ? 'Surplus' : 'Deficit'}
          icon={DollarSign}
          iconBgColor={(overview?.netBalance || 0) >= 0 ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}
          iconColor={(overview?.netBalance || 0) >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'}
        />
      </div>

      {/* Monthly Summary */}
      {overview && overview.monthlySummary.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Monthly Summary - {selectedYear}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Month</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Net Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {overview.monthlySummary.map((month) => (
                  <tr key={month.month} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{month.monthName}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(month.credit)}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(month.debit)}</td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${month.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(month.netAmount))} {month.netAmount >= 0 ? 'CR' : 'DR'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">{month.transactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Transactions</h2>
          <Button variant="ghost" onClick={() => navigate('/expenses')}>
            View All →
          </Button>
        </div>

        {overview && overview.recentTransactions.length > 0 ? (
          <Table
            columns={columns}
            data={overview.recentTransactions}
            keyExtractor={(t) => t.id}
          />
        ) : (
          <EmptyState
            icon={Calendar}
            title="No transactions yet"
            description="Start by creating a credit or debit entry"
            action={
              <div className="flex gap-3">
                <Button variant="success" onClick={() => navigate('/credit')}>
                  Credit Entry
                </Button>
                <Button variant="danger" onClick={() => navigate('/debit')}>
                  Debit Entry
                </Button>
              </div>
            }
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105"
        >
          <Users size={24} className="mb-2" />
          <h3 className="font-bold text-lg">Manage Customers</h3>
          <p className="text-sm text-blue-100 mt-1">Add or edit customer details</p>
        </button>

        <button
          onClick={() => navigate('/credit')}
          className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105"
        >
          <TrendingUp size={24} className="mb-2" />
          <h3 className="font-bold text-lg">Credit Entry</h3>
          <p className="text-sm text-green-100 mt-1">Record payment received</p>
        </button>

        <button
          onClick={() => navigate('/debit')}
          className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105"
        >
          <TrendingDown size={24} className="mb-2" />
          <h3 className="font-bold text-lg">Debit Entry</h3>
          <p className="text-sm text-red-100 mt-1">Record payment made</p>
        </button>
      </div>
    </div>
  );
}