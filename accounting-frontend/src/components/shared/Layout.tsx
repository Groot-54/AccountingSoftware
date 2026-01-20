// src/components/shared/Layout.tsx - WITH DARK MODE SUPPORT
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
import { ThemeToggle } from './ThemeToggle';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 border-b dark:border-gray-700 transition-colors duration-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
              Accounting System
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
              {user?.fullName || user?.username}
            </span>
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            <Link
              to="/change-password"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Change Password"
            >
              <Settings size={20} />
            </Link>
            <button
              onClick={() => logout()}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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
          } lg:translate-x-0 transition-transform duration-200 ease-in-out w-64 min-h-screen bg-white dark:bg-gray-800 shadow-lg z-30 mt-16 lg:mt-0 overflow-y-auto border-r dark:border-gray-700`}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname.startsWith('/reports')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 size={20} />
                  Reports
                </div>
                <ChevronDown
                  size={16}
                  className={`transform transition-transform duration-200 ${
                    isReportsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isReportsOpen && (
                <div className="ml-8 mt-1 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {reportItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`block px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
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
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-20 lg:hidden transition-opacity duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 w-full transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};