# CoinCC - 코인 매매일지 플랫폼

## 프로젝트 개요

암호화폐 트레이더를 위한 매매일지 및 포트폴리오 관리 플랫폼. 업비트 API와 연동하여 실시간 시세를 제공하고, 매매 기록을 체계적으로 관리할 수 있다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| State | Zustand (persist middleware) |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| Charts | Recharts |
| API | Upbit Public API + WebSocket |
| Export | jspdf, xlsx |

## 디렉토리 구조

```
app/
├── (auth)/              # 인증 관련 페이지
│   ├── login/
│   └── signup/
├── (dashboard)/         # 인증 필요 페이지 (layout에서 보호)
│   ├── dashboard/       # 대시보드 메인
│   ├── trades/          # 매매 기록
│   │   ├── [id]/        # 거래 상세/수정
│   │   └── new/         # 새 거래 등록
│   ├── portfolio/       # 포트폴리오
│   ├── analysis/        # 분석
│   ├── reports/         # 리포트
│   └── settings/        # 설정
├── auth/callback/       # OAuth 콜백 (route.ts)
└── page.tsx             # 랜딩 페이지

components/
├── ui/                  # shadcn/ui 컴포넌트
├── layout/              # Sidebar, Header, MobileNav
└── dashboard/           # 대시보드 전용 컴포넌트

lib/
├── supabase/            # Supabase 클라이언트 설정
├── upbit/api.ts         # 업비트 API 래퍼
└── utils.ts             # cn() 유틸리티

stores/
└── useStore.ts          # Zustand 전역 스토어

types/
└── index.ts             # 모든 타입 정의
```

## 핵심 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
```

## 데이터베이스 스키마

### 주요 테이블

| 테이블 | 설명 |
|--------|------|
| `users` | 사용자 프로필 (auth.users 확장) |
| `trades` | 매매 기록 (BUY/SELL) |
| `holdings` | 현재 보유 자산 (자동 계산) |
| `daily_stats` | 일별 통계 |
| `trade_rules` | 사용자 매매 원칙 |
| `alerts` | 알림 설정 |

### 자동 트리거

- `on_auth_user_created`: 회원가입 시 users 테이블에 프로필 자동 생성
- `on_trade_created`: 거래 등록 시 holdings 자동 업데이트 (평단가 재계산)
- `update_*_updated_at`: updated_at 자동 갱신

### RLS (Row Level Security)

모든 테이블에 RLS 활성화됨. 사용자는 자신의 데이터만 접근 가능.

```sql
-- 기본 패턴
auth.uid() = user_id
```

## 타입 시스템

모든 타입은 `types/index.ts`에 정의됨.

### 핵심 타입

```typescript
// 거래 타입
type TradeType = 'BUY' | 'SELL'

// 거래 기록
interface Trade {
  id: string
  user_id: string
  coin_symbol: string      // ex: 'BTC'
  trade_type: TradeType
  quantity: number
  price: number
  total_amount: number
  fee: number
  exchange: string         // 기본값: '업비트'
  trade_at: string
  memo: string | null
  emotion: number | null   // 1-5
  strategy: string | null
  screenshot_url: string | null
}

// 보유 자산
interface Holding {
  coin_symbol: string
  avg_price: number        // 평균 매수가
  quantity: number
  total_invested: number
  // API에서 계산되는 필드
  current_price?: number
  unrealized_pnl?: number
}
```

## 상태 관리 패턴

Zustand 스토어 (`stores/useStore.ts`):

```typescript
// 데이터 조회
const trades = useStore((state) => state.trades)
const holdings = useStore((state) => state.holdings)

// 데이터 변경
const { setTrades, addTrade, updateTrade, deleteTrade } = useStore()

// UI 상태
const { sidebarCollapsed, toggleSidebar } = useStore()

// 필터
const { tradeFilter, setTradeFilter, resetTradeFilter } = useStore()
```

LocalStorage 영속화: `sidebarCollapsed`, `tradeFilter`만 저장

## 업비트 API

### REST API (`lib/upbit/api.ts`)

```typescript
// 시세 조회 (인증 불필요)
getTickers(['BTC', 'ETH'])     // 복수 종목
getTicker('BTC')               // 단일 종목
getDailyCandles('BTC', 30)     // 일봉
getMinuteCandles('BTC', 60)    // 분봉
getMarkets()                   // 전체 마켓 목록
```

### WebSocket 실시간 시세

```typescript
const ws = createUpbitWebSocket(
  ['BTC', 'ETH'],
  (ticker) => console.log(ticker),
  (error) => console.error(error)
)
```

### 심볼 규칙

- 내부: `BTC`, `ETH` (심볼만)
- API 호출: `KRW-BTC`, `KRW-ETH` (마켓 포함)

## UI 컴포넌트 규칙

### shadcn/ui 사용

모든 기본 컴포넌트는 `components/ui/`에 위치:
- Button, Card, Input, Label, Select, Tabs, Dialog, Toast 등

### 스타일링

```typescript
import { cn } from '@/lib/utils'

// 조건부 클래스 병합
<div className={cn('base-class', condition && 'conditional-class')} />
```

### 다크 모드

기본 테마: dark. CSS 변수 기반 (`tailwind.config.ts` 참조)

## 인증 흐름

1. Supabase Auth 사용 (이메일/소셜 로그인)
2. `middleware.ts`에서 세션 갱신
3. `(dashboard)` 그룹은 인증 필요
4. `/auth/callback`에서 OAuth 리다이렉트 처리

## 환경 변수

```env
# 필수
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 선택 (실시간 시세용)
UPBIT_ACCESS_KEY=
UPBIT_SECRET_KEY=
```

## 코딩 컨벤션

### 파일 명명

- 컴포넌트: PascalCase (`StatCard.tsx`)
- 훅: camelCase with use prefix (`useUpbit.ts`)
- 유틸: camelCase (`utils.ts`)
- 페이지: `page.tsx` (Next.js 규칙)

### 컴포넌트 구조

```typescript
'use client'  // 클라이언트 컴포넌트인 경우

import { ... } from 'react'
import { ... } from '@/components/ui'
import { ... } from '@/lib/...'
import type { ... } from '@/types'

interface Props { ... }

export function ComponentName({ ... }: Props) {
  // hooks
  // handlers
  // render
}
```

### 경로 별칭

```typescript
import { Button } from '@/components/ui/button'
import { useStore } from '@/stores/useStore'
import type { Trade } from '@/types'
```

## 주의사항

1. **RLS 정책**: Supabase 쿼리 시 자동 적용됨. 별도 필터 불필요
2. **Holdings 자동 업데이트**: Trade INSERT 시 트리거가 holdings 계산
3. **KRW 마켓만 지원**: 업비트 API 호출 시 `KRW-` 접두사 자동 추가
4. **WebSocket 정리**: 컴포넌트 언마운트 시 `ws.close()` 필수
5. **숫자 정밀도**: quantity는 8자리, price/amount는 2자리 소수점

## 향후 계획

- [ ] 거래 상세 페이지 (`trades/[id]`)
- [ ] PDF/Excel 리포트 내보내기
- [ ] 실시간 알림 시스템
- [ ] 다중 거래소 지원
