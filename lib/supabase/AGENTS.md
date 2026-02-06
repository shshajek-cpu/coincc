<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# supabase

## Purpose

Supabase 클라이언트 설정. 브라우저용, 서버용, 미들웨어용 클라이언트를 분리하여 제공한다.

## Key Files

| File | Description |
|------|-------------|
| `client.ts` | 브라우저용 Supabase 클라이언트 (Client Components) |
| `server.ts` | 서버용 Supabase 클라이언트 (Server Components, Route Handlers) |
| `middleware.ts` | 미들웨어용 - 세션 갱신 및 인증 검사 |
| `storage.ts` | Supabase Storage 유틸리티 - 스크린샷 업로드/삭제 |

## For AI Agents

### Working In This Directory

- 클라이언트 컴포넌트: `createClient()` from `client.ts`
- 서버 컴포넌트: `createClient()` from `server.ts`
- 미들웨어: `updateSession()` from `middleware.ts`

### Testing Requirements

- 데모 모드 동작 확인 (`NEXT_PUBLIC_DEMO_MODE=true`)
- 인증 리다이렉트 동작 확인
- 세션 갱신 확인

### 사용 패턴

```typescript
// 클라이언트 컴포넌트
'use client'
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// 서버 컴포넌트
import { createClient } from '@/lib/supabase/server'
const supabase = createClient()

// 데이터 조회
const { data, error } = await supabase
  .from('trades')
  .select('*')
  .order('trade_at', { ascending: false })

// 인증 상태 확인
const { data: { user } } = await supabase.auth.getUser()

// 스크린샷 업로드
import { uploadScreenshot, deleteScreenshot, validateFile } from '@/lib/supabase/storage'

const file = inputRef.current.files[0]
const error = validateFile(file) // 클라이언트 사전 검증
const { url, error } = await uploadScreenshot(file, userId)

// 스크린샷 삭제
await deleteScreenshot(screenshotUrl)
```

### 미들웨어 보호 경로

```typescript
// 인증 필요 (비로그인 시 /login으로 리다이렉트)
const protectedPaths = ['/dashboard', '/trades', '/portfolio', '/analysis', '/reports', '/settings']

// 인증 페이지 (로그인 시 /dashboard로 리다이렉트)
const authPaths = ['/login', '/signup']
```

### 데모 모드

환경 변수 미설정 또는 `NEXT_PUBLIC_DEMO_MODE=true`일 때:
- 인증 검사 스킵
- 모든 라우트 접근 허용

## Dependencies

### External

- `@supabase/ssr` - SSR 지원 Supabase 클라이언트
- `@supabase/supabase-js` - Supabase JavaScript 클라이언트

<!-- MANUAL: -->
