/**
 * Exchange rate fetch (1 USD = X ARS).
 * Use NEXT_PUBLIC_EXCHANGE_RATE_API_URL for the endpoint.
 * Expected response shape: { rate: number } or { usd_ars: number }.
 */

const DEFAULT_RATE = 1500

export interface ExchangeRateResponse {
  rate?: number
  usd_ars?: number
}

/**
 * Fetch current USD->ARS rate from API.
 * Returns default 1500 if env is missing or request fails.
 */
export async function fetchExchangeRate(): Promise<number> {
  const url = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_URL
  if (!url) return DEFAULT_RATE
  try {
    const res = await fetch(url)
    if (!res.ok) return DEFAULT_RATE
    const data: ExchangeRateResponse = await res.json()
    const rate = data.rate ?? data.usd_ars
    return typeof rate === "number" && rate > 0 ? rate : DEFAULT_RATE
  } catch {
    return DEFAULT_RATE
  }
}
