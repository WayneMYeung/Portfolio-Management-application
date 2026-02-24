// src/lib/ai-insights.ts
// Pluggable AI insights module — swap provider via AI_PROVIDER env var

import type { PortfolioAnalytics } from '@/types'

type Provider = 'mock' | 'openai' | 'anthropic'

const provider: Provider = (process.env.AI_PROVIDER as Provider) ?? 'mock'

/**
 * Main entry point — generates AI insights for a portfolio.
 * Dispatches to the appropriate provider based on AI_PROVIDER env var.
 */
export async function generateAiInsights(
  portfolioName: string,
  analytics: PortfolioAnalytics
): Promise<string> {
  const prompt = buildPrompt(portfolioName, analytics)

  switch (provider) {
    case 'openai':    return callOpenAI(prompt)
    case 'anthropic': return callAnthropic(prompt)
    default:          return mockInsights(portfolioName, analytics)
  }
}

// ─── Prompt Builder ───────────────────────────────────────────────
function buildPrompt(portfolioName: string, a: PortfolioAnalytics): string {
  const topHoldingNames = a.topHoldings.slice(0, 5).map(
    h => `${h.assetName} (${h.allocationPct.toFixed(1)}%)`
  ).join(', ')

  return `You are a financial advisor analyzing a personal investment portfolio.

Portfolio: ${portfolioName}
Total Value: $${a.totalValue.toLocaleString()}
Total Gain/Loss: ${a.totalGainLossPct.toFixed(2)}%
Concentration Risk (top holding): ${a.concentrationRisk.toFixed(1)}%
Top Holdings: ${topHoldingNames}
Asset Allocation: ${a.allocationByType.map(t => `${t.name}: ${t.pct.toFixed(1)}%`).join(', ')}
Currency Exposure: ${a.currencyExposure.map(c => `${c.currency}: ${c.pct.toFixed(1)}%`).join(', ')}

Please provide:
1. A brief portfolio summary (2-3 sentences)
2. Diversification assessment
3. Concentration risk observations
4. Currency risk observations
5. 3 specific, actionable suggestions

Keep the response concise (under 400 words) and in plain text (no markdown headers).`
}

// ─── OpenAI ───────────────────────────────────────────────────────
async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // cost-efficient
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`)
  const data = await res.json()
  return data.choices[0]?.message?.content ?? 'No insights generated.'
}

// ─── Anthropic Claude ─────────────────────────────────────────────
async function callAnthropic(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.statusText}`)
  const data = await res.json()
  return data.content[0]?.text ?? 'No insights generated.'
}

// ─── Mock (demo / no AI key) ──────────────────────────────────────
function mockInsights(portfolioName: string, a: PortfolioAnalytics): string {
  const riskLevel = a.concentrationRisk > 40 ? 'high' : a.concentrationRisk > 20 ? 'moderate' : 'low'
  const topAsset = a.topHoldings[0]?.assetName ?? 'your top holding'
  const currencies = a.currencyExposure.map(c => c.currency).join(', ')

  return `Portfolio Summary for "${portfolioName}":

Your portfolio currently holds ${a.holdings.length} positions with a total value of ${a.totalValue.toLocaleString()} and an overall return of ${a.totalGainLossPct.toFixed(2)}%.

Diversification: ${a.allocationByType.map(t => `${t.name} represents ${t.pct.toFixed(0)}%`).join('; ')}.

Concentration Risk (${riskLevel}): ${topAsset} represents ${a.concentrationRisk.toFixed(1)}% of the portfolio. ${riskLevel === 'high' ? 'This is above the recommended 20-30% threshold for single-position risk.' : 'This is within acceptable concentration limits.'}

Currency Risk: Your portfolio has exposure to ${currencies}. ${a.currencyExposure.length > 3 ? 'Good multi-currency diversification.' : 'Consider diversifying currency exposure further.'}

Suggestions:
1. ${a.concentrationRisk > 30 ? `Consider trimming ${topAsset} to reduce concentration risk below 20%.` : 'Maintain current allocation — concentration is well managed.'}
2. ${a.holdings.some(h => h.assetType === 'CASH') ? 'Review idle cash allocation — consider deploying into income-generating assets.' : 'Consider adding a small cash reserve (3-5%) for rebalancing opportunities.'}
3. Review holdings with a loss of more than 15% and assess whether the original investment thesis still holds.

Note: These insights are AI-generated for informational purposes only. Please consult a licensed financial advisor before making investment decisions.`
}
