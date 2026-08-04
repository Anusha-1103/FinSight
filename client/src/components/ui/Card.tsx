import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable = false, ...props }) => {
  return (
    <div
      className={cn(
        'glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-300',
        hoverable && 'glass-panel-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
