import type { UpbitTicker, UpbitCandle } from '@/types'

// Use relative API route to avoid CORS issues in production
const API_BASE_URL = '/api/upbit'

// Public API endpoints (no authentication required)

/**
 * Get current ticker information for markets
 */
export async function getTickers(markets: string[]): Promise<UpbitTicker[]> {
  const marketsParam = markets.map((m) => `KRW-${m}`).join(',')
  const response = await fetch(`${API_BASE_URL}?type=ticker&market=${marketsParam}`)

  if (!response.ok) {
    throw new Error('Failed to fetch tickers')
  }

  return response.json()
}

/**
 * Get single ticker
 */
export async function getTicker(symbol: string): Promise<UpbitTicker | null> {
  const tickers = await getTickers([symbol])
  return tickers[0] || null
}

/**
 * Get daily candles
 */
export async function getDailyCandles(
  symbol: string,
  count: number = 30
): Promise<UpbitCandle[]> {
  const response = await fetch(
    `${API_BASE_URL}?type=days&market=KRW-${symbol}&count=${count}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch candles')
  }

  return response.json()
}

/**
 * Get minute candles
 */
export async function getMinuteCandles(
  symbol: string,
  unit: 1 | 3 | 5 | 15 | 30 | 60 | 240 = 60,
  count: number = 100
): Promise<UpbitCandle[]> {
  const response = await fetch(
    `${API_BASE_URL}?type=minutes&market=KRW-${symbol}&unit=${unit}&count=${count}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch minute candles')
  }

  return response.json()
}

/**
 * Get all available markets
 */
export async function getMarkets(): Promise<
  { market: string; korean_name: string; english_name: string }[]
> {
  // Direct call to Upbit for markets (no CORS issues with this endpoint usually)
  const response = await fetch('https://api.upbit.com/v1/market/all?isDetails=false')

  if (!response.ok) {
    throw new Error('Failed to fetch markets')
  }

  const markets = await response.json()
  // Filter only KRW markets
  return markets.filter((m: { market: string }) => m.market.startsWith('KRW-'))
}

// WebSocket connection for real-time data
export function createUpbitWebSocket(
  symbols: string[],
  onMessage: (data: UpbitTicker) => void,
  onError?: (error: Event) => void
): WebSocket {
  const ws = new WebSocket('wss://api.upbit.com/websocket/v1')

  ws.onopen = () => {
    const subscribeMessage = [
      { ticket: `ticker-${Date.now()}` },
      {
        type: 'ticker',
        codes: symbols.map((s) => `KRW-${s}`),
      },
    ]
    ws.send(JSON.stringify(subscribeMessage))
  }

  ws.onmessage = async (event) => {
    try {
      const blob = event.data as Blob
      const text = await blob.text()
      const data = JSON.parse(text)

      // Transform to match our UpbitTicker type
      const ticker: UpbitTicker = {
        market: data.code,
        trade_price: data.trade_price,
        signed_change_rate: data.signed_change_rate,
        signed_change_price: data.signed_change_price,
        acc_trade_price_24h: data.acc_trade_price_24h,
        acc_trade_volume_24h: data.acc_trade_volume_24h,
        high_price: data.high_price,
        low_price: data.low_price,
        prev_closing_price: data.prev_closing_price,
        timestamp: data.timestamp,
      }

      onMessage(ticker)
    } catch (error) {
      console.error('WebSocket message parse error:', error)
    }
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
    onError?.(error)
  }

  return ws
}

// Price formatting helpers
export function formatUpbitPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('ko-KR', { maximumFractionDigits: 0 })
  }
  if (price >= 100) {
    return price.toLocaleString('ko-KR', { maximumFractionDigits: 1 })
  }
  if (price >= 1) {
    return price.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
  }
  return price.toFixed(4)
}

export function getSymbolFromMarket(market: string): string {
  return market.replace('KRW-', '')
}
