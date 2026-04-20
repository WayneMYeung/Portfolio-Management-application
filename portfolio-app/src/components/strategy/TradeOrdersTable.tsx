import { TradeOrder } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface TradeOrdersTableProps {
  orders: TradeOrder[]
  currency: string
}

export default function TradeOrdersTable({ orders, currency }: TradeOrdersTableProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
        <p className="font-medium text-slate-700 dark:text-slate-300">Portfolio is aligned</p>
        <p className="text-sm">No trades are required to meet this strategy's targets.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
          <tr>
            <th className="px-6 py-3 font-semibold">Action</th>
            <th className="px-6 py-3 font-semibold">Asset Basket</th>
            <th className="px-6 py-3 font-semibold text-right">Amount To Trade</th>
            <th className="px-6 py-3 font-semibold text-right">Drift %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
          {orders.map((order, i) => {
            const isBuy = order.action === 'BUY'
            return (
              <tr key={i} className="group transition-colors">
                <td colSpan={4} className="p-0">
                  <div className="flex flex-col">
                    {/* Main Row */}
                    <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-default">
                      <div className="flex items-center gap-4 flex-1">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-widest shrink-0 ${
                          isBuy ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                        }`}>
                          {order.action}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-200">{order.label}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight">Basket ID: {order.bucketId}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-black text-slate-900 dark:text-slate-200">
                          {formatCurrency(order.amount, currency)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Drift: {order.pct.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Holdings Sub-section */}
                    {order.holdings.length > 0 && (
                      <div className="px-6 pb-4 pt-1 flex flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase self-center mr-2">Components:</span>
                        {order.holdings.map((h, hi) => (
                          <div key={hi} className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 transition-all hover:border-slate-200 dark:hover:border-slate-700">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{h.ticker || h.assetName}</span>
                            <span className="text-[10px] text-slate-400">{formatCurrency(h.marketValueBase, currency)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
