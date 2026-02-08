'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createChart, ColorType, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts'
import type { Trade, UpbitCandle } from '@/types'
import { getDailyCandles, getMinuteCandles } from '@/lib/upbit/api'
import { formatKRW, cn } from '@/lib/utils'
import { useUpbit } from '@/hooks/useUpbit'
import { CalendarIcon } from 'lucide-react'

type TimeFrame = '1' | '5' | '15' | '60' | '240' | 'D'
type DateRangePreset = '30d' | '90d' | '1y' | 'all' | 'custom'

const TIMEFRAMES: { value: TimeFrame; label: string }[] = [
  { value: '1', label: '1분' },
  { value: '5', label: '5분' },
  { value: '15', label: '15분' },
  { value: '60', label: '1시간' },
  { value: '240', label: '4시간' },
  { value: 'D', label: '1일' },
]

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
  { value: '1y', label: '최근 1년' },
  { value: 'all', label: '전체' },
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
  const candleSeriesRef = useRef<any>(null)
  const resizeListenerRef = useRef<(() => void) | null>(null)
  const chartDataRef = useRef<any[]>([])
  const lastCandleTimeRef = useRef<string | number | null>(null)
  const priceLinesRef = useRef<any[]>([])
  const crosshairUnsubscribeRef = useRef<(() => void) | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('D')
  const [hoveredTrade, setHoveredTrade] = useState<Trade | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [tradeTooltips, setTradeTooltips] = useState<Array<{
    trade: Trade
    x: number
    y: number
  }>>([])


  // Date range filtering state
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  // Real-time price updates
  const { prices, getPrice } = useUpbit({
    symbols: [coinSymbol],
    realtime: false,
  })

  // Calculate date range based on preset or custom selection
  const getDateRange = useCallback((): { start: Date | null; end: Date | null } => {
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    if (dateRangePreset === 'custom') {
      return {
        start: customStartDate ? new Date(customStartDate) : null,
        end: customEndDate ? new Date(customEndDate) : null,
      }
    }

    if (dateRangePreset === 'all') {
      return { start: null, end: null }
    }

    let start: Date
    switch (dateRangePreset) {
      case '30d':
        start = new Date(now)
        start.setDate(start.getDate() - 30)
        break
      case '90d':
        start = new Date(now)
        start.setDate(start.getDate() - 90)
        break
      case '1y':
        start = new Date(now)
        start.setFullYear(start.getFullYear() - 1)
        break
      default:
        return { start: null, end: null }
    }

    start.setHours(0, 0, 0, 0)
    return { start, end }
  }, [dateRangePreset, customStartDate, customEndDate])

  // Filter candles based on date range
  const filterCandlesByDateRange = useCallback((candles: UpbitCandle[]): UpbitCandle[] => {
    const { start, end } = getDateRange()
    if (!start && !end) return candles

    return candles.filter(candle => {
      const candleDate = new Date(candle.candle_date_time_utc)
      if (start && candleDate < start) return false
      if (end && candleDate > end) return false
      return true
    })
  }, [getDateRange])

  // Filter trades based on date range
  const filterTradesByDateRange = useCallback((tradesToFilter: Trade[]): Trade[] => {
    const { start, end } = getDateRange()
    if (!start && !end) return tradesToFilter

    return tradesToFilter.filter(trade => {
      const tradeDate = new Date(trade.trade_at)
      if (start && tradeDate < start) return false
      if (end && tradeDate > end) return false
      return true
    })
  }, [getDateRange])

  // Create a Map for O(1) trade lookup by timestamp
  const tradesByTime = useMemo(() => {
    const map = new Map<string | number, Trade>()
    filterTradesByDateRange(trades).forEach(t => {
      const tradeDate = new Date(t.trade_at)
      const time = timeFrame === 'D'
        ? tradeDate.toISOString().split('T')[0]
        : Math.floor(tradeDate.getTime() / 1000)
      map.set(time, t)
    })
    return map
  }, [trades, timeFrame, filterTradesByDateRange])

  // Tooltip position calculation with boundary detection
  const getTooltipStyle = useCallback((x: number, y: number) => {
    const maxX = window.innerWidth - 300
    const adjustedX = Math.min(x, maxX)
    const adjustedY = y > 200 ? y - 10 : y + 10
    return {
      left: `${adjustedX}px`,
      top: `${adjustedY}px`,
      transform: y > 200 ? 'translateY(-100%)' : 'translateY(0)',
    }
  }, [])

  // Update trade tooltips based on chart coordinates
  const updateTradeTooltips = useCallback(() => {
    if (!chartRef.current || !candleSeriesRef.current || !chartContainerRef.current) {
      setTradeTooltips([])
      return
    }

    const filteredTrades = filterTradesByDateRange(trades)
    const newTooltips: Array<{ trade: Trade; x: number; y: number }> = []

    filteredTrades.forEach(trade => {
      try {
        const tradeDate = new Date(trade.trade_at)
        let time: any

        if (timeFrame === 'D') {
          time = tradeDate.toISOString().split('T')[0]
        } else {
          time = Math.floor(tradeDate.getTime() / 1000)
        }

        // Get coordinate from price - using the series method
        const priceCoordinate = candleSeriesRef.current.priceToCoordinate(trade.price)
        const timeCoordinate = chartRef.current?.timeScale().timeToCoordinate(time)

        // Ensure both coordinates are valid numbers
        if (
          priceCoordinate !== null &&
          typeof priceCoordinate === 'number' &&
          !isNaN(priceCoordinate) &&
          timeCoordinate !== null &&
          typeof timeCoordinate === 'number' &&
          !isNaN(timeCoordinate)
        ) {
          newTooltips.push({
            trade,
            x: timeCoordinate,
            y: priceCoordinate,
          })
        }
      } catch (e) {
        console.warn('Coordinate conversion error for trade:', trade.id, e)
      }
    })

    setTradeTooltips(newTooltips)
  }, [trades, timeFrame, filterTradesByDateRange])

  // Function to get current candle time based on timeframe
  const getCurrentCandleTime = useCallback(() => {
    const now = new Date()

    if (timeFrame === 'D') {
      return now.toISOString().split('T')[0]
    } else {
      const minutes = Number(timeFrame)
      const timestamp = Math.floor(now.getTime() / 1000)
      // Round down to candle interval
      const candleSeconds = minutes * 60
      return Math.floor(timestamp / candleSeconds) * candleSeconds
    }
  }, [timeFrame])

  // Update last candle with real-time price
  useEffect(() => {
    if (!candleSeriesRef.current || !chartDataRef.current.length) return

    const currentPrice = getPrice(coinSymbol)
    if (!currentPrice) return

    const currentCandleTime = getCurrentCandleTime()
    const lastCandle = chartDataRef.current[chartDataRef.current.length - 1]

    if (!lastCandle) return

    // Check if we need to create a new candle or update existing one
    const isNewCandle = lastCandleTimeRef.current !== currentCandleTime

    if (isNewCandle) {
      // Create new candle
      const newCandle = {
        time: currentCandleTime,
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice,
      }

      chartDataRef.current = [...chartDataRef.current, newCandle]
      lastCandleTimeRef.current = currentCandleTime

      candleSeriesRef.current.update(newCandle)

      // Auto-scroll to latest candle
      if (chartRef.current) {
        chartRef.current.timeScale().scrollToRealTime()
      }
    } else {
      // Update existing candle
      const updatedCandle = {
        time: lastCandle.time,
        open: lastCandle.open,
        high: Math.max(lastCandle.high, currentPrice),
        low: Math.min(lastCandle.low, currentPrice),
        close: currentPrice,
      }

      chartDataRef.current[chartDataRef.current.length - 1] = updatedCandle
      candleSeriesRef.current.update(updatedCandle)
    }
  }, [prices, coinSymbol, getPrice, getCurrentCandleTime])

  // Auto-scroll every 3 seconds when real-time updates are active
  useEffect(() => {
    if (!chartRef.current) return

    const scrollInterval = setInterval(() => {
      if (chartRef.current) {
        chartRef.current.timeScale().scrollToRealTime()
      }
    }, 3000)

    return () => clearInterval(scrollInterval)
  }, [])

  useEffect(() => {
    if (!chartContainerRef.current) return

    const abortController = new AbortController()
    let visibleRangeUnsubscribe: (() => void) | null = null

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

        // Apply date range filter
        const filteredCandles = filterCandlesByDateRange(candles)

        if (filteredCandles.length === 0) {
          setError('선택한 기간에 차트 데이터가 없습니다')
          setLoading(false)
          return
        }

        const container = chartContainerRef.current
        if (!container) return

        // Create chart (v5 API)
        const chart = createChart(container, {
          width: container.clientWidth,
          height: height - 80,
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
          priceLineVisible: false,
        })

        // Convert candles - format depends on timeframe (reverse in place for efficiency)
        const chartData = filteredCandles
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
        chartData.reverse()

        candleSeries.setData(chartData as any)
        candleSeriesRef.current = candleSeries
        chartDataRef.current = chartData
        lastCandleTimeRef.current = chartData.length > 0 ? chartData[chartData.length - 1].time : null

        // Filter trades by date range
        const filteredTrades = filterTradesByDateRange(trades)

        // Clear previous price lines (auto-cleanup when series is removed)
        priceLinesRef.current = []

        // Add price lines for each trade
        filteredTrades.forEach(trade => {
          try {
            const priceLine = candleSeries.createPriceLine({
              price: trade.price,
              color: trade.trade_type === 'BUY' ? '#3b82f6' : '#ef4444',
              lineWidth: 1,
              lineStyle: 0, // solid
              axisLabelVisible: false,
              title: '',
            })
            priceLinesRef.current.push(priceLine)
          } catch (e) {
            // Ignore price line creation errors
          }
        })

        // Add enhanced trade markers with profit/loss information
        if (filteredTrades.length > 0) {
          const markers = filteredTrades
            .map(trade => {
              const tradeDate = new Date(trade.trade_at)

              let time: string | number
              if (timeFrame === 'D') {
                time = tradeDate.toISOString().split('T')[0]
              } else {
                time = Math.floor(tradeDate.getTime() / 1000)
              }

              // Build enhanced marker text with larger, clearer formatting
              let markerText = ''
              let markerColor = ''
              let markerSize = 1.5  // Larger markers

              if (trade.trade_type === 'BUY') {
                // BUY marker: larger text with line break for better readability
                markerText = `매수\n${formatKRW(trade.price)}`
                markerColor = '#10b981'  // Brighter green
              } else {
                // SELL marker - show exit price and profit/loss percentage
                if (trade.pnl_percentage !== null && trade.pnl_percentage !== undefined) {
                  const pnlSign = trade.pnl_percentage >= 0 ? '+' : ''
                  markerText = `매도 ${formatKRW(trade.price)}\n(${pnlSign}${trade.pnl_percentage.toFixed(2)}%)`
                  // Green for profit, red for loss
                  markerColor = trade.pnl_percentage >= 0 ? '#10b981' : '#ef4444'
                } else {
                  markerText = `매도\n${formatKRW(trade.price)}`
                  markerColor = '#ef4444'
                }
              }

              return {
                time,
                position: trade.trade_type === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
                color: markerColor,
                shape: trade.trade_type === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
                text: markerText,
                size: markerSize,
                // Store trade data for potential tooltip usage
                id: trade.id,
              }
            })
            .sort((a, b) => {
              if (typeof a.time === 'string' && typeof b.time === 'string') {
                return a.time.localeCompare(b.time)
              }
              return (a.time as number) - (b.time as number)
            })

          try {
            createSeriesMarkers(candleSeries, markers as any)
          } catch {
            // Markers might fail if trade dates are outside candle range
          }
        }

        // Add crosshair move handler for trade marker tooltips
        // Store unsubscribe function to prevent memory leak
        try {
          const crosshairHandler = (param: any) => {
            if (!param.time || !param.point) {
              setHoveredTrade(null)
              setTooltipPosition(null)
              return
            }

            // Use Map for O(1) lookup instead of O(n) find
            const hoveredTime = param.time
            const trade = tradesByTime.get(hoveredTime)

            if (trade && param.point) {
              setHoveredTrade(trade)
              setTooltipPosition({ x: param.point.x, y: param.point.y })
            } else {
              setHoveredTrade(null)
              setTooltipPosition(null)
            }
          }

          // Clear previous subscription to prevent memory leak
          if (crosshairUnsubscribeRef.current) {
            crosshairUnsubscribeRef.current()
          }

          chart.subscribeCrosshairMove(crosshairHandler)

          // Store unsubscribe function
          crosshairUnsubscribeRef.current = () => {
            chart.unsubscribeCrosshairMove(crosshairHandler)
          }
        } catch (e) {
          console.error('Failed to subscribe to crosshair move:', e)
        }

        chart.timeScale().fitContent()
        setLoading(false)

        // Initial tooltip positions - wait for layout stabilization
        requestAnimationFrame(() => {
          updateTradeTooltips()
        })

        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
            })
            chartRef.current.timeScale().fitContent()
            // Recalculate tooltip positions on resize with slight delay
            setTimeout(() => updateTradeTooltips(), 150)
          }
        }

        window.addEventListener('resize', handleResize)
        resizeListenerRef.current = handleResize

        // Subscribe to visible range changes to update tooltips on zoom/pan
        const visibleRangeHandler = () => {
          setTimeout(() => updateTradeTooltips(), 50)
        }
        chart.timeScale().subscribeVisibleTimeRangeChange(visibleRangeHandler)
        visibleRangeUnsubscribe = () => {
          chart.timeScale().unsubscribeVisibleTimeRangeChange(visibleRangeHandler)
        }
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

      // Unsubscribe from crosshair events to prevent memory leak
      if (crosshairUnsubscribeRef.current) {
        crosshairUnsubscribeRef.current()
        crosshairUnsubscribeRef.current = null
      }

      // Unsubscribe from visible range changes
      if (visibleRangeUnsubscribe) {
        visibleRangeUnsubscribe()
        visibleRangeUnsubscribe = null
      }

      if (resizeListenerRef.current) {
        window.removeEventListener('resize', resizeListenerRef.current)
        resizeListenerRef.current = null
      }

      // Clear price lines
      priceLinesRef.current = []

      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
      candleSeriesRef.current = null
      chartDataRef.current = []
      lastCandleTimeRef.current = null
      setTradeTooltips([])
    }
  }, [coinSymbol, height, timeFrame, dateRangePreset, customStartDate, customEndDate, updateTradeTooltips, tradesByTime, filterCandlesByDateRange, filterTradesByDateRange, trades])

  const chartHeight = height - 80

  return (
    <div className={cn('w-full overflow-hidden', className)} style={{ height }}>
      {/* Date range selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 px-1 pb-2 border-b border-gray-800 mb-1">
        <div className="flex items-center gap-1 flex-wrap">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                setDateRangePreset(preset.value)
                if (preset.value !== 'custom') {
                  setCustomStartDate('')
                  setCustomEndDate('')
                }
              }}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                dateRangePreset === preset.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => setDateRangePreset('custom')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              dateRangePreset === 'custom'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            커스텀
          </button>
        </div>

        {/* Custom date range inputs */}
        {dateRangePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                max={customEndDate || new Date().toISOString().split('T')[0]}
                className="h-7 px-2 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <span className="text-xs text-muted-foreground">~</span>
            <div className="relative">
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
                max={new Date().toISOString().split('T')[0]}
                className="h-7 px-2 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Timeframe selector */}
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
        {/* Trade summary overlay - shows last BUY and SELL prices */}
        {trades.length > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2 text-xs space-y-1">
            {(() => {
              // Find last trades by iterating backwards (more efficient than reverse + find)
              let lastBuy: Trade | undefined
              let lastSell: Trade | undefined
              for (let i = trades.length - 1; i >= 0; i--) {
                if (!lastBuy && trades[i].trade_type === 'BUY') lastBuy = trades[i]
                if (!lastSell && trades[i].trade_type === 'SELL') lastSell = trades[i]
                if (lastBuy && lastSell) break
              }

              return (
                <>
                  {lastBuy && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-semibold">▲ 마지막 매수:</span>
                      <span className="text-white font-bold">{formatKRW(lastBuy.price)}</span>
                    </div>
                  )}
                  {lastSell && (
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-semibold">▼ 마지막 매도:</span>
                      <span className="text-white font-bold">{formatKRW(lastSell.price)}</span>
                      {lastSell.pnl_percentage !== null && lastSell.pnl_percentage !== undefined && (
                        <span className={cn(
                          'font-bold ml-1',
                          lastSell.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          ({lastSell.pnl_percentage >= 0 ? '+' : ''}{lastSell.pnl_percentage.toFixed(2)}%)
                        </span>
                      )}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        <div ref={chartContainerRef} className="w-full" style={{ height: chartHeight }} />

        {/* Always-visible trade tooltips */}
        {tradeTooltips.map((tooltip) => (
          <div
            key={tooltip.trade.id}
            className="absolute pointer-events-none"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 40,
              display: 'block',
              visibility: 'visible',
            }}
          >
            <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-md shadow-lg p-2 text-xs text-white whitespace-nowrap mb-1">
              <div className={cn(
                'font-semibold',
                tooltip.trade.trade_type === 'BUY' ? 'text-blue-400' : 'text-red-400'
              )}>
                {tooltip.trade.trade_type}
              </div>
              <div className="mt-0.5 space-y-0.5">
                <div className="text-[10px] text-gray-400">
                  {new Date(tooltip.trade.trade_at).toLocaleString('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="font-medium">
                  {formatKRW(tooltip.trade.price)}
                </div>
                <div className="text-[10px] text-gray-400">
                  {tooltip.trade.quantity.toFixed(4)}
                </div>
                {tooltip.trade.trade_type === 'SELL' && tooltip.trade.pnl_percentage !== null && (
                  <div className={cn(
                    'text-[10px] font-semibold',
                    tooltip.trade.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {tooltip.trade.pnl_percentage >= 0 ? '+' : ''}{tooltip.trade.pnl_percentage.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Trade marker tooltip - Enhanced with larger fonts */}
        {hoveredTrade && tooltipPosition && (
          <div
            className="absolute z-50 pointer-events-none"
            style={getTooltipStyle(tooltipPosition.x + 10, tooltipPosition.y)}
          >
            <div className="bg-gray-900/98 backdrop-blur-md border-2 border-gray-600 rounded-lg shadow-2xl p-4 min-w-[280px]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-gray-600">
                <span className={cn(
                  'text-base font-bold tracking-wide',
                  hoveredTrade.trade_type === 'BUY' ? 'text-green-400' : 'text-red-400'
                )}>
                  {hoveredTrade.trade_type === 'BUY' ? '▲ 매수 진입' : '▼ 매도 청산'}
                </span>
                <span className="text-xs text-gray-500">#{hoveredTrade.id.slice(0, 8)}</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center bg-gray-800/50 rounded px-2 py-1.5">
                  <span className="text-gray-400 font-medium">가격:</span>
                  <span className="text-white font-bold text-base">{formatKRW(hoveredTrade.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">수량:</span>
                  <span className="text-white">{hoveredTrade.quantity.toFixed(8)} {hoveredTrade.coin_symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">총액:</span>
                  <span className="text-white font-medium">{formatKRW(hoveredTrade.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">수수료:</span>
                  <span className="text-white">{formatKRW(hoveredTrade.fee)}</span>
                </div>

                {hoveredTrade.trade_type === 'SELL' && hoveredTrade.realized_pnl !== null && (
                  <>
                    <div className="border-t-2 border-gray-600 my-2 pt-2" />
                    <div className="flex justify-between items-center bg-gray-800/50 rounded px-2 py-1.5">
                      <span className="text-gray-400 font-medium">실현손익:</span>
                      <span className={cn(
                        'font-bold text-base',
                        hoveredTrade.realized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {hoveredTrade.realized_pnl >= 0 ? '+' : ''}{formatKRW(hoveredTrade.realized_pnl)}
                      </span>
                    </div>
                    {hoveredTrade.pnl_percentage !== null && (
                      <div className="flex justify-between items-center bg-gray-800/50 rounded px-2 py-1.5">
                        <span className="text-gray-400 font-medium">수익률:</span>
                        <span className={cn(
                          'font-bold text-base',
                          hoveredTrade.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          {hoveredTrade.pnl_percentage >= 0 ? '+' : ''}{hoveredTrade.pnl_percentage.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </>
                )}

                {hoveredTrade.memo && (
                  <>
                    <div className="border-t border-gray-600 my-2 pt-2" />
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-400 font-medium">메모:</span>
                      <span className="text-white text-xs leading-relaxed bg-gray-800/30 rounded px-2 py-1">{hoveredTrade.memo}</span>
                    </div>
                  </>
                )}

                <div className="border-t border-gray-600 my-2 pt-2" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">거래시각:</span>
                  <span className="text-white text-xs font-medium">
                    {new Date(hoveredTrade.trade_at).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

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
