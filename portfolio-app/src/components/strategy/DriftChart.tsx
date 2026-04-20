import { DriftItem } from '@/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts'
import { formatCurrency, formatPct } from '@/lib/utils'

interface DriftChartProps {
  data: DriftItem[]
  currency: string
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as DriftItem
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700">
        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <p className="text-slate-500">Target: <span className="font-medium text-slate-700 dark:text-slate-300">{item.targetPct.toFixed(1)}%</span></p>
          <p className="text-slate-500">Actual: <span className="font-medium text-slate-700 dark:text-slate-300">{item.actualPct.toFixed(1)}%</span></p>
          <p className="text-slate-500">Drift: <span className={`font-medium ${item.driftPct > 0 ? 'text-emerald-500' : item.driftPct < 0 ? 'text-rose-500' : 'text-slate-500'}`}>{(item.driftPct > 0 ? '+' : '')}{item.driftPct.toFixed(2)}%</span></p>
          <p className="text-slate-500">Value: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(item.driftValue, currency)}</span></p>
        </div>
      </div>
    )
  }
  return null
}

export default function DriftChart({ data, currency }: DriftChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-400">No drift data available</div>
  }

  // Find max absolute drift to keep x-axis balanced
  const maxDrift = Math.max(...data.map(d => Math.abs(d.driftPct)), 5) // at least 5%

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
          <XAxis 
            type="number" 
            domain={[-maxDrift, maxDrift]} 
            tickFormatter={(val) => `${val}%`}
            stroke="#64748b" 
            fontSize={12}
          />
          <YAxis 
            dataKey="label" 
            type="category" 
            stroke="#64748b" 
            fontSize={12} 
            width={120} 
            tick={{ fill: '#64748b' }}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'transparent' }} />
          <ReferenceLine x={0} stroke="#94a3b8" />
          <Bar dataKey="driftPct" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.driftPct > 0 ? '#10b981' : '#f43f5e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
