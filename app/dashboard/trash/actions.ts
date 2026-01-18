'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const restoreCardSchema = z.object({
  id: z.string().uuid(),
})

const restoreDeckSchema = z.object({
  id: z.string().uuid(),
})

const permanentDeleteCardSchema = z.object({
  id: z.string().uuid(),
})

const permanentDeleteDeckSchema = z.object({
  id: z.string().uuid(),
})

/**
 * 恢复卡片
 */
export async function restoreCard(input: z.infer<typeof restoreCardSchema>) {
  try {
    const validated = restoreCardSchema.parse(input)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: '未授权' }
    }

    const { error } = await supabase
      .from('cards')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Restore card error:', error)
      return { success: false, error: '恢复失败' }
    }

    revalidatePath('/dashboard/trash')
    revalidatePath('/dashboard/decks')
    return { success: true }
  } catch (error) {
    console.error('Restore card error:', error)
    return { success: false, error: '恢复失败' }
  }
}

/**
 * 恢复牌组
 */
export async function restoreDeck(input: z.infer<typeof restoreDeckSchema>) {
  try {
    const validated = restoreDeckSchema.parse(input)
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
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Restore deck error:', error)
      return { success: false, error: '恢复失败' }
    }

    revalidatePath('/dashboard/trash')
    revalidatePath('/dashboard/decks')
    return { success: true }
  } catch (error) {
    console.error('Restore deck error:', error)
    return { success: false, error: '恢复失败' }
  }
}

/**
 * 永久删除卡片
 */
export async function permanentDeleteCard(input: z.infer<typeof permanentDeleteCardSchema>) {
  try {
    const validated = permanentDeleteCardSchema.parse(input)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: '未授权' }
    }

    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Permanent delete card error:', error)
      return { success: false, error: '删除失败' }
    }

    revalidatePath('/dashboard/trash')
    return { success: true }
  } catch (error) {
    console.error('Permanent delete card error:', error)
    return { success: false, error: '删除失败' }
  }
}

/**
 * 永久删除牌组
 */
export async function permanentDeleteDeck(input: z.infer<typeof permanentDeleteDeckSchema>) {
  try {
    const validated = permanentDeleteDeckSchema.parse(input)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: '未授权' }
    }

    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Permanent delete deck error:', error)
      return { success: false, error: '删除失败' }
    }

    revalidatePath('/dashboard/trash')
    return { success: true }
  } catch (error) {
    console.error('Permanent delete deck error:', error)
    return { success: false, error: '删除失败' }
  }
}
