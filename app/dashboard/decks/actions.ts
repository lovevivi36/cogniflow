'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateDeckSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
})

const deleteDeckSchema = z.object({
  id: z.string().uuid(),
})

/**
 * 更新牌组
 */
export async function updateDeck(input: z.infer<typeof updateDeckSchema>) {
  try {
    const validated = updateDeckSchema.parse(input)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: '未授权' }
    }

    const { error } = await supabase
      .from('decks')
      .update({
        name: validated.name,
        description: validated.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Update deck error:', error)
      return { success: false, error: '更新失败' }
    }

    revalidatePath('/dashboard/decks')
    return { success: true }
  } catch (error) {
    console.error('Update deck error:', error)
    return { success: false, error: '更新失败' }
  }
}

/**
 * 删除牌组（软删除，如果数据库支持）
 */
export async function deleteDeck(input: z.infer<typeof deleteDeckSchema>) {
  try {
    const validated = deleteDeckSchema.parse(input)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: '未授权' }
    }

    // 先检查牌组下是否有未删除的卡片
    const { data: cards } = await supabase
      .from('cards')
      .select('id')
      .eq('deck_id', validated.id)
      .eq('user_id', user.id)
      .is('deleted_at', null) // 只检查未删除的卡片
      .limit(1)

    if (cards && cards.length > 0) {
      return { success: false, error: '牌组中还有卡片，请先删除所有卡片' }
    }

    // 尝试软删除（如果数据库有 deleted_at 字段）
    const { error: softDeleteError } = await supabase
      .from('decks')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (softDeleteError) {
      // 如果软删除失败（可能是数据库没有 deleted_at 字段），使用硬删除
      console.log('Soft delete not supported, using hard delete')
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', validated.id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Delete deck error:', error)
        return { success: false, error: '删除失败' }
      }
    }

    revalidatePath('/dashboard/decks')
    return { success: true }
  } catch (error) {
    console.error('Delete deck error:', error)
    return { success: false, error: '删除失败' }
  }
}
