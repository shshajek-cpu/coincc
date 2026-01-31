<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# lib

## Purpose

유틸리티 함수 및 외부 서비스 API 클라이언트. Supabase 연동과 업비트 API 래퍼를 포함한다.

## Key Files

| File | Description |
|------|-------------|
| `utils.ts` | `cn()` 함수 - Tailwind 클래스 병합 유틸리티 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `supabase/` | Supabase 클라이언트 설정 (see `supabase/AGENTS.md`) |
| `upbit/` | 업비트 API 래퍼 (see `upbit/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- 새 유틸리티는 `utils.ts`에 추가하거나 별도 파일 생성
- 외부 API 연동은 별도 디렉토리로 분리
- 모든 함수에 TypeScript 타입 명시

### Testing Requirements

- 함수 단위 테스트 권장
- API 함수는 에러 핸들링 필수

### Common Patterns

```typescript
// utils.ts 패턴
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Dependencies

### External

- `clsx` - 조건부 클래스 결합
- `tailwind-merge` - Tailwind 클래스 충돌 해결

<!-- MANUAL: -->
