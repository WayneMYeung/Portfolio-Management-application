// src/lib/fx-rates.ts
// Fetches and caches foreign exchange rates

import prisma from './prisma'
import type { Currency, FxRates } from '@/types'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Fetches FX rates from exchangerate-api.com or falls back to cached rates in DB.
 * All rates are relative to USD base.
 */
export async function getFxRates(base: Currency = 'USD'): Promise<FxRates> {
  // Try DB cache first
  const cachedRates = await prisma.fxRate.findMany()
  if (cachedRates.length > 0) {
    const newest = cachedRates.reduce((a, b) =>
      new Date(a.fetchedAt) > new Date(b.fetchedAt) ? a : b
    )
    const age = Date.now() - new Date(newest.fetchedAt).getTime()
    if (age < CACHE_TTL_MS) {
      // Use cached rates - build rate map
      return buildRateMap(cachedRates, base)
    }
  }

  // Fetch fresh rates
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    let rates: Record<string, number> = {}

    if (apiKey) {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
        { next: { revalidate: 3600 } }
      )
      if (res.ok) {
        const data = await res.json()
        rates = data.conversion_rates ?? {}
      }
    } else {
      // Free fallback - frankfurter.app (no key needed)
      const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
        next: { revalidate: 3600 }
      })
      if (res.ok) {
        const data = await res.json()
        rates = { USD: 1, ...data.rates }
      }
    }

    if (Object.keys(rates).length > 0) {
      // Update DB cache (upsert each pair)
      const pairs = Object.entries(rates).map(([toCurrency, rate]) => ({
        fromCurrency: 'USD',
        toCurrency,
        rate: rate as number,
      }))

      await Promise.allSettled(
        pairs.map(p =>
          prisma.fxRate.upsert({
            where: { fromCurrency_toCurrency: { fromCurrency: p.fromCurrency, toCurrency: p.toCurrency } },
            create: p,
            update: { rate: p.rate, fetchedAt: new Date() },
          })
        )
      )

      return {
        base,
        rates: convertBase(rates, base),
        timestamp: Date.now(),
      }
    }
  } catch (err) {
    console.error('[fx-rates] Failed to fetch:', err)
  }

  // Return cached even if stale, or hardcoded fallback
  if (cachedRates.length > 0) {
    return buildRateMap(cachedRates, base)
  }

  // Hardcoded fallback rates (approximate)
  return {
    base: 'USD',
    rates: { USD: 1, HKD: 7.82, TWD: 32.1, CNY: 7.24, EUR: 0.92, GBP: 0.79, JPY: 157, SGD: 1.35 },
    timestamp: Date.now(),
  }
}

function buildRateMap(dbRates: any[], base: Currency): FxRates {
  const usdRates: Record<string, number> = { USD: 1 }
  for (const r of dbRates) {
    if (r.fromCurrency === 'USD') usdRates[r.toCurrency] = r.rate
  }
  return { base, rates: convertBase(usdRates, base), timestamp: Date.now() }
}

function convertBase(usdRates: Record<string, number>, base: Currency): Record<string, number> {
  if (base === 'USD') return usdRates
  const baseRate = usdRates[base] ?? 1
  const converted: Record<string, number> = {}
  for (const [currency, rate] of Object.entries(usdRates)) {
    converted[currency] = rate / baseRate
  }
  return converted
}

/**
 * Convert an amount from one currency to another.
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (from === to) return amount
  const fromRate = rates[from] ?? 1
  const toRate = rates[to] ?? 1
  // rates are relative to a base (e.g. USD=1)
  // to convert: amount / fromRate * toRate
  // but since rates[from] means "1 USD = X from", we need to invert
  // Actually: rates[X] = how much X per base
  // amount in FROM -> to base: amount / rates[FROM]  (if base=USD, rates[from]=7.82 for HKD means 1 USD = 7.82 HKD, so 7.82 HKD = 1 USD)
  // Wait, exchangerate format: base=USD, rates={HKD:7.82} means 1 USD = 7.82 HKD
  // So: HKD->USD: amount / 7.82; USD->HKD: amount * 7.82
  // FROM to TO: (amount / rates[FROM]) * rates[TO] — when base is USD
  // If base is not USD, same logic applies since convertBase already adjusted
  const baseAmount = amount / fromRate
  return baseAmount * toRate
}
