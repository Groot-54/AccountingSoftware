// src/features/reports/types/reports.types.ts

export interface YearWiseReport {
  year: number;
  generatedAt: string;
  totalCustomers: number;
  activeCustomers: number;
  settledCustomers: number;
  totalOpeningBalance: number;
  totalCredit: number;
  totalDebit: number;
  totalClosingBalance: number;
  customers: YearWiseCustomerReport[];
}

export interface YearWiseCustomerReport {
  customerId: number;
  customerName: string;
  mobile?: string;
  openingBalance: number;
  openingBalanceType: 'CR' | 'DR';
  totalCredit: number;
  totalDebit: number;
  closingBalance: number;
  closingBalanceType: 'CR' | 'DR';
  transactionCount: number;
  isSettled: boolean;
}

export interface CustomerLedger {
  customerId: number;
  customerName: string;
  mobile?: string;
  address?: string;
  openingBalance: number;
  openingBalanceType: 'CR' | 'DR';
  totalCredit: number;
  totalDebit: number;
  closingBalance: number;
  closingBalanceType: 'CR' | 'DR';
  startDate?: string;
  endDate?: string;
  year?: number;
  generatedAt: string;
  entries: LedgerEntry[];
}

export interface LedgerEntry {
  id: number;
  date: string;
  description?: string;
  creditAmount: number;
  debitAmount: number;
  balance: number;
  balanceType: 'CR' | 'DR';
  remark?: string;
}

export interface DateWiseReport {
  startDate: string;
  endDate: string;
  generatedAt: string;
  totalTransactions: number;
  totalCredit: number;
  totalDebit: number;
  netAmount: number;
  entries: DateWiseReportEntry[];
}

export interface DateWiseReportEntry {
  id: number;
  date: string;
  customerId: number;
  customerName: string;
  description?: string;
  creditAmount: number;
  debitAmount: number;
  balance: number;
  balanceType: 'CR' | 'DR';
  transactionType: 'Credit' | 'Debit';
}

export interface CustomerSummaryReport {
  startDate?: string;
  endDate?: string;
  year?: number;
  generatedAt: string;
  totalCustomers: number;
  totalCredit: number;
  totalDebit: number;
  summaries: CustomerSummary[];
}

export interface CustomerSummary {
  customerId: number;
  customerName: string;
  mobile?: string;
  totalCredit: number;
  totalDebit: number;
  currentBalance: number;
  balanceType: 'CR' | 'DR';
  transactionCount: number;
  lastTransactionDate: string;
}