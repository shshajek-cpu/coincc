// User types
export interface User {
  id: string
  email: string
  nickname: string | null
  avatar_url: string | null
  created_at: string
  settings: UserSettings | null
}

export interface UserSettings {
  notifications: {
    dailyLoss: boolean
    monthlyLoss: boolean
    targetProfit: boolean
  }
  theme: 'dark' | 'light'
  currency: 'KRW' | 'USD'
}

// Trade types
export type TradeType = 'BUY' | 'SELL'

export interface Trade {
  id: string
  user_id: string
  coin_symbol: string
  trade_type: TradeType
  quantity: number
  price: number
  total_amount: number
  fee: number
  exchange: string
  trade_at: string
  memo: string | null
  emotion: number | null // 1-5
  strategy: string | null
  screenshot_url: string | null
  created_at: string
}

export interface TradeFormData {
  coin_symbol: string
  trade_type: TradeType
  quantity: number
  price: number
  fee?: number
  exchange: string
  trade_at: string
  memo?: string
  emotion?: number
  strategy?: string
}

// Holding types
export interface Holding {
  id: string
  user_id: string
  coin_symbol: string
  avg_price: number
  quantity: number
  total_invested: number
  updated_at: string
  // Computed fields (from API)
  current_price?: number
  current_value?: number
  unrealized_pnl?: number
  unrealized_pnl_percent?: number
}

// Daily stats types
export interface DailyStats {
  id: string
  user_id: string
  date: string
  total_asset: number
  realized_pnl: number
  unrealized_pnl: number
  trade_count: number
  win_count: number
  loss_count: number
}

// Trade rule types
export interface TradeRule {
  id: string
  user_id: string
  rule_text: string
  is_active: boolean
  order_num: number
}

// Alert types
export type AlertType = 'DAILY_LOSS' | 'MONTHLY_LOSS' | 'TARGET_PROFIT'

export interface Alert {
  id: string
  user_id: string
  alert_type: AlertType
  threshold: number
  is_active: boolean
}

// Upbit API types
export interface UpbitTicker {
  market: string
  trade_price: number
  signed_change_rate: number
  signed_change_price: number
  acc_trade_price_24h: number
  acc_trade_volume_24h: number
  high_price: number
  low_price: number
  prev_closing_price: number
  timestamp: number
}

export interface UpbitCandle {
  market: string
  candle_date_time_utc: string
  candle_date_time_kst: string
  opening_price: number
  high_price: number
  low_price: number
  trade_price: number
  timestamp: number
  candle_acc_trade_price: number
  candle_acc_trade_volume: number
}

// Dashboard types
export interface DashboardSummary {
  totalAsset: number
  totalInvested: number
  totalRealizedPnl: number
  totalUnrealizedPnl: number
  totalPnlPercent: number
  todayPnl: number
  todayPnlPercent: number
  winRate: number
  totalTrades: number
  winTrades: number
  lossTrades: number
}

// Chart data types
export interface ChartDataPoint {
  date: string
  value: number
  pnl?: number
}

export interface PieChartData {
  name: string
  value: number
  color: string
}

// Common types
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}
