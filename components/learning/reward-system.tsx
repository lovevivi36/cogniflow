'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Gift, Settings, Trophy, Flame, Clock } from 'lucide-react'
import { RewardLibraryManager } from './reward-library-manager'
import { loadRewardHistory, groupRewardHistoryByDate, formatRewardDate } from '@/lib/reward-history'
import { RARITY_CONFIG } from '@/lib/types/reward'
import type { RewardHistoryItem } from '@/lib/reward-history'

interface Reward {
  id: string
  name: string
  description: string
  type: 'completion' | 'streak' | 'custom'
  threshold: number // 触发阈值（完成次数、连续天数等）
  icon?: string
}

interface RewardSystemProps {
  userId: string
  studyStats: {
    totalCompleted: number
    currentStreak: number
    longestStreak: number
  }
}

/**
 * 奖励系统组件
 * 支持自定义奖励设置和奖励库管理
 */
export function RewardSystem({ userId, studyStats }: RewardSystemProps) {
  const [customRewards, setCustomRewards] = useState<Reward[]>([])
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [rewardHistory, setRewardHistory] = useState<RewardHistoryItem[]>([])

  // 从 localStorage 加载自定义奖励
  useEffect(() => {
    const saved = localStorage.getItem(`rewards_${userId}`)
    if (saved) {
      try {
        setCustomRewards(JSON.parse(saved))
      } catch (error) {
        console.error('加载奖励失败:', error)
      }
    }
  }, [userId])

  // 加载奖励历史记录
  useEffect(() => {
    const history = loadRewardHistory(userId)
    // 按时间倒序排列（最新的在前）
    setRewardHistory(history.sort((a, b) => 
      new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
    ))
  }, [userId])

  // 只使用自定义奖励，不使用默认奖励
  const allRewards = customRewards

  // 计算已获得的奖励
  const earnedRewards = allRewards.filter((reward) => {
    if (reward.type === 'completion') {
      return studyStats.totalCompleted >= reward.threshold
    } else if (reward.type === 'streak') {
      return studyStats.currentStreak >= reward.threshold
    }
    return false
  })

  // 计算即将获得的奖励
  const upcomingRewards = allRewards
    .filter((reward) => !earnedRewards.find((r) => r.id === reward.id))
    .sort((a, b) => {
      const aProgress = a.type === 'completion' 
        ? studyStats.totalCompleted / a.threshold
        : studyStats.currentStreak / a.threshold
      const bProgress = b.type === 'completion'
        ? studyStats.totalCompleted / b.threshold
        : studyStats.currentStreak / b.threshold
      return bProgress - aProgress
    })
    .slice(0, 3)

  // 计算奖励进度
  const getRewardProgress = (reward: Reward): number => {
    if (reward.type === 'completion') {
      return Math.min(100, (studyStats.totalCompleted / reward.threshold) * 100)
    } else if (reward.type === 'streak') {
      return Math.min(100, (studyStats.currentStreak / reward.threshold) * 100)
    }
    return 0
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* 当前统计 */}
      <div>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            学习成就
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-2xl bg-white dark:bg-slate-800/50 shadow-md">
            <div className="text-5xl font-medium text-slate-900 dark:text-slate-100 mb-2">{studyStats.totalCompleted}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">总完成</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-white dark:bg-slate-800/50 shadow-md">
            <div className="text-5xl font-medium text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2 mb-2">
              <Flame className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              {studyStats.currentStreak}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">连续天数</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-white dark:bg-slate-800/50 shadow-md">
            <div className="text-5xl font-medium text-slate-900 dark:text-slate-100 mb-2">{studyStats.longestStreak}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">最长连续</div>
          </div>
        </div>
      </div>

      {/* 已获得的奖励 */}
      {earnedRewards.length > 0 && (
        <div>
          <div className="mb-4">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Gift className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              已获得奖励
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {earnedRewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-800/50 transition-all duration-200 hover:shadow-md"
              >
                <span className="text-xl">{reward.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate text-slate-900 dark:text-slate-100">{reward.name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 truncate font-normal">{reward.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 即将获得的奖励 - 已隐藏，用户不需要此功能 */}

      {/* 奖励历史记录 */}
      {rewardHistory.length > 0 && (
        <div>
          <div className="mb-4">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              奖励历史
            </h4>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(groupRewardHistoryByDate(rewardHistory))
              .sort(([a], [b]) => b.localeCompare(a)) // 按日期倒序
              .map(([date, items]) => (
                <div key={date} className="space-y-2">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">
                    {formatRewardDate(date)}
                  </div>
                  {items.map((item) => {
                    const rarityConfig = RARITY_CONFIG[item.rarity]
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
                      >
                        <span className="text-lg">{item.icon || rarityConfig?.icon || '🎁'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                            {item.rewardName}
                          </div>
                          {item.rewardDescription && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                              {item.rewardDescription}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {rarityConfig && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {rarityConfig.name}
                              </span>
                            )}
                            {item.bonus && item.bonus > 0 && (
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                +{item.bonus} 分
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                          {new Date(item.earnedAt).toLocaleTimeString('zh-CN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 奖励库管理 */}
      <div className="flex justify-end mt-auto pt-4">
        <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-full text-xs">
              <Settings className="h-4 w-4 mr-1.5" />
              管理奖励库
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>奖励库管理</DialogTitle>
              <DialogDescription>
                自定义奖励内容、级别和权重。奖励分为传说、史诗、精良、普通四个级别。
              </DialogDescription>
            </DialogHeader>
            <RewardLibraryManager userId={userId} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
