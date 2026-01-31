<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# upbit

## Purpose

업비트 거래소 Public API 래퍼. 실시간 시세 조회, 캔들 데이터, 마켓 목록 등을 제공한다.

## Key Files

| File | Description |
|------|-------------|
| `api.ts` | 업비트 API 함수 - REST API + WebSocket |

## For AI Agents

### Working In This Directory

- Public API만 사용 (인증 불필요)
- 모든 심볼은 내부적으로 `KRW-` 접두사 추가
- WebSocket 사용 시 클린업 필수

### Testing Requirements

- API 응답 형식 확인
- WebSocket 연결/해제 확인
- 에러 핸들링 확인

### API 함수

```typescript
// 시세 조회
getTickers(['BTC', 'ETH'])        // 복수 종목
getTicker('BTC')                  // 단일 종목

// 캔들 데이터
getDailyCandles('BTC', 30)        // 일봉 30개
getMinuteCandles('BTC', 60, 100)  // 60분봉 100개

// 마켓 목록
getMarkets()                      // KRW 마켓 전체

// 가격 포맷팅
formatUpbitPrice(52000000)        // "52,000,000"
formatUpbitPrice(0.0001)          // "0.0001"

// 심볼 변환
getSymbolFromMarket('KRW-BTC')    // "BTC"
```

### WebSocket 실시간 시세

```typescript
const ws = createUpbitWebSocket(
  ['BTC', 'ETH'],          // 구독할 심볼
  (ticker) => {            // 메시지 핸들러
    console.log(ticker.trade_price)
  },
  (error) => {             // 에러 핸들러
    console.error(error)
  }
)

// 컴포넌트 언마운트 시
ws.close()
```

### 데이터 형식

```typescript
interface UpbitTicker {
  market: string              // 'KRW-BTC'
  trade_price: number         // 현재가
  signed_change_rate: number  // 전일 대비 등락률 (-0.05 = -5%)
  signed_change_price: number // 전일 대비 등락가
  acc_trade_price_24h: number // 24시간 거래대금
  acc_trade_volume_24h: number // 24시간 거래량
  high_price: number          // 고가
  low_price: number           // 저가
  prev_closing_price: number  // 전일 종가
  timestamp: number           // 타임스탬프
}
```

### 주의사항

- API 호출 제한: 초당 10회 (Public API)
- WebSocket은 브라우저 환경에서만 동작
- KRW 마켓만 지원 (BTC, USDT 마켓 제외)

<!-- MANUAL: -->
