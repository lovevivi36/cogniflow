/**
 * 学习计划类型
 */
export interface StudyPlan {
  id: string
  user_id: string
  title: string
  description?: string
  plan_type: string
  duration_minutes?: number
  scheduled_date: string // ISO date string (YYYY-MM-DD)
  completed_at?: string // ISO timestamp
  status: 'pending' | 'completed' | 'cancelled'
  deck_id?: string | null // 关联的牌组ID
  card_id?: string | null // 关联的卡片ID（如果学习计划创建了卡片）
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * 学习计划类型枚举
 */
export enum StudyPlanType {
  Custom = 'custom',
  Listening = 'listening',
  Reading = 'reading',
  Vocabulary = 'vocabulary',
  Writing = 'writing',
  Speaking = 'speaking',
}

/**
 * 学习计划状态
 */
export enum StudyPlanStatus {
  Pending = 'pending',
  Completed = 'completed',
  Cancelled = 'cancelled',
}
