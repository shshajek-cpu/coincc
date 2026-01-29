import Link from 'next/link'
import {
  Coins,
  TrendingUp,
  BarChart3,
  Shield,
  BookOpen,
  PieChart,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: BookOpen,
    title: '매매일지',
    description: '매수/매도 기록을 체계적으로 관리하고 전략과 감정을 함께 기록하세요.',
  },
  {
    icon: BarChart3,
    title: '상세 분석',
    description: '코인별, 시간대별, 요일별 매매 패턴을 분석하여 약점을 파악하세요.',
  },
  {
    icon: PieChart,
    title: '포트폴리오',
    description: '보유 자산 현황과 비중을 한눈에 확인하고 리밸런싱하세요.',
  },
  {
    icon: TrendingUp,
    title: '실시간 시세',
    description: '업비트 API 연동으로 실시간 시세와 미실현 손익을 확인하세요.',
  },
  {
    icon: Shield,
    title: '리스크 관리',
    description: '일일/월간 손실 한도 알림으로 과매매를 방지하세요.',
  },
  {
    icon: BarChart3,
    title: '월간 리포트',
    description: '자동 생성되는 월간 리포트로 투자 성과를 리뷰하세요.',
  },
]

const benefits = [
  '체계적인 매매 기록으로 실수 반복 방지',
  '승률과 손익비 분석으로 전략 개선',
  '감정 기록으로 심리 패턴 파악',
  '실시간 포트폴리오 모니터링',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Coins className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">코인노트</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button>시작하기</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-6xl">
            <span className="text-gradient">프로 트레이더</span>의
            <br />
            매매일지
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground lg:text-xl">
            매매 기록부터 분석, 리포트까지.
            <br />
            체계적인 매매일지로 수익률을 높이세요.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                로그인
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">강력한 기능</h2>
            <p className="text-muted-foreground">
              매매일지에 필요한 모든 기능을 제공합니다
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="card-hover">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold">
                왜 <span className="text-primary">코인노트</span>인가요?
              </h2>
              <p className="mb-8 text-muted-foreground">
                단순한 기록이 아닌, 데이터 기반의 분석으로 실력을 향상시키세요.
                프로 트레이더들이 사용하는 매매일지 작성법을 쉽게 따라할 수 있습니다.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-xl border border-border bg-card p-1">
                <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-8">
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="h-4 w-24 rounded bg-muted" />
                      <div className="h-4 w-16 rounded bg-primary/30" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 w-32 rounded bg-muted" />
                      <div className="h-4 w-48 rounded bg-muted" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-20 flex-1 rounded bg-success/20" />
                      <div className="h-20 flex-1 rounded bg-primary/20" />
                      <div className="h-20 flex-1 rounded bg-danger/20" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary/20 blur-[40px]" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            지금 바로 시작하세요
          </h2>
          <p className="mb-8 text-muted-foreground">
            무료로 시작하고, 매매 실력을 한 단계 높여보세요.
          </p>
          <Link href="/signup">
            <Button size="lg">
              무료 회원가입
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Coins className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-primary">코인노트</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 코인노트. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
