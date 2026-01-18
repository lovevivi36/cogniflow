'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { FileUpload } from './file-upload'

interface CreateCardFormProps {
  deckId: string
}

export function CreateCardForm({ deckId }: CreateCardFormProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error('请输入学习内容')
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

      // 创建卡片（新卡片，due_date 设为当前时间，可以立即学习）
      const cardData = {
        deck_id: deckId,
        user_id: user.id,
        content: content.trim(),
        stability: 0,
        difficulty: 0,
        due_date: new Date().toISOString(), // 新卡片可以立即学习
        state: 0, // New
      }

      // 为了兼容数据库结构，同时提供 front, back 和 content
      // 如果数据库迁移已完成，content 会被使用；否则使用 front 和 back
      const cardDataWithFields = {
        ...cardData,
        front: content.trim(), // 兼容旧结构
        back: '', // 初始为空，后续可以通过 AI 生成
        content: content.trim(), // 新结构
      }

      const { data, error } = await supabase
        .from('cards')
        .insert(cardDataWithFields)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        // Supabase 错误对象可能包含多种格式的错误信息
        let errorMessage = '未知错误'
        
        if (error.message) {
          errorMessage = error.message
        } else if (error.details) {
          errorMessage = error.details
        } else if (error.hint) {
          errorMessage = error.hint
        } else if (typeof error === 'string') {
          errorMessage = error
        } else if (error.code) {
          errorMessage = `错误代码: ${error.code}`
        }
        
        throw new Error(errorMessage)
      }

      toast.success('卡片创建成功！')
      setContent('')
      router.refresh()
    } catch (error: any) {
      console.error('创建卡片错误:', error)
      
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
        'duplicate key value violates unique constraint': '该卡片已存在',
        'violates foreign key constraint': '牌组不存在',
        'null value in column': '缺少必填字段',
        'permission denied': '权限不足，请检查登录状态',
        'new row violates row-level security policy': '权限不足，无法创建卡片',
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium">
          学习内容 <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="content"
          className="min-h-[120px] resize-y"
          placeholder="输入你想要学习的内容，可以是问题、概念、知识点等。AI 会根据这个内容与你对话。"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          disabled={isLoading}
          rows={5}
        />
        <p className="text-xs text-muted-foreground">
          输入任何你想学习的内容，AI 会根据这个内容与你对话并帮助你理解
        </p>
        
        {/* 文件上传 */}
        <FileUpload
          onFilesChange={setAttachedFiles}
          maxFiles={5}
          maxSize={10}
        />
        {attachedFiles.length > 0 && (
          <p className="text-xs text-muted-foreground">
            已选择 {attachedFiles.length} 个文件（文件上传功能开发中，当前仅保存文件名）
          </p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? '创建中...' : '创建卡片'}
      </Button>
    </form>
  )
}
