// src/components/shared/PageHeader.tsx
import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  actions,
  className,
}) => {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn('p-3 rounded-full', iconBgColor)}>
              <Icon className={iconColor} size={28} />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{title}</h1>
            {description && <p className="text-gray-600 dark:text-gray-300 mt-1">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
};