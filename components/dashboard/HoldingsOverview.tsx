'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatKRW, formatPercent, getCoinName } from '@/lib/utils'
import type { Holding } from '@/types'

interface HoldingsOverviewProps {
  holdings: Holding[]
}

const COLORS = [
  '#facc15', // Primary yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#f97316', // Orange
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#8b5cf6', // Violet
]

export function HoldingsOverview({ holdings }: HoldingsOverviewProps) {
  const pieData = holdings.map((holding, index) => ({
    name: holding.coin_symbol,
    value: holding.current_value || holding.total_invested,
    color: COLORS[index % COLORS.length],
  }))

  const totalValue = pieData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>보유 현황</CardTitle>
      </CardHeader>
      <CardContent>
        {holdings.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>보유 중인 코인이 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Pie Chart */}
            <div className="h-[200px] w-full lg:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
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

            {/* Holdings List */}
            <div className="flex-1 space-y-3">
              {holdings.slice(0, 5).map((holding, index) => {
                const percentage = totalValue > 0
                  ? ((holding.current_value || holding.total_invested) / totalValue) * 100
                  : 0
                const pnlPercent = holding.unrealized_pnl_percent || 0

                return (
                  <div key={holding.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{holding.coin_symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {getCoinName(holding.coin_symbol)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-number text-sm">{percentage.toFixed(1)}%</span>
                      <span
                        className={cn(
                          'ml-2 font-number text-xs',
                          pnlPercent >= 0 ? 'text-success' : 'text-danger'
                        )}
                      >
                        {formatPercent(pnlPercent)}
                      </span>
                    </div>
                  </div>
                )
              })}
              {holdings.length > 5 && (
                <p className="text-center text-sm text-muted-foreground">
                  외 {holdings.length - 5}개
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
