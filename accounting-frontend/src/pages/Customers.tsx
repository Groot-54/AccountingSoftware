import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { useCustomers } from '../features/customers/hooks/useCustomers';
import type { Customer } from '../features/customers/types/customer.types';

export default function Customers() {
  const { 
    customers, 
    isLoading, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer,
    isCreating,
    isUpdating,
    isDeleting 
  } = useCustomers();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; customerId: number | null }>({
    open: false,
    customerId: null,
  });
  const [password, setPassword] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    address: '',
    openingBalance: 0,
    openingBalanceType: 'CR' as 'CR' | 'DR',
    openingBalanceDate: new Date().toISOString().split('T')[0],
    isSettled: false,
  });

  const filteredCustomers = customers?.filter(c =>
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile?.includes(searchTerm)
  ) || [];

  const handleSave = async () => {
    try {
      if (editingCustomer) {
        await updateCustomer({
          id: editingCustomer.id,
          data: {
            customerName: formData.customerName,
            mobile: formData.mobile,
            address: formData.address,
          },
        });
      } else {
        await createCustomer({
          customerName: formData.customerName,
          mobile: formData.mobile,
          address: formData.address,
        });
      }
      closeModal();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customerName: customer.customerName,
      mobile: customer.mobile || '',
      address: customer.address || '',
      openingBalance: customer.openingBalance,
      openingBalanceType: customer.openingBalanceType,
      openingBalanceDate: customer.openingBalanceDate ? customer.openingBalanceDate.split('T')[0] : new Date().toISOString().split('T')[0],
      isSettled: customer.isSettled,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (customerId: number) => {
    setPasswordModal({ open: true, customerId });
  };

  const handleDeleteConfirm = async () => {
    if (!passwordModal.customerId) return;
    
    try {
      await deleteCustomer(passwordModal.customerId);
      setPasswordModal({ open: false, customerId: null });
      setPassword('');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Invalid password or deletion failed');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({
      customerName: '',
      mobile: '',
      address: '',
      openingBalance: 0,
      openingBalanceType: 'CR',
      openingBalanceDate: new Date().toISOString().split('T')[0],
      isSettled: false,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Opening Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {customer.customerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.mobile || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {customer.address || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={customer.openingBalanceType === 'CR' ? 'text-green-600' : 'text-red-600'}>
                    ₹{customer.openingBalance.toLocaleString()} {customer.openingBalanceType === 'CR' ? 'Credit' : 'Debit'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    customer.isSettled
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {customer.isSettled ? 'Settled' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(customer.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance Type
                </label>
                <select
                  value={formData.openingBalanceType}
                  onChange={(e) => setFormData({ ...formData, openingBalanceType: e.target.value as 'CR' | 'DR' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CR">Credit</option>
                  <option value="DR">Debit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Balance Date
                </label>
                <input
                  type="date"
                  value={formData.openingBalanceDate}
                  onChange={(e) => setFormData({ ...formData, openingBalanceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSettled"
                  checked={formData.isSettled}
                  onChange={(e) => setFormData({ ...formData, isSettled: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isSettled" className="text-sm font-medium text-gray-700">
                  Mark as Settled
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isCreating || isUpdating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreating || isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-4">
              Enter your password to confirm deletion:
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleDeleteConfirm()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPasswordModal({ open: false, customerId: null });
                  setPassword('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}