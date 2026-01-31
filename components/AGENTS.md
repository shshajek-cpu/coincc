<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# components

## Purpose

재사용 가능한 React 컴포넌트 모음. shadcn/ui 기반의 기본 UI 컴포넌트와 도메인별 커스텀 컴포넌트로 구성된다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `ui/` | shadcn/ui 기본 컴포넌트 (see `ui/AGENTS.md`) |
| `layout/` | 레이아웃 컴포넌트 - Sidebar, Header, MobileNav (see `layout/AGENTS.md`) |
| `dashboard/` | 대시보드 전용 컴포넌트 - 차트, 통계 카드 (see `dashboard/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- 새 UI 컴포넌트는 `ui/`에 추가
- 도메인 특화 컴포넌트는 해당 디렉토리에 추가
- 모든 컴포넌트는 `'use client'` 여부 명시

### Testing Requirements

- 컴포넌트 렌더링 확인
- Props 타입 검증 (`interface Props`)
- 반응형 동작 확인 (모바일/데스크톱)

### Common Patterns

```typescript
'use client'

import { cn } from '@/lib/utils'

interface Props {
  className?: string
  children: React.ReactNode
}

export function ComponentName({ className, children }: Props) {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  )
}
```

## Dependencies

### Internal

- `@/lib/utils` - `cn()` 클래스 병합 유틸리티

### External

- `@radix-ui/*` - 접근성 지원 헤드리스 컴포넌트
- `lucide-react` - 아이콘
- `class-variance-authority` - 컴포넌트 variants
- `clsx`, `tailwind-merge` - 클래스 병합

<!-- MANUAL: -->
