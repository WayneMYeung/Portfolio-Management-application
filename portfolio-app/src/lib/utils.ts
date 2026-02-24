// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: number,
  currency = 'USD',
  compact = false
): string {
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
  if (compact && Math.abs(value) >= 1000) {
    opts.notation = 'compact'
    opts.maximumFractionDigits = 1
  }
  return new Intl.NumberFormat('en-US', opts).format(value)
}

export function formatPct(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function getGainLossColor(value: number): string {
  if (value > 0) return 'text-green-500'
  if (value < 0) return 'text-red-500'
  return 'text-slate-500'
}

export function getAssetTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    STOCK: 'Stock', ETF: 'ETF', CASH: 'Cash',
    CRYPTO: 'Crypto', STRUCTURED: 'Structured', TIME_DEPOSIT: 'Time Deposit',
  }
  return labels[type] ?? type
}

export const ASSET_TYPE_COLORS: Record<string, string> = {
  STOCK: '#3b82f6',
  ETF: '#8b5cf6',
  CASH: '#22c55e',
  CRYPTO: '#f59e0b',
  STRUCTURED: '#ec4899',
  TIME_DEPOSIT: '#06b6d4',
}

export const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b',
  '#ec4899', '#06b6d4', '#ef4444', '#84cc16',
]

export const CURRENCIES = ['USD', 'HKD', 'TWD', 'CNY', 'EUR', 'GBP', 'JPY', 'SGD']
export const ASSET_TYPES = ['STOCK', 'ETF', 'CASH', 'CRYPTO', 'STRUCTURED', 'TIME_DEPOSIT']
