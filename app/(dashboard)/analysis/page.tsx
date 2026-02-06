'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts'
import { Calendar, TrendingUp, TrendingDown, Clock, RefreshCw, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn, formatKRW } from '@/lib/utils'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useStore } from '@/stores/useStore'
import type { Trade } from '@/types'

// Analysis calculation functions
function calculateCoinPerformance(trades: Trade[]) {
  const coinMap = new Map<string, { buys: Trade[]; sells: Trade[] }>()

  trades.forEach((trade) => {
    if (!coinMap.has(trade.coin_symbol)) {
      coinMap.set(trade.coin_symbol, { buys: [], sells: [] })
    }
    const coin = coinMap.get(trade.coin_symbol)!
    if (trade.trade_type === 'BUY') {
      coin.buys.push(trade)
    } else {
      coin.sells.push(trade)
    }
  })

  const results: { coin: string; winRate: number; trades: number; profit: number; avgReturn: number }[] = []

  coinMap.forEach((data, symbol) => {
    const totalTrades = data.buys.length + data.sells.length
    // Calculate realized profit from sells
    let profit = 0
    let wins = 0

    data.sells.forEach((sell) => {
      // Find matching buy (simplified: use average buy price)
      const avgBuyPrice = data.buys.length > 0
        ? data.buys.reduce((sum, b) => sum + b.price, 0) / data.buys.length
        : sell.price

      const pnl = (sell.price - avgBuyPrice) * sell.quantity
      profit += pnl
      if (pnl > 0) wins++
    })

    const winRate = data.sells.length > 0 ? Math.round((wins / data.sells.length) * 100) : 0
    const avgReturn = data.sells.length > 0 && profit !== 0
      ? profit / data.sells.length / 10000 // Simplified avg return
      : 0

    if (totalTrades > 0) {
      results.push({
        coin: symbol,
        winRate,
        trades: totalTrades,
        profit: Math.round(profit),
        avgReturn: Math.round(avgReturn * 10) / 10,
      })
    }
  })

  return results.sort((a, b) => b.profit - a.profit).slice(0, 10)
}

function calculateHourlyPerformance(trades: Trade[]) {
  const hourRanges = [
    { label: '0-4시', start: 0, end: 4 },
    { label: '4-8시', start: 4, end: 8 },
    { label: '8-12시', start: 8, end: 12 },
    { label: '12-16시', start: 12, end: 16 },
    { label: '16-20시', start: 16, end: 20 },
    { label: '20-24시', start: 20, end: 24 },
  ]

  return hourRanges.map(({ label, start, end }) => {
    const rangeTrades = trades.filter((t) => {
      const hour = new Date(t.trade_at).getHours()
      return hour >= start && hour < end
    })

    const sells = rangeTrades.filter((t) => t.trade_type === 'SELL')
    // Simplified win calculation
    const wins = sells.filter((s) => {
      const relatedBuys = trades.filter(
        (t) => t.coin_symbol === s.coin_symbol && t.trade_type === 'BUY' && new Date(t.trade_at) < new Date(s.trade_at)
      )
      if (relatedBuys.length === 0) return false
      const avgBuyPrice = relatedBuys.reduce((sum, b) => sum + b.price, 0) / relatedBuys.length
      return s.price > avgBuyPrice
    })

    return {
      hour: label,
      winRate: sells.length > 0 ? Math.round((wins.length / sells.length) * 100) : 0,
      trades: rangeTrades.length,
    }
  })
}

function calculateWeeklyPerformance(trades: Trade[]) {
  const days = ['일', '월', '화', '수', '목', '금', '토']

  return days.map((day, dayIndex) => {
    const dayTrades = trades.filter((t) => new Date(t.trade_at).getDay() === dayIndex)
    const sells = dayTrades.filter((t) => t.trade_type === 'SELL')

    let profit = 0
    let wins = 0

    sells.forEach((sell) => {
      const relatedBuys = trades.filter(
        (t) => t.coin_symbol === sell.coin_symbol && t.trade_type === 'BUY' && new Date(t.trade_at) < new Date(sell.trade_at)
      )
      if (relatedBuys.length > 0) {
        const avgBuyPrice = relatedBuys.reduce((sum, b) => sum + b.price, 0) / relatedBuys.length
        const pnl = (sell.price - avgBuyPrice) * sell.quantity
        profit += pnl
        if (pnl > 0) wins++
      }
    })

    return {
      day,
      winRate: sells.length > 0 ? Math.round((wins / sells.length) * 100) : 0,
      trades: dayTrades.length,
      profit: Math.round(profit),
    }
  })
}

function calculateMonthlyPnl(trades: Trade[]) {
  const monthMap = new Map<string, number>()

  trades.filter((t) => t.trade_type === 'SELL').forEach((sell) => {
    const date = new Date(sell.trade_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    const relatedBuys = trades.filter(
      (t) => t.coin_symbol === sell.coin_symbol && t.trade_type === 'BUY' && new Date(t.trade_at) < new Date(sell.trade_at)
    )

    if (relatedBuys.length > 0) {
      const avgBuyPrice = relatedBuys.reduce((sum, b) => sum + b.price, 0) / relatedBuys.length
      const pnl = (sell.price - avgBuyPrice) * sell.quantity
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + pnl)
    }
  })

  const sortedMonths = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)

  return sortedMonths.map(([key, pnl]) => {
    const [year, month] = key.split('-')
    return {
      month: `${month}월`,
      pnl: Math.round(pnl),
    }
  })
}

function calculateStrategyPerformance(trades: Trade[]) {
  const strategyMap = new Map<string, { total: number; wins: number }>()

  const colors: Record<string, string> = {
    '지지선 반등': '#22c55e',
    '저항선 돌파': '#3b82f6',
    '분할 매수': '#facc15',
    '분할 매도': '#a855f7',
    '목표가 매도': '#14b8a6',
    '손절': '#ef4444',
    '추세 추종': '#f97316',
    '역추세': '#ec4899',
    '기타': '#8b5cf6',
  }

  trades.filter((t) => t.strategy).forEach((trade) => {
    const strategy = trade.strategy!
    if (!strategyMap.has(strategy)) {
      strategyMap.set(strategy, { total: 0, wins: 0 })
    }
    const data = strategyMap.get(strategy)!
    data.total++

    if (trade.trade_type === 'SELL') {
      const relatedBuys = trades.filter(
        (t) => t.coin_symbol === trade.coin_symbol && t.trade_type === 'BUY' && new Date(t.trade_at) < new Date(trade.trade_at)
      )
      if (relatedBuys.length > 0) {
        const avgBuyPrice = relatedBuys.reduce((sum, b) => sum + b.price, 0) / relatedBuys.length
        if (trade.price > avgBuyPrice) {
          data.wins++
        }
      }
    }
  })

  return Array.from(strategyMap.entries())
    .map(([strategy, data]) => ({
      strategy,
      winRate: data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0,
      trades: data.total,
      color: colors[strategy] || '#8b5cf6',
    }))
    .sort((a, b) => b.trades - a.trades)
}

// Mock data for demo mode
const mockTrades: Trade[] = [
  { id: '1', user_id: '1', coin_symbol: 'BTC', trade_type: 'BUY', quantity: 0.1, price: 90000000, total_amount: 9000000, fee: 9000, exchange: '업비트', trade_at: '2025-01-15T10:30:00Z', memo: null, emotion: 4, strategy: '지지선 반등', screenshot_url: null, created_at: '', paired_trade_id: null, realized_pnl: null, pnl_percentage: null },
  { id: '2', user_id: '1', coin_symbol: 'BTC', trade_type: 'SELL', quantity: 0.1, price: 95000000, total_amount: 9500000, fee: 9500, exchange: '업비트', trade_at: '2025-01-20T14:00:00Z', memo: null, emotion: 5, strategy: '목표가 매도', screenshot_url: null, created_at: '', paired_trade_id: null, realized_pnl: null, pnl_percentage: null },
  { id: '3', user_id: '1', coin_symbol: 'ETH', trade_type: 'BUY', quantity: 2, price: 3200000, total_amount: 6400000, fee: 6400, exchange: '업비트', trade_at: '2025-01-10T09:00:00Z', memo: null, emotion: 3, strategy: '분할 매수', screenshot_url: null, created_at: '', paired_trade_id: null, realized_pnl: null, pnl_percentage: null },
  { id: '4', user_id: '1', coin_symbol: 'ETH', trade_type: 'SELL', quantity: 1, price: 3500000, total_amount: 3500000, fee: 3500, exchange: '업비트', trade_at: '2025-01-18T16:30:00Z', memo: null, emotion: 4, strategy: '분할 매도', screenshot_url: null, created_at: '', paired_trade_id: null, realized_pnl: null, pnl_percentage: null },
  { id: '5', user_id: '1', coin_symbol: 'SOL', trade_type: 'BUY', quantity: 10, price: 180000, total_amount: 1800000, fee: 1800, exchange: '업비트', trade_at: '2025-01-12T11:00:00Z', memo: null, emotion: 3, strategy: '저항선 돌파', screenshot_url: null, created_at: '', paired_trade_id: null, realized_pnl: null, pnl_percentage: null },
  { id: '6', user_id: '1', coin_symbol: 'SOL', trade_type: 'SELL', quantity: 10, price: 170000, total_amount: 1700000, fee: 1700, exchange: '업비트', trade_at: '2025-01-22T08:00:00Z', memo: null, emotion: 2, strategy: '손절', screenshot_url: null, created_at: '', paired_trade_id: null, realized_pnl: null, pnl_percentage: null },
]

export default function AnalysisPage() {
  const { trades: storeTrades, setTrades } = useStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch trades from Supabase
  useEffect(() => {
    const fetchTrades = async () => {
      if (!isSupabaseConfigured()) {
        setTrades(mockTrades)
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setTrades(mockTrades)
          setLoading(false)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .order('trade_at', { ascending: true })

        if (fetchError) throw fetchError

        if (data && data.length > 0) {
          setTrades(data)
        } else {
          setTrades([])
        }
      } catch (err) {
        console.error('Failed to fetch trades:', err)
        setError('거래 데이터를 불러오는데 실패했습니다.')
        setTrades(mockTrades)
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()
  }, [setTrades])

  // Calculate all analytics
  const trades = storeTrades.length > 0 ? storeTrades : mockTrades

  const coinPerformance = useMemo(() => calculateCoinPerformance(trades), [trades])
  const hourlyPerformance = useMemo(() => calculateHourlyPerformance(trades), [trades])
  const weeklyPerformance = useMemo(() => calculateWeeklyPerformance(trades), [trades])
  const monthlyPnl = useMemo(() => calculateMonthlyPnl(trades), [trades])
  const strategyPerformance = useMemo(() => calculateStrategyPerformance(trades), [trades])

  // Calculate key insights
  const bestCoin = coinPerformance.length > 0
    ? coinPerformance.reduce((a, b) => (a.winRate > b.winRate ? a : b))
    : { coin: '-', winRate: 0 }
  const worstCoin = coinPerformance.length > 0
    ? coinPerformance.reduce((a, b) => (a.winRate < b.winRate ? a : b))
    : { coin: '-', winRate: 0 }
  const bestHour = hourlyPerformance.reduce((a, b) => (a.winRate > b.winRate ? a : b))
  const bestDay = weeklyPerformance.reduce((a, b) => (a.winRate > b.winRate ? a : b))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">매매 분석</h1>
          <p className="text-muted-foreground">매매 패턴과 성과를 분석합니다</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">분석할 데이터가 없습니다</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              매매 기록을 추가하면 패턴 분석이 시작됩니다.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/trades/new'}>
              첫 거래 기록하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">매매 분석</h1>
        <p className="text-muted-foreground">매매 패턴과 성과를 분석합니다</p>
        {error && <p className="text-sm text-yellow-500">{error} (데모 데이터 표시 중)</p>}
      </div>

      {/* Key Insights */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-success/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">최고 성과 코인</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-success">{bestCoin.coin}</p>
            <p className="text-sm text-muted-foreground">승률 {bestCoin.winRate}%</p>
          </CardContent>
        </Card>

        <Card className="border-danger/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-danger" />
              <span className="text-sm text-muted-foreground">개선 필요 코인</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-danger">{worstCoin.coin}</p>
            <p className="text-sm text-muted-foreground">승률 {worstCoin.winRate}%</p>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">최적 거래 시간</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-primary">{bestHour.hour}</p>
            <p className="text-sm text-muted-foreground">승률 {bestHour.winRate}%</p>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">최적 거래 요일</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-primary">{bestDay.day}요일</p>
            <p className="text-sm text-muted-foreground">승률 {bestDay.winRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="coin" className="space-y-6">
        <TabsList>
          <TabsTrigger value="coin">코인별</TabsTrigger>
          <TabsTrigger value="time">시간대별</TabsTrigger>
          <TabsTrigger value="day">요일별</TabsTrigger>
          <TabsTrigger value="strategy">전략별</TabsTrigger>
        </TabsList>

        {/* Coin Performance */}
        <TabsContent value="coin" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>코인별 승률</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {coinPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={coinPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                        <XAxis
                          dataKey="coin"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#a3a3a3', fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#a3a3a3', fontSize: 12 }}
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#141414',
                            border: '1px solid #262626',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`${value}%`, '승률']}
                        />
                        <Bar dataKey="winRate" fill="#facc15" radius={[4, 4, 0, 0]}>
                          {coinPerformance.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.winRate >= 60 ? '#22c55e' : entry.winRate >= 50 ? '#facc15' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      데이터가 충분하지 않습니다
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>코인별 수익</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {coinPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={coinPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#a3a3a3', fontSize: 12 }}
                          tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                        />
                        <YAxis
                          type="category"
                          dataKey="coin"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#ffffff', fontSize: 12 }}
                          width={50}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#141414',
                            border: '1px solid #262626',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [formatKRW(value), '수익']}
                        />
                        <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                          {coinPerformance.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      데이터가 충분하지 않습니다
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Time Performance */}
        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle>시간대별 승률</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#a3a3a3', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#a3a3a3', fontSize: 12 }}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141414',
                        border: '1px solid #262626',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'winRate' ? `${value}%` : value,
                        name === 'winRate' ? '승률' : '거래수',
                      ]}
                    />
                    <Bar dataKey="winRate" fill="#facc15" radius={[4, 4, 0, 0]} name="winRate">
                      {hourlyPerformance.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.winRate >= 60 ? '#22c55e' : entry.winRate >= 50 ? '#facc15' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Performance */}
        <TabsContent value="day">
          <Card>
            <CardHeader>
              <CardTitle>요일별 성과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#a3a3a3', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#a3a3a3', fontSize: 12 }}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141414',
                        border: '1px solid #262626',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'winRate' ? `${value}%` : formatKRW(value),
                        name === 'winRate' ? '승률' : '손익',
                      ]}
                    />
                    <Bar dataKey="winRate" fill="#facc15" radius={[4, 4, 0, 0]} name="winRate">
                      {weeklyPerformance.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Performance */}
        <TabsContent value="strategy">
          <Card>
            <CardHeader>
              <CardTitle>전략별 승률</CardTitle>
            </CardHeader>
            <CardContent>
              {strategyPerformance.length > 0 ? (
                <div className="space-y-4">
                  {strategyPerformance.map((strategy) => (
                    <div key={strategy.strategy} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{strategy.strategy}</span>
                        <span className="font-number">{strategy.winRate}% ({strategy.trades}건)</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${strategy.winRate}%`,
                            backgroundColor: strategy.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  전략이 기록된 거래가 없습니다
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Monthly PnL */}
      <Card>
        <CardHeader>
          <CardTitle>월별 손익 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {monthlyPnl.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyPnl}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#a3a3a3', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#a3a3a3', fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141414',
                      border: '1px solid #262626',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatKRW(value), '손익']}
                  />
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    stroke="#facc15"
                    strokeWidth={2}
                    dot={{ fill: '#facc15', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                매도 기록이 있어야 손익을 계산할 수 있습니다
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
