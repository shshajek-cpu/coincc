'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  LayoutList,
  LayoutGrid,
  X,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Upload,
  Loader2,
  LinkIcon,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  cn,
  formatKRW,
  formatQuantity,
  formatDateTime,
  getCoinName,
  getEmotionEmoji,
} from '@/lib/utils'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { uploadScreenshot, validateFile } from '@/lib/supabase/storage'
import { useStore } from '@/stores/useStore'
import { useToast } from '@/hooks/use-toast'
import type { Trade, TradeType } from '@/types'

const TradePairChart = dynamic(
  () => import('@/components/charts/TradePairChart').then((mod) => ({ default: mod.TradePairChart })),
  { ssr: false }
)

const COINS = [
  'BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'DOT', 'MATIC',
  'AVAX', 'LINK', 'ATOM', 'UNI', 'ETC', 'BCH', 'LTC', 'NEAR', 'APT', 'ARB', 'OP'
]

const EXCHANGES = ['업비트', '빗썸', '코인원', '바이낸스', '기타']

const STRATEGIES = [
  '지지선 반등',
  '저항선 돌파',
  '분할 매수',
  '분할 매도',
  '목표가 매도',
  '손절',
  '추세 추종',
  '역추세',
  '기타',
]

const EMOTIONS = [
  { value: 1, emoji: '😫', label: '매우 나쁨' },
  { value: 2, emoji: '😟', label: '나쁨' },
  { value: 3, emoji: '😐', label: '보통' },
  { value: 4, emoji: '😊', label: '좋음' },
  { value: 5, emoji: '🤩', label: '매우 좋음' },
]

export default function TradesPage() {
  const { toast } = useToast()
  const { trades, setTrades, deleteTrade, addTrade, getOpenBuyTrades } = useStore()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | TradeType>('all')
  const [search, setSearch] = useState('')
  const [exchange, setExchange] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list')
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)

  // Chart section state
  const [chartCoin, setChartCoin] = useState<string>('')

  // Inline form state
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Paired trade state (for SELL)
  const [selectedBuyTradeId, setSelectedBuyTradeId] = useState<string>('')

  const [formData, setFormData] = useState({
    trade_type: 'BUY' as TradeType,
    coin_symbol: '',
    quantity: '',
    price: '',
    fee: '0',
    exchange: '업비트',
    trade_at: new Date().toISOString().slice(0, 16),
    strategy: '',
    emotion: 3,
    memo: '',
  })

  // Compute open buy trades for the selected coin when in SELL mode
  const openBuyTrades = useMemo(() => {
    if (formData.trade_type !== 'SELL' || !formData.coin_symbol) return []
    return getOpenBuyTrades(formData.coin_symbol)
  }, [formData.trade_type, formData.coin_symbol, getOpenBuyTrades, trades])

  // Compute unique traded coins for chart selector, sorted by frequency
  const tradedCoins = useMemo(() => {
    const coinCounts = new Map<string, number>()
    trades.forEach((t) => {
      coinCounts.set(t.coin_symbol, (coinCounts.get(t.coin_symbol) || 0) + 1)
    })
    return Array.from(coinCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([coin]) => coin)
  }, [trades])

  // Set default chart coin when trades load
  useEffect(() => {
    if (tradedCoins.length > 0 && !chartCoin) {
      setChartCoin(tradedCoins[0])
    }
  }, [tradedCoins, chartCoin])

  // Get trades for the selected chart coin
  const chartTrades = useMemo(() => {
    if (!chartCoin) return []
    return trades.filter((t) => t.coin_symbol === chartCoin)
  }, [trades, chartCoin])

  useEffect(() => {
    const fetchTrades = async () => {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient()
          const { data: userData } = await supabase.auth.getUser()

          if (userData.user) {
            const { data, error } = await supabase
              .from('trades')
              .select('*')
              .eq('user_id', userData.user.id)
              .order('trade_at', { ascending: false })

            if (error) throw error
            setTrades(data as Trade[])
          }
        } catch (error) {
          console.error('Failed to fetch trades:', error)
        }
      }
      setLoading(false)
    }

    fetchTrades()
  }, [setTrades])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      toast({
        variant: 'destructive',
        title: '파일 오류',
        description: validationError,
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setScreenshotPreview(dataUrl)

      if (!isSupabaseConfigured()) {
        setScreenshotUrl(dataUrl)
      }
    }
    reader.readAsDataURL(file)

    if (isSupabaseConfigured()) {
      setUploading(true)
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          toast({
            variant: 'destructive',
            title: '오류',
            description: '로그인이 필요합니다.',
          })
          setScreenshotPreview(null)
          return
        }

        const result = await uploadScreenshot(file, userData.user.id)

        if (result.error) {
          toast({
            variant: 'destructive',
            title: '업로드 실패',
            description: result.error,
          })
          setScreenshotPreview(null)
        } else {
          setScreenshotUrl(result.url)
          toast({
            title: '업로드 완료',
            description: '스크린샷이 업로드되었습니다.',
          })
        }
      } catch {
        toast({
          variant: 'destructive',
          title: '업로드 실패',
          description: '스크린샷 업로드에 실패했습니다.',
        })
        setScreenshotPreview(null)
      } finally {
        setUploading(false)
      }
    }
  }

  const handleRemoveScreenshot = () => {
    setScreenshotUrl(null)
    setScreenshotPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const resetForm = () => {
    setFormData({
      trade_type: 'BUY',
      coin_symbol: '',
      quantity: '',
      price: '',
      fee: '0',
      exchange: '업비트',
      trade_at: new Date().toISOString().slice(0, 16),
      strategy: '',
      emotion: 3,
      memo: '',
    })
    setSelectedBuyTradeId('')
    setScreenshotUrl(null)
    setScreenshotPreview(null)
    setShowAdvanced(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // When user selects a buy trade to pair with
  const handleBuyTradeSelect = (buyTradeId: string) => {
    setSelectedBuyTradeId(buyTradeId)
    const buyTrade = openBuyTrades.find((t) => t.id === buyTradeId)
    if (buyTrade) {
      // Auto-fill quantity from the selected buy trade
      setFormData((prev) => ({
        ...prev,
        quantity: String(buyTrade.quantity),
      }))
    }
  }

  // Reset paired trade when switching trade type or coin
  useEffect(() => {
    setSelectedBuyTradeId('')
  }, [formData.trade_type, formData.coin_symbol])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.coin_symbol || !formData.quantity || !formData.price) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '필수 항목을 모두 입력해주세요.',
      })
      return
    }

    setSubmitting(true)

    try {
      const quantity = Number(formData.quantity)
      const price = Number(formData.price)
      const fee = Number(formData.fee) || 0
      const total_amount = quantity * price

      // Calculate PnL for SELL trades with a paired buy
      let paired_trade_id: string | null = null
      let realized_pnl: number | null = null
      let pnl_percentage: number | null = null

      if (formData.trade_type === 'SELL' && selectedBuyTradeId) {
        const buyTrade = openBuyTrades.find((t) => t.id === selectedBuyTradeId)
        if (buyTrade) {
          paired_trade_id = buyTrade.id
          realized_pnl = (price - buyTrade.price) * quantity
          pnl_percentage = ((price - buyTrade.price) / buyTrade.price) * 100
        }
      }

      const tradeData = {
        coin_symbol: formData.coin_symbol,
        trade_type: formData.trade_type,
        quantity,
        price,
        total_amount,
        fee,
        exchange: formData.exchange,
        trade_at: new Date(formData.trade_at).toISOString(),
        strategy: formData.strategy || null,
        emotion: formData.emotion,
        memo: formData.memo || null,
        screenshot_url: screenshotUrl,
        paired_trade_id,
        realized_pnl,
        pnl_percentage,
      }

      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          throw new Error('로그인이 필요합니다.')
        }

        const { data, error } = await supabase
          .from('trades')
          .insert({
            ...tradeData,
            user_id: userData.user.id,
          })
          .select()
          .single()

        if (error) throw error

        addTrade(data as Trade)
      } else {
        const demoTrade: Trade = {
          id: crypto.randomUUID(),
          user_id: 'demo-user',
          ...tradeData,
          created_at: new Date().toISOString(),
        }
        addTrade(demoTrade)
      }

      toast({
        title: '매매 기록 완료',
        description: `${formData.coin_symbol} ${formData.trade_type === 'BUY' ? '매수' : '매도'} 기록이 저장되었습니다.`,
      })

      resetForm()
    } catch (error) {
      console.error('Trade save error:', error)
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '매매 기록 저장에 실패했습니다.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { error } = await supabase.from('trades').delete().eq('id', id)
        if (error) throw error
      }
      deleteTrade(id)
      toast({ title: '삭제 완료', description: '매매 기록이 삭제되었습니다.' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: '매매 기록 삭제에 실패했습니다.',
      })
    }
  }

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

  const totalAmount = Number(formData.quantity) * Number(formData.price) || 0

  // Helper to format PnL display
  const formatPnl = (pnl: number, pnlPct: number) => {
    const sign = pnl >= 0 ? '+' : ''
    const pnlText = `${sign}${formatKRW(pnl)}`
    const pctText = `(${sign}${pnlPct.toFixed(1)}%)`
    return { pnlText, pctText, isProfit: pnl >= 0 }
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
      </div>

      {/* Inline Trade Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main Row - Always Visible */}
            <div className="flex flex-wrap items-end gap-2">
              {/* Trade Type Toggle */}
              <div className="w-full sm:w-auto">
                <Tabs
                  value={formData.trade_type}
                  onValueChange={(v) => setFormData({ ...formData, trade_type: v as TradeType })}
                >
                  <TabsList className="grid w-full grid-cols-2 sm:w-[180px]">
                    <TabsTrigger
                      value="BUY"
                      className="data-[state=active]:bg-success data-[state=active]:text-white"
                    >
                      매수
                    </TabsTrigger>
                    <TabsTrigger
                      value="SELL"
                      className="data-[state=active]:bg-danger data-[state=active]:text-white"
                    >
                      매도
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Coin Select */}
              <div className="flex-1 min-w-[120px]">
                <Select
                  value={formData.coin_symbol}
                  onValueChange={(v) => setFormData({ ...formData, coin_symbol: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="코인" />
                  </SelectTrigger>
                  <SelectContent>
                    {COINS.map((coin) => (
                      <SelectItem key={coin} value={coin}>
                        {coin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="flex-1 min-w-[100px]">
                <Input
                  type="number"
                  step="any"
                  placeholder="수량"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="font-number"
                />
              </div>

              {/* Price */}
              <div className="flex-1 min-w-[120px]">
                <Input
                  type="number"
                  step="any"
                  placeholder="단가"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="font-number"
                />
              </div>

              {/* Total Amount Display */}
              <div className="hidden lg:flex items-center px-3 py-2 rounded-md bg-muted min-w-[120px]">
                <span className="font-number text-sm font-medium">
                  {formatKRW(totalAmount)}
                </span>
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={submitting} className="min-w-[80px]">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '기록'}
              </Button>

              {/* Advanced Toggle */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {/* Total Amount - Mobile */}
            <div className="lg:hidden rounded-md bg-muted p-2">
              <span className="font-number text-sm font-medium">
                총 금액: {formatKRW(totalAmount)}
              </span>
            </div>

            {/* Open Buy Trade Selector - visible when SELL and coin selected */}
            {formData.trade_type === 'SELL' && formData.coin_symbol && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                  매수 거래 매칭 (선택사항)
                </Label>
                {openBuyTrades.length > 0 ? (
                  <Select
                    value={selectedBuyTradeId}
                    onValueChange={handleBuyTradeSelect}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="매칭할 매수 거래를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {openBuyTrades.map((buy) => (
                        <SelectItem key={buy.id} value={buy.id}>
                          <span className="font-number">
                            {buy.coin_symbol} 매수 | {formatDateTime(buy.trade_at)} | {formatQuantity(buy.quantity)}개 @ {formatKRW(buy.price)} | {formatKRW(buy.total_amount)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {formData.coin_symbol}에 대한 미매칭 매수 기록이 없습니다.
                  </p>
                )}
                {/* PnL preview when buy trade selected and price entered */}
                {selectedBuyTradeId && formData.price && (
                  (() => {
                    const buyTrade = openBuyTrades.find((t) => t.id === selectedBuyTradeId)
                    if (!buyTrade) return null
                    const sellPrice = Number(formData.price)
                    const qty = Number(formData.quantity) || buyTrade.quantity
                    const pnl = (sellPrice - buyTrade.price) * qty
                    const pnlPct = ((sellPrice - buyTrade.price) / buyTrade.price) * 100
                    const { pnlText, pctText, isProfit } = formatPnl(pnl, pnlPct)
                    return (
                      <div className={cn(
                        'mt-2 rounded-md px-3 py-2 text-sm font-medium font-number',
                        isProfit ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      )}>
                        예상 손익: {pnlText} {pctText}
                      </div>
                    )
                  })()
                )}
              </div>
            )}

            {/* Advanced Section - Collapsible */}
            {showAdvanced && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  상세 옵션
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Exchange */}
                  <div className="space-y-2">
                    <Label htmlFor="exchange" className="text-xs">거래소</Label>
                    <Select
                      value={formData.exchange}
                      onValueChange={(v) => setFormData({ ...formData, exchange: v })}
                    >
                      <SelectTrigger id="exchange">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXCHANGES.map((ex) => (
                          <SelectItem key={ex} value={ex}>
                            {ex}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fee */}
                  <div className="space-y-2">
                    <Label htmlFor="fee" className="text-xs">수수료</Label>
                    <Input
                      id="fee"
                      type="number"
                      step="any"
                      placeholder="0"
                      value={formData.fee}
                      onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                      className="font-number"
                    />
                  </div>

                  {/* Trade Date */}
                  <div className="space-y-2">
                    <Label htmlFor="trade_at" className="text-xs">거래 일시</Label>
                    <Input
                      id="trade_at"
                      type="datetime-local"
                      value={formData.trade_at}
                      onChange={(e) => setFormData({ ...formData, trade_at: e.target.value })}
                    />
                  </div>

                  {/* Strategy */}
                  <div className="space-y-2">
                    <Label htmlFor="strategy" className="text-xs">전략</Label>
                    <Select
                      value={formData.strategy}
                      onValueChange={(v) => setFormData({ ...formData, strategy: v })}
                    >
                      <SelectTrigger id="strategy">
                        <SelectValue placeholder="전략 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {STRATEGIES.map((strategy) => (
                          <SelectItem key={strategy} value={strategy}>
                            {strategy}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Emotion */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs">감정 상태</Label>
                    <div className="flex gap-2">
                      {EMOTIONS.map((emotion) => (
                        <button
                          key={emotion.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, emotion: emotion.value })}
                          className={cn(
                            'flex flex-1 flex-col items-center gap-1 rounded-lg border p-2 transition-colors',
                            formData.emotion === emotion.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <span className="text-xl">{emotion.emoji}</span>
                          <span className="text-[10px] text-muted-foreground">{emotion.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Memo */}
                <div className="space-y-2">
                  <Label htmlFor="memo" className="text-xs">메모</Label>
                  <textarea
                    id="memo"
                    placeholder="매매에 대한 메모를 남겨주세요..."
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-2">
                  <Label className="text-xs">스크린샷</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {screenshotPreview ? (
                    <div className="relative">
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={screenshotPreview}
                          alt="스크린샷 미리보기"
                          className="h-full w-full object-contain"
                        />
                        {uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2"
                        onClick={handleRemoveScreenshot}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted/50"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                        <p className="mt-1 text-xs text-muted-foreground">
                          차트 스크린샷 업로드
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

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

      {/* Chart Section */}
      {tradedCoins.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                매매 차트
              </CardTitle>
              <Select value={chartCoin} onValueChange={setChartCoin}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="코인 선택" />
                </SelectTrigger>
                <SelectContent>
                  {tradedCoins.map((coin) => (
                    <SelectItem key={coin} value={coin}>
                      {coin} ({getCoinName(coin)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {chartCoin && (
              <TradePairChart
                coinSymbol={chartCoin}
                trades={chartTrades}
                height={400}
              />
            )}
          </CardContent>
        </Card>
      )}

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
              <div className="flex rounded-lg border border-border">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'gallery' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('gallery')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trades List / Gallery */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">불러오는 중...</p>
          </CardContent>
        </Card>
      ) : filteredTrades.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">매매 기록이 없습니다</p>
            <Link href="/trades/new">
              <Button variant="outline" className="mt-4">
                첫 매매 기록하기
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/50"
                  onClick={() => setSelectedTrade(trade)}
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
                        {trade.paired_trade_id && (
                          <span title="매수 거래 매칭됨">
                            <LinkIcon className="h-3.5 w-3.5 text-primary" />
                          </span>
                        )}
                        {trade.emotion && (
                          <span title={`감정: ${trade.emotion}/5`}>
                            {getEmotionEmoji(trade.emotion)}
                          </span>
                        )}
                        {trade.screenshot_url && (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
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
                      {/* P&L display for SELL trades */}
                      {trade.trade_type === 'SELL' && trade.realized_pnl != null && trade.pnl_percentage != null && (
                        (() => {
                          const { pnlText, pctText, isProfit } = formatPnl(trade.realized_pnl!, trade.pnl_percentage!)
                          return (
                            <p className={cn(
                              'font-number text-sm font-medium',
                              isProfit ? 'text-success' : 'text-danger'
                            )}>
                              {pnlText} {pctText}
                            </p>
                          )
                        })()
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(trade.id)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Gallery View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrades.map((trade) => (
            <Card
              key={trade.id}
              className="cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary/50"
              onClick={() => setSelectedTrade(trade)}
            >
              {/* Screenshot or Placeholder */}
              <div className="relative aspect-video bg-muted">
                {trade.screenshot_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={trade.screenshot_url}
                    alt={`${trade.coin_symbol} 차트`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="mx-auto h-10 w-10 opacity-50" />
                      <p className="mt-2 text-xs">스크린샷 없음</p>
                    </div>
                  </div>
                )}
                {/* Trade Type Badge */}
                <div
                  className={cn(
                    'absolute left-2 top-2 rounded px-2 py-1 text-xs font-bold text-white',
                    trade.trade_type === 'BUY' ? 'bg-success' : 'bg-danger'
                  )}
                >
                  {trade.trade_type === 'BUY' ? '매수' : '매도'}
                </div>
                {/* Paired indicator */}
                {trade.paired_trade_id && (
                  <div className="absolute right-2 top-2 rounded bg-primary/80 px-1.5 py-0.5">
                    <LinkIcon className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{trade.coin_symbol}</span>
                      {trade.emotion && (
                        <span>{getEmotionEmoji(trade.emotion)}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(trade.trade_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-number font-bold">
                      {formatKRW(trade.total_amount)}
                    </p>
                    <p className="font-number text-xs text-muted-foreground">
                      @ {formatKRW(trade.price)}
                    </p>
                  </div>
                </div>
                {/* P&L for SELL in gallery */}
                {trade.trade_type === 'SELL' && trade.realized_pnl != null && trade.pnl_percentage != null && (
                  (() => {
                    const { pnlText, pctText, isProfit } = formatPnl(trade.realized_pnl!, trade.pnl_percentage!)
                    return (
                      <div className={cn(
                        'mt-2 rounded-md px-2 py-1 text-sm font-number font-medium',
                        isProfit ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      )}>
                        {pnlText} {pctText}
                      </div>
                    )
                  })()
                )}
                {trade.strategy && (
                  <p className="mt-2 text-sm text-primary">{trade.strategy}</p>
                )}
                {trade.memo && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {trade.memo}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Trade Detail Modal */}
      <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedTrade && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      selectedTrade.trade_type === 'BUY'
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                    )}
                  >
                    {selectedTrade.trade_type === 'BUY' ? (
                      <ArrowDownRight className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{selectedTrade.coin_symbol}</span>
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-sm font-medium',
                          selectedTrade.trade_type === 'BUY'
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        )}
                      >
                        {selectedTrade.trade_type === 'BUY' ? '매수' : '매도'}
                      </span>
                      {selectedTrade.paired_trade_id && (
                        <span title="매수 거래 매칭됨">
                          <LinkIcon className="h-4 w-4 text-primary" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-normal text-muted-foreground">
                      {getCoinName(selectedTrade.coin_symbol)}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* P&L display for SELL trades */}
                {selectedTrade.trade_type === 'SELL' && selectedTrade.realized_pnl != null && selectedTrade.pnl_percentage != null && (
                  (() => {
                    const { pnlText, pctText, isProfit } = formatPnl(selectedTrade.realized_pnl!, selectedTrade.pnl_percentage!)
                    return (
                      <div className={cn(
                        'rounded-lg p-4 text-center',
                        isProfit ? 'bg-success/10' : 'bg-danger/10'
                      )}>
                        <p className="text-sm text-muted-foreground mb-1">실현 손익</p>
                        <p className={cn(
                          'font-number text-2xl font-bold',
                          isProfit ? 'text-success' : 'text-danger'
                        )}>
                          {pnlText}
                        </p>
                        <p className={cn(
                          'font-number text-sm font-medium',
                          isProfit ? 'text-success' : 'text-danger'
                        )}>
                          {pctText}
                        </p>
                      </div>
                    )
                  })()
                )}

                {/* Screenshot */}
                {selectedTrade.screenshot_url && (
                  <div className="overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedTrade.screenshot_url}
                      alt={`${selectedTrade.coin_symbol} 차트`}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Trade Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm text-muted-foreground">거래금액</p>
                    <p className="font-number text-lg font-bold">
                      {formatKRW(selectedTrade.total_amount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm text-muted-foreground">단가</p>
                    <p className="font-number text-lg font-bold">
                      {formatKRW(selectedTrade.price)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm text-muted-foreground">수량</p>
                    <p className="font-number text-lg font-bold">
                      {formatQuantity(selectedTrade.quantity)} {selectedTrade.coin_symbol}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm text-muted-foreground">수수료</p>
                    <p className="font-number text-lg font-bold">
                      {formatKRW(selectedTrade.fee)}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">거래소</span>
                    <span className="font-medium">{selectedTrade.exchange}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">거래 일시</span>
                    <span className="font-medium">
                      {formatDateTime(selectedTrade.trade_at)}
                    </span>
                  </div>
                  {selectedTrade.strategy && (
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">전략</span>
                      <span className="font-medium text-primary">
                        {selectedTrade.strategy}
                      </span>
                    </div>
                  )}
                  {selectedTrade.emotion && (
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">감정 상태</span>
                      <span className="text-xl">
                        {getEmotionEmoji(selectedTrade.emotion)}
                      </span>
                    </div>
                  )}
                  {/* Show paired buy trade info */}
                  {selectedTrade.paired_trade_id && (
                    (() => {
                      const pairedBuy = trades.find((t) => t.id === selectedTrade.paired_trade_id)
                      return pairedBuy ? (
                        <div className="flex justify-between border-b border-border pb-2">
                          <span className="text-muted-foreground">매칭 매수</span>
                          <span className="font-number text-sm font-medium">
                            {formatDateTime(pairedBuy.trade_at)} @ {formatKRW(pairedBuy.price)}
                          </span>
                        </div>
                      ) : null
                    })()
                  )}
                </div>

                {/* Memo */}
                {selectedTrade.memo && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      메모
                    </p>
                    <p className="whitespace-pre-wrap">{selectedTrade.memo}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/trades/${selectedTrade.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      수정하기
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDelete(selectedTrade.id)
                      setSelectedTrade(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
