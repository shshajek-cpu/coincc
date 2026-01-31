<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# supabase

## Purpose

Supabase 데이터베이스 마이그레이션 및 설정. PostgreSQL 스키마, RLS 정책, 트리거를 관리한다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `migrations/` | SQL 마이그레이션 파일 |

## Key Migration Files

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | 초기 스키마 - 테이블, RLS, 트리거 |

## For AI Agents

### Working In This Directory

- 새 마이그레이션은 `migrations/` 디렉토리에 순번 파일로 추가
- 파일명 패턴: `00N_description.sql`
- Supabase Dashboard 또는 CLI로 실행

### Testing Requirements

- SQL 문법 검증
- RLS 정책 동작 확인
- 트리거 실행 확인

### 데이터베이스 구조

```
테이블:
├── users          # 사용자 프로필 (auth.users 확장)
├── trades         # 매매 기록
├── holdings       # 보유 자산 (자동 계산)
├── daily_stats    # 일별 통계
├── trade_rules    # 매매 원칙
└── alerts         # 알림 설정

트리거:
├── on_auth_user_created     # 회원가입 → users 생성
├── on_trade_created         # 거래 등록 → holdings 업데이트
└── update_*_updated_at      # updated_at 자동 갱신
```

### RLS 정책 패턴

```sql
-- 기본 패턴: 자신의 데이터만 접근
CREATE POLICY "Users can view own data" ON public.table
  FOR SELECT USING (auth.uid() = user_id);
```

### 주의사항

- **holdings 직접 수정 금지**: 트리거가 자동 계산
- **RLS 항상 활성화**: 모든 테이블에 적용됨
- **user_id 필수**: 새 테이블 추가 시 FK 설정

<!-- MANUAL: -->
