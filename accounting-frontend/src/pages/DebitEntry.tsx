import { useState, useEffect } from 'react';
import { TrendingDown, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../features/customers/hooks/useCustomers';
import { useCreateTransaction } from '../features/transactions/hooks/useTransactions';

export default function DebitEntry() {
  const navigate = useNavigate();
  const { customers, isLoading: customersLoading } = useCustomers();
  const { mutateAsync: createTransaction, isPending } = useCreateTransaction();

  const [formData, setFormData] = useState({
    customerId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    remark: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Set first customer as default
  useEffect(() => {
    if (customers && customers.length > 0 && !formData.customerId) {
      setFormData(prev => ({ ...prev, customerId: customers[0].id.toString() }));
    }
  }, [customers, formData.customerId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Please select a customer';
    }

    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Transaction date is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (parseFloat(formData.amount) > 10000000) {
      newErrors.amount = 'Amount cannot exceed ₹1 crore';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      await createTransaction({
        type: 'debit',
        data: {
          customerId: parseInt(formData.customerId),
          transactionDate: formData.transactionDate,
          amount: parseFloat(formData.amount),
          description: formData.description || undefined,
          remark: formData.remark || undefined,
          type: 'DEBIT'
        }
      });

      setSuccessMessage('Debit transaction recorded successfully!');

      // Reset form
      setFormData({
        customerId: formData.customerId, // Keep same customer
        transactionDate: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        remark: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error creating debit transaction:', error);
      setErrors({
        submit: error?.response?.data?.message || 'Failed to create transaction'
      });
    }
  };

  const handleReset = () => {
    setFormData({
      customerId: customers && customers.length > 0 ? customers[0].id.toString() : '',
      transactionDate: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
      remark: ''
    });
    setErrors({});
    setSuccessMessage('');
  };

  const selectedCustomer = customers?.find(c => c.id.toString() === formData.customerId);

  if (customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-orange-500" size={48} />
          <p className="text-lg font-medium text-gray-900 mb-2">No Customers Found</p>
          <p className="text-gray-600 mb-4">You need to add customers before creating transactions</p>
          <button
            onClick={() => navigate('/customers')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-red-100 p-3 rounded-full">
            <TrendingDown className="text-red-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Debit Entry</h1>
            <p className="text-gray-600">Record payment made to customer</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{errors.submit}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer *
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.customerId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Choose a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.customerName} {customer.mobile ? `- ${customer.mobile}` : ''}
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
            )}

            {/* Customer Info Card */}
            {selectedCustomer && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {selectedCustomer.customerName}
                    </p>
                    {selectedCustomer.mobile && (
                      <p className="text-sm text-gray-600">📱 {selectedCustomer.mobile}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Opening Balance</p>
                    <p className={`text-sm font-bold ${
                      selectedCustomer.openingBalanceType === 'CR' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{selectedCustomer.openingBalance.toLocaleString()} {selectedCustomer.openingBalanceType}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Date *
            </label>
            <input
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.transactionDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.transactionDate && (
              <p className="mt-1 text-sm text-red-600">{errors.transactionDate}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500 text-lg">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                In words: ₹{parseFloat(formData.amount).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Payment for supplies"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Remark */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remark / Notes
            </label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows={3}
              placeholder="Additional notes (optional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save size={20} />
            {isPending ? 'Saving...' : 'Save Debit Entry'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
          >
            <X size={20} />
            Reset
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Debit Entry Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Debit decreases the customer's balance (they owe you more or you owe them less)</li>
          <li>• Use this when you make payment to a customer</li>
          <li>• The running balance will be updated automatically</li>
          <li>• Transaction date cannot be in the future</li>
        </ul>
      </div>
    </div>
  );
}