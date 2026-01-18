/**
 * 奖励级别枚举
 */
export enum RewardRarity {
  Common = 'common', // 普通
  Rare = 'rare', // 精良
  Epic = 'epic', // 史诗
  Legendary = 'legendary', // 传说
}

/**
 * 奖励级别配置
 */
export const RARITY_CONFIG = {
  [RewardRarity.Common]: {
    name: '普通',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    weight: 50, // 默认权重
    icon: '⚪',
  },
  [RewardRarity.Rare]: {
    name: '精良',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    weight: 30,
    icon: '🔵',
  },
  [RewardRarity.Epic]: {
    name: '史诗',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    weight: 15,
    icon: '🟣',
  },
  [RewardRarity.Legendary]: {
    name: '传说',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    weight: 5,
    icon: '🟠',
  },
}

/**
 * 奖励项接口
 */
export interface RewardItem {
  id: string
  name: string
  description: string
  rarity: RewardRarity
  weight: number // 权重（0-100），用于随机分配
  icon?: string
  enabled: boolean // 是否启用
}

/**
 * 奖励库接口
 */
export interface RewardLibrary {
  items: RewardItem[]
  version: number
}
