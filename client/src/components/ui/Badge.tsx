import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  const variants = {
    success: 'bg-[#8f9779]/10 text-[#747c5e] border-[#8f9779]/20',
    warning: 'bg-[#d4af37]/10 text-[#a88626] border-[#d4af37]/20',
    danger: 'bg-[#c87a53]/10 text-[#a15d39] border-[#c87a53]/20',
    info: 'bg-[#7da2a9]/10 text-[#5a8289] border-[#7da2a9]/20',
    purple: 'bg-[#a78bfa]/10 text-[#8561eb] border-[#a78bfa]/20',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
