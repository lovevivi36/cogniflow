'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      toast.success('已退出登录')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      console.error('Logout error:', error)
      toast.error('退出失败，请重试')
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      退出登录
    </Button>
  )
}
