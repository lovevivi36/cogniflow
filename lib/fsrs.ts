import { createEmptyCard, fsrs, Rating, State, type Card as FSRSCard, type Grade } from 'ts-fsrs'
import type { Card, FSRSResult, CardState } from './types/card'
import { FSRSRating } from './types/card'

/**
 * FSRS 调度器
 * 封装 ts-fsrs 库，提供卡片复习调度计算
 */
class FSRSScheduler {
  private fsrsInstance: ReturnType<typeof fsrs>

  constructor() {
    // 使用默认参数初始化 FSRS 实例
    // ts-fsrs 会自动使用论文中的默认权重参数
    this.fsrsInstance = fsrs()
  }

  /**
   * 将数据库卡片转换为 ts-fsrs 的 Card 格式
   */
  private cardToFSRSCard(card: Card): FSRSCard {
    // 如果卡片是新卡片（stability 为 0），返回空卡片
    if (card.stability === 0) {
      return createEmptyCard()
    }

    // 计算已过天数
    const now = new Date()
    const due = new Date(card.due_date)
    const elapsedDays = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))

    // 设置 FSRS 卡片状态
    const fsrsCard: FSRSCard = {
      due: new Date(card.due_date),
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: elapsedDays, // 虽然 deprecated，但类型要求
      scheduled_days: 0,
      learning_steps: 0,
      reps: 0,
      lapses: 0,
      state: card.state as unknown as State,
      last_review: card.updated_at ? new Date(card.updated_at) : new Date(),
    }

    return fsrsCard
  }


  /**
   * 将 FSRS Rating 转换为 ts-fsrs Grade
   */
  private ratingToFSRSGrade(rating: FSRSRating): Grade {
    const ratingMap: Record<FSRSRating, Grade> = {
      [FSRSRating.Again]: Rating.Again as Grade,
      [FSRSRating.Hard]: Rating.Hard as Grade,
      [FSRSRating.Good]: Rating.Good as Grade,
      [FSRSRating.Easy]: Rating.Easy as Grade,
    }
    return ratingMap[rating]
  }

  /**
   * 将 ts-fsrs 的 State 转换为我们的 CardState
   */
  private fsrsStateToCardState(state: State): CardState {
    // ts-fsrs 的 State 枚举：0=New, 1=Learning, 2=Review, 3=Relearning
    return state as unknown as CardState
  }

  /**
   * 计算下一次复习时间
   * 
   * @param card 当前卡片状态
   * @param rating 用户评分 (1:Again, 2:Hard, 3:Good, 4:Easy)
   * @returns 新的卡片状态（stability, difficulty, due_date, state）
   */
  calculateNextReview(card: Card, rating: FSRSRating): FSRSResult {
    try {
      const fsrsCard = this.cardToFSRSCard(card)
      const fsrsGrade = this.ratingToFSRSGrade(rating)
      
      // 调用 ts-fsrs 的 next 方法直接获取指定评分的下一次复习
      const recordLog = this.fsrsInstance.next(fsrsCard, new Date(), fsrsGrade)

      // 提取结果
      const result: FSRSResult = {
        stability: recordLog.card.stability,
        difficulty: recordLog.card.difficulty,
        due_date: recordLog.card.due,
        state: this.fsrsStateToCardState(recordLog.card.state),
      }

      return result
    } catch (error) {
      console.error('FSRS calculation error:', error)
      throw new Error('Failed to calculate next review date')
    }
  }

  /**
   * 获取默认的新卡片状态
   * 用于创建新卡片时的初始值
   */
  getDefaultNewCardState(): Omit<FSRSResult, 'state'> {
    const emptyCard = createEmptyCard()
    return {
      stability: 0,
      difficulty: 0,
      due_date: new Date(), // 新卡片立即可以学习
    }
  }
}

// 导出单例实例
export const fsrsScheduler = new FSRSScheduler()

// 导出便捷函数
export function calculateNextReview(card: Card, rating: FSRSRating): FSRSResult {
  return fsrsScheduler.calculateNextReview(card, rating)
}
