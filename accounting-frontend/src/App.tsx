// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
// import { LoginForm } from './features/auth/components/LoginForm';
import Login from './pages/Login';
import { Layout } from './components/shared/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CreditEntry from './pages/CreditEntry';
import DebitEntry from './pages/DebitEntry';
import ExpenseList from './pages/ExpenseList';
import Reports from './pages/Reports';
import CustomerReport from './pages/CustomerReport';
import DatewiseReport from './pages/DatewiseReport';
import ChangePassword from './pages/ChangePassword';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public routes */}
        {/* <Route path="/login" element={<LoginForm />} /> */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="credit" element={<CreditEntry />} />
          <Route path="debit" element={<DebitEntry />} />
          <Route path="expenses" element={<ExpenseList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/customer" element={<CustomerReport />} />
          <Route path="reports/datewise" element={<DatewiseReport />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;