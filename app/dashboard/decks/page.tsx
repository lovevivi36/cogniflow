import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { DecksClient } from './page-client'

// 强制动态渲染，因为使用了 cookies 进行认证
export const dynamic = 'force-dynamic'

export default async function DecksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 获取用户的牌组（排除已删除的）
  const { data: decks } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null) // 只获取未删除的牌组
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">我的牌组</h1>
          <p className="text-muted-foreground">管理你的学习牌组</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/trash">回收站</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/decks/new">创建牌组</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {decks && decks.length > 0 ? (
        <DecksClient decks={decks} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              还没有牌组，开始创建你的第一个牌组吧！
            </p>
            <Button asChild>
              <Link href="/dashboard/decks/new">创建牌组</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}
