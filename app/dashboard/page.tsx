import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { DashboardClient } from './page-client'

// 强制动态渲染，因为使用了 cookies 进行认证
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error:', authError)
      redirect('/')
    }

    if (!user) {
      redirect('/')
    }

  // 获取用户的牌组
  const { data: decks } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 获取所有卡片（排除已删除的）
  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null) // 只获取未删除的卡片

  // 获取待学习的卡片数量（排除已删除的）
  const { count: dueCardsCount } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('due_date', new Date().toISOString())
    .is('deleted_at', null) // 只统计未删除的卡片

  // 获取学习日志（用于日历和统计）
  const { data: studyLogs } = await supabase
    .from('study_logs')
    .select('review_time, rating')
    .eq('user_id', user.id)
    .order('review_time', { ascending: false })

  // 处理学习日志数据
  const processedLogs = studyLogs
    ? studyLogs.map((log) => ({
        date: log.review_time,
        count: 1, // 每条日志代表一次学习
        rating: log.rating,
      }))
    : []

  // 按日期聚合学习日志
  const aggregatedLogs = processedLogs.reduce((acc, log) => {
    const date = new Date(log.date).toISOString().split('T')[0]
    const existing = acc.find((l) => l.date.startsWith(date))
    if (existing) {
      existing.count += log.count
      existing.rating = (existing.rating + log.rating) / 2 // 平均评分
    } else {
      acc.push({ ...log, date })
    }
    return acc
  }, [] as typeof processedLogs)

  // 计算学习统计
  const calculateStreak = (logs: typeof processedLogs): number => {
    if (logs.length === 0) return 0

    const sortedLogs = [...logs]
      .filter((log) => log.count > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (sortedLogs.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i].date)
      logDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)

      if (logDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const studyStats = {
    totalCompleted: processedLogs.length,
    currentStreak: calculateStreak(aggregatedLogs),
    longestStreak: calculateStreak(aggregatedLogs), // 简化版本，可以后续优化
  }

  // 获取用户邮箱的显示名称
  const userDisplayName = user.email?.split('@')[0] || '用户'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* 极简 Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-medium tracking-tight text-slate-900 dark:text-slate-100 mb-2">
              学习中心
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 font-normal">
              欢迎回来，{userDisplayName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/dashboard/trash">回收站</Link>
            </Button>
            <LogoutButton />
          </div>
        </div>

        {/* Bento Grid 主内容区 */}
        <div className="mb-12">
          <DashboardClient
            cards={cards || []}
            studyLogs={aggregatedLogs}
            userId={user.id}
            studyStats={studyStats}
            decks={decks || []}
          />
        </div>

        {/* 快速统计卡片 - 药丸形状 */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-8 shadow-enhanced-lg hover:shadow-enhanced-xl transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">待学习卡片</h3>
              <div className="text-5xl font-medium text-slate-900 dark:text-slate-100 mb-6">
                {dueCardsCount || 0}
              </div>
            </div>
            {dueCardsCount && dueCardsCount > 0 && (
              <Button asChild size="lg" className="w-full rounded-full shadow-md hover:shadow-lg">
                <Link href="/dashboard/review">开始学习</Link>
              </Button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-8 shadow-enhanced-lg hover:shadow-enhanced-xl transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">我的牌组</h3>
              <div className="text-5xl font-medium text-slate-900 dark:text-slate-100 mb-6">
                {decks?.length || 0}
              </div>
            </div>
            <Button asChild variant="outline" size="lg" className="w-full rounded-full shadow-sm hover:shadow-md">
              <Link href="/dashboard/decks">管理牌组</Link>
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-8 shadow-enhanced-lg hover:shadow-enhanced-xl transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">快速开始</h3>
              <div className="text-5xl font-medium text-slate-900 dark:text-slate-100 mb-6">
                +
              </div>
            </div>
            <Button asChild size="lg" className="w-full rounded-full shadow-md hover:shadow-lg">
              <Link href="/dashboard/decks/new">创建牌组</Link>
            </Button>
          </div>
        </div>

        {/* 牌组列表 - 药丸形状卡片 */}
        {decks && decks.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-8 shadow-enhanced-lg mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">我的牌组</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">点击牌组查看其中的卡片</p>
            </div>
            <div className="space-y-3">
              {decks.map((deck) => (
                <Link
                  key={deck.id}
                  href={`/dashboard/decks/${deck.id}`}
                  className="block rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-5 hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-800/50 transition-all duration-300 hover:shadow-md"
                >
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {deck.name}
                  </h3>
                  {deck.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                      {deck.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {(!decks || decks.length === 0) && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-16 shadow-enhanced-lg text-center mb-12">
            <p className="text-base text-slate-600 dark:text-slate-400 mb-6 font-normal">
              还没有牌组，开始创建你的第一个牌组吧！
            </p>
            <Button asChild size="lg" className="rounded-full shadow-md hover:shadow-lg">
              <Link href="/dashboard/decks/new">创建牌组</Link>
            </Button>
          </div>
        )}

        {/* Action Dock - 底部操作栏 */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-700/60 rounded-full px-6 py-4 shadow-enhanced-xl flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/dashboard/review">复习</Link>
            </Button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/dashboard/decks">牌组</Link>
            </Button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/dashboard/decks/new">新建</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
  } catch (error) {
    console.error('Dashboard page error:', error)
    // 如果出现错误，重定向到首页
    redirect('/')
  }
}
