import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && <label className="block text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-xs text-stone-900 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all shadow-sm',
            error && 'border-terracotta focus:border-terracotta focus:ring-terracotta/20',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-stone-900">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[10px] text-terracotta font-medium font-mono">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
