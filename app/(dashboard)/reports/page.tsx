'use client'

import { useState } from 'react'
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

// Mock data for monthly report
const monthlyData = {
  month: '2024년 1월',
  summary: {
    totalTrades: 45,
    winTrades: 28,
    lossTrades: 17,
    winRate: 62.2,
    totalPnl: 3250000,
    totalPnlPercent: 8.5,
    avgWinAmount: 180000,
    avgLossAmount: -95000,
    profitFactor: 1.89,
    maxDrawdown: -4.2,
    bestTrade: { coin: 'BTC', pnl: 850000 },
    worstTrade: { coin: 'DOGE', pnl: -320000 },
  },
  dailyPnl: [
    { date: '1일', pnl: 120000, cumulative: 120000 },
    { date: '5일', pnl: -50000, cumulative: 70000 },
    { date: '10일', pnl: 280000, cumulative: 350000 },
    { date: '15일', pnl: 150000, cumulative: 500000 },
    { date: '20일', pnl: -180000, cumulative: 320000 },
    { date: '25일', pnl: 420000, cumulative: 740000 },
    { date: '30일', pnl: 310000, cumulative: 1050000 },
  ],
  topCoins: [
    { coin: 'BTC', trades: 12, pnl: 1500000, winRate: 75 },
    { coin: 'ETH', trades: 10, pnl: 800000, winRate: 70 },
    { coin: 'SOL', trades: 8, pnl: 450000, winRate: 62.5 },
    { coin: 'XRP', trades: 6, pnl: -150000, winRate: 50 },
    { coin: 'DOGE', trades: 5, pnl: -320000, winRate: 40 },
  ],
  insights: [
    {
      type: 'positive',
      title: '오전 시간대 승률 우수',
      description: '8시-12시 매매 승률이 78%로 가장 높았습니다.',
    },
    {
      type: 'positive',
      title: '분할 매수 전략 효과적',
      description: '분할 매수 전략의 평균 수익률이 12%를 기록했습니다.',
    },
    {
      type: 'negative',
      title: '주말 매매 주의 필요',
      description: '토/일 매매 승률이 45%로 평일 대비 낮았습니다.',
    },
    {
      type: 'suggestion',
      title: '손절 라인 조정 권장',
      description: '평균 손실 대비 손절 라인을 더 타이트하게 설정해보세요.',
    },
  ],
}

export default function ReportsPage() {
  const [currentMonth] = useState(new Date())

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF 내보내기 기능은 준비 중입니다.')
  }

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    alert('엑셀 다운로드 기능은 준비 중입니다.')
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
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold">{monthlyData.month}</span>
          </div>
          <Button variant="ghost" size="icon">
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
              Profit Factor: {monthlyData.summary.profitFactor}
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
            <CardTitle>AI 인사이트</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyData.insights.map((insight, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-lg border p-4',
                  insight.type === 'positive' && 'border-success/30 bg-success/5',
                  insight.type === 'negative' && 'border-danger/30 bg-danger/5',
                  insight.type === 'suggestion' && 'border-primary/30 bg-primary/5'
                )}
              >
                <p
                  className={cn(
                    'font-medium',
                    insight.type === 'positive' && 'text-success',
                    insight.type === 'negative' && 'text-danger',
                    insight.type === 'suggestion' && 'text-primary'
                  )}
                >
                  {insight.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            ))}
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
