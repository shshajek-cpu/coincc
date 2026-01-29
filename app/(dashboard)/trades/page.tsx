'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  cn,
  formatKRW,
  formatQuantity,
  formatDateTime,
  getCoinName,
  getEmotionEmoji,
} from '@/lib/utils'
import type { Trade, TradeType } from '@/types'

// Mock data
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
    memo: '지지선에서 반등 예상',
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
    memo: '목표가 도달로 익절',
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
  {
    id: '4',
    user_id: '1',
    coin_symbol: 'XRP',
    trade_type: 'SELL',
    quantity: 1000,
    price: 850,
    total_amount: 850000,
    fee: 850,
    exchange: '빗썸',
    trade_at: new Date(Date.now() - 259200000).toISOString(),
    memo: '손절',
    emotion: 2,
    strategy: '손절',
    screenshot_url: null,
    created_at: new Date().toISOString(),
  },
]

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>(mockTrades)
  const [filter, setFilter] = useState<'all' | TradeType>('all')
  const [search, setSearch] = useState('')
  const [exchange, setExchange] = useState<string>('all')

  const filteredTrades = trades.filter((trade) => {
    const matchesFilter = filter === 'all' || trade.trade_type === filter
    const matchesSearch =
      search === '' ||
      trade.coin_symbol.toLowerCase().includes(search.toLowerCase()) ||
      getCoinName(trade.coin_symbol).includes(search)
    const matchesExchange = exchange === 'all' || trade.exchange === exchange
    return matchesFilter && matchesSearch && matchesExchange
  })

  const stats = {
    totalTrades: trades.length,
    buyTrades: trades.filter((t) => t.trade_type === 'BUY').length,
    sellTrades: trades.filter((t) => t.trade_type === 'SELL').length,
    totalVolume: trades.reduce((sum, t) => sum + t.total_amount, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">매매 기록</h1>
          <p className="text-muted-foreground">
            총 {stats.totalTrades}건의 매매 기록
          </p>
        </div>
        <Link href="/trades/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 매매 기록
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">총 매매</p>
            <p className="font-number text-2xl font-bold">{stats.totalTrades}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">매수</p>
            <p className="font-number text-2xl font-bold text-success">
              {stats.buyTrades}건
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">매도</p>
            <p className="font-number text-2xl font-bold text-danger">
              {stats.sellTrades}건
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">총 거래대금</p>
            <p className="font-number text-2xl font-bold">{formatKRW(stats.totalVolume)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="BUY">매수</TabsTrigger>
                <TabsTrigger value="SELL">매도</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-1 gap-2 lg:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="코인 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={exchange} onValueChange={setExchange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="거래소" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="업비트">업비트</SelectItem>
                  <SelectItem value="빗썸">빗썸</SelectItem>
                  <SelectItem value="코인원">코인원</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trades List */}
      <Card>
        <CardContent className="p-0">
          {filteredTrades.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">매매 기록이 없습니다</p>
              <Link href="/trades/new">
                <Button variant="outline" className="mt-4">
                  첫 매매 기록하기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
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
                        {trade.emotion && (
                          <span title={`감정: ${trade.emotion}/5`}>
                            {getEmotionEmoji(trade.emotion)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getCoinName(trade.coin_symbol)} · {trade.exchange} ·{' '}
                        {formatDateTime(trade.trade_at)}
                      </p>
                      {trade.strategy && (
                        <p className="text-xs text-primary">{trade.strategy}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-number font-medium">
                        {formatKRW(trade.total_amount)}
                      </p>
                      <p className="font-number text-sm text-muted-foreground">
                        {formatQuantity(trade.quantity)} {trade.coin_symbol} @{' '}
                        {formatKRW(trade.price)}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/trades/${trade.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            수정
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
