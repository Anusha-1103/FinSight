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
  color = 'bg-stone-850',
  className,
  size = 'md',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3.5',
  };

  return (
    <div className={cn('w-full bg-stone-200/60 rounded-full overflow-hidden', heights[size], className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-300 ease-out', color)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
