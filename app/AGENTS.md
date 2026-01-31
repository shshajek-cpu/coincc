<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# app

## Purpose

Next.js 14 App Router 기반의 페이지 및 레이아웃. Route Groups를 사용하여 인증(`(auth)`)과 대시보드(`(dashboard)`) 영역을 분리한다.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | 루트 레이아웃 - HTML 기본 구조, 다크 테마, Toaster |
| `page.tsx` | 랜딩 페이지 (`/`) |
| `globals.css` | 전역 CSS 및 Tailwind 지시문 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `(auth)/` | 인증 관련 페이지 - login, signup (see `(auth)/AGENTS.md`) |
| `(dashboard)/` | 인증 필요 페이지 - 대시보드, 거래, 포트폴리오 등 (see `(dashboard)/AGENTS.md`) |
| `auth/` | OAuth 콜백 라우트 핸들러 |

## For AI Agents

### Working In This Directory

- Route Groups `(auth)`, `(dashboard)`는 URL에 영향 없음
- `(dashboard)` 내 페이지는 공통 레이아웃(Sidebar, Header) 공유
- 새 페이지 추가 시 해당 디렉토리에 `page.tsx` 생성

### Testing Requirements

- 페이지 라우팅 확인: 브라우저에서 URL 접근
- 레이아웃 렌더링 확인: Sidebar, Header 표시 여부

### Common Patterns

```typescript
// 서버 컴포넌트 (기본)
export default function Page() { ... }

// 클라이언트 컴포넌트
'use client'
export default function Page() { ... }

// 메타데이터
export const metadata: Metadata = { title: '...' }
```

## Dependencies

### Internal

- `@/components/layout` - Sidebar, Header, MobileNav
- `@/components/ui` - shadcn/ui 컴포넌트
- `@/lib/supabase` - 인증 클라이언트

<!-- MANUAL: -->
