<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# types

## Purpose

프로젝트 전역 TypeScript 타입 정의. 모든 인터페이스와 타입을 중앙 집중 관리한다.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | 모든 타입 정의 - User, Trade, Holding, Upbit 등 |

## For AI Agents

### Working In This Directory

- 새 타입은 `index.ts`에 추가
- DB 스키마와 타입 동기화 유지
- 계산 필드는 `?` optional로 표시

### Testing Requirements

- 타입 정합성: `npm run build`로 타입 체크
- DB 스키마와 일치 여부 확인

### 핵심 타입

```typescript
// 거래 타입
type TradeType = 'BUY' | 'SELL'

// 거래 기록
interface Trade {
  id: string
  user_id: string
  coin_symbol: string      // 'BTC', 'ETH' 등
  trade_type: TradeType
  quantity: number         // 소수점 8자리
  price: number            // 소수점 2자리
  total_amount: number
  fee: number
  exchange: string
  trade_at: string         // ISO datetime
  memo: string | null
  emotion: number | null   // 1-5 (감정 기록)
  strategy: string | null
}

// 보유 자산
interface Holding {
  coin_symbol: string
  avg_price: number        // 평균 매수가
  quantity: number
  total_invested: number
  // API 계산 필드
  current_price?: number
  unrealized_pnl?: number
}

// 업비트 시세
interface UpbitTicker {
  market: string           // 'KRW-BTC'
  trade_price: number
  signed_change_rate: number
}
```

### 타입 vs DB 스키마

| TypeScript | PostgreSQL | 비고 |
|------------|------------|------|
| `string` | `UUID`, `TEXT` | |
| `number` | `DECIMAL`, `INTEGER` | |
| `TradeType` | `trade_type ENUM` | 'BUY' \| 'SELL' |
| `string` (ISO) | `TIMESTAMP WITH TIME ZONE` | |

<!-- MANUAL: -->
