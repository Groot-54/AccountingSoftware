import { FileText, User, Calendar, TrendingUp } from 'lucide-react';

export default function Reports() {
  const reportCards = [
    {
      title: 'Customer Report',
      description: 'View detailed ledger for a specific customer',
      icon: User,
      color: 'blue',
      path: '/customer-report',
    },
    {
      title: 'Date-wise Report',
      description: 'View transactions for a specific date range',
      icon: Calendar,
      color: 'green',
      path: '/datewise-report',
    },
    {
      title: 'Year-wise Summary',
      description: 'Financial year summary and balance overview',
      icon: TrendingUp,
      color: 'purple',
      path: '/year-report',
    },
    {
      title: 'All Transactions',
      description: 'Complete transaction history with filters',
      icon: FileText,
      color: 'orange',
      path: '/expense-list',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        hover: 'hover:bg-blue-50',
        border: 'border-blue-200',
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        hover: 'hover:bg-green-50',
        border: 'border-green-200',
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        hover: 'hover:bg-purple-50',
        border: 'border-purple-200',
      },
      orange: {
        bg: 'bg-orange-100',
        text: 'text-orange-600',
        hover: 'hover:bg-orange-50',
        border: 'border-orange-200',
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const handleCardClick = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports</h1>
        <p className="text-gray-600">
          Generate and view various financial reports and summaries
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCards.map((card) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);
          
          return (
            <div
              key={card.path}
              onClick={() => handleCardClick(card.path)}
              className={`${colors.bg} border-2 ${colors.border} rounded-lg p-6 cursor-pointer transition-all ${colors.hover} transform hover:scale-105 hover:shadow-lg`}
            >
              <div className={`${colors.text} mb-4`}>
                <Icon size={48} strokeWidth={1.5} />
              </div>
              <h3 className={`text-lg font-bold ${colors.text} mb-2`}>
                {card.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-1">Total Credit</div>
            <div className="text-2xl font-bold text-green-600">₹0.00</div>
            <div className="text-xs text-gray-500 mt-1">Money received</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="text-sm text-gray-600 mb-1">Total Debit</div>
            <div className="text-2xl font-bold text-red-600">₹0.00</div>
            <div className="text-xs text-gray-500 mt-1">Money paid out</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">Net Balance</div>
            <div className="text-2xl font-bold text-blue-600">₹0.00</div>
            <div className="text-xs text-gray-500 mt-1">Current position</div>
          </div>
        </div>
      </div>

      {/* Report Guidelines */}
      <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          📋 Report Guidelines
        </h3>
        <ul className="space-y-2 text-sm text-yellow-900">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Customer Report:</strong> Best for viewing complete transaction history of individual customers</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Date-wise Report:</strong> Perfect for daily or monthly reconciliation</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Year-wise Summary:</strong> Use for annual financial reviews and tax preparation</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>All Transactions:</strong> Complete searchable list with bulk operations</span>
          </li>
        </ul>
      </div>
    </div>
  );
}