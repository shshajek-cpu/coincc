'use client'

import { useState, useEffect } from 'react'
import { User, Bell, Shield, Palette, LogOut, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [profile, setProfile] = useState({
    nickname: '',
    email: '',
  })

  const [alerts, setAlerts] = useState({
    dailyLossLimit: 100000,
    dailyLossEnabled: true,
    monthlyLossLimit: 500000,
    monthlyLossEnabled: true,
    targetProfitPercent: 10,
    targetProfitEnabled: false,
    emailNotifications: true,
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setProfile({
          nickname: user.user_metadata?.nickname || user.user_metadata?.full_name || '',
          email: user.email || '',
        })
      }
    }
    getUser()
  }, [supabase.auth])

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { nickname: profile.nickname },
      })

      if (error) throw error

      toast({
        title: '저장 완료',
        description: '프로필이 업데이트되었습니다.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '프로필 저장에 실패했습니다.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAlerts = async () => {
    setLoading(true)
    try {
      // TODO: Save to Supabase
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast({
        title: '저장 완료',
        description: '알림 설정이 업데이트되었습니다.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '알림 설정 저장에 실패했습니다.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground">계정 및 알림 설정을 관리하세요</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>프로필</CardTitle>
          </div>
          <CardDescription>기본 정보를 수정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {profile.nickname ? getInitials(profile.nickname) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile.nickname || '사용자'}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                value={profile.nickname}
                onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                placeholder="닉네임을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            프로필 저장
          </Button>
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>알림 설정</CardTitle>
          </div>
          <CardDescription>손실 한도 및 알림을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Daily Loss Alert */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">일일 손실 한도</p>
                <p className="text-sm text-muted-foreground">
                  일일 손실이 한도를 초과하면 알림을 받습니다
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={alerts.dailyLossEnabled}
                  onChange={(e) =>
                    setAlerts({ ...alerts, dailyLossEnabled: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>
            {alerts.dailyLossEnabled && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={alerts.dailyLossLimit}
                  onChange={(e) =>
                    setAlerts({ ...alerts, dailyLossLimit: Number(e.target.value) })
                  }
                  className="w-40 font-number"
                />
                <span className="text-muted-foreground">원</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Monthly Loss Alert */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">월간 손실 한도</p>
                <p className="text-sm text-muted-foreground">
                  월간 손실이 한도를 초과하면 알림을 받습니다
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={alerts.monthlyLossEnabled}
                  onChange={(e) =>
                    setAlerts({ ...alerts, monthlyLossEnabled: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>
            {alerts.monthlyLossEnabled && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={alerts.monthlyLossLimit}
                  onChange={(e) =>
                    setAlerts({ ...alerts, monthlyLossLimit: Number(e.target.value) })
                  }
                  className="w-40 font-number"
                />
                <span className="text-muted-foreground">원</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Target Profit Alert */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">목표 수익률 알림</p>
                <p className="text-sm text-muted-foreground">
                  목표 수익률 달성 시 알림을 받습니다
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={alerts.targetProfitEnabled}
                  onChange={(e) =>
                    setAlerts({ ...alerts, targetProfitEnabled: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>
            {alerts.targetProfitEnabled && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={alerts.targetProfitPercent}
                  onChange={(e) =>
                    setAlerts({ ...alerts, targetProfitPercent: Number(e.target.value) })
                  }
                  className="w-24 font-number"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">이메일 알림</p>
              <p className="text-sm text-muted-foreground">알림을 이메일로도 받습니다</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={alerts.emailNotifications}
                onChange={(e) =>
                  setAlerts({ ...alerts, emailNotifications: e.target.checked })
                }
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
            </label>
          </div>

          <Button onClick={handleSaveAlerts} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            알림 설정 저장
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>보안</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">로그아웃</p>
              <p className="text-sm text-muted-foreground">현재 세션에서 로그아웃합니다</p>
            </div>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
