"use client"

import { useState, useCallback } from "react"
import { fetchExchangeRate } from "@/lib/exchange-rate"

const DEFAULT_RATE = 1500

export interface UseExchangeRateReturn {
  rate: number
  setRate: (value: number) => void
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Exchange rate state with optional API refetch.
 * Default 1500; call refetch() to load from NEXT_PUBLIC_EXCHANGE_RATE_API_URL.
 */
export function useExchangeRate(
  initialRate: number = DEFAULT_RATE
): UseExchangeRateReturn {
  const [rate, setRate] = useState(initialRate)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const newRate = await fetchExchangeRate()
      setRate(newRate)
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch rate"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { rate, setRate, isLoading, error, refetch }
}
