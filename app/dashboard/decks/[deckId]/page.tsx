import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { CreateCardForm } from '@/components/cards/create-card-form'
import { DeckDetailClient } from './page-client'

interface PageProps {
  params: Promise<{ deckId: string }>
}

export default async function DeckDetailPage({ params }: PageProps) {
  const { deckId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 获取牌组信息
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (deckError || !deck) {
    notFound()
  }

  // 获取牌组中的卡片（排除已删除的）
  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .eq('deck_id', deckId)
    .eq('user_id', user.id)
    .is('deleted_at', null) // 只获取未删除的卡片
    .order('created_at', { ascending: false })

  // 计算待复习的卡片数量
  const dueCards = cards?.filter(
    (card) => new Date(card.due_date) <= new Date()
  ) || []

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{deck.name}</h1>
          {deck.description && (
            <p className="text-muted-foreground mt-1">{deck.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/decks">返回牌组列表</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">总卡片数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cards?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">待复习</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dueCards.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">已学习</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {cards?.filter((c) => c.state !== 0).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 创建新卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>添加新卡片</CardTitle>
          <CardDescription>
            创建一个新的概念卡片开始学习
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateCardForm deckId={deckId} />
        </CardContent>
      </Card>

      {/* 卡片列表 */}
      {cards && cards.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">卡片列表</h2>
          <DeckDetailClient cards={cards} />
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              这个牌组还没有卡片，创建你的第一张卡片开始学习吧！
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}
