// src/lib/market-data.ts
// Fetches stock/ETF/crypto prices from Yahoo Finance (free, no API key needed)

import type { MarketPrice } from '@/types'

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in-memory cache

// Simple in-memory price cache
const priceCache = new Map<string, { data: MarketPrice; ts: number }>()

/**
 * Fetches current price for a ticker from Yahoo Finance.
 * Returns null if ticker is invalid or API fails.
 */
export async function fetchMarketPrice(ticker: string): Promise<MarketPrice | null> {
  const upperTicker = ticker.toUpperCase()

  // Check cache first
  const cached = priceCache.get(upperTicker)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { ...cached.data, source: 'cache' }
  }

  try {
    const url = `${YAHOO_BASE}/${encodeURIComponent(upperTicker)}?interval=1d&range=2d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }, // Yahoo requires a UA
      next: { revalidate: 300 }, // Next.js cache for 5 min
    })

    if (!res.ok) return null

    const json = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result) return null

    const meta = result.meta
    const price: MarketPrice = {
      ticker: upperTicker,
      price: meta.regularMarketPrice ?? meta.previousClose,
      currency: meta.currency ?? 'USD',
      change: meta.regularMarketPrice - meta.previousClose,
      changePct: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      source: 'yahoo',
    }

    priceCache.set(upperTicker, { data: price, ts: Date.now() })
    return price
  } catch (err) {
    console.error(`[market-data] Failed to fetch ${ticker}:`, err)
    return null
  }
}

/**
 * Fetches historical daily prices for volatility and charting.
 * Returns array of {date, price} for the last `days`.
 */
export async function fetchHistoricalPrices(
  ticker: string,
  days = 90
): Promise<{ date: string; price: number }[]> {
  try {
    const range = days <= 30 ? '1mo' : days <= 90 ? '3mo' : days <= 365 ? '1y' : '2y'
    const url = `${YAHOO_BASE}/${encodeURIComponent(ticker)}?interval=1d&range=${range}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return []

    const json = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result) return []

    const timestamps: number[] = result.timestamp ?? []
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? []

    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      price: closes[i] ?? 0,
    })).filter(p => p.price > 0)
  } catch {
    return []
  }
}

/**
 * Batch fetch prices for multiple tickers concurrently.
 */
export async function fetchMarketPrices(tickers: string[]): Promise<Map<string, MarketPrice>> {
  const results = await Promise.allSettled(
    tickers.map(t => fetchMarketPrice(t))
  )

  const map = new Map<string, MarketPrice>()
  tickers.forEach((ticker, i) => {
    const result = results[i]
    if (result.status === 'fulfilled' && result.value) {
      map.set(ticker.toUpperCase(), result.value)
    }
  })

  return map
}
