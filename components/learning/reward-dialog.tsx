'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RARITY_CONFIG } from '@/lib/types/reward'
import type { RewardItem } from '@/lib/types/reward'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface RewardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rewardItem?: RewardItem
  message?: string
  type?: 'super' | 'normal' | 'encouragement' | 'none'
  bonus?: number
}

/**
 * 奖励弹窗组件
 * 当用户完成学习并获得奖励时显示
 */
export function RewardDialog({
  open,
  onOpenChange,
  rewardItem,
  message,
  type = 'none',
  bonus = 0,
}: RewardDialogProps) {
  // 当弹窗打开时，触发庆祝动画
  useEffect(() => {
    if (open && type !== 'none') {
      // 根据奖励类型显示不同的动画
      if (type === 'super') {
        // 超级奖励：大爆炸效果
        const duration = 2000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

        const interval: NodeJS.Timeout = setInterval(() => {
          const timeLeft = animationEnd - Date.now()

          if (timeLeft <= 0) {
            return clearInterval(interval)
          }

          const particleCount = 50 * (timeLeft / duration)
          
          // 从中心向四周发射
          confetti({
            ...defaults,
            particleCount,
            origin: { x: 0.5, y: 0.5 }
          })
        }, 250)

        // 额外的大爆炸
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: 9999,
          })
        }, 500)
      } else if (type === 'normal') {
        // 普通奖励：中等效果
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          zIndex: 9999,
        })
      } else {
        // 鼓励奖励：小效果
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.6 },
          zIndex: 9999,
        })
      }
    }
  }, [open, type])

  if (type === 'none' || !open) {
    return null
  }

  const rarityConfig = rewardItem ? RARITY_CONFIG[rewardItem.rarity] : null
  const displayMessage = message || (rewardItem ? `${rewardItem.name}！${rewardItem.description}` : '恭喜完成学习！')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {type === 'super' ? '🎉 超级奖励！' : type === 'normal' ? '⭐ 获得奖励！' : '💪 继续加油！'}
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            {rarityConfig && (
              <div className="text-6xl mb-4">
                {rarityConfig.icon}
              </div>
            )}
            <p className="text-lg font-semibold text-foreground mb-2">
              {displayMessage}
            </p>
            {bonus > 0 && (
              <p className="text-sm text-muted-foreground">
                额外奖励：+{bonus} 分
              </p>
            )}
            {rewardItem && (
              <div className="mt-4 p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium">
                  奖励级别：{rarityConfig?.name || rewardItem.rarity}
                </p>
                {rewardItem.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {rewardItem.description}
                  </p>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            太棒了！
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
