'use client'

import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatKRW, formatQuantity, formatRelativeTime, getCoinName } from '@/lib/utils'
import type { Trade } from '@/types'

interface RecentTradesProps {
  trades: Trade[]
}

export function RecentTrades({ trades }: RecentTradesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>최근 매매</CardTitle>
        <Link href="/trades">
          <Button variant="ghost" size="sm">
            전체보기
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>매매 기록이 없습니다</p>
            <Link href="/trades/new">
              <Button variant="outline" className="mt-4">
                첫 매매 기록하기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => (
              <Link
                key={trade.id}
                href={`/trades/${trade.id}`}
                className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      trade.trade_type === 'BUY'
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                    )}
                  >
                    {trade.trade_type === 'BUY' ? (
                      <ArrowDownRight className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trade.coin_symbol}</span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs font-medium',
                          trade.trade_type === 'BUY'
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        )}
                      >
                        {trade.trade_type === 'BUY' ? '매수' : '매도'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getCoinName(trade.coin_symbol)} · {formatRelativeTime(trade.trade_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-number font-medium">{formatKRW(trade.total_amount)}</p>
                  <p className="font-number text-sm text-muted-foreground">
                    {formatQuantity(trade.quantity)} {trade.coin_symbol}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
