import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { FeynmanStudyClient } from './feynman-study-client'

interface PageProps {
  params: Promise<{ cardId: string }>
}

/**
 * 费曼学习页面
 * 左侧显示卡片，右侧是聊天窗口
 */
export default async function FeynmanStudyPage({ params }: PageProps) {
  const { cardId } = await params

  // 获取用户信息
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 获取卡片信息
  const { data: card, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .eq('user_id', user.id)
    .single()

  if (error || !card) {
    notFound()
  }

  return <FeynmanStudyClient card={card} userId={user.id} />
}
