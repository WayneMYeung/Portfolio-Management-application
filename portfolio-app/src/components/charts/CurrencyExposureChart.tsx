'use client'
// src/components/charts/CurrencyExposureChart.tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { CHART_COLORS } from '@/lib/utils'

interface Props {
  data: { currency: string; value: number; pct: number }[]
}

export default function CurrencyExposureChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data</div>
  }

  const sorted = [...data].sort((a, b) => b.pct - a.pct)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.1)" />
        <XAxis type="number" tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fontSize: 11 }} domain={[0, 100]} />
        <YAxis type="category" dataKey="currency" tick={{ fontSize: 12, fontWeight: 600 }} width={40} />
        <Tooltip
          formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Exposure']}
          contentStyle={{
            backgroundColor: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(148,163,184,0.2)',
            borderRadius: '8px',
            color: '#f1f5f9',
          }}
        />
        <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={32}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
