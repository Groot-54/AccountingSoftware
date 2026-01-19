// src/lib/utils.ts - ENHANCED VERSION
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes intelligently
 * Handles conflicts and removes duplicates
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Indian currency (₹)
 * @param amount - Number to format
 * @returns Formatted currency string (e.g., ₹1,500.50)
 * @example
 * formatCurrency(1500.5) // "₹1,500.50"
 * formatCurrency(1000000) // "₹10,00,000.00"
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

/**
 * Format date to Indian format (DD Mon YYYY)
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., 15 Jan 2024)
 * @example
 * formatDate('2024-01-15') // "15 Jan 2024"
 * formatDate(new Date()) // "15 Jan 2024"
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format date for HTML date input fields (YYYY-MM-DD)
 * @param date - Optional date string or Date object
 * @returns ISO date string (e.g., 2024-01-15)
 * @example
 * formatDateForInput() // "2024-01-15" (today)
 * formatDateForInput('2024-01-15T10:30:00') // "2024-01-15"
 */
export function formatDateForInput(date?: string | Date): string {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 * @returns Today's date as string
 * @example
 * getTodayDate() // "2024-01-15"
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format date and time to Indian format
 * @param date - Date string or Date object
 * @returns Formatted date and time string (e.g., 15 Jan 2024, 10:30 AM)
 * @example
 * formatDateTime('2024-01-15T10:30:00') // "15 Jan 2024, 10:30 AM"
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get Tailwind color class for balance type (CR/DR)
 * @param balanceType - 'CR' (Credit) or 'DR' (Debit)
 * @returns Tailwind color class
 * @example
 * getBalanceColor('CR') // "text-green-600"
 * getBalanceColor('DR') // "text-red-600"
 */
export function getBalanceColor(balanceType: 'CR' | 'DR'): string {
  return balanceType === 'CR' ? 'text-green-600' : 'text-red-600';
}

/**
 * Get Tailwind color class for transaction type
 * @param type - 'Credit' or 'Debit'
 * @returns Tailwind color class
 * @example
 * getTransactionColor('Credit') // "text-green-600"
 * getTransactionColor('Debit') // "text-red-600"
 */
export function getTransactionColor(type: 'Credit' | 'Debit'): string {
  return type === 'Credit' ? 'text-green-600' : 'text-red-600';
}

/**
 * Get badge variant based on balance type
 * @param balanceType - 'CR' (Credit) or 'DR' (Debit)
 * @returns Badge variant name
 * @example
 * getBalanceBadgeVariant('CR') // "success"
 * getBalanceBadgeVariant('DR') // "error"
 */
export function getBalanceBadgeVariant(balanceType: 'CR' | 'DR'): 'success' | 'error' {
  return balanceType === 'CR' ? 'success' : 'error';
}

/**
 * Get badge variant based on transaction type
 * @param type - 'Credit' or 'Debit'
 * @returns Badge variant name
 * @example
 * getTransactionBadgeVariant('Credit') // "success"
 * getTransactionBadgeVariant('Debit') // "error"
 */
export function getTransactionBadgeVariant(type: 'Credit' | 'Debit'): 'success' | 'error' {
  return type === 'Credit' ? 'success' : 'error';
}

/**
 * Format number with Indian number system (lakhs, crores)
 * @param num - Number to format
 * @returns Formatted number string
 * @example
 * formatIndianNumber(1000000) // "10,00,000"
 * formatIndianNumber(10000000) // "1,00,00,000"
 */
export function formatIndianNumber(num: number): string {
  return num.toLocaleString('en-IN');
}

/**
 * Parse currency string to number
 * @param currencyStr - Currency string (e.g., "₹1,500.50" or "1,500.50")
 * @returns Number value
 * @example
 * parseCurrency("₹1,500.50") // 1500.5
 * parseCurrency("1,500.50") // 1500.5
 */
export function parseCurrency(currencyStr: string): number {
  return parseFloat(currencyStr.replace(/[₹,]/g, '')) || 0;
}

/**
 * Get financial year from date
 * @param date - Date string or Date object
 * @returns Financial year (e.g., 2024 for Apr 2024 - Mar 2025)
 * @example
 * getFinancialYear('2024-01-15') // 2023 (Jan is in FY 2023-24)
 * getFinancialYear('2024-05-15') // 2024 (May is in FY 2024-25)
 */
export function getFinancialYear(date: string | Date): number {
  const d = new Date(date);
  const month = d.getMonth(); // 0-11
  const year = d.getFullYear();
  
  // If month is Jan-Mar (0-2), financial year is previous year
  // If month is Apr-Dec (3-11), financial year is current year
  return month < 3 ? year - 1 : year;
}

/**
 * Get current financial year
 * @returns Current financial year
 * @example
 * getCurrentFinancialYear() // 2024 (if current date is in FY 2024-25)
 */
export function getCurrentFinancialYear(): number {
  return getFinancialYear(new Date());
}

/**
 * Format financial year display
 * @param year - Financial year
 * @returns Formatted string (e.g., "FY 2024-25")
 * @example
 * formatFinancialYear(2024) // "FY 2024-25"
 */
export function formatFinancialYear(year: number): string {
  return `FY ${year}-${(year + 1).toString().slice(-2)}`;
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 * @example
 * truncateText("This is a long text", 10) // "This is a..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Capitalize first letter of string
 * @param str - String to capitalize
 * @returns Capitalized string
 * @example
 * capitalizeFirst("hello") // "Hello"
 */
export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Debounce function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 * @example
 * const debouncedSearch = debounce(handleSearch, 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 * @param value - Value to check
 * @returns True if empty
 * @example
 * isEmpty(null) // true
 * isEmpty("") // true
 * isEmpty([]) // true
 * isEmpty("hello") // false
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Generate array of years for dropdowns
 * @param startYear - Starting year (default: 10 years ago)
 * @param endYear - Ending year (default: current year)
 * @returns Array of years
 * @example
 * getYearOptions() // [2024, 2023, 2022, ..., 2014]
 * getYearOptions(2020, 2024) // [2024, 2023, 2022, 2021, 2020]
 */
export function getYearOptions(startYear?: number, endYear?: number): number[] {
  const currentYear = new Date().getFullYear();
  const start = startYear || currentYear - 10;
  const end = endYear || currentYear;
  
  const years: number[] = [];
  for (let year = end; year >= start; year--) {
    years.push(year);
  }
  
  return years;
}

/**
 * Generate array of months
 * @param short - Return short month names (Jan, Feb) instead of full names
 * @returns Array of month objects with value and label
 * @example
 * getMonthOptions() // [{ value: 1, label: "January" }, ...]
 * getMonthOptions(true) // [{ value: 1, label: "Jan" }, ...]
 */
export function getMonthOptions(short = false): Array<{ value: number; label: string }> {
  const months = short
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return months.map((label, index) => ({
    value: index + 1,
    label
  }));
}

/**
 * Calculate percentage
 * @param value - Current value
 * @param total - Total value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Percentage value
 * @example
 * calculatePercentage(25, 100) // 25.00
 * calculatePercentage(1, 3, 1) // 33.3
 */
export function calculatePercentage(value: number, total: number, decimals = 2): number {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(decimals));
}

/**
 * Sleep/delay function for async operations
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 * @example
 * await sleep(1000); // Wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 * @example
 * await copyToClipboard("Hello World");
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } finally {
      textArea.remove();
    }
  }
}

/**
 * Download data as CSV file
 * @param data - Array of objects to convert to CSV
 * @param filename - Name of the file (default: data.csv)
 * @example
 * downloadCSV([{ name: "John", age: 30 }], "users.csv");
 */
export function downloadCSV(data: any[], filename = 'data.csv'): void {
  if (data.length === 0) return;
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape values containing commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}