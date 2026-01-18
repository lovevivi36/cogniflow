/**
 * 卡片状态枚举
 * 0=New, 1=Learning, 2=Review, 3=Relearning
 */
export enum CardState {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

/**
 * FSRS 评分枚举
 * 1=Again, 2=Hard, 3=Good, 4=Easy
 */
export enum FSRSRating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

/**
 * 卡片数据结构（与数据库对应）
 */
export interface Card {
  id: string
  deck_id: string
  user_id: string
  front?: string // 问题（旧结构，可选以兼容新结构）
  back?: string // 核心定义（旧结构，可选以兼容新结构）
  content?: string // 学习内容（新结构，合并了 front 和 back）
  stability: number // 记忆稳定性（天数）
  difficulty: number // 记忆难度（1-10）
  due_date: string // ISO 8601 格式的时间戳
  state: CardState
  created_at: string
  updated_at: string
}

/**
 * FSRS 计算后的新卡片状态
 */
export interface FSRSResult {
  stability: number
  difficulty: number
  due_date: Date
  state: CardState
}
