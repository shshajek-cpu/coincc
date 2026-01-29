'use client'

import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatKRW, formatPercent } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  format?: 'currency' | 'percent' | 'number'
  variant?: 'default' | 'success' | 'danger'
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  format = 'currency',
  variant = 'default',
}: StatCardProps) {
  const formattedValue = format === 'currency'
    ? formatKRW(value)
    : format === 'percent'
    ? formatPercent(value)
    : value.toLocaleString('ko-KR')

  const isPositiveChange = change !== undefined && change >= 0

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p
              className={cn(
                'font-number text-2xl font-bold',
                variant === 'success' && 'text-success',
                variant === 'danger' && 'text-danger'
              )}
            >
              {formattedValue}
            </p>
            {change !== undefined && (
              <p
                className={cn(
                  'flex items-center text-xs',
                  isPositiveChange ? 'text-success' : 'text-danger'
                )}
              >
                <span className="font-number">{formatPercent(change)}</span>
                {changeLabel && (
                  <span className="ml-1 text-muted-foreground">{changeLabel}</span>
                )}
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              variant === 'default' && 'bg-primary/10 text-primary',
              variant === 'success' && 'bg-success/10 text-success',
              variant === 'danger' && 'bg-danger/10 text-danger'
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
