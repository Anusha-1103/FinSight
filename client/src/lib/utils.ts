import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function maskAccountNumber(accountNumber?: string | null): string {
  if (!accountNumber) return '••••0000';
  const clean = accountNumber.replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length === 0) return '••••0000';
  const last4 = clean.slice(-4);
  return `••••${last4.padStart(4, '0')}`;
}
