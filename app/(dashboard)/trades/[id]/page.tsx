'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trash2, Upload, X, Loader2 } from 'lucide-react'
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
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { uploadScreenshot, deleteScreenshot, validateFile } from '@/lib/supabase/storage'
import { useStore } from '@/stores/useStore'
import type { Trade, TradeType } from '@/types'

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

export default function EditTradePage() {
  const router = useRouter()
  const params = useParams()
  const tradeId = params.id as string
  const { toast } = useToast()
  const { trades, updateTrade, deleteTrade } = useStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [originalScreenshotUrl, setOriginalScreenshotUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      // In demo mode, use data URL directly as screenshot URL
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

  const handleRemoveScreenshot = async () => {
    // Delete old screenshot if it exists and is from storage (not a data URL)
    if (screenshotUrl && !screenshotUrl.startsWith('data:')) {
      try {
        await deleteScreenshot(screenshotUrl)
      } catch (error) {
        console.error('Failed to delete screenshot:', error)
      }
    }
    setScreenshotUrl(null)
    setScreenshotPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    const loadTrade = async () => {
      // 스토어에서 먼저 찾기
      let trade = trades.find((t) => t.id === tradeId)

      // 스토어에 없으면 Supabase에서 조회
      if (!trade && isSupabaseConfigured()) {
        try {
          const supabase = createClient()
          const { data } = await supabase
            .from('trades')
            .select('*')
            .eq('id', tradeId)
            .single()

          if (data) {
            trade = data as Trade
          }
        } catch (error) {
          console.error('Failed to fetch trade:', error)
        }
      }

      if (trade) {
        setFormData({
          trade_type: trade.trade_type,
          coin_symbol: trade.coin_symbol,
          quantity: trade.quantity.toString(),
          price: trade.price.toString(),
          fee: trade.fee.toString(),
          exchange: trade.exchange,
          trade_at: new Date(trade.trade_at).toISOString().slice(0, 16),
          strategy: trade.strategy || '',
          emotion: trade.emotion || 3,
          memo: trade.memo || '',
        })
        if (trade.screenshot_url) {
          setScreenshotUrl(trade.screenshot_url)
          setScreenshotPreview(trade.screenshot_url)
          setOriginalScreenshotUrl(trade.screenshot_url)
        }
      } else {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '거래 기록을 찾을 수 없습니다.',
        })
        router.push('/trades')
      }

      setLoading(false)
    }

    loadTrade()
  }, [tradeId, trades, router, toast])

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

    setSaving(true)

    try {
      const quantity = Number(formData.quantity)
      const price = Number(formData.price)
      const fee = Number(formData.fee) || 0
      const total_amount = quantity * price

      // Delete old screenshot if changed and it's not a data URL
      if (originalScreenshotUrl && originalScreenshotUrl !== screenshotUrl && !originalScreenshotUrl.startsWith('data:')) {
        try {
          await deleteScreenshot(originalScreenshotUrl)
        } catch (error) {
          console.error('Failed to delete old screenshot:', error)
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
      }

      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { error } = await supabase
          .from('trades')
          .update(tradeData)
          .eq('id', tradeId)

        if (error) throw error
      }

      updateTrade(tradeId, tradeData)

      toast({
        title: '수정 완료',
        description: '매매 기록이 수정되었습니다.',
      })
      router.push('/trades')
    } catch (error) {
      console.error('Trade update error:', error)
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '매매 기록 수정에 실패했습니다.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { error } = await supabase.from('trades').delete().eq('id', tradeId)
        if (error) throw error
      }
      deleteTrade(tradeId)
      toast({ title: '삭제 완료', description: '매매 기록이 삭제되었습니다.' })
      router.push('/trades')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: '매매 기록 삭제에 실패했습니다.',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">매매 기록 수정</h1>
            <p className="text-muted-foreground">기록을 수정하거나 삭제할 수 있습니다</p>
          </div>
        </div>
        <Button variant="destructive" size="icon" onClick={handleDelete}>
          <Trash2 className="h-5 w-5" />
        </Button>
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
                className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    차트 스크린샷을 업로드하세요
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG, WebP, GIF (최대 5MB)
                  </p>
                </div>
              </button>
            )}
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
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? '저장 중...' : '수정 저장'}
          </Button>
        </div>
      </form>
    </div>
  )
}
