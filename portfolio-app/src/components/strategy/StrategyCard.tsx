import { InvestmentStrategy, StrategyBucket, StrategyLeaf } from '@/types'
import { Target, CheckCircle2 } from 'lucide-react'

interface StrategyCardProps {
  strategy: InvestmentStrategy
  isSelected: boolean
  isActive: boolean
  onSelect: (strategy: InvestmentStrategy) => void
  onActivate: (strategy: InvestmentStrategy) => void
}

export default function StrategyCard({ strategy, isSelected, isActive, onSelect, onActivate }: StrategyCardProps) {
  
  const renderTree = (node: StrategyBucket | StrategyLeaf) => {
    // Basic flat rendering for preview purposes. We'll show leaves of the root.
    if (!('children' in node)) return null

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {node.children.map((child, i) => (
          <div key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {child.label} <span className="text-slate-400">{(child.weight * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div 
      className={`card p-5 cursor-pointer border-2 transition-all duration-200 ${
        isSelected 
          ? 'border-blue-500 shadow-lg shadow-blue-500/10 bg-blue-50/30 dark:bg-blue-900/10' 
          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
      }`}
      onClick={() => onSelect(strategy)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
            {isActive ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{strategy.name}</h3>
            {isActive && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active Strategy</span>}
          </div>
        </div>
        
        {isSelected && !isActive && (
          <button 
            onClick={(e) => { e.stopPropagation(); onActivate(strategy); }}
            className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-800"
          >
            Apply Portfolio
          </button>
        )}
      </div>
      
      {strategy.description && (
        <p className="mt-3 text-sm text-slate-500 line-clamp-2">{strategy.description}</p>
      )}

      {renderTree(strategy.tree)}
    </div>
  )
}
