'use client'
// src/components/charts/AllocationChart.tsx
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { formatCurrency, CHART_COLORS } from '@/lib/utils'

interface Props {
  data: { name: string; value: number; pct: number }[]
  currency: string
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct }: any) => {
  if (pct < 5) return null // Don't label tiny slices
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {pct.toFixed(0)}%
    </text>
  )
}

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg shadow-lg outline-none">
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{data.name}</p>
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {formatCurrency(data.value, currency)}
        </p>
        <p className="text-[10px] text-slate-500">{data.pct.toFixed(1)}% of portfolio</p>
      </div>
    )
  }
  return null
}

export default function AllocationChart({ data, currency }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data</div>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={90}
          dataKey="value"
          labelLine={false}
          label={renderCustomizedLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend
          formatter={(value, entry: any) => (
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {value} ({entry.payload?.pct?.toFixed(1)}%)
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
