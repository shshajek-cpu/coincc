'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts'
import type { Trade, UpbitCandle } from '@/types'
import { getDailyCandles, getMinuteCandles } from '@/lib/upbit/api'
import { formatKRW, cn } from '@/lib/utils'

type TimeFrame = '1' | '5' | '15' | '60' | '240' | 'D'

const TIMEFRAMES: { value: TimeFrame; label: string }[] = [
  { value: '1', label: '1분' },
  { value: '5', label: '5분' },
  { value: '15', label: '15분' },
  { value: '60', label: '1시간' },
  { value: '240', label: '4시간' },
  { value: 'D', label: '1일' },
]

interface TradePairChartProps {
  coinSymbol: string
  trades: Trade[]
  height?: number
  className?: string
}

export function TradePairChart({
  coinSymbol,
  trades,
  height = 400,
  className,
}: TradePairChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const resizeListenerRef = useRef<(() => void) | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('D')

  useEffect(() => {
    if (!chartContainerRef.current) return

    const abortController = new AbortController()

    // Clean up previous chart and resize listener
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }
    if (resizeListenerRef.current) {
      window.removeEventListener('resize', resizeListenerRef.current)
      resizeListenerRef.current = null
    }

    const fetchDataAndRenderChart = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch candle data based on timeframe
        let candles: UpbitCandle[]
        if (timeFrame === 'D') {
          candles = await getDailyCandles(coinSymbol, 200)
        } else {
          const unit = Number(timeFrame) as 1 | 3 | 5 | 15 | 30 | 60 | 240
          candles = await getMinuteCandles(coinSymbol, unit, 200)
        }

        // Check if this effect was cancelled
        if (abortController.signal.aborted) return

        if (!candles || candles.length === 0) {
          setError('차트 데이터를 불러올 수 없습니다')
          setLoading(false)
          return
        }

        const container = chartContainerRef.current
        if (!container) return

        // Create chart (v5 API)
        const chart = createChart(container, {
          width: container.clientWidth,
          height: height - 40,
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#9ca3af',
          },
          grid: {
            vertLines: { color: '#1f2937' },
            horzLines: { color: '#1f2937' },
          },
          crosshair: {
            mode: 0,
          },
          rightPriceScale: {
            borderColor: '#374151',
          },
          timeScale: {
            borderColor: '#374151',
            timeVisible: timeFrame !== 'D',
            secondsVisible: false,
          },
        })

        chartRef.current = chart

        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        })

        // Convert candles - format depends on timeframe
        const chartData = candles
          .map((candle: UpbitCandle) => {
            if (timeFrame === 'D') {
              return {
                time: candle.candle_date_time_utc.split('T')[0],
                open: candle.opening_price,
                high: candle.high_price,
                low: candle.low_price,
                close: candle.trade_price,
              }
            } else {
              const ts = Math.floor(new Date(candle.candle_date_time_utc).getTime() / 1000)
              return {
                time: ts,
                open: candle.opening_price,
                high: candle.high_price,
                low: candle.low_price,
                close: candle.trade_price,
              }
            }
          })
          .reverse()

        candleSeries.setData(chartData as any)

        // Add trade markers
        if (trades.length > 0) {
          const markers = trades
            .map(trade => {
              const tradeDate = new Date(trade.trade_at)

              let time: string | number
              if (timeFrame === 'D') {
                time = tradeDate.toISOString().split('T')[0]
              } else {
                time = Math.floor(tradeDate.getTime() / 1000)
              }

              return {
                time,
                position: trade.trade_type === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
                color: trade.trade_type === 'BUY' ? '#22c55e' : '#ef4444',
                shape: trade.trade_type === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
                text: `${trade.trade_type === 'BUY' ? '매수' : '매도'} ${formatKRW(trade.price)}`,
              }
            })
            .sort((a, b) => {
              if (typeof a.time === 'string' && typeof b.time === 'string') {
                return a.time.localeCompare(b.time)
              }
              return (a.time as number) - (b.time as number)
            })

          try {
            candleSeries.setMarkers(markers as any)
          } catch {
            // Markers might fail if trade dates are outside candle range
          }
        }

        chart.timeScale().fitContent()
        setLoading(false)

        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
            })
          }
        }

        window.addEventListener('resize', handleResize)
        resizeListenerRef.current = handleResize
      } catch (err) {
        if (abortController.signal.aborted) return
        console.error('Chart error:', err)
        setError(err instanceof Error ? err.message : '차트를 불러오는데 실패했습니다')
        setLoading(false)
      }
    }

    fetchDataAndRenderChart()

    return () => {
      abortController.abort()
      if (resizeListenerRef.current) {
        window.removeEventListener('resize', resizeListenerRef.current)
        resizeListenerRef.current = null
      }
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [coinSymbol, trades, height, timeFrame])

  const chartHeight = height - 40

  return (
    <div className={cn('w-full overflow-hidden', className)} style={{ height }}>
      {/* Timeframe selector - always clickable, outside relative container */}
      <div className="flex items-center gap-1 px-1 pb-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeFrame(tf.value)}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              timeFrame === tf.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Chart wrapper - loading/error overlays only cover this area */}
      <div className="relative w-full" style={{ height: chartHeight }}>
        <div ref={chartContainerRef} className="w-full" style={{ height: chartHeight }} />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin h-8 w-8 border-4 border-gray-600 border-t-gray-400 rounded-full" />
              <p className="text-sm text-gray-400">차트 로딩 중...</p>
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
