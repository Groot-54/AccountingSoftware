// src/components/shared/StatCard.tsx
import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  trend,
  onClick,
  className,
}) => {
  const getTrendColor = (trendValue: number) => {
    if (trendValue > 0) return 'text-green-600';
    if (trendValue < 0) return 'text-red-600';
    return 'text-gray-600 dark:text-gray-300';
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-shadow',
        onClick && 'cursor-pointer hover:shadow-lg',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-300 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-full', iconBgColor)}>
            <Icon className={iconColor} size={24} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span className={cn('text-sm font-medium', getTrendColor(trend.value))}>
            {trend.value > 0 ? '+' : ''}{Math.abs(trend.value).toFixed(1)}%
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-300">{trend.label}</span>
        </div>
      )}
    </div>
  );
};