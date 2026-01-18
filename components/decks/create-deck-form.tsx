'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function CreateDeckForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('请输入牌组名称')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // 获取当前用户
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('请先登录')
        router.push('/')
        return
      }

      // 创建牌组
      const { data, error } = await supabase
        .from('decks')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('牌组创建成功！')
      router.push(`/dashboard/decks/${data.id}`)
      router.refresh()
    } catch (error: any) {
      console.error('创建牌组错误:', error)
      
      // 提取错误信息
      let errorMessage = '创建失败，请重试'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.details) {
        errorMessage = error.details
      }
      
      // 将常见的英文错误信息转换为中文
      const errorMap: Record<string, string> = {
        'duplicate key value violates unique constraint': '该牌组名称已存在',
        'null value in column': '缺少必填字段',
        'permission denied': '权限不足，请检查登录状态',
        'new row violates row-level security policy': '权限不足，无法创建牌组',
      }
      
      // 检查是否匹配已知错误
      for (const [key, value] of Object.entries(errorMap)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
          errorMessage = value
          break
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              牌组名称 <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              placeholder="例如：编程基础、英语单词、数学公式"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              描述（可选）
            </label>
            <Input
              id="description"
              placeholder="简单描述这个牌组的用途"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? '创建中...' : '创建牌组'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
