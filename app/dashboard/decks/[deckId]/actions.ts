'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateCardSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
})

const deleteCardSchema = z.object({
  id: z.string().uuid(),
})

/**
 * 更新卡片内容
 */
export async function updateCard(input: z.infer<typeof updateCardSchema>) {
  try {
    const validated = updateCardSchema.parse(input)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: '未授权' }
    }

    // 更新卡片（同时更新 front, back 和 content 以兼容）
    const { error } = await supabase
      .from('cards')
      .update({
        content: validated.content,
        front: validated.content, // 兼容旧结构
        back: '', // 清空 back
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Update card error:', error)
      return { success: false, error: '更新失败' }
    }

    // 同步更新关联的学习计划（如果存在）
    const { data: studyPlans } = await supabase
      .from('study_plans')
      .select('id')
      .eq('card_id', validated.id)
      .eq('user_id', user.id)
      .in('status', ['pending', 'completed'])

    if (studyPlans && studyPlans.length > 0) {
      // 更新所有关联的学习计划标题
      await supabase
        .from('study_plans')
        .update({
          title: validated.content,
          updated_at: new Date().toISOString(),
        })
        .eq('card_id', validated.id)
        .eq('user_id', user.id)
    }

    revalidatePath('/dashboard/decks')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Update card error:', error)
    return { success: false, error: '更新失败' }
  }
}

/**
 * 软删除卡片（移动到回收站）
 */
export async function deleteCard(input: z.infer<typeof deleteCardSchema>) {
  try {
    const validated = deleteCardSchema.parse(input)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: '未授权' }
    }

    // 查找关联的学习计划
    const { data: studyPlans } = await supabase
      .from('study_plans')
      .select('id')
      .eq('card_id', validated.id)
      .eq('user_id', user.id)
      .in('status', ['pending', 'completed'])

    // 尝试软删除（如果数据库有 deleted_at 字段）
    // 先尝试软删除
    const { error: softDeleteError } = await supabase
      .from('cards')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (softDeleteError) {
      // 如果软删除失败（可能是数据库没有 deleted_at 字段），使用硬删除
      console.log('Soft delete not supported, using hard delete')
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', validated.id)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Delete card error:', deleteError)
        return { success: false, error: '删除失败' }
      }
    }

    // 如果有关联的学习计划，删除或取消它们
    if (studyPlans && studyPlans.length > 0) {
      await supabase
        .from('study_plans')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('card_id', validated.id)
        .eq('user_id', user.id)
    }

    revalidatePath('/dashboard/decks')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Delete card error:', error)
    return { success: false, error: '删除失败' }
  }
}
