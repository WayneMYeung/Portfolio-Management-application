'use client'
// src/components/PortfolioSelector.tsx
import { ChevronDown } from 'lucide-react'
import type { Portfolio } from '@/types'

interface Props {
  portfolios: Portfolio[]
  selectedId: string | null
  onChange: (id: string) => void
}

export default function PortfolioSelector({ portfolios, selectedId, onChange }: Props) {
  return (
    <div className="relative">
      <select
        value={selectedId ?? ''}
        onChange={e => onChange(e.target.value)}
        className="input pr-8 appearance-none bg-white dark:bg-slate-900 font-medium"
      >
        {portfolios.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.ownerName})</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  )
}
