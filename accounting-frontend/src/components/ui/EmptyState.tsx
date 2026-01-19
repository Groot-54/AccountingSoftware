// src/components/ui/EmptyState.tsx
import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('text-center py-12', className)}>
      {Icon && (
        <Icon size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-200" />
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-450 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};