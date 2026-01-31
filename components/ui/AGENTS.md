<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-01 | Updated: 2026-02-01 -->

# ui

## Purpose

shadcn/ui 기반 기본 UI 컴포넌트. Radix UI 프리미티브를 Tailwind CSS로 스타일링한 접근성 지원 컴포넌트 모음.

## Key Files

| File | Description |
|------|-------------|
| `button.tsx` | 버튼 컴포넌트 (variants: default, destructive, outline, secondary, ghost, link) |
| `card.tsx` | 카드 컨테이너 (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter) |
| `input.tsx` | 텍스트 입력 필드 |
| `label.tsx` | 폼 레이블 |
| `select.tsx` | 드롭다운 선택 |
| `tabs.tsx` | 탭 네비게이션 |
| `dialog.tsx` | 모달 다이얼로그 |
| `dropdown-menu.tsx` | 드롭다운 메뉴 |
| `toast.tsx` | 토스트 알림 |
| `toaster.tsx` | 토스트 컨테이너 |
| `avatar.tsx` | 아바타 이미지 |
| `separator.tsx` | 구분선 |

## For AI Agents

### Working In This Directory

- shadcn/ui CLI로 새 컴포넌트 추가: `npx shadcn-ui@latest add [component]`
- 직접 수정 가능 (ejected 상태)
- Radix UI 문서 참조 필요

### Testing Requirements

- 접근성 검증 (키보드 네비게이션, 스크린 리더)
- 다크 모드 스타일 확인

### Common Patterns

```typescript
// 버튼 사용
import { Button } from '@/components/ui/button'
<Button variant="default">Click</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>

// 카드 사용
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// 토스트 사용
import { useToast } from '@/hooks/use-toast'
const { toast } = useToast()
toast({ title: 'Success', description: 'Done!' })
```

## Dependencies

### External

- `@radix-ui/react-*` - 헤드리스 컴포넌트
- `class-variance-authority` - variant 관리
- `lucide-react` - 아이콘

<!-- MANUAL: -->
