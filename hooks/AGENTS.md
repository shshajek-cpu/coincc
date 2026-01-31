<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# hooks

## Purpose

커스텀 React 훅 모음. 업비트 실시간 시세 조회, Toast 알림 등 재사용 가능한 로직을 캡슐화한다.

## Key Files

| File | Description |
|------|-------------|
| `useUpbit.ts` | 업비트 실시간 시세 훅 - REST API + WebSocket 지원 |
| `use-toast.ts` | Toast 알림 훅 (shadcn/ui) |

## For AI Agents

### Working In This Directory

- 훅 파일명은 `use*.ts` 또는 `use-*.ts` 패턴
- 모든 훅은 `'use client'` 환경에서만 동작
- 클린업 로직 필수 (useEffect return)

### Testing Requirements

- 훅 동작 확인: 상태 변화, 사이드 이펙트
- WebSocket 연결 해제 확인

### Common Patterns

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseCustomOptions {
  // 옵션 정의
}

export function useCustom(options: UseCustomOptions) {
  const [state, setState] = useState()

  useEffect(() => {
    // 설정
    return () => {
      // 클린업
    }
  }, [deps])

  return { state, actions }
}
```

### useUpbit 사용법

```typescript
const { prices, loading, error, getPrice, refresh } = useUpbit({
  symbols: ['BTC', 'ETH'],
  realtime: true,  // WebSocket 사용
  interval: 5000,  // polling 시 간격
})

// 특정 심볼 가격 조회
const btcPrice = getPrice('BTC')
```

## Dependencies

### Internal

- `@/lib/upbit/api` - 업비트 API 함수
- `@/types` - UpbitTicker 타입

<!-- MANUAL: -->
