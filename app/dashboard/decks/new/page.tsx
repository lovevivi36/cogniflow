import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateDeckForm } from '@/components/decks/create-deck-form'

export default async function NewDeckPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">创建新牌组</h1>
        <p className="text-muted-foreground mt-2">
          创建一个新的牌组来组织你的学习卡片
        </p>
      </div>

      <CreateDeckForm />
      </div>
    </div>
  )
}
