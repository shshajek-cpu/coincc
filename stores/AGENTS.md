<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# stores

## Purpose

Zustand 기반 전역 상태 관리. 사용자 정보, 거래 기록, 보유 자산, UI 상태를 관리한다.

## Key Files

| File | Description |
|------|-------------|
| `useStore.ts` | 메인 스토어 - 모든 전역 상태 및 액션 정의 |

## For AI Agents

### Working In This Directory

- 새 상태 추가 시 `AppState` 인터페이스에 타입 정의
- persist 미들웨어로 LocalStorage 영속화 (선택적)
- Selector 함수로 필요한 상태만 구독

### Testing Requirements

- 상태 변경 로직 검증
- LocalStorage 영속화 확인

### Common Patterns

```typescript
// 상태 조회
const trades = useStore((state) => state.trades)

// 액션 호출
const { addTrade, updateTrade, deleteTrade } = useStore()

// Selector 사용 (최적화)
const user = useStore(selectUser)
```

### 영속화 대상

`partialize` 옵션으로 일부 상태만 LocalStorage에 저장:
- `sidebarCollapsed` - 사이드바 접힘 상태
- `tradeFilter` - 거래 필터 설정

### 주의사항

- `user`, `trades`, `holdings`는 영속화하지 않음 (서버에서 fetch)
- SSR 환경에서 hydration 불일치 주의

## Dependencies

### External

- `zustand` - 상태 관리 라이브러리
- `zustand/middleware` - persist 미들웨어

### Internal

- `@/types` - Trade, Holding, User 타입

<!-- MANUAL: -->
