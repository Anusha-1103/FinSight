import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FAF8F5] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-stone-900 hover:bg-stone-850 text-white shadow-sm focus:ring-stone-900',
    secondary: 'bg-sage text-white hover:bg-sage-dark shadow-sm focus:ring-sage',
    outline: 'border border-stone-300 hover:border-stone-400 text-stone-700 bg-white hover:bg-stone-50 focus:ring-stone-500',
    danger: 'bg-terracotta text-white hover:bg-terracotta-dark shadow-sm focus:ring-terracotta',
    ghost: 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus:ring-stone-500',
    glass: 'bg-white/80 backdrop-blur-md border border-stone-200 hover:bg-white text-stone-900 shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
