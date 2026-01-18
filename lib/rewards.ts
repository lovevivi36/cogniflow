/**
 * 不确定性奖励机制
 * 基于多巴胺机制，通过随机奖励增强学习动机
 * 使用用户自定义的奖励库
 */

import {
  RewardItem,
  RewardRarity,
  type RewardLibrary,
} from './types/reward'
import {
  loadRewardLibrary,
  selectReward,
  recommendRewardRarity,
} from './rewards-library'

export interface RewardResult {
  type: 'super' | 'normal' | 'encouragement' | 'none'
  message: string
  bonus?: number // 额外奖励分数
  rewardItem?: RewardItem // 选中的奖励项
}

/**
 * 根据学习表现和随机性计算奖励（使用奖励库）
 * @param rating AI 评分 (1-4)
 * @param stability 记忆稳定性
 * @param consecutiveDays 连续学习天数
 * @param userId 用户ID（用于加载奖励库）
 */
export function calculateReward(
  rating: number,
  stability: number,
  consecutiveDays: number = 0,
  userId?: string
): RewardResult {
  const random = Math.random()
  
  // 基础奖励概率（根据评分调整）- 提高概率确保用户有更好的体验
  // 提高奖励概率，让用户更容易获得奖励，增强学习动机
  const baseChance = {
    4: 0.70, // 完美：70% 基础概率
    3: 0.60, // 很好：60% 基础概率
    2: 0.50, // 不错：50% 基础概率
    1: 0.40, // 需要努力：40% 基础概率（鼓励）
  }[rating] || 0.50

  // 连续学习加成（艾宾浩斯机制：持续学习提高奖励概率）
  const streakBonus = Math.min(consecutiveDays * 0.05, 0.20) // 最多 20% 加成
  
  // 记忆稳定性加成（稳定性越高，奖励概率越高）
  const stabilityBonus = Math.min(stability / 50, 0.15) // 最多 15% 加成

  const totalChance = baseChance + streakBonus + stabilityBonus

  // 如果没有达到奖励概率，返回无奖励
  if (random >= totalChance) {
    return {
      type: 'none',
      message: '',
      bonus: 0,
    }
  }

  // 如果提供了 userId，使用奖励库选择奖励
  if (userId) {
    try {
      const library = loadRewardLibrary(userId)
      const recommendedRarity = recommendRewardRarity(rating, stability, consecutiveDays)
      
      // 优先从推荐级别选择，如果没有则从所有级别选择
      let selectedReward = selectReward(library, recommendedRarity)
      if (!selectedReward) {
        selectedReward = selectReward(library)
      }

      if (selectedReward) {
        // 根据级别确定奖励类型
        let type: 'super' | 'normal' | 'encouragement' = 'encouragement'
        let bonus = 0
        
        if (selectedReward.rarity === RewardRarity.Legendary) {
          type = 'super'
          bonus = 10
        } else if (selectedReward.rarity === RewardRarity.Epic) {
          type = 'super'
          bonus = 8
        } else if (selectedReward.rarity === RewardRarity.Rare) {
          type = 'normal'
          bonus = 5
        } else {
          type = 'encouragement'
          bonus = 0
        }

        return {
          type,
          message: `${selectedReward.name}！${selectedReward.description}`,
          bonus,
          rewardItem: selectedReward,
        }
      }
    } catch (error) {
      console.error('加载奖励库失败，使用默认奖励:', error)
    }
  }

  // 回退到默认奖励逻辑
  if (random < totalChance * 0.3) {
    return {
      type: 'super',
      message: '🎁 恭喜！你获得了超级奖励！',
      bonus: 10,
    }
  }

  if (random < totalChance * 0.7) {
    return {
      type: 'normal',
      message: '⭐ 太棒了！你获得了额外奖励！',
      bonus: 5,
    }
  }

  return {
    type: 'encouragement',
    message: '💪 继续保持！',
    bonus: 0,
  }
}

/**
 * 计算艾宾浩斯遗忘曲线上的记忆强度
 * @param stability 记忆稳定性（天数）
 * @param elapsedDays 已过天数
 */
export function calculateRetention(stability: number, elapsedDays: number): number {
  if (stability === 0) return 1.0 // 新卡片
  
  // 简化的遗忘曲线公式：R = e^(-t/S)
  // R: 记忆保留率, t: 已过时间, S: 稳定性
  const retention = Math.exp(-elapsedDays / stability)
  return Math.max(0, Math.min(1, retention))
}

/**
 * 获取复习建议（基于艾宾浩斯曲线）
 */
export function getReviewSuggestion(retention: number): string {
  if (retention > 0.9) {
    return '记忆很牢固，可以适当延长复习间隔'
  } else if (retention > 0.7) {
    return '记忆良好，按计划复习即可'
  } else if (retention > 0.5) {
    return '记忆开始衰退，建议尽快复习'
  } else {
    return '记忆衰退明显，需要立即复习'
  }
}
