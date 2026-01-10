// src/pages/Dashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
  currentYearCredit: number;
  currentYearDebit: number;
}

interface RecentTransaction {
  id: number;
  customerName: string;
  transactionDate: string;
  description: string;
  creditAmount: number;
  debitAmount: number;
  runningBalance: number;
}

export const Dashboard: React.FC = () => {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  // Fetch recent transactions
  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: async (): Promise<RecentTransaction[]> => {
      const response = await api.get('/dashboard/recent-transactions', {
        params: { limit: 10 }
      });
      return response.data;
    },
  });

  const statCards = [
    {
      label: 'Total Customers',
      value: stats?.totalCustomers.toString() || '0',
      subValue: `${stats?.activeCustomers || 0} active`,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Credit',
      value: formatCurrency(stats?.totalCredit || 0),
      subValue: `This year: ${formatCurrency(stats?.currentYearCredit || 0)}`,
      icon: TrendingUp,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      label: 'Total Debit',
      value: formatCurrency(stats?.totalDebit || 0),
      subValue: `This year: ${formatCurrency(stats?.currentYearDebit || 0)}`,
      icon: TrendingDown,
      color: 'bg-red-500',
      textColor: 'text-red-600',
    },
    {
      label: 'Net Balance',
      value: formatCurrency(stats?.netBalance || 0),
      subValue: stats?.netBalance && stats.netBalance >= 0 ? 'Surplus' : 'Deficit',
      icon: DollarSign,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
  ];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400 mt-1">{stat.subValue}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>

        {transactionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : recentTransactions && recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-700">Date</th>
                  <th className="text-left p-3 font-medium text-gray-700">Customer</th>
                  <th className="text-left p-3 font-medium text-gray-700">Description</th>
                  <th className="text-right p-3 font-medium text-gray-700">Credit</th>
                  <th className="text-right p-3 font-medium text-gray-700">Debit</th>
                  <th className="text-right p-3 font-medium text-gray-700">Balance</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-sm">
                      {formatDate(txn.transactionDate)}
                    </td>
                    <td className="p-3 font-medium">{txn.customerName}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {txn.description || '-'}
                    </td>
                    <td className="p-3 text-right text-green-600 font-medium">
                      {txn.creditAmount > 0
                        ? formatCurrency(txn.creditAmount)
                        : '-'}
                    </td>
                    <td className="p-3 text-right text-red-600 font-medium">
                      {txn.debitAmount > 0
                        ? formatCurrency(txn.debitAmount)
                        : '-'}
                    </td>
                    <td className="p-3 text-right font-bold">
                      {formatCurrency(txn.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No transactions yet
          </div>
        )}
      </div>

      {/* Quick Actions (Optional) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => window.location.href = '/customers'}
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          <Users className="text-blue-600 mb-2" size={24} />
          <h3 className="font-semibold">Manage Customers</h3>
          <p className="text-sm text-gray-600">Add or edit customer details</p>
        </button>

        <button
          onClick={() => window.location.href = '/credit'}
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          <TrendingUp className="text-green-600 mb-2" size={24} />
          <h3 className="font-semibold">Credit Entry</h3>
          <p className="text-sm text-gray-600">Record payment received</p>
        </button>

        <button
          onClick={() => window.location.href = '/debit'}
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          <TrendingDown className="text-red-600 mb-2" size={24} />
          <h3 className="font-semibold">Debit Entry</h3>
          <p className="text-sm text-gray-600">Record payment made</p>
        </button>
      </div>
    </div>
  );
};