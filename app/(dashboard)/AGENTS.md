<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# (dashboard)

## Purpose

인증이 필요한 대시보드 영역 Route Group. 공통 레이아웃(Sidebar, Header)을 공유하며, 미들웨어에서 인증을 검사한다.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | 대시보드 레이아웃 - Sidebar, Header, MobileNav 포함 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `dashboard/` | 메인 대시보드 (`/dashboard`) |
| `trades/` | 매매 기록 관리 (`/trades`, `/trades/new`, `/trades/[id]`) |
| `portfolio/` | 포트폴리오 현황 (`/portfolio`) |
| `analysis/` | 수익률 분석 (`/analysis`) |
| `reports/` | 리포트 생성 (`/reports`) |
| `settings/` | 사용자 설정 (`/settings`) |

## For AI Agents

### Working In This Directory

- 모든 페이지는 인증 필수 (미들웨어에서 처리)
- `layout.tsx`의 Sidebar/Header 공유
- 모바일 반응형: MobileNav 사용

### Testing Requirements

- 비로그인 상태에서 접근 시 `/login`으로 리다이렉트 확인
- Sidebar 네비게이션 동작 확인
- 모바일 메뉴 동작 확인

### Common Patterns

```typescript
// 페이지 컴포넌트
'use client'

export default function PageName() {
  // Supabase에서 데이터 fetch
  // Zustand 스토어에 저장
  // UI 렌더링
}
```

### 라우트 구조

```
/dashboard      → dashboard/page.tsx
/trades         → trades/page.tsx
/trades/new     → trades/new/page.tsx
/trades/[id]    → trades/[id]/page.tsx
/portfolio      → portfolio/page.tsx
/analysis       → analysis/page.tsx
/reports        → reports/page.tsx
/settings       → settings/page.tsx
```

## Dependencies

### Internal

- `@/components/layout` - Sidebar, Header, MobileNav
- `@/stores/useStore` - 전역 상태
- `@/lib/supabase` - 데이터 조회

<!-- MANUAL: -->
