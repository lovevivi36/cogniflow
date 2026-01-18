/**
 * 奖励库管理
 * 支持用户自定义奖励内容和权重
 */

import { RewardItem, RewardRarity, RARITY_CONFIG, type RewardLibrary } from './types/reward'

const STORAGE_KEY = 'cogniflow_reward_library'
const LIBRARY_VERSION = 1

/**
 * 获取默认奖励库（空库，用户需要自己添加奖励）
 */
export function getDefaultRewardLibrary(): RewardLibrary {
  return {
    version: LIBRARY_VERSION,
    items: [], // 不提供默认奖励，用户需要自己创建
  }
}

/**
 * 从本地存储加载奖励库
 */
export function loadRewardLibrary(userId: string): RewardLibrary {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    if (saved) {
      const library: RewardLibrary = JSON.parse(saved)
      // 检查版本，如果版本不匹配则合并默认奖励
      if (library.version !== LIBRARY_VERSION) {
        return migrateRewardLibrary(library)
      }
      return library
    }
  } catch (error) {
    console.error('加载奖励库失败:', error)
  }
  return getDefaultRewardLibrary()
}

/**
 * 保存奖励库到本地存储
 */
export function saveRewardLibrary(userId: string, library: RewardLibrary): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(library))
  } catch (error) {
    console.error('保存奖励库失败:', error)
  }
}

/**
 * 迁移奖励库（版本升级时使用）
 */
function migrateRewardLibrary(oldLibrary: RewardLibrary): RewardLibrary {
  // 只保留用户自定义的奖励（custom_ 开头的）
  return {
    version: LIBRARY_VERSION,
    items: oldLibrary.items.filter((item) => item.id.startsWith('custom_')),
  }
}

/**
 * 根据权重随机选择一个奖励
 * @param items 奖励列表（已启用且权重 > 0）
 * @returns 选中的奖励，如果没有则返回 null
 */
export function selectRewardByWeight(items: RewardItem[]): RewardItem | null {
  const enabledItems = items.filter((item) => item.enabled && item.weight > 0)
  if (enabledItems.length === 0) return null

  // 计算总权重
  const totalWeight = enabledItems.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight === 0) return null

  // 随机选择
  let random = Math.random() * totalWeight
  for (const item of enabledItems) {
    random -= item.weight
    if (random <= 0) {
      return item
    }
  }

  // 兜底返回第一个
  return enabledItems[0]
}

/**
 * 根据级别和权重选择奖励
 * @param library 奖励库
 * @param rarity 目标级别（可选，如果指定则只从该级别选择）
 * @returns 选中的奖励
 */
export function selectReward(
  library: RewardLibrary,
  rarity?: RewardRarity
): RewardItem | null {
  let items = library.items.filter((item) => item.enabled && item.weight > 0)

  // 如果指定了级别，只从该级别选择
  if (rarity) {
    items = items.filter((item) => item.rarity === rarity)
  }

  return selectRewardByWeight(items)
}

/**
 * 根据学习表现智能选择奖励级别
 * @param rating AI 评分 (1-4)
 * @param stability 记忆稳定性
 * @param consecutiveDays 连续学习天数
 * @returns 推荐的奖励级别
 */
export function recommendRewardRarity(
  rating: number,
  stability: number,
  consecutiveDays: number = 0
): RewardRarity {
  // 基础分数（根据评分）
  let score = rating * 10

  // 稳定性加成
  score += Math.min(stability / 10, 20)

  // 连续学习加成
  score += Math.min(consecutiveDays * 2, 20)

  // 根据总分推荐级别
  if (score >= 60) {
    return RewardRarity.Legendary
  } else if (score >= 45) {
    return RewardRarity.Epic
  } else if (score >= 30) {
    return RewardRarity.Rare
  } else {
    return RewardRarity.Common
  }
}
