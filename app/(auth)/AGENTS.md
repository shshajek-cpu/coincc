<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# (auth)

## Purpose

인증 관련 페이지 Route Group. 로그인, 회원가입 페이지를 포함하며, URL에는 `(auth)`가 포함되지 않는다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `login/` | 로그인 페이지 (`/login`) |
| `signup/` | 회원가입 페이지 (`/signup`) |

## For AI Agents

### Working In This Directory

- 인증된 사용자는 미들웨어에서 `/dashboard`로 리다이렉트
- Supabase Auth 사용 (이메일/소셜 로그인)
- 폼 제출 후 에러 처리 필수

### Common Patterns

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// 로그인
await supabase.auth.signInWithPassword({ email, password })

// 회원가입
await supabase.auth.signUp({ email, password })

// OAuth
await supabase.auth.signInWithOAuth({ provider: 'google' })
```

## Dependencies

### Internal

- `@/lib/supabase/client` - 브라우저용 Supabase 클라이언트
- `@/components/ui` - 폼 컴포넌트

<!-- MANUAL: -->
