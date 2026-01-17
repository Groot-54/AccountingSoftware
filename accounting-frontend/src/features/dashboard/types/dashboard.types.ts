// src/features/dashboard/types/dashboard.types.ts

export interface DashboardOverview {
  // Customer Stats
  totalCustomers: number;
  activeCustomers: number;
  settledCustomers: number;

  // Current Year Stats
  year: number;
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
  balanceType: 'CR' | 'DR';

  // All Time Stats
  allTimeCredit: number;
  allTimeDebit: number;
  allTimeBalance: number;

  // Transaction Stats
  totalTransactions: number;
  allTimeTransactions: number;
  recentTransactions: RecentTransaction[];

  // Monthly Summary
  monthlySummary: MonthlySummary[];
}

export interface RecentTransaction {
  id: number;
  customerName: string;
  transactionDate: string;
  description?: string;
  amount: number;
  type: 'Credit' | 'Debit';
  runningBalance: number;
}

export interface MonthlySummary {
  month: number;
  monthName: string;
  credit: number;
  debit: number;
  netAmount: number;
  transactionCount: number;
}

export interface YearlySummary {
  year: number;
  credit: number;
  debit: number;
  netAmount: number;
  transactionCount: number;
  creditCount: number;
  debitCount: number;
}

export interface TopCustomer {
  id: number;
  customerName: string;
  balance: number;
  balanceType: 'CR' | 'DR';
  transactionCount: number;
  lastTransactionDate?: string;
}

export interface DashboardStats {
  thisMonth: MonthStats;
  lastMonth: MonthStats;
  growth: GrowthStats;
}

export interface MonthStats {
  credit: number;
  debit: number;
  transactionCount: number;
  newCustomers: number;
}

export interface GrowthStats {
  creditGrowth: number;
  debitGrowth: number;
  customerGrowth: number;
}