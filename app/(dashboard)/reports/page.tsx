'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatKRW, formatPercent } from '@/lib/utils'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useStore } from '@/stores/useStore'
import { useToast } from '@/hooks/use-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Trade } from '@/types'

// 월별 데이터 계산
function calculateMonthlyData(trades: Trade[], year: number, month: number) {
  const monthTrades = trades.filter((t) => {
    const d = new Date(t.trade_at)
    return d.getFullYear() === year && d.getMonth() === month
  })

  if (monthTrades.length === 0) {
    return null
  }

  const buyTotal = monthTrades
    .filter((t) => t.trade_type === 'BUY')
    .reduce((sum, t) => sum + t.total_amount, 0)

  const sellTotal = monthTrades
    .filter((t) => t.trade_type === 'SELL')
    .reduce((sum, t) => sum + t.total_amount, 0)

  const totalPnl = sellTotal - buyTotal

  // 코인별 성과
  const coinStats = new Map<string, { trades: number; buyAmount: number; sellAmount: number }>()
  for (const trade of monthTrades) {
    const stat = coinStats.get(trade.coin_symbol) || { trades: 0, buyAmount: 0, sellAmount: 0 }
    stat.trades++
    if (trade.trade_type === 'BUY') {
      stat.buyAmount += trade.total_amount
    } else {
      stat.sellAmount += trade.total_amount
    }
    coinStats.set(trade.coin_symbol, stat)
  }

  const topCoins = Array.from(coinStats.entries())
    .map(([coin, stat]) => ({
      coin,
      trades: stat.trades,
      pnl: stat.sellAmount - stat.buyAmount,
      winRate: stat.sellAmount > stat.buyAmount ? 100 : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 5)

  // 일별 손익
  const dailyPnlMap = new Map<number, number>()
  for (const trade of monthTrades) {
    const day = new Date(trade.trade_at).getDate()
    const pnl = trade.trade_type === 'SELL' ? trade.total_amount : -trade.total_amount
    dailyPnlMap.set(day, (dailyPnlMap.get(day) || 0) + pnl)
  }

  let cumulative = 0
  const dailyPnl = Array.from(dailyPnlMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, pnl]) => {
      cumulative += pnl
      return { date: `${day}일`, pnl, cumulative }
    })

  // 승/패 계산
  const sellTrades = monthTrades.filter((t) => t.trade_type === 'SELL')
  const winTrades = sellTrades.filter((t) => {
    const prevBuys = monthTrades.filter(
      (bt) =>
        bt.trade_type === 'BUY' &&
        bt.coin_symbol === t.coin_symbol &&
        new Date(bt.trade_at) < new Date(t.trade_at)
    )
    if (prevBuys.length === 0) return false
    const avgBuyPrice = prevBuys.reduce((sum, bt) => sum + bt.price, 0) / prevBuys.length
    return t.price > avgBuyPrice
  }).length

  const lossTrades = sellTrades.length - winTrades
  const winRate = sellTrades.length > 0 ? (winTrades / sellTrades.length) * 100 : 0

  return {
    month: `${year}년 ${month + 1}월`,
    summary: {
      totalTrades: monthTrades.length,
      winTrades,
      lossTrades,
      winRate: Math.round(winRate * 10) / 10,
      totalPnl,
      totalPnlPercent: buyTotal > 0 ? (totalPnl / buyTotal) * 100 : 0,
      maxDrawdown: 0,
      bestTrade: topCoins[0] || { coin: '-', pnl: 0 },
      worstTrade: topCoins[topCoins.length - 1] || { coin: '-', pnl: 0 },
    },
    dailyPnl,
    topCoins,
    trades: monthTrades,
  }
}

export default function ReportsPage() {
  const { toast } = useToast()
  const { trades, setTrades } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient()
          const { data: userData } = await supabase.auth.getUser()

          if (userData.user) {
            const { data } = await supabase
              .from('trades')
              .select('*')
              .eq('user_id', userData.user.id)
              .order('trade_at', { ascending: false })

            if (data) setTrades(data as Trade[])
          }
        } catch (error) {
          console.error('Failed to fetch trades:', error)
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [setTrades])

  const monthlyData = useMemo(
    () => calculateMonthlyData(trades, currentDate.getFullYear(), currentDate.getMonth()),
    [trades, currentDate]
  )

  const handlePrevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  const handleExportPDF = () => {
    if (!monthlyData) {
      toast({ variant: 'destructive', title: '내보낼 데이터가 없습니다.' })
      return
    }

    const doc = new jsPDF()
    const { summary, topCoins, trades: monthTrades } = monthlyData

    // 제목
    doc.setFontSize(20)
    doc.text(`${monthlyData.month} 매매 리포트`, 105, 20, { align: 'center' })

    // 요약
    doc.setFontSize(12)
    doc.text('요약', 14, 35)
    autoTable(doc, {
      startY: 40,
      head: [['항목', '값']],
      body: [
        ['총 매매', `${summary.totalTrades}건`],
        ['승률', `${summary.winRate}%`],
        ['총 손익', `${summary.totalPnl.toLocaleString()}원`],
        ['익절', `${summary.winTrades}건`],
        ['손절', `${summary.lossTrades}건`],
      ],
    })

    // 코인별 성과
    doc.text('코인별 성과', 14, (doc as any).lastAutoTable.finalY + 15)
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['코인', '거래 수', '손익']],
      body: topCoins.map((c) => [c.coin, `${c.trades}건`, `${c.pnl.toLocaleString()}원`]),
    })

    // 거래 내역
    doc.text('거래 내역', 14, (doc as any).lastAutoTable.finalY + 15)
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['일시', '코인', '유형', '수량', '금액']],
      body: monthTrades.slice(0, 20).map((t) => [
        new Date(t.trade_at).toLocaleDateString('ko-KR'),
        t.coin_symbol,
        t.trade_type === 'BUY' ? '매수' : '매도',
        t.quantity.toString(),
        `${t.total_amount.toLocaleString()}원`,
      ]),
    })

    doc.save(`코인노트_${monthlyData.month}_리포트.pdf`)
    toast({ title: 'PDF 다운로드 완료' })
  }

  const handleExportExcel = () => {
    if (!monthlyData) {
      toast({ variant: 'destructive', title: '내보낼 데이터가 없습니다.' })
      return
    }

    const { trades: monthTrades, summary, topCoins } = monthlyData

    // 요약 시트
    const summaryData = [
      ['항목', '값'],
      ['총 매매', summary.totalTrades],
      ['승률', `${summary.winRate}%`],
      ['총 손익', summary.totalPnl],
      ['익절', summary.winTrades],
      ['손절', summary.lossTrades],
    ]

    // 거래 내역 시트
    const tradesData = [
      ['일시', '코인', '유형', '수량', '단가', '금액', '수수료', '거래소', '전략', '메모'],
      ...monthTrades.map((t) => [
        new Date(t.trade_at).toLocaleString('ko-KR'),
        t.coin_symbol,
        t.trade_type === 'BUY' ? '매수' : '매도',
        t.quantity,
        t.price,
        t.total_amount,
        t.fee,
        t.exchange,
        t.strategy || '',
        t.memo || '',
      ]),
    ]

    // 코인별 성과 시트
    const coinsData = [
      ['코인', '거래 수', '손익'],
      ...topCoins.map((c) => [c.coin, c.trades, c.pnl]),
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), '요약')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tradesData), '거래 내역')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(coinsData), '코인별 성과')

    XLSX.writeFile(wb, `코인노트_${monthlyData.month}_리포트.xlsx`)
    toast({ title: '엑셀 다운로드 완료' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (!monthlyData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">월간 리포트</h1>
            <p className="text-muted-foreground">매월 투자 성과를 분석합니다</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
        <div className="py-12 text-center text-muted-foreground">
          이 달의 거래 기록이 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">월간 리포트</h1>
          <p className="text-muted-foreground">매월 투자 성과를 분석합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileText className="mr-2 h-4 w-4" />
            엑셀
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF 내보내기
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold">{monthlyData.month}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">총 매매</span>
            </div>
            <p className="mt-2 font-number text-2xl font-bold">
              {monthlyData.summary.totalTrades}건
            </p>
            <p className="text-sm text-muted-foreground">
              익절 {monthlyData.summary.winTrades}건 / 손절 {monthlyData.summary.lossTrades}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">승률</span>
            </div>
            <p
              className={cn(
                'mt-2 font-number text-2xl font-bold',
                monthlyData.summary.winRate >= 50 ? 'text-success' : 'text-danger'
              )}
            >
              {monthlyData.summary.winRate.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              익절 {monthlyData.summary.winTrades} / 손절 {monthlyData.summary.lossTrades}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {monthlyData.summary.totalPnl >= 0 ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-danger" />
              )}
              <span className="text-sm text-muted-foreground">총 손익</span>
            </div>
            <p
              className={cn(
                'mt-2 font-number text-2xl font-bold',
                monthlyData.summary.totalPnl >= 0 ? 'text-success' : 'text-danger'
              )}
            >
              {monthlyData.summary.totalPnl >= 0 ? '+' : ''}
              {formatKRW(monthlyData.summary.totalPnl)}
            </p>
            <p
              className={cn(
                'font-number text-sm',
                monthlyData.summary.totalPnlPercent >= 0 ? 'text-success' : 'text-danger'
              )}
            >
              {formatPercent(monthlyData.summary.totalPnlPercent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-danger" />
              <span className="text-sm text-muted-foreground">최대 낙폭</span>
            </div>
            <p className="mt-2 font-number text-2xl font-bold text-danger">
              {monthlyData.summary.maxDrawdown}%
            </p>
            <p className="text-sm text-muted-foreground">MDD (Max Drawdown)</p>
          </CardContent>
        </Card>
      </div>

      {/* PnL Chart */}
      <Card>
        <CardHeader>
          <CardTitle>일별 손익 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData.dailyPnl}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="date"
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
                  formatter={(value: number, name: string) => [
                    formatKRW(value),
                    name === 'cumulative' ? '누적 손익' : '일별 손익',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#facc15"
                  strokeWidth={2}
                  dot={{ fill: '#facc15', strokeWidth: 2 }}
                  name="cumulative"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Coins & Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performing Coins */}
        <Card>
          <CardHeader>
            <CardTitle>코인별 성과</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {monthlyData.topCoins.map((coin, index) => (
                <div key={coin.coin} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{coin.coin}</p>
                      <p className="text-sm text-muted-foreground">
                        {coin.trades}건 · 승률 {coin.winRate}%
                      </p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      'font-number font-medium',
                      coin.pnl >= 0 ? 'text-success' : 'text-danger'
                    )}
                  >
                    {coin.pnl >= 0 ? '+' : ''}{formatKRW(coin.pnl)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>이번 달 요약</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyData.summary.winRate >= 50 ? (
              <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                <p className="font-medium text-success">승률 양호</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  이번 달 승률 {monthlyData.summary.winRate.toFixed(1)}%로 50% 이상을 기록했습니다.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
                <p className="font-medium text-danger">승률 개선 필요</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  이번 달 승률이 {monthlyData.summary.winRate.toFixed(1)}%입니다. 매매 전략을 점검해보세요.
                </p>
              </div>
            )}
            {monthlyData.topCoins[0] && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="font-medium text-primary">최고 성과 코인</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {monthlyData.topCoins[0].coin}에서 가장 좋은 성과를 기록했습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Best & Worst Trades */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-success/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-success">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">최고 수익 매매</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{monthlyData.summary.bestTrade.coin}</p>
              <p className="font-number text-3xl font-bold text-success">
                +{formatKRW(monthlyData.summary.bestTrade.pnl)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-danger/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-danger">
              <TrendingDown className="h-5 w-5" />
              <span className="font-medium">최대 손실 매매</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{monthlyData.summary.worstTrade.coin}</p>
              <p className="font-number text-3xl font-bold text-danger">
                {formatKRW(monthlyData.summary.worstTrade.pnl)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
