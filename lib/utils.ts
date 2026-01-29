import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format number with Korean currency
export function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value)
}

// Format number with commas
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value)
}

// Format percentage
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

// Format crypto quantity
export function formatQuantity(value: number): string {
  if (value >= 1) {
    return formatNumber(value, 4)
  }
  return value.toPrecision(6)
}

// Format date to Korean format
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

// Format datetime to Korean format
export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Format relative time (e.g., "3시간 전")
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return formatDate(d)
}

// Calculate PnL
export function calculatePnl(
  currentPrice: number,
  avgPrice: number,
  quantity: number
): { pnl: number; pnlPercent: number } {
  const pnl = (currentPrice - avgPrice) * quantity
  const pnlPercent = ((currentPrice - avgPrice) / avgPrice) * 100
  return { pnl, pnlPercent }
}

// Get coin name from symbol
export function getCoinName(symbol: string): string {
  const coinNames: Record<string, string> = {
    BTC: '비트코인',
    ETH: '이더리움',
    XRP: '리플',
    SOL: '솔라나',
    ADA: '에이다',
    DOGE: '도지코인',
    DOT: '폴카닷',
    MATIC: '폴리곤',
    AVAX: '아발란체',
    LINK: '체인링크',
    ATOM: '코스모스',
    UNI: '유니스왑',
    ETC: '이더리움클래식',
    BCH: '비트코인캐시',
    LTC: '라이트코인',
    NEAR: '니어프로토콜',
    APT: '앱토스',
    ARB: '아비트럼',
    OP: '옵티미즘',
  }
  return coinNames[symbol] || symbol
}

// Get emotion emoji
export function getEmotionEmoji(emotion: number): string {
  const emojis: Record<number, string> = {
    1: '😫',
    2: '😟',
    3: '😐',
    4: '😊',
    5: '🤩',
  }
  return emojis[emotion] || '😐'
}

// Get emotion label
export function getEmotionLabel(emotion: number): string {
  const labels: Record<number, string> = {
    1: '매우 나쁨',
    2: '나쁨',
    3: '보통',
    4: '좋음',
    5: '매우 좋음',
  }
  return labels[emotion] || '보통'
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Sleep function
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
