// src/pages/DebitEntry.tsx - COMPACT VERSION
import { useState, useEffect } from 'react';
import { TrendingDown, Save, X, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../features/customers/hooks/useCustomers';
import { useCreateTransaction } from '../features/transactions/hooks/useTransactions';
import { formatCurrency, getTodayDate, getBalanceColor } from '@/lib/utils';

import {
  Button,
  Input,
  Select,
  Alert,
  Card,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';

export default function DebitEntry() {
  const navigate = useNavigate();
  const { customers, isLoading: customersLoading } = useCustomers();
  const { mutateAsync: createTransaction, isPending } = useCreateTransaction();

  const [formData, setFormData] = useState({
    customerId: '',
    transactionDate: getTodayDate(),
    amount: '',
    description: '',
    remark: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (customers && customers.length > 0 && !formData.customerId) {
      setFormData(prev => ({ ...prev, customerId: customers[0].id.toString() }));
    }
  }, [customers, formData.customerId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerId) newErrors.customerId = 'Please select a customer';
    if (!formData.transactionDate) newErrors.transactionDate = 'Transaction date is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (parseFloat(formData.amount) > 10000000) newErrors.amount = 'Amount cannot exceed ₹1 crore';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    if (!validateForm()) return;

    try {
      await createTransaction({
        type: 'debit',
        data: {
          customerId: parseInt(formData.customerId),
          transactionDate: formData.transactionDate,
          amount: parseFloat(formData.amount),
          description: formData.description || undefined,
          remark: formData.remark || undefined,
          type: 'Debit'
        }
      });

      setSuccessMessage('Debit transaction recorded successfully!');
      setFormData({
        customerId: formData.customerId,
        transactionDate: getTodayDate(),
        amount: '',
        description: '',
        remark: ''
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrors({ submit: error?.response?.data?.message || 'Failed to create transaction' });
    }
  };

  const handleReset = () => {
    setFormData({
      customerId: customers && customers.length > 0 ? customers[0].id.toString() : '',
      transactionDate: getTodayDate(),
      amount: '',
      description: '',
      remark: ''
    });
    setErrors({});
    setSuccessMessage('');
  };

  const selectedCustomer = customers?.find(c => c.id.toString() === formData.customerId);

  if (customersLoading) return <LoadingSpinner fullScreen text="Loading..." />;

  if (!customers || customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <EmptyState
          icon={TrendingDown}
          title="No Customers Found"
          description="You need to add customers before creating transactions"
          action={<Button onClick={() => navigate('/customers')}>Go to Customers</Button>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Debit Entry"
        description="Record payment made to customer"
        icon={TrendingDown}
        iconBgColor="bg-red-100 dark:bg-red-900/30"
        iconColor="text-red-600 dark:text-red-400"
      />

      {successMessage && <Alert variant="success" className="mb-4">{successMessage}</Alert>}
      {errors.submit && <Alert variant="error" className="mb-4">{errors.submit}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Select
                    label="Select Customer"
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    options={customers.map(c => ({
                      value: c.id,
                      label: `${c.customerName}${c.mobile ? ` - ${c.mobile}` : ''}`
                    }))}
                    placeholder="Choose a customer"
                    error={errors.customerId}
                  />

                  {selectedCustomer && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {selectedCustomer.customerName}
                      </span>
                      <span className={`font-bold ${getBalanceColor(selectedCustomer.openingBalanceType)}`}>
                        {formatCurrency(selectedCustomer.openingBalance)} {selectedCustomer.openingBalanceType}
                      </span>
                    </div>
                  )}
                </div>

                <Input
                  type="date"
                  label="Transaction Date"
                  required
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  max={getTodayDate()}
                  error={errors.transactionDate}
                />

                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  label="Amount (₹)"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  error={errors.amount}
                  leftIcon={<span className="text-gray-500">₹</span>}
                />

                <Input
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Payment for supplies"
                />

                <Input
                  label="Remark"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="Additional notes (optional)"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <Button type="submit" variant="danger" icon={Save} isLoading={isPending} fullWidth>
                  Save Debit Entry
                </Button>
                <Button type="button" variant="outline" icon={X} onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </Card>
          </form>
        </div>

        {/* Help Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 sticky top-6">
            <div className="flex items-start gap-2 mb-3">
              <Info size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <h3 className="font-semibold text-red-900 dark:text-red-100">Debit Entry Tips</h3>
            </div>
            <ul className="text-sm text-red-800 dark:text-red-200 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400">•</span>
                <span>Debit decreases customer balance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400">•</span>
                <span>Use when making payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400">•</span>
                <span>Running balance updates automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400">•</span>
                <span>Date cannot be in future</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}