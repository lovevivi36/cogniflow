'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateNextReview } from '@/lib/fsrs'
import { FSRSRating } from '@/lib/types/card'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const submitReviewSchema = z.object({
  cardId: z.string().uuid(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  cardContent: z.string(),
})

/**
 * 提交费曼复习结果
 * 第一步：AI 评分
 * 第二步：FSRS 算法更新
 * 第三步：数据库更新
 * 第四步：返回结果
 */
export async function submitFeynmanReview(
  input: z.infer<typeof submitReviewSchema>
) {
  try {
    // 验证输入
    const validated = submitReviewSchema.parse(input)

    // 获取用户
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: '未授权' }
    }

    // 第一步：AI 评分
    const gradingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/grade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: validated.messages,
        cardContent: validated.cardContent,
      }),
    })

    if (!gradingResponse.ok) {
      return { success: false, error: '评分失败' }
    }

    const { rating } = await gradingResponse.json()

    if (!rating || rating < 1 || rating > 4) {
      return { success: false, error: '无效的评分' }
    }

    // 获取当前卡片
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', validated.cardId)
      .eq('user_id', user.id)
      .single()

    if (cardError || !card) {
      return { success: false, error: '卡片不存在' }
    }

    // 第二步：FSRS 算法更新
    const fsrsResult = calculateNextReview(card, rating as FSRSRating)

    // 第三步：数据库更新
    // 更新卡片
    const { error: updateError } = await supabase
      .from('cards')
      .update({
        stability: fsrsResult.stability,
        difficulty: fsrsResult.difficulty,
        due_date: fsrsResult.due_date.toISOString(),
        state: fsrsResult.state,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.cardId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update card error:', updateError)
      return { success: false, error: '更新卡片失败' }
    }

    // 创建学习日志
    const { error: logError } = await supabase.from('study_logs').insert({
      card_id: validated.cardId,
      user_id: user.id,
      rating: rating,
      feynman_logs: {
        messages: validated.messages,
        cardContent: validated.cardContent,
      },
    })

    if (logError) {
      console.error('Create log error:', logError)
      // 日志创建失败不影响主流程，只记录错误
    }

    // 第四步：返回结果
    revalidatePath('/dashboard')
    
    return {
      success: true,
      rating,
      nextReviewDate: fsrsResult.due_date.toISOString(),
      stability: fsrsResult.stability,
      difficulty: fsrsResult.difficulty,
    }
  } catch (error) {
    console.error('Submit review error:', error)
    return { success: false, error: '服务器错误' }
  }
}
