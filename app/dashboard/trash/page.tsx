import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { TrashClient } from './page-client'

// 强制动态渲染，因为使用了 cookies 进行认证
export const dynamic = 'force-dynamic'

/**
 * 回收站页面
 * 显示已删除的卡片和牌组（如果数据库支持软删除）
 * 注意：当前实现为硬删除，回收站功能需要数据库支持 deleted_at 字段
 */
export default async function TrashPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 获取已删除的卡片和牌组
  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null) // 只获取已删除的卡片
    .order('deleted_at', { ascending: false })

  const { data: decks } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null) // 只获取已删除的牌组
    .order('deleted_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trash2 className="h-8 w-8" />
            回收站
          </h1>
          <p className="text-muted-foreground mt-2">
            已删除的卡片和牌组可以在这里恢复
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard">返回学习中心</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {/* 提示信息 */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            💡 提示：已删除的卡片和牌组会保留在回收站中，可以恢复或永久删除。
            {(!cards || cards.length === 0) && (!decks || decks.length === 0) && (
              <span className="block mt-2">如需启用回收站功能，请在 Supabase 中执行迁移脚本 <code className="bg-muted px-1 rounded">002_add_soft_delete.sql</code></span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* 已删除的卡片 */}
      {cards && cards.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>已删除的卡片 ({cards.length})</CardTitle>
            <CardDescription>可以恢复或永久删除</CardDescription>
          </CardHeader>
          <CardContent>
            <TrashClient cards={cards} decks={[]} />
          </CardContent>
        </Card>
      )}

      {/* 已删除的牌组 */}
      {decks && decks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>已删除的牌组 ({decks.length})</CardTitle>
            <CardDescription>可以恢复或永久删除</CardDescription>
          </CardHeader>
          <CardContent>
            <TrashClient cards={[]} decks={decks} />
          </CardContent>
        </Card>
      )}

      {(!cards || cards.length === 0) && (!decks || decks.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              回收站为空
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard">返回学习中心</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}
