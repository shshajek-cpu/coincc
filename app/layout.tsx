import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: '코인노트 | 코인 매매일지',
  description: '강력한 기능을 갖춘 코인 매매일지 플랫폼. 매매 기록, 포트폴리오 관리, 수익률 분석을 한 곳에서.',
  keywords: ['코인', '매매일지', '가상화폐', '트레이딩', '포트폴리오', '업비트'],
  authors: [{ name: '코인노트' }],
  openGraph: {
    title: '코인노트 | 코인 매매일지',
    description: '강력한 기능을 갖춘 코인 매매일지 플랫폼',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
