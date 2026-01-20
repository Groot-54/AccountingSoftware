// src/components/shared/PasswordModal.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { PasswordInput } from '../ui/PasswordInput';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  title?: string;
  description?: string;
  confirmButtonText?: string;
  isLoading?: boolean;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'This action requires your password to confirm.',
  confirmButtonText = 'Confirm',
  isLoading = false,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError('');
      setLocalLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Password is required');
      return;
    }

    setError('');
    setLocalLoading(true);

    try {
      await onConfirm(password);
      // Success - modal will be closed by parent
      setPassword('');
      setError('');
    } catch (err: any) {
      console.error('Password verification error:', err);
      
      // Handle different error types
      let errorMessage = 'Invalid password or action failed';
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.title) {
        errorMessage = err.response.data.title;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Check for authentication errors
      if (err?.response?.status === 401) {
        errorMessage = 'Invalid password. Please check and try again.';
      } else if (err?.response?.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      }
      
      setError(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const loading = isLoading || localLoading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>

        <PasswordInput
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(''); // Clear error when typing
          }}
          placeholder="Enter your password"
          autoFocus
          disabled={loading}
        />

        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            fullWidth
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            fullWidth
            isLoading={loading}
            disabled={!password}
          >
            {confirmButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};