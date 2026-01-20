// src/pages/CreditEntry.tsx - COMPACT VERSION (No Scroll Needed)
import { useState, useEffect } from 'react';
import { TrendingUp, Save, X, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../features/customers/hooks/useCustomers';
import { useCreateTransaction } from '../features/transactions/hooks/useTransactions';
import { formatCurrency, getTodayDate, getBalanceColor } from '@/lib/utils';

// Shared Components
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

export default function CreditEntry() {
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
        type: 'credit',
        data: {
          customerId: parseInt(formData.customerId),
          transactionDate: formData.transactionDate,
          amount: parseFloat(formData.amount),
          description: formData.description || undefined,
          remark: formData.remark || undefined,
          type: 'Credit'
        }
      });

      setSuccessMessage('Credit transaction recorded successfully!');
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
          icon={TrendingUp}
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
        title="Credit Entry"
        description="Record payment received from customer"
        icon={TrendingUp}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />

      {successMessage && <Alert variant="success" className="mb-4">{successMessage}</Alert>}
      {errors.submit && <Alert variant="error" className="mb-4">{errors.submit}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - 2/3 width */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Selection - Full Width */}
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

                  {/* Customer Info - Compact */}
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

                {/* Date and Amount - Side by Side */}
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

                {/* Description and Remark - Side by Side */}
                <Input
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Payment for Invoice #1234"
                />

                <Input
                  label="Remark"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="Additional notes (optional)"
                />
              </div>

              {/* Buttons */}
              <div className="mt-6 flex gap-3">
                <Button type="submit" variant="success" icon={Save} isLoading={isPending} fullWidth>
                  Save Credit Entry
                </Button>
                <Button type="button" variant="outline" icon={X} onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </Card>
          </form>
        </div>

        {/* Help Sidebar - 1/3 width */}
        <div className="lg:col-span-1">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 sticky top-6">
            <div className="flex items-start gap-2 mb-3">
              <Info size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Credit Entry Tips</h3>
            </div>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Credit increases customer balance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Use when receiving payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Running balance updates automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Date cannot be in future</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}