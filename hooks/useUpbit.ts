'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getTickers,
  createUpbitWebSocket,
  getSymbolFromMarket,
} from '@/lib/upbit/api'
import type { UpbitTicker } from '@/types'

interface UseUpbitOptions {
  symbols: string[]
  realtime?: boolean
  interval?: number // Polling interval in ms (if not using realtime)
}

export function useUpbit({
  symbols,
  realtime = true,
  interval = 5000,
}: UseUpbitOptions) {
  const [prices, setPrices] = useState<Record<string, UpbitTicker>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Fetch initial prices
  const fetchPrices = useCallback(async () => {
    try {
      const tickers = await getTickers(symbols)
      const priceMap: Record<string, UpbitTicker> = {}
      tickers.forEach((ticker) => {
        const symbol = getSymbolFromMarket(ticker.market)
        priceMap[symbol] = ticker
      })
      setPrices(priceMap)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch prices'))
    } finally {
      setLoading(false)
    }
  }, [symbols])

  // Handle WebSocket message
  const handleMessage = useCallback((ticker: UpbitTicker) => {
    const symbol = getSymbolFromMarket(ticker.market)
    setPrices((prev) => ({
      ...prev,
      [symbol]: ticker,
    }))
  }, [])

  // Setup WebSocket or polling
  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false)
      return
    }

    // Fetch initial data
    fetchPrices()

    if (realtime) {
      // Use WebSocket for real-time updates
      wsRef.current = createUpbitWebSocket(
        symbols,
        handleMessage,
        (error) => {
          console.error('WebSocket error:', error)
          setError(new Error('WebSocket connection failed'))
        }
      )

      return () => {
        wsRef.current?.close()
      }
    } else {
      // Use polling
      const pollInterval = setInterval(fetchPrices, interval)
      return () => clearInterval(pollInterval)
    }
  }, [symbols, realtime, interval, fetchPrices, handleMessage])

  // Get price for a specific symbol
  const getPrice = useCallback(
    (symbol: string): number | null => {
      return prices[symbol]?.trade_price ?? null
    },
    [prices]
  )

  // Get change rate for a specific symbol
  const getChangeRate = useCallback(
    (symbol: string): number | null => {
      return prices[symbol]?.signed_change_rate ?? null
    },
    [prices]
  )

  // Refresh prices manually
  const refresh = useCallback(() => {
    setLoading(true)
    fetchPrices()
  }, [fetchPrices])

  return {
    prices,
    loading,
    error,
    getPrice,
    getChangeRate,
    refresh,
  }
}
