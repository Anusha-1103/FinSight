import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps {
  value: number; // 0 - 100
  color?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  color = 'bg-indigo-500',
  className,
  size = 'md',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5', heights[size], className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', color)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
