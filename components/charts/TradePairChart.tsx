'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'
import type { Trade, UpbitCandle } from '@/types'
import { getDailyCandles } from '@/lib/upbit/api'
import { formatKRW, cn } from '@/lib/utils'

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
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null) as any

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const fetchDataAndRenderChart = async () => {
      try {
        setLoading(true)
        setError(null)

        // Calculate date range from trades
        const tradeDates = trades.map(t => new Date(t.trade_at).getTime())
        const earliestTrade = tradeDates.length > 0 ? Math.min(...tradeDates) : Date.now()
        const latestTrade = tradeDates.length > 0 ? Math.max(...tradeDates) : Date.now()

        // Calculate days needed (with buffer)
        const daysNeeded = Math.min(
          Math.ceil((latestTrade - earliestTrade) / (1000 * 60 * 60 * 24)) + 30,
          200
        )

        // Fetch candle data
        const candles = await getDailyCandles(coinSymbol, Math.max(daysNeeded, 30))

        if (!candles || candles.length === 0) {
          setError('차트 데이터를 불러올 수 없습니다')
          setLoading(false)
          return
        }

        // Create chart
        const container = chartContainerRef.current
        if (!container) return

        const chart = createChart(container, {
          width: container.clientWidth,
          height,
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
            timeVisible: true,
            secondsVisible: false,
          },
        })

        chartRef.current = chart

        // Create candlestick series
        const candlestickSeries = (chart as any).addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        })

        candlestickSeriesRef.current = candlestickSeries as any

        // Convert Upbit candles to lightweight-charts format
        const chartData: CandlestickData[] = candles
          .map((candle: UpbitCandle) => {
            // Extract date from UTC timestamp (format: "2025-01-10T00:00:00")
            const date = candle.candle_date_time_utc.split('T')[0]

            return {
              time: date as Time,
              open: candle.opening_price,
              high: candle.high_price,
              low: candle.low_price,
              close: candle.trade_price,
            }
          })
          .reverse() // Upbit returns newest first, we need oldest first

        candlestickSeries.setData(chartData)

        // Add trade markers
        if (trades.length > 0) {
          const markers = trades.map(trade => {
            const tradeDate = new Date(trade.trade_at)
            const dateStr = tradeDate.toISOString().split('T')[0]

            return {
              time: dateStr as Time,
              position: trade.trade_type === 'BUY' ? ('belowBar' as const) : ('aboveBar' as const),
              color: trade.trade_type === 'BUY' ? '#22c55e' : '#ef4444',
              shape: trade.trade_type === 'BUY' ? ('arrowUp' as const) : ('arrowDown' as const),
              text: `${trade.trade_type} ${formatKRW(trade.price)}`,
            }
          })

          candlestickSeries.setMarkers(markers)
        }

        // Fit content to visible range
        chart.timeScale().fitContent()

        setLoading(false)

        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
            })
          }
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
        }
      } catch (err) {
        console.error('Chart error:', err)
        setError(err instanceof Error ? err.message : '차트를 불러오는데 실패했습니다')
        setLoading(false)
      }
    }

    fetchDataAndRenderChart()

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [coinSymbol, trades, height])

  if (loading) {
    return (
      <div
        className={cn('flex items-center justify-center bg-gray-900/50 rounded-lg', className)}
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-8 w-8 border-4 border-gray-600 border-t-gray-400 rounded-full" />
          <p className="text-sm text-gray-400">차트 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={cn('flex items-center justify-center bg-gray-900/50 rounded-lg', className)}
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <svg
            className="h-12 w-12 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return <div ref={chartContainerRef} className={cn('w-full', className)} style={{ height }} />
}
