// src/components/ui/Select.tsx
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-3 py-2 border rounded-lg transition-colors',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-gray-100',
            'border-gray-300 dark:border-gray-600',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            error && 'border-red-500 focus:ring-red-500',
            !error && 'border-gray-300 dark:border-gray-600',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        
        {!error && helperText && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-250">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';