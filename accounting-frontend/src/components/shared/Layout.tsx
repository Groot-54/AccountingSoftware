// src/components/shared/Layout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  BarChart3, 
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/credit', label: 'Credit Entry', icon: TrendingUp },
    { path: '/debit', label: 'Debit Entry', icon: TrendingDown },
    { path: '/expenses', label: 'Expenses', icon: FileText },
  ];

  const reportItems = [
    { path: '/reports', label: 'Year-wise Reports' },
    { path: '/reports/customer', label: 'Customer Report' },
    { path: '/reports/datewise', label: 'Date-wise Report' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold text-blue-600">
              Accounting System
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user?.fullName || user?.username}
            </span>
            <Link
              to="/change-password"
              className="text-gray-600 hover:text-gray-900"
              title="Change Password"
            >
              <Settings size={20} />
            </Link>
            <button
              onClick={() => logout()}
              className="text-gray-600 hover:text-gray-900"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition-transform duration-200 ease-in-out w-64 bg-white shadow-lg z-30 mt-16 lg:mt-0 overflow-y-auto`}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}

            {/* Reports dropdown */}
            <div>
              <button
                onClick={() => setIsReportsOpen(!isReportsOpen)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname.startsWith('/reports')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 size={20} />
                  Reports
                </div>
                <ChevronDown
                  size={16}
                  className={`transform transition-transform ${
                    isReportsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isReportsOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  {reportItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};