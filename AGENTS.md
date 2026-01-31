<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# CoinCC (코인노트)

## Purpose

암호화폐 트레이더를 위한 매매일지 및 포트폴리오 관리 플랫폼. Next.js 14 App Router 기반의 풀스택 애플리케이션으로, Supabase 백엔드와 업비트 API를 연동한다.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | 프로젝트 의존성 및 스크립트 정의 |
| `tsconfig.json` | TypeScript 설정 (strict mode) |
| `tailwind.config.ts` | Tailwind CSS 설정 (다크 테마 기본) |
| `middleware.ts` | Next.js 미들웨어 - 인증 세션 관리 |
| `next.config.js` | Next.js 설정 |
| `.env.local.example` | 환경 변수 템플릿 |
| `CLAUDE.md` | AI 에이전트용 프로젝트 전체 컨텍스트 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router 페이지 및 레이아웃 (see `app/AGENTS.md`) |
| `components/` | 재사용 가능한 React 컴포넌트 (see `components/AGENTS.md`) |
| `lib/` | 유틸리티 함수 및 API 클라이언트 (see `lib/AGENTS.md`) |
| `hooks/` | 커스텀 React 훅 (see `hooks/AGENTS.md`) |
| `stores/` | Zustand 전역 상태 관리 (see `stores/AGENTS.md`) |
| `types/` | TypeScript 타입 정의 (see `types/AGENTS.md`) |
| `supabase/` | Supabase 마이그레이션 및 설정 (see `supabase/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- `npm run dev`로 개발 서버 실행 (localhost:3000)
- `npm run build`로 프로덕션 빌드 전 타입 체크
- `npm run lint`로 ESLint 검사

### Testing Requirements

- 빌드 성공 확인: `npm run build`
- 린트 통과: `npm run lint`
- 브라우저에서 주요 페이지 동작 확인

### Common Patterns

- 경로 별칭: `@/` = 프로젝트 루트
- 다크 모드 기본: `<html className="dark">`
- 클라이언트 컴포넌트: `'use client'` 지시문 필수
- Supabase RLS: 모든 DB 쿼리에 자동 적용

## Dependencies

### External

| Package | Purpose |
|---------|---------|
| `next` 14.x | React 프레임워크 (App Router) |
| `@supabase/ssr` | Supabase SSR 클라이언트 |
| `zustand` | 경량 상태 관리 |
| `recharts` | 차트 라이브러리 |
| `@radix-ui/*` | shadcn/ui 기반 컴포넌트 |
| `tailwindcss` | 유틸리티 기반 CSS |

<!-- MANUAL: -->
