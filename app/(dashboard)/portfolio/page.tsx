'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, RefreshCw, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  cn,
  formatKRW,
  formatQuantity,
  formatPercent,
  getCoinName,
  calculatePnl,
} from '@/lib/utils'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useStore } from '@/stores/useStore'
import { useUpbit } from '@/hooks/useUpbit'
import type { Holding } from '@/types'

const COLORS = [
  '#facc15',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#8b5cf6',
]

// Mock data for demo mode
const mockHoldings: Holding[] = [
  {
    id: '1',
    user_id: '1',
    coin_symbol: 'BTC',
    avg_price: 95000000,
    quantity: 0.1,
    total_invested: 9500000,
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: '1',
    coin_symbol: 'ETH',
    avg_price: 3300000,
    quantity: 2,
    total_invested: 6600000,
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    user_id: '1',
    coin_symbol: 'SOL',
    avg_price: 180000,
    quantity: 10,
    total_invested: 1800000,
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    user_id: '1',
    coin_symbol: 'XRP',
    avg_price: 800,
    quantity: 1500,
    total_invested: 1200000,
    updated_at: new Date().toISOString(),
  },
]

export default function PortfolioPage() {
  const { holdings: storeHoldings, setHoldings } = useStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get symbols from holdings for price fetching
  const symbols = useMemo(() => {
    const h = storeHoldings.length > 0 ? storeHoldings : mockHoldings
    return h.map((holding) => holding.coin_symbol)
  }, [storeHoldings])

  // Fetch real-time prices from Upbit
  const {
    prices,
    loading: pricesLoading,
    refresh: refreshPrices,
  } = useUpbit({
    symbols,
    realtime: true,
  })

  // Fetch holdings from Supabase
  useEffect(() => {
    const fetchHoldings = async () => {
      if (!isSupabaseConfigured()) {
        setHoldings(mockHoldings)
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setHoldings(mockHoldings)
          setLoading(false)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('holdings')
          .select('*')
          .eq('user_id', user.id)
          .order('total_invested', { ascending: false })

        if (fetchError) throw fetchError

        if (data && data.length > 0) {
          setHoldings(data)
        } else {
          // No holdings yet, use empty array
          setHoldings([])
        }
      } catch (err) {
        console.error('Failed to fetch holdings:', err)
        setError('보유 자산을 불러오는데 실패했습니다.')
        setHoldings(mockHoldings)
      } finally {
        setLoading(false)
      }
    }

    fetchHoldings()
  }, [setHoldings])

  // Calculate holdings with real-time prices
  const holdingsWithPrices = useMemo(() => {
    const baseHoldings = storeHoldings.length > 0 ? storeHoldings : mockHoldings

    return baseHoldings.map((holding) => {
      const currentPrice = prices[holding.coin_symbol]?.trade_price || holding.avg_price
      const { pnl, pnlPercent } = calculatePnl(
        currentPrice,
        holding.avg_price,
        holding.quantity
      )
      const currentValue = currentPrice * holding.quantity

      return {
        ...holding,
        current_price: currentPrice,
        current_value: currentValue,
        unrealized_pnl: pnl,
        unrealized_pnl_percent: pnlPercent,
      }
    })
  }, [storeHoldings, prices])

  // Calculate totals
  const totalInvested = holdingsWithPrices.reduce((sum, h) => sum + h.total_invested, 0)
  const totalValue = holdingsWithPrices.reduce((sum, h) => sum + (h.current_value || h.total_invested), 0)
  const totalPnl = totalValue - totalInvested
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0

  // Chart data
  const pieData = holdingsWithPrices.map((h, i) => ({
    name: h.coin_symbol,
    value: h.current_value || h.total_invested,
    color: COLORS[i % COLORS.length],
  }))

  const barData = holdingsWithPrices.map((h) => ({
    name: h.coin_symbol,
    pnl: h.unrealized_pnl || 0,
    pnlPercent: h.unrealized_pnl_percent || 0,
  }))

  const handleRefresh = () => {
    refreshPrices()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (holdingsWithPrices.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">포트폴리오</h1>
          <p className="text-muted-foreground">보유 자산 현황</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">보유 자산이 없습니다</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              매매 기록을 추가하면 자동으로 포트폴리오가 업데이트됩니다.
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">포트폴리오</h1>
          <p className="text-muted-foreground">보유 자산 현황</p>
          {error && <p className="text-sm text-yellow-500">{error} (데모 데이터 표시 중)</p>}
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={pricesLoading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', pricesLoading && 'animate-spin')} />
          시세 업데이트
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">총 평가금액</p>
            <p className="font-number text-2xl font-bold">{formatKRW(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">총 투자금액</p>
            <p className="font-number text-2xl font-bold">{formatKRW(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">미실현 손익</p>
            <p
              className={cn(
                'font-number text-2xl font-bold',
                totalPnl >= 0 ? 'text-success' : 'text-danger'
              )}
            >
              {totalPnl >= 0 ? '+' : ''}{formatKRW(totalPnl)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">수익률</p>
            <p
              className={cn(
                'font-number text-2xl font-bold',
                totalPnlPercent >= 0 ? 'text-success' : 'text-danger'
              )}
            >
              {formatPercent(totalPnlPercent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>자산 비중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141414',
                      border: '1px solid #262626',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatKRW(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PnL Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>코인별 손익</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#a3a3a3', fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
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
                    formatter={(value: number) => [
                      formatKRW(value),
                      '손익',
                    ]}
                  />
                  <Bar
                    dataKey="pnl"
                    fill="#facc15"
                    radius={[0, 4, 4, 0]}
                  >
                    {barData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>보유 현황</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">코인</th>
                  <th className="p-4 text-right text-sm font-medium text-muted-foreground">보유량</th>
                  <th className="p-4 text-right text-sm font-medium text-muted-foreground">평균단가</th>
                  <th className="p-4 text-right text-sm font-medium text-muted-foreground">현재가</th>
                  <th className="p-4 text-right text-sm font-medium text-muted-foreground">평가금액</th>
                  <th className="p-4 text-right text-sm font-medium text-muted-foreground">손익</th>
                  <th className="p-4 text-right text-sm font-medium text-muted-foreground">수익률</th>
                </tr>
              </thead>
              <tbody>
                {holdingsWithPrices.map((holding, index) => (
                  <tr key={holding.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] + '30' }}
                        >
                          <div
                            className="flex h-full w-full items-center justify-center text-xs font-bold"
                            style={{ color: COLORS[index % COLORS.length] }}
                          >
                            {holding.coin_symbol.slice(0, 2)}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{holding.coin_symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {getCoinName(holding.coin_symbol)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-number">
                      {formatQuantity(holding.quantity)}
                    </td>
                    <td className="p-4 text-right font-number">
                      {formatKRW(holding.avg_price)}
                    </td>
                    <td className="p-4 text-right font-number">
                      {formatKRW(holding.current_price || holding.avg_price)}
                    </td>
                    <td className="p-4 text-right font-number font-medium">
                      {formatKRW(holding.current_value || holding.total_invested)}
                    </td>
                    <td
                      className={cn(
                        'p-4 text-right font-number',
                        (holding.unrealized_pnl || 0) >= 0 ? 'text-success' : 'text-danger'
                      )}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {(holding.unrealized_pnl || 0) >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {(holding.unrealized_pnl || 0) >= 0 ? '+' : ''}
                        {formatKRW(holding.unrealized_pnl || 0)}
                      </div>
                    </td>
                    <td
                      className={cn(
                        'p-4 text-right font-number font-medium',
                        (holding.unrealized_pnl_percent || 0) >= 0
                          ? 'text-success'
                          : 'text-danger'
                      )}
                    >
                      {formatPercent(holding.unrealized_pnl_percent || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
