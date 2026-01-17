import { useState } from 'react';
import { Users, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useDashboardOverview, useDashboardStats } from '../features/dashboard/hooks/useDashboard';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(selectedYear);
  const { data: stats } = useDashboardStats();

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

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

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight size={16} className="text-green-600" />;
    if (growth < 0) return <ArrowDownRight size={16} className="text-red-600" />;
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your accounting system</p>
        </div>
        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Customers */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
             onClick={() => navigate('/customers')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{overview?.totalCustomers || 0}</p>
              <p className="text-sm text-gray-500 mt-1">
                {overview?.activeCustomers || 0} active
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          {stats && stats.growth.customerGrowth !== 0 && (
            <div className="mt-4 flex items-center gap-1">
              {getGrowthIcon(stats.growth.customerGrowth)}
              <span className={`text-sm font-medium ${getGrowthColor(stats.growth.customerGrowth)}`}>
                {Math.abs(stats.growth.customerGrowth).toFixed(1)}% from last month
              </span>
            </div>
          )}
        </div>

        {/* Total Credit */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Credit</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatCurrency(overview?.totalCredit || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">This year: ₹{(overview?.totalCredit || 0).toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          {stats && stats.growth.creditGrowth !== 0 && (
            <div className="mt-4 flex items-center gap-1">
              {getGrowthIcon(stats.growth.creditGrowth)}
              <span className={`text-sm font-medium ${getGrowthColor(stats.growth.creditGrowth)}`}>
                {Math.abs(stats.growth.creditGrowth).toFixed(1)}% from last month
              </span>
            </div>
          )}
        </div>

        {/* Total Debit */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Debit</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {formatCurrency(overview?.totalDebit || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">This year: ₹{(overview?.totalDebit || 0).toLocaleString()}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
          {stats && stats.growth.debitGrowth !== 0 && (
            <div className="mt-4 flex items-center gap-1">
              {getGrowthIcon(stats.growth.debitGrowth)}
              <span className={`text-sm font-medium ${getGrowthColor(stats.growth.debitGrowth)}`}>
                {Math.abs(stats.growth.debitGrowth).toFixed(1)}% from last month
              </span>
            </div>
          )}
        </div>

        {/* Net Balance */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Net Balance</p>
              <p className={`text-3xl font-bold mt-2 ${
                (overview?.netBalance || 0) >= 0 ? 'text-purple-600' : 'text-orange-600'
              }`}>
                {formatCurrency(Math.abs(overview?.netBalance || 0))}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {(overview?.netBalance || 0) >= 0 ? 'Surplus' : 'Deficit'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              (overview?.netBalance || 0) >= 0 ? 'bg-purple-100' : 'bg-orange-100'
            }`}>
              <DollarSign className={
                (overview?.netBalance || 0) >= 0 ? 'text-purple-600' : 'text-orange-600'
              } size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary Chart Placeholder */}
      {overview && overview.monthlySummary.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Summary - {selectedYear}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {overview.monthlySummary.map((month) => (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.monthName}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(month.credit)}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(month.debit)}</td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${
                      month.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(Math.abs(month.netAmount))} {month.netAmount >= 0 ? 'CR' : 'DR'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{month.transactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
            <button
              onClick={() => navigate('/expenses')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
        </div>

        {overview && overview.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Running Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overview.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(transaction.transactionDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={`font-medium ${
                        transaction.type === 'Credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'Credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(Math.abs(transaction.runningBalance))} 
                      <span className="text-xs ml-1">
                        {transaction.runningBalance >= 0 ? 'CR' : 'DR'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No transactions yet</p>
            <p className="text-sm mt-1">Start by creating a credit or debit entry</p>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => navigate('/credit-entry')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Credit Entry
              </button>
              <button
                onClick={() => navigate('/debit-entry')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Debit Entry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105"
        >
          <Users size={24} className="mb-2" />
          <h3 className="font-bold text-lg">Manage Customers</h3>
          <p className="text-sm text-blue-100 mt-1">Add or edit customer details</p>
        </button>

        <button
          onClick={() => navigate('/credit-entry')}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105"
        >
          <TrendingUp size={24} className="mb-2" />
          <h3 className="font-bold text-lg">Credit Entry</h3>
          <p className="text-sm text-green-100 mt-1">Record payment received</p>
        </button>

        <button
          onClick={() => navigate('/debit-entry')}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105"
        >
          <TrendingDown size={24} className="mb-2" />
          <h3 className="font-bold text-lg">Debit Entry</h3>
          <p className="text-sm text-red-100 mt-1">Record payment made</p>
        </button>
      </div>
    </div>
  );
}