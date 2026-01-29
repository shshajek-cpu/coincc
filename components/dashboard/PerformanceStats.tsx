'use client'

import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatPercent } from '@/lib/utils'

interface PerformanceStatsProps {
  winRate: number
  totalTrades: number
  winTrades: number
  lossTrades: number
  avgProfit?: number
  avgLoss?: number
}

export function PerformanceStats({
  winRate,
  totalTrades,
  winTrades,
  lossTrades,
  avgProfit = 0,
  avgLoss = 0,
}: PerformanceStatsProps) {
  const stats = [
    {
      label: '승률',
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      color: winRate >= 50 ? 'text-success' : 'text-danger',
      bgColor: winRate >= 50 ? 'bg-success/10' : 'bg-danger/10',
    },
    {
      label: '총 매매',
      value: totalTrades.toString(),
      icon: Activity,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: '익절',
      value: winTrades.toString(),
      subValue: avgProfit > 0 ? `평균 ${formatPercent(avgProfit)}` : undefined,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: '손절',
      value: lossTrades.toString(),
      subValue: avgLoss < 0 ? `평균 ${formatPercent(avgLoss)}` : undefined,
      icon: TrendingDown,
      color: 'text-danger',
      bgColor: 'bg-danger/10',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>매매 성과</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className={cn(
                  'mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg',
                  stat.bgColor
                )}
              >
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <p className={cn('font-number text-xl font-bold', stat.color)}>
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {stat.subValue && (
                <p className="font-number text-xs text-muted-foreground">
                  {stat.subValue}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Win Rate Bar */}
        {totalTrades > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-success">{winTrades} 익절</span>
              <span className="text-danger">{lossTrades} 손절</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-success transition-all duration-500"
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
