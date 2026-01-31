'use client'

import { useEffect, useState, useMemo } from 'react'
import { Wallet, TrendingUp, TrendingDown, BarChart3, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/dashboard/StatCard'
import { PnLChart } from '@/components/dashboard/PnLChart'
import { RecentTrades } from '@/components/dashboard/RecentTrades'
import { HoldingsOverview } from '@/components/dashboard/HoldingsOverview'
import { PerformanceStats } from '@/components/dashboard/PerformanceStats'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useStore } from '@/stores/useStore'
import Link from 'next/link'
import type { Trade, Holding, DashboardSummary } from '@/types'

// 거래 기록에서 보유 현황 계산
function calculateHoldings(trades: Trade[]): Holding[] {
  const holdingsMap = new Map<string, { quantity: number; totalCost: number }>()

  // 시간순 정렬
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.trade_at).getTime() - new Date(b.trade_at).getTime()
  )

  for (const trade of sortedTrades) {
    const current = holdingsMap.get(trade.coin_symbol) || { quantity: 0, totalCost: 0 }

    if (trade.trade_type === 'BUY') {
      current.quantity += trade.quantity
      current.totalCost += trade.total_amount
    } else {
      // SELL: 평균 단가 기준으로 비용 차감
      const avgPrice = current.quantity > 0 ? current.totalCost / current.quantity : 0
      current.quantity -= trade.quantity
      current.totalCost = current.quantity * avgPrice
    }

    if (current.quantity > 0.00000001) {
      holdingsMap.set(trade.coin_symbol, current)
    } else {
      holdingsMap.delete(trade.coin_symbol)
    }
  }

  return Array.from(holdingsMap.entries()).map(([symbol, data]) => ({
    id: symbol,
    user_id: '',
    coin_symbol: symbol,
    avg_price: data.totalCost / data.quantity,
    quantity: data.quantity,
    total_invested: data.totalCost,
    updated_at: new Date().toISOString(),
  }))
}

// 일별 손익 차트 데이터 생성
function generateChartData(trades: Trade[]): { date: string; value: number; pnl: number }[] {
  if (trades.length === 0) return []

  const dailyPnl = new Map<string, number>()

  for (const trade of trades) {
    const date = new Date(trade.trade_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
    const pnl = trade.trade_type === 'SELL' ? trade.total_amount : -trade.total_amount
    dailyPnl.set(date, (dailyPnl.get(date) || 0) + pnl)
  }

  let cumulative = 0
  return Array.from(dailyPnl.entries())
    .sort((a, b) => {
      const [aMonth, aDay] = a[0].split('/').map(Number)
      const [bMonth, bDay] = b[0].split('/').map(Number)
      return aMonth !== bMonth ? aMonth - bMonth : aDay - bDay
    })
    .map(([date, pnl]) => {
      cumulative += pnl
      return { date, value: cumulative, pnl }
    })
}

export default function DashboardPage() {
  const { trades, setTrades, holdings, setHoldings } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient()
          const { data: userData } = await supabase.auth.getUser()

          if (userData.user) {
            // 거래 내역 조회
            const { data: tradesData } = await supabase
              .from('trades')
              .select('*')
              .eq('user_id', userData.user.id)
              .order('trade_at', { ascending: false })

            if (tradesData) {
              setTrades(tradesData as Trade[])
            }

            // 보유 현황 조회 (DB에 있으면)
            const { data: holdingsData } = await supabase
              .from('holdings')
              .select('*')
              .eq('user_id', userData.user.id)

            if (holdingsData && holdingsData.length > 0) {
              setHoldings(holdingsData as Holding[])
            }
          }
        } catch (error) {
          console.error('Failed to fetch data:', error)
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [setTrades, setHoldings])

  // 거래 기록 기반으로 통계 계산
  const summary = useMemo<DashboardSummary>(() => {
    if (trades.length === 0) {
      return {
        totalAsset: 0,
        totalInvested: 0,
        totalRealizedPnl: 0,
        totalUnrealizedPnl: 0,
        totalPnlPercent: 0,
        todayPnl: 0,
        todayPnlPercent: 0,
        winRate: 0,
        totalTrades: 0,
        winTrades: 0,
        lossTrades: 0,
      }
    }

    const buyTotal = trades
      .filter((t) => t.trade_type === 'BUY')
      .reduce((sum, t) => sum + t.total_amount, 0)

    const sellTotal = trades
      .filter((t) => t.trade_type === 'SELL')
      .reduce((sum, t) => sum + t.total_amount, 0)

    const realizedPnl = sellTotal - buyTotal
    const totalInvested = buyTotal

    // 오늘 거래
    const today = new Date().toDateString()
    const todayTrades = trades.filter(
      (t) => new Date(t.trade_at).toDateString() === today
    )
    const todayBuy = todayTrades
      .filter((t) => t.trade_type === 'BUY')
      .reduce((sum, t) => sum + t.total_amount, 0)
    const todaySell = todayTrades
      .filter((t) => t.trade_type === 'SELL')
      .reduce((sum, t) => sum + t.total_amount, 0)
    const todayPnl = todaySell - todayBuy

    // 승률 계산 (매도 거래 기준)
    const sellTrades = trades.filter((t) => t.trade_type === 'SELL')
    const winTrades = sellTrades.filter((t) => {
      // 같은 코인의 이전 매수 평균가와 비교
      const prevBuys = trades.filter(
        (bt) =>
          bt.trade_type === 'BUY' &&
          bt.coin_symbol === t.coin_symbol &&
          new Date(bt.trade_at) < new Date(t.trade_at)
      )
      if (prevBuys.length === 0) return false
      const avgBuyPrice =
        prevBuys.reduce((sum, bt) => sum + bt.price, 0) / prevBuys.length
      return t.price > avgBuyPrice
    }).length

    const winRate = sellTrades.length > 0 ? (winTrades / sellTrades.length) * 100 : 0

    return {
      totalAsset: totalInvested + realizedPnl,
      totalInvested,
      totalRealizedPnl: realizedPnl,
      totalUnrealizedPnl: 0, // 실시간 가격 없이는 계산 불가
      totalPnlPercent: totalInvested > 0 ? (realizedPnl / totalInvested) * 100 : 0,
      todayPnl,
      todayPnlPercent: totalInvested > 0 ? (todayPnl / totalInvested) * 100 : 0,
      winRate: Math.round(winRate),
      totalTrades: trades.length,
      winTrades,
      lossTrades: sellTrades.length - winTrades,
    }
  }, [trades])

  // 보유 현황 계산 (DB에 없으면 거래 기록에서 계산)
  const displayHoldings = useMemo(() => {
    if (holdings.length > 0) return holdings
    return calculateHoldings(trades)
  }, [trades, holdings])

  // 차트 데이터
  const chartData = useMemo(() => generateChartData(trades), [trades])

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
        <PnLChart data={chartData} />
        <HoldingsOverview holdings={displayHoldings} />
      </div>

      {/* Performance & Recent Trades */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceStats
          winRate={summary.winRate}
          totalTrades={summary.totalTrades}
          winTrades={summary.winTrades}
          lossTrades={summary.lossTrades}
          avgProfit={0}
          avgLoss={0}
        />
        <RecentTrades trades={trades.slice(0, 5)} />
      </div>
    </div>
  )
}
