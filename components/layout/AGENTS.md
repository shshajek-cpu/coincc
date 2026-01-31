<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# layout

## Purpose

애플리케이션 레이아웃 컴포넌트. 대시보드 영역의 Sidebar, Header, 모바일 네비게이션을 담당한다.

## Key Files

| File | Description |
|------|-------------|
| `Sidebar.tsx` | 데스크톱 사이드바 - 메뉴, 로고, 로그아웃, 접기 기능 |
| `Header.tsx` | 상단 헤더 - 사용자 정보, 알림 |
| `MobileNav.tsx` | 모바일 슬라이드 메뉴 |

## For AI Agents

### Working In This Directory

- Sidebar 메뉴 항목은 `menuItems` 배열에서 관리
- 아이콘은 `lucide-react` 사용
- 반응형: `lg:` breakpoint 기준

### Testing Requirements

- 데스크톱: Sidebar 표시, 접기/펼치기 동작
- 모바일: MobileNav 슬라이드 동작
- 로그아웃 기능 동작

### Sidebar 메뉴 구조

```typescript
const menuItems = [
  { title: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { title: '매매 기록', href: '/trades', icon: BookOpen },
  { title: '포트폴리오', href: '/portfolio', icon: PieChart },
  { title: '분석', href: '/analysis', icon: BarChart3 },
  { title: '리포트', href: '/reports', icon: FileText },
]

const bottomMenuItems = [
  { title: '설정', href: '/settings', icon: Settings },
]
```

### 메뉴 추가 방법

1. `menuItems` 또는 `bottomMenuItems` 배열에 항목 추가
2. `lucide-react`에서 아이콘 import
3. `href`는 실제 라우트 경로와 일치

## Dependencies

### Internal

- `@/lib/supabase/client` - 로그아웃 처리
- `@/components/ui` - Button, Separator

### External

- `lucide-react` - 아이콘
- `next/navigation` - usePathname, useRouter

<!-- MANUAL: -->
