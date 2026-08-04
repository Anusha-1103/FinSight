import React from 'react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn('p-8 text-center space-y-4 bg-white rounded-xl border border-stone-200/80 shadow-sm', className)}>
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200/60 text-stone-600 mx-auto flex items-center justify-center shadow-xs">
          {icon}
        </div>
      )}
      <div className="max-w-sm mx-auto space-y-1">
        <h4 className="text-xs font-bold text-stone-900">{title}</h4>
        <p className="text-[11px] text-stone-500 leading-relaxed font-sans">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
