import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Home() {
  // 检查用户是否已登录
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 如果用户已登录，重定向到仪表板
  if (user) {
    redirect('/dashboard')
  }

  // 如果用户未登录，显示登录界面
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* 主卡片 */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-light tracking-tight">
                CogniFlow
              </CardTitle>
              <CardDescription className="text-lg mt-2 font-light">
                结合 FSRS 记忆算法与费曼学习法的深度学习工具
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 text-center">
                <p className="text-slate-600 dark:text-slate-400 font-light">
                  通过"教 AI"来学习，让知识真正内化
                </p>
              </div>
              <div className="flex justify-center pt-4">
                <AuthDialog />
              </div>
            </CardContent>
          </Card>

          {/* 使用指南 */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>如何使用 CogniFlow？</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">创建概念卡片</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                      在牌组中创建卡片，输入"问题"和"核心定义"
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">进入费曼模式</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                      点击卡片开始学习，向 AI（Feyn）解释这个概念
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">AI 评分与复习</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                      AI 会根据你的解释质量评分，系统自动计算下次复习时间
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold">持续复习</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                      系统会根据 FSRS 算法提醒你复习，让知识真正内化
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
