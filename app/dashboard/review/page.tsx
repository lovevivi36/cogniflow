import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReviewStats } from '@/components/review/review-stats'
import Link from 'next/link'

// 强制动态渲染，因为使用了 cookies 进行认证
export const dynamic = 'force-dynamic'

export default async function ReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 获取所有待复习的卡片（due_date <= 当前时间，排除已删除的）
  const { data: dueCards, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .lte('due_date', new Date().toISOString())
    .is('deleted_at', null) // 只获取未删除的卡片
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching due cards:', error)
  }

  const stateLabels = ['新卡片', '学习中', '复习中', '重新学习']

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">待复习卡片</h1>
        <p className="text-muted-foreground mt-2">
          共有 {dueCards?.length || 0} 张卡片需要复习
        </p>
      </div>

      {/* 复习统计和艾宾浩斯曲线 */}
      {dueCards && dueCards.length > 0 && (
        <div className="mb-6">
          <ReviewStats cards={dueCards} />
        </div>
      )}

      {dueCards && dueCards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dueCards.map((card) => {
            const cardContent = (card as any).content || `${(card as any).front || ''}\n\n${(card as any).back || ''}`.trim()
            
            return (
              <Card
                key={card.id}
                className="hover:shadow-lg transition-shadow border-slate-300 dark:border-slate-700"
              >
                <CardHeader>
                  <CardDescription>
                    状态：{stateLabels[card.state] || '未知'}
                    <span className="ml-2 text-slate-700 dark:text-slate-300 font-semibold">
                      · 待复习
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-4 mb-4">
                    {cardContent || '无内容'}
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/study/${card.id}`}>
                      开始复习
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              太棒了！目前没有需要复习的卡片。
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
