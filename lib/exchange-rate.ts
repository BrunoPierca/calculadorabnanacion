/**
 * Exchange rate fetch (1 USD = X ARS).
 * Use NEXT_PUBLIC_EXCHANGE_RATE_API_URL for the endpoint.
 * Expected response shape: { rate: number } or { usd_ars: number }.
 */

const DEFAULT_RATE = 1500

interface CurrencyRate {
  value_sell: number
  value_buy: number
  value_avg: number
}
export interface ExchangeRateResponse {
  oficial: CurrencyRate
  blue: CurrencyRate
  oficial_euro: CurrencyRate
  blue_euro: CurrencyRate
  last_update: string
}

const API_URL = "https://api.bluelytics.com.ar/v2/latest"
/**
 * Fetch current USD->ARS rate from API.
 * Returns default 1500 if env is missing or request fails.
 */
export async function fetchExchangeRate(): Promise<number> {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) return DEFAULT_RATE
    const data: ExchangeRateResponse = await res.json()
    const rate = data.oficial.value_sell
    return typeof rate === "number" && rate > 0 ? rate : DEFAULT_RATE
  } catch {
    return DEFAULT_RATE
  }
}
