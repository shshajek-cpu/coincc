'use client'

import { useState } from 'react'
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Calendar, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatKRW, formatPercent } from '@/lib/utils'

// Mock data for analysis
const coinPerformance = [
  { coin: 'BTC', winRate: 72, trades: 15, profit: 2500000, avgReturn: 8.5 },
  { coin: 'ETH', winRate: 68, trades: 12, profit: 1800000, avgReturn: 6.2 },
  { coin: 'SOL', winRate: 55, trades: 8, profit: -200000, avgReturn: -2.1 },
  { coin: 'XRP', winRate: 60, trades: 10, profit: 500000, avgReturn: 4.3 },
  { coin: 'DOGE', winRate: 45, trades: 6, profit: -150000, avgReturn: -3.5 },
]

const hourlyPerformance = [
  { hour: '0-4시', winRate: 45, trades: 5 },
  { hour: '4-8시', winRate: 55, trades: 8 },
  { hour: '8-12시', winRate: 72, trades: 15 },
  { hour: '12-16시', winRate: 68, trades: 12 },
  { hour: '16-20시', winRate: 65, trades: 10 },
  { hour: '20-24시', winRate: 58, trades: 8 },
]

const weeklyPerformance = [
  { day: '월', winRate: 65, trades: 8, profit: 450000 },
  { day: '화', winRate: 70, trades: 10, profit: 620000 },
  { day: '수', winRate: 58, trades: 7, profit: 180000 },
  { day: '목', winRate: 72, trades: 9, profit: 750000 },
  { day: '금', winRate: 55, trades: 6, profit: -120000 },
  { day: '토', winRate: 48, trades: 4, profit: -200000 },
  { day: '일', winRate: 52, trades: 5, profit: 80000 },
]

const monthlyPnl = [
  { month: '8월', pnl: 1200000 },
  { month: '9월', pnl: -300000 },
  { month: '10월', pnl: 850000 },
  { month: '11월', pnl: 1500000 },
  { month: '12월', pnl: 2100000 },
  { month: '1월', pnl: 1800000 },
]

const strategyPerformance = [
  { strategy: '지지선 반등', winRate: 75, trades: 12, color: '#22c55e' },
  { strategy: '저항선 돌파', winRate: 68, trades: 8, color: '#3b82f6' },
  { strategy: '분할 매수', winRate: 70, trades: 15, color: '#facc15' },
  { strategy: '목표가 매도', winRate: 85, trades: 10, color: '#a855f7' },
  { strategy: '손절', winRate: 0, trades: 5, color: '#ef4444' },
]

export default function AnalysisPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  const bestCoin = coinPerformance.reduce((a, b) => (a.winRate > b.winRate ? a : b))
  const worstCoin = coinPerformance.reduce((a, b) => (a.winRate < b.winRate ? a : b))
  const bestHour = hourlyPerformance.reduce((a, b) => (a.winRate > b.winRate ? a : b))
  const bestDay = weeklyPerformance.reduce((a, b) => (a.winRate > b.winRate ? a : b))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">매매 분석</h1>
        <p className="text-muted-foreground">매매 패턴과 성과를 분석합니다</p>
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>코인별 수익</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
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
                    />
                    <Bar dataKey="winRate" fill="#facc15" radius={[4, 4, 0, 0]} name="승률" />
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
                    />
                    <Bar dataKey="winRate" fill="#facc15" radius={[4, 4, 0, 0]} name="승률">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
