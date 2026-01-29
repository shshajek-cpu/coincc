'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, BarChart3, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/dashboard/StatCard'
import { PnLChart } from '@/components/dashboard/PnLChart'
import { RecentTrades } from '@/components/dashboard/RecentTrades'
import { HoldingsOverview } from '@/components/dashboard/HoldingsOverview'
import { PerformanceStats } from '@/components/dashboard/PerformanceStats'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Trade, Holding, DashboardSummary } from '@/types'

// Mock data for demonstration
const mockChartData = [
  { date: '1/1', value: 10000000, pnl: 0 },
  { date: '1/5', value: 10500000, pnl: 500000 },
  { date: '1/10', value: 10200000, pnl: 200000 },
  { date: '1/15', value: 11000000, pnl: 1000000 },
  { date: '1/20', value: 10800000, pnl: 800000 },
  { date: '1/25', value: 11500000, pnl: 1500000 },
  { date: '1/29', value: 12000000, pnl: 2000000 },
]

const mockTrades: Trade[] = [
  {
    id: '1',
    user_id: '1',
    coin_symbol: 'BTC',
    trade_type: 'BUY',
    quantity: 0.05,
    price: 98000000,
    total_amount: 4900000,
    fee: 4900,
    exchange: '업비트',
    trade_at: new Date(Date.now() - 3600000).toISOString(),
    memo: null,
    emotion: 4,
    strategy: '지지선 반등',
    screenshot_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: '1',
    coin_symbol: 'ETH',
    trade_type: 'SELL',
    quantity: 1.5,
    price: 3500000,
    total_amount: 5250000,
    fee: 5250,
    exchange: '업비트',
    trade_at: new Date(Date.now() - 86400000).toISOString(),
    memo: '목표가 도달',
    emotion: 5,
    strategy: '목표가 매도',
    screenshot_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    user_id: '1',
    coin_symbol: 'SOL',
    trade_type: 'BUY',
    quantity: 10,
    price: 180000,
    total_amount: 1800000,
    fee: 1800,
    exchange: '업비트',
    trade_at: new Date(Date.now() - 172800000).toISOString(),
    memo: null,
    emotion: 3,
    strategy: '분할 매수',
    screenshot_url: null,
    created_at: new Date().toISOString(),
  },
]

const mockHoldings: Holding[] = [
  {
    id: '1',
    user_id: '1',
    coin_symbol: 'BTC',
    avg_price: 95000000,
    quantity: 0.1,
    total_invested: 9500000,
    updated_at: new Date().toISOString(),
    current_price: 98000000,
    current_value: 9800000,
    unrealized_pnl: 300000,
    unrealized_pnl_percent: 3.16,
  },
  {
    id: '2',
    user_id: '1',
    coin_symbol: 'ETH',
    avg_price: 3300000,
    quantity: 2,
    total_invested: 6600000,
    updated_at: new Date().toISOString(),
    current_price: 3500000,
    current_value: 7000000,
    unrealized_pnl: 400000,
    unrealized_pnl_percent: 6.06,
  },
  {
    id: '3',
    user_id: '1',
    coin_symbol: 'SOL',
    avg_price: 180000,
    quantity: 10,
    total_invested: 1800000,
    updated_at: new Date().toISOString(),
    current_price: 175000,
    current_value: 1750000,
    unrealized_pnl: -50000,
    unrealized_pnl_percent: -2.78,
  },
]

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary>({
    totalAsset: 18550000,
    totalInvested: 17900000,
    totalRealizedPnl: 2500000,
    totalUnrealizedPnl: 650000,
    totalPnlPercent: 17.6,
    todayPnl: 350000,
    todayPnlPercent: 1.92,
    winRate: 68,
    totalTrades: 25,
    winTrades: 17,
    lossTrades: 8,
  })
  const [trades, setTrades] = useState<Trade[]>(mockTrades)
  const [holdings, setHoldings] = useState<Holding[]>(mockHoldings)

  useEffect(() => {
    // TODO: Fetch real data from Supabase
    const fetchData = async () => {
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-lg" />
          ))}
        </div>
        <div className="skeleton h-[400px] rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-muted-foreground">오늘의 투자 현황을 확인하세요</p>
        </div>
        <Link href="/trades/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 매매 기록
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="총 자산"
          value={summary.totalAsset}
          change={summary.todayPnlPercent}
          changeLabel="오늘"
          icon={Wallet}
        />
        <StatCard
          title="총 수익률"
          value={summary.totalPnlPercent}
          format="percent"
          icon={TrendingUp}
          variant={summary.totalPnlPercent >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="실현 손익"
          value={summary.totalRealizedPnl}
          icon={BarChart3}
          variant={summary.totalRealizedPnl >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="미실현 손익"
          value={summary.totalUnrealizedPnl}
          icon={summary.totalUnrealizedPnl >= 0 ? TrendingUp : TrendingDown}
          variant={summary.totalUnrealizedPnl >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Charts & Holdings */}
      <div className="grid gap-6 lg:grid-cols-3">
        <PnLChart data={mockChartData} />
        <HoldingsOverview holdings={holdings} />
      </div>

      {/* Performance & Recent Trades */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceStats
          winRate={summary.winRate}
          totalTrades={summary.totalTrades}
          winTrades={summary.winTrades}
          lossTrades={summary.lossTrades}
          avgProfit={8.5}
          avgLoss={-4.2}
        />
        <RecentTrades trades={trades} />
      </div>
    </div>
  )
}
