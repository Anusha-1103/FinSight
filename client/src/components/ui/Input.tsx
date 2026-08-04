import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && <label className="block text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">{label}</label>}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all shadow-sm',
              leftIcon && 'pl-10',
              error && 'border-terracotta focus:border-terracotta focus:ring-terracotta/20',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] text-terracotta font-medium font-mono">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
