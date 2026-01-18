/**
 * 奖励历史记录管理
 * 记录用户每次获得的奖励，包括日期、奖励内容等
 */

import type { RewardItem } from './types/reward'
import { RewardRarity } from './types/reward'

export interface RewardHistoryItem {
  id: string
  rewardId: string // 奖励库中的奖励ID
  rewardName: string
  rewardDescription: string
  rarity: RewardRarity // 奖励级别
  icon?: string
  earnedAt: string // ISO 日期字符串
  bonus?: number // 额外奖励分数
}

const STORAGE_KEY = 'cogniflow_reward_history'

/**
 * 保存奖励历史记录
 */
export function saveRewardHistory(userId: string, rewardItem: RewardItem, bonus?: number): void {
  try {
    const history = loadRewardHistory(userId)
    
    const newHistoryItem: RewardHistoryItem = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rewardId: rewardItem.id,
      rewardName: rewardItem.name,
      rewardDescription: rewardItem.description || '',
      rarity: rewardItem.rarity,
      icon: rewardItem.icon,
      earnedAt: new Date().toISOString(),
      bonus: bonus || 0,
    }

    history.push(newHistoryItem)
    
    // 只保留最近 100 条记录
    const limitedHistory = history.slice(-100)
    
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(limitedHistory))
  } catch (error) {
    console.error('保存奖励历史失败:', error)
  }
}

/**
 * 加载奖励历史记录
 */
export function loadRewardHistory(userId: string): RewardHistoryItem[] {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载奖励历史失败:', error)
  }
  return []
}

/**
 * 按日期分组奖励历史
 */
export function groupRewardHistoryByDate(history: RewardHistoryItem[]): Record<string, RewardHistoryItem[]> {
  const grouped: Record<string, RewardHistoryItem[]> = {}
  
  history.forEach((item) => {
    const date = new Date(item.earnedAt)
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    
    if (!grouped[dateStr]) {
      grouped[dateStr] = []
    }
    grouped[dateStr].push(item)
  })
  
  return grouped
}

/**
 * 格式化日期显示
 */
export function formatRewardDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // 重置时间到 00:00:00 进行比较
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return '今天'
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return '昨天'
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}
