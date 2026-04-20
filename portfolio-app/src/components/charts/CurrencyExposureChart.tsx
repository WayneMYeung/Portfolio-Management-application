'use client'
// src/components/charts/CurrencyExposureChart.tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { CHART_COLORS } from '@/lib/utils'

interface Props {
  data: { currency: string; value: number; pct: number }[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg shadow-lg outline-none">
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{data.currency}</p>
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {data.pct.toFixed(1)}% Exposure
        </p>
      </div>
    )
  }
  return null
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
        <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={32}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
