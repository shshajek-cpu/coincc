<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# dashboard

## Purpose

대시보드 페이지 전용 컴포넌트. 통계 카드, 차트, 최근 거래 목록, 보유 자산 현황 등을 표시한다.

## Key Files

| File | Description |
|------|-------------|
| `StatCard.tsx` | 통계 카드 - 총 자산, 수익률, 승률 등 표시 |
| `PnLChart.tsx` | 손익 차트 (Recharts 기반) |
| `RecentTrades.tsx` | 최근 거래 목록 |
| `HoldingsOverview.tsx` | 보유 자산 현황 |
| `PerformanceStats.tsx` | 성과 통계 |

## For AI Agents

### Working In This Directory

- 차트는 Recharts 라이브러리 사용
- 데이터는 props로 전달받거나 Zustand 스토어에서 조회
- 숫자 포맷팅: `toLocaleString('ko-KR')`

### Testing Requirements

- 데이터 로딩 상태 표시
- 빈 데이터 처리
- 차트 렌더링 확인

### Common Patterns

```typescript
// StatCard 사용
<StatCard
  title="총 자산"
  value={totalAsset}
  change={changePercent}
  icon={Wallet}
/>

// 차트 데이터 형식
const chartData = [
  { date: '2024-01-01', value: 1000000, pnl: 50000 },
  { date: '2024-01-02', value: 1050000, pnl: 50000 },
]

// 숫자 포맷팅
const formatted = value.toLocaleString('ko-KR')
// 1234567 → "1,234,567"
```

### 색상 규칙

- 수익 (양수): `text-green-500`
- 손실 (음수): `text-red-500`
- 중립: `text-muted-foreground`

## Dependencies

### Internal

- `@/stores/useStore` - 대시보드 데이터
- `@/types` - DashboardSummary, ChartDataPoint
- `@/components/ui/card` - 카드 레이아웃

### External

- `recharts` - 차트 라이브러리
- `lucide-react` - 아이콘

<!-- MANUAL: -->
