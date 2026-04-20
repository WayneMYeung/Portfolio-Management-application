'use client'
// src/components/holdings/TopHoldingsTable.tsx
import { formatCurrency, formatPct, getGainLossColor, getAssetTypeLabel } from '@/lib/utils'
import type { HoldingWithAnalytics } from '@/types'

interface Props {
  holdings: HoldingWithAnalytics[]
  currency: string
}

export default function TopHoldingsTable({ holdings, currency }: Props) {
  if (!holdings || holdings.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-8">No holdings</p>
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th className="text-left">Asset</th>
          <th className="text-right">Value</th>
          <th className="text-right">Allocation</th>
          <th className="text-right">Return</th>
        </tr>
      </thead>
      <tbody>
        {holdings.map((h, i) => (
          <tr key={h.id}>
            <td>
              <div className="flex items-center gap-3">
                <span className="w-6 text-xs text-slate-400 font-mono">{i + 1}</span>
                <div>
                  <p className="font-medium text-sm text-slate-900 dark:text-white">{h.assetName}</p>
                  <p className="text-xs text-slate-500 font-mono">{h.ticker ?? getAssetTypeLabel(h.assetType)}</p>
                </div>
              </div>
            </td>
            <td className="text-right text-sm font-mono">{formatCurrency(h.marketValueBase, currency)}</td>
            <td className="text-right">
              <div className="flex items-center justify-end gap-2">
                <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 hidden sm:block">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(h.allocationPct, 100)}%` }}
                  />
                </div>
                <span className="text-sm tabular-nums">{h.allocationPct.toFixed(1)}%</span>
              </div>
            </td>
            <td className={`text-right text-sm font-medium tabular-nums ${getGainLossColor(h.gainLossPct)}`}>
              {formatPct(h.gainLossPct)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
