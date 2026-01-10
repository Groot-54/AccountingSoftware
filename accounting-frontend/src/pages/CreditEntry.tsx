import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { useCustomers } from '../features/customers/hooks/useCustomers';
import { useTransactions } from '../features/transactions/hooks/useTransactions';

export default function CreditEntry() {
  const { customers, isLoading: customersLoading } = useCustomers();
  const { createCredit, isCreating } = useTransactions();
  
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const activeCustomers = customers?.filter(c => !c.isSettled) || [];

  useEffect(() => {
    if (formData.customerId) {
      const customer = activeCustomers.find(c => c.id === parseInt(formData.customerId));
      setSelectedCustomer(customer);
    } else {
      setSelectedCustomer(null);
    }
  }, [formData.customerId, activeCustomers]);

  const handleSave = async () => {
    if (!formData.customerId || !formData.amount) {
      alert('Please fill in Customer and Amount fields');
      return;
    }

    try {
      await createCredit({
        customerId: parseInt(formData.customerId),
        amount: parseFloat(formData.amount),
        description: formData.description,
        transactionDate: formData.transactionDate,
      });

      alert('Credit transaction saved successfully!');
      handleReset();
    } catch (error) {
      console.error('Error saving credit transaction:', error);
      alert('Failed to save transaction. Please try again.');
    }
  };

  const handleReset = () => {
    setFormData({
      customerId: '',
      amount: '',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
    });
    setSelectedCustomer(null);
  };

  if (customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Credit Entry</h1>
        <p className="text-gray-600 mt-1">Record money received from customers</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer *
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Customer</option>
              {activeCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customerName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Date
            </label>
            <input
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Enter transaction details..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {selectedCustomer && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Customer Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{selectedCustomer.fullName}</span>
              </div>
              <div>
                <span className="text-gray-600">Mobile:</span>
                <span className="ml-2 font-medium">{selectedCustomer.mobile || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Balance:</span>
                <span className={`ml-2 font-medium ${
                  selectedCustomer.openingBalanceType === 'CR' ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{selectedCustomer.openingBalance.toLocaleString()} {selectedCustomer.openingBalanceType === 'CR' ? 'Credit' : 'Debit'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">
                  {selectedCustomer.isSettled ? 'Settled' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isCreating}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {isCreating ? 'Saving...' : 'Save Credit'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Credit transactions represent money received from the customer. 
            This will reduce their outstanding balance (if they owe you) or increase their credit with you.
          </p>
        </div>
      </div>
    </div>
  );
}