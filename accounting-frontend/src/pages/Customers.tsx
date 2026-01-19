// src/pages/Customers.tsx - REFACTORED VERSION
import { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { useCustomers } from '../features/customers/hooks/useCustomers';
import { formatCurrency, getBalanceColor } from '@/lib/utils';
import type { Customer } from '../features/customers/types/customer.types';

// Shared Components
import { 
  Button, 
  Input, 
  Select, 
  Modal, 
  Table, 
  Badge, 
  EmptyState, 
  LoadingSpinner,
  Alert
} from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { PasswordModal } from '@/components/shared/PasswordModal';

export default function Customers() {
  const { 
    customers, 
    isLoading, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer,
    settleCustomer,
    isCreating,
    isUpdating,
    isDeleting,
    isSettling
  } = useCustomers();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; customerId: number | null }>({
    isOpen: false,
    customerId: null,
  });
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    openingBalance: 0,
    openingBalanceType: 'CR' as 'CR' | 'DR',
    openingBalanceDate: new Date().toISOString().split('T')[0],
    isSettled: false,
  });

  const filteredCustomers = customers?.filter(c =>
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile?.includes(searchTerm) ||
    c.phone?.includes(searchTerm)
  ) || [];

  const handleSave = async () => {
    try {
      setError(null);
      
      if (!formData.customerName.trim()) {
        setError('Customer name is required');
        return;
      }

      if (editingCustomer) {
        await updateCustomer({
          id: editingCustomer.id,
          data: {
            customerName: formData.customerName,
            mobile: formData.mobile || undefined,
            phone: formData.phone || undefined,
            email: formData.email || undefined,
            address: formData.address || undefined,
            city: formData.city || undefined,
            state: formData.state || undefined,
            zipCode: formData.zipCode || undefined,
            openingBalance: formData.openingBalance,
            openingBalanceType: formData.openingBalanceType,
            openingBalanceDate: formData.openingBalanceDate || undefined,
            isSettled: formData.isSettled,
          },
        });
      } else {
        await createCustomer({
          customerName: formData.customerName,
          mobile: formData.mobile || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zipCode: formData.zipCode || undefined,
        });
      }
      closeModal();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customerName: customer.customerName,
      mobile: customer.mobile || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      zipCode: customer.zipCode || '',
      openingBalance: customer.openingBalance,
      openingBalanceType: customer.openingBalanceType,
      openingBalanceDate: customer.openingBalanceDate 
        ? customer.openingBalanceDate.split('T')[0] 
        : new Date().toISOString().split('T')[0],
      isSettled: customer.isSettled,
    });
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteModalState.customerId) return;
    
    await deleteCustomer({ 
      id: deleteModalState.customerId, 
      password 
    });
    
    setDeleteModalState({ isOpen: false, customerId: null });
  };

  const handleSettleCustomer = async (customerId: number) => {
    if (!confirm('Are you sure you want to settle this customer? This action marks the account as closed.')) {
      return;
    }
    
    try {
      await settleCustomer(customerId);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to settle customer');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setError(null);
    setFormData({
      customerName: '',
      mobile: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      openingBalance: 0,
      openingBalanceType: 'CR',
      openingBalanceDate: new Date().toISOString().split('T')[0],
      isSettled: false,
    });
  };

  // Table columns configuration
  const columns = [
    {
      key: 'customerName',
      header: 'Name',
      headerClassName: 'text-left',
      className: 'font-medium text-gray-900',
    },
    {
      key: 'mobile',
      header: 'Mobile',
      headerClassName: 'text-left',
      className: 'text-gray-500',
      render: (customer: Customer) => customer.mobile || customer.phone || '-',
    },
    {
      key: 'address',
      header: 'Address',
      headerClassName: 'text-left',
      className: 'text-gray-500',
      render: (customer: Customer) => customer.address || '-',
    },
    {
      key: 'openingBalance',
      header: 'Opening Balance',
      headerClassName: 'text-left',
      render: (customer: Customer) => (
        <span className={getBalanceColor(customer.openingBalanceType)}>
          {formatCurrency(customer.openingBalance)} {customer.openingBalanceType}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      headerClassName: 'text-left',
      render: (customer: Customer) => (
        <Badge variant={customer.isSettled ? 'gray' : 'success'}>
          {customer.isSettled ? 'Settled' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-left',
      render: (customer: Customer) => (
        <div className="flex items-center gap-3">
          {!customer.isSettled && (
            <button
              onClick={() => handleSettleCustomer(customer.id)}
              className="text-green-600 hover:text-green-900 transition-colors"
              title="Settle customer"
              disabled={isSettling}
            >
              <CheckCircle size={18} />
            </button>
          )}
          <button
            onClick={() => handleEdit(customer)}
            className="text-blue-600 hover:text-blue-900 transition-colors"
            title="Edit customer"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => setDeleteModalState({ isOpen: true, customerId: customer.id })}
            className="text-red-600 hover:text-red-900 transition-colors"
            title="Delete customer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading customers..." />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Customers"
        actions={
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add Customer
          </Button>
        }
      />

      <Input
        placeholder="Search by name, mobile, or phone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
        leftIcon={<span className="text-gray-400">🔍</span>}
      />

      <Table
        columns={columns}
        data={filteredCustomers}
        keyExtractor={(customer) => customer.id}
        emptyState={
          <EmptyState
            title="No customers found"
            description={searchTerm ? 'Try adjusting your search' : 'Add your first customer to get started'}
          />
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
      >
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Customer Name"
            required
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="Enter customer name"
            className="md:col-span-2"
          />

          <Input
            label="Mobile Number"
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            placeholder="10-digit mobile"
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Landline or alternate"
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="customer@example.com"
            className="md:col-span-2"
          />

          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={2}
            placeholder="Street address"
            className="md:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <Input
            label="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />

          <Input
            label="State"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />

          <Input
            label="ZIP Code"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
          />

          {editingCustomer && (
            <>
              <Input
                label="Opening Balance"
                type="number"
                step="0.01"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
              />

              <Select
                label="Balance Type"
                value={formData.openingBalanceType}
                onChange={(e) => setFormData({ ...formData, openingBalanceType: e.target.value as 'CR' | 'DR' })}
                options={[
                  { value: 'CR', label: 'Credit (CR)' },
                  { value: 'DR', label: 'Debit (DR)' },
                ]}
              />

              <Input
                label="Opening Balance Date"
                type="date"
                value={formData.openingBalanceDate}
                onChange={(e) => setFormData({ ...formData, openingBalanceDate: e.target.value })}
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSettled"
                  checked={formData.isSettled}
                  onChange={(e) => setFormData({ ...formData, isSettled: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isSettled" className="text-sm font-medium text-gray-700">
                  Mark as Settled
                </label>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={closeModal} fullWidth>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isCreating || isUpdating}
            fullWidth
          >
            Save Customer
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <PasswordModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, customerId: null })}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        description="This action cannot be undone. Enter your password to confirm:"
        confirmButtonText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}