'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X } from 'lucide-react'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatKRW, getCoinName } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { TradeType } from '@/types'

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

export default function NewTradePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    trade_type: 'BUY' as TradeType,
    coin_symbol: '',
    quantity: '',
    price: '',
    fee: '',
    exchange: '업비트',
    trade_at: new Date().toISOString().slice(0, 16),
    strategy: '',
    emotion: 3,
    memo: '',
  })

  const totalAmount = Number(formData.quantity) * Number(formData.price) || 0
  const totalWithFee = totalAmount + (Number(formData.fee) || 0)

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

    setLoading(true)

    try {
      // TODO: Save to Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: '매매 기록 완료',
        description: `${formData.coin_symbol} ${formData.trade_type === 'BUY' ? '매수' : '매도'} 기록이 저장되었습니다.`,
      })
      router.push('/trades')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '매매 기록 저장에 실패했습니다.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">새 매매 기록</h1>
          <p className="text-muted-foreground">매수 또는 매도 기록을 입력하세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trade Type */}
        <Card>
          <CardHeader>
            <CardTitle>거래 유형</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={formData.trade_type}
              onValueChange={(v) => setFormData({ ...formData, trade_type: v as TradeType })}
            >
              <TabsList className="grid w-full grid-cols-2">
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
          </CardContent>
        </Card>

        {/* Trade Details */}
        <Card>
          <CardHeader>
            <CardTitle>거래 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coin">코인 *</Label>
                <Select
                  value={formData.coin_symbol}
                  onValueChange={(v) => setFormData({ ...formData, coin_symbol: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="코인 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {COINS.map((coin) => (
                      <SelectItem key={coin} value={coin}>
                        {coin} - {getCoinName(coin)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exchange">거래소 *</Label>
                <Select
                  value={formData.exchange}
                  onValueChange={(v) => setFormData({ ...formData, exchange: v })}
                >
                  <SelectTrigger>
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">수량 *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="font-number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">단가 (KRW) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="any"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="font-number"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fee">수수료 (KRW)</Label>
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

              <div className="space-y-2">
                <Label htmlFor="trade_at">거래 일시 *</Label>
                <Input
                  id="trade_at"
                  type="datetime-local"
                  value={formData.trade_at}
                  onChange={(e) => setFormData({ ...formData, trade_at: e.target.value })}
                />
              </div>
            </div>

            {/* Total Amount */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">거래 금액</span>
                <span className="font-number font-medium">{formatKRW(totalAmount)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2">
                <span className="font-medium">총 금액 (수수료 포함)</span>
                <span
                  className={cn(
                    'font-number text-lg font-bold',
                    formData.trade_type === 'BUY' ? 'text-success' : 'text-danger'
                  )}
                >
                  {formatKRW(totalWithFee)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy & Emotion */}
        <Card>
          <CardHeader>
            <CardTitle>전략 & 감정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strategy">전략</Label>
              <Select
                value={formData.strategy}
                onValueChange={(v) => setFormData({ ...formData, strategy: v })}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>감정 상태</Label>
              <div className="flex justify-between gap-2">
                {EMOTIONS.map((emotion) => (
                  <button
                    key={emotion.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, emotion: emotion.value })}
                    className={cn(
                      'flex flex-1 flex-col items-center gap-1 rounded-lg border p-3 transition-colors',
                      formData.emotion === emotion.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-2xl">{emotion.emoji}</span>
                    <span className="text-xs text-muted-foreground">{emotion.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">메모</Label>
              <textarea
                id="memo"
                placeholder="매매에 대한 메모를 남겨주세요..."
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Screenshot Upload */}
        <Card>
          <CardHeader>
            <CardTitle>스크린샷</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-8">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  차트 스크린샷을 업로드하세요
                </p>
                <Button variant="outline" className="mt-4" type="button">
                  파일 선택
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? '저장 중...' : '기록 저장'}
          </Button>
        </div>
      </form>
    </div>
  )
}
