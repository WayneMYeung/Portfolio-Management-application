import {
  HoldingWithAnalytics,
  InvestmentStrategy,
  StrategyBucket,
  StrategyLeaf,
  DriftReport,
  DriftItem,
  TradeOrder
} from '@/types'

export class StrategyEvaluator {
  /**
   * Evaluates the given holdings against a target strategy to produce a drift report.
   */
  static evaluate(holdings: HoldingWithAnalytics[], strategy: InvestmentStrategy, totalValue: number): DriftReport {
    // 1. Flatten strategy to absolute weights
    const targetLeaves = this.flattenStrategy(strategy.tree)
    
    // 2. Map actual holdings to strategy leaves
    const mappedHoldingsMap = new Map<string, HoldingWithAnalytics[]>() // leaf id -> array of holdings
    const unmappedHoldings: HoldingWithAnalytics[] = []

    for (const h of holdings) {
      // Find the best leaf match for this holding.
      let bestMatch: StrategyLeaf | null = null
      
      for (const leaf of targetLeaves) {
        // Priority 1: Multi-ticker match
        if (leaf.tickers && h.ticker && leaf.tickers.some(t => t.toUpperCase() === h.ticker?.toUpperCase())) {
          bestMatch = leaf
          break
        }

        // Priority 2: Single ticker match (legacy/simple)
        if (leaf.ticker && h.ticker && leaf.ticker.toUpperCase() === h.ticker?.toUpperCase()) {
          bestMatch = leaf
          break
        }

        // Priority 3: Keyword detection (Case-insensitive match in Name or Notes)
        if (leaf.keywords && leaf.keywords.length > 0) {
          const nameMatch = leaf.keywords.some(k => h.assetName.toLowerCase().includes(k.toLowerCase()))
          const noteMatch = leaf.keywords.some(k => h.notes?.toLowerCase().includes(k.toLowerCase()))
          if (nameMatch || noteMatch) {
            bestMatch = leaf
            break
          }
        }
      }
      
      // Priority 4: Asset type fallback (only if no specific asset match found)
      if (!bestMatch) {
        bestMatch = targetLeaves.find(leaf => !leaf.ticker && !leaf.tickers && !leaf.keywords && leaf.assetType === h.assetType) || null
      }

      if (bestMatch) {
        const assigned = mappedHoldingsMap.get(bestMatch.id) || []
        mappedHoldingsMap.set(bestMatch.id, [...assigned, h])
      } else {
        unmappedHoldings.push(h)
      }
    }

    // 3. Compute drift
    const items: DriftItem[] = []
    
    for (const leaf of targetLeaves) {
      const targetPct = leaf.weight * 100
      const assignedHoldings = mappedHoldingsMap.get(leaf.id) || []
      const actualValue = assignedHoldings.reduce((sum, h) => sum + h.marketValueBase, 0)
      
      const actualPct = totalValue > 0 ? (actualValue / totalValue) * 100 : 0
      const driftPct = actualPct - targetPct
      const driftValue = (driftPct / 100) * totalValue

      items.push({
        bucketId: leaf.id,
        label: leaf.label,
        targetPct,
        actualPct,
        driftPct,
        driftValue,
        holdings: assignedHoldings
      })
    }

    // Handle completely unmapped items
    const unmappedValue = unmappedHoldings.reduce((sum, h) => sum + h.marketValueBase, 0)
    if (unmappedValue > 0) {
       const unmappedPct = totalValue > 0 ? (unmappedValue / totalValue) * 100 : 0
       items.push({
         bucketId: 'unassigned',
         label: 'Unassigned Holdings',
         targetPct: 0,
         actualPct: unmappedPct,
         driftPct: unmappedPct,
         driftValue: unmappedValue,
         holdings: unmappedHoldings
       })
    }

    // 4. Generate Trade Orders
    const tradeOrders = this.generateTradeOrders(items)

    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      totalValue,
      items,
      tradeOrders,
      evaluatedAt: new Date().toISOString()
    }
  }

  /**
   * Generates BUY/SELL orders for drift magnitudes greater than the threshold.
   */
  static generateTradeOrders(items: DriftItem[], thresholdPct: number = 1.0): TradeOrder[] {
    const orders: TradeOrder[] = []

    for (const item of items) {
      if (Math.abs(item.driftPct) < thresholdPct) continue

      // If drift is positive, we refer to it as being Overweight -> SELL
      // If drift is negative, we refer to it as being Underweight -> BUY
      const isOverweight = item.driftPct > 0
      
      orders.push({
        action: isOverweight ? 'SELL' : 'BUY',
        label: item.label,
        bucketId: item.bucketId,
        amount: Math.abs(item.driftValue),
        pct: Math.abs(item.driftPct),
        holdings: item.holdings
      })
    }

    // Sort by largest trade amount first
    return orders.sort((a, b) => b.amount - a.amount)
  }

  /**
   * Recursively flattens a strategy tree, multiplying weights to yield an array of absolute weighted leaves.
   */
  static flattenStrategy(node: StrategyBucket | StrategyLeaf, parentWeight: number = 1.0): StrategyLeaf[] {
    const absoluteWeight = node.weight * parentWeight

    // If it's a leaf (has assetType or ticker) or no children array
    if (!('children' in node) || !node.children) {
      return [{
        ...node,
        weight: absoluteWeight
      } as StrategyLeaf]
    }

    // It's a bucket -> recurse
    let leaves: StrategyLeaf[] = []
    for (const child of node.children) {
      leaves = leaves.concat(this.flattenStrategy(child, absoluteWeight))
    }
    
    return leaves
  }
}
