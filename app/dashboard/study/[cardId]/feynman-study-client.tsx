'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/cards/file-upload'
import { submitFeynmanReview } from './actions'
import { toast } from 'sonner'
import { VoiceChat } from '@/components/voice/voice-chat'
import { X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { calculateReward } from '@/lib/rewards'
import { createClient } from '@/lib/supabase/client'
import type { Card as CardType } from '@/lib/types/card'
import { RewardDialog } from '@/components/learning/reward-dialog'
import { saveRewardHistory } from '@/lib/reward-history'

interface FeynmanStudyClientProps {
  card: CardType
  userId?: string // 用户ID，用于加载奖励库
}

/**
 * 费曼学习客户端组件
 * 左侧显示卡片，右侧是聊天窗口
 */
export function FeynmanStudyClient({ card, userId }: FeynmanStudyClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [input, setInput] = useState('')
  const [continuousMode, setContinuousMode] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(new Set())
  const lastAssistantMessageRef = useRef<string>('')
  const speakRef = useRef<((text: string) => void) | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 奖励弹窗状态
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false)
  const [rewardResult, setRewardResult] = useState<{
    rewardItem?: any
    message?: string
    type?: 'super' | 'normal' | 'encouragement' | 'none'
    bonus?: number
  } | null>(null)

  // 使用 Vercel AI SDK 的 useChat
  const cardContent = (card as any).content || `${(card as any).front || ''}\n\n${(card as any).back || ''}`.trim()
  
  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/chat',
      // 使用函数形式确保每次请求都包含最新的 cardContent
      body: () => ({
        cardContent: cardContent,
      }),
    }),
    onError: (error) => {
      console.error('Chat error:', error)
      toast.error('对话出错：' + (error.message || '请重试'))
    },
  })

  // 自动朗读 AI 回复
  useEffect(() => {
    const assistantMessages = messages.filter((msg) => msg.role === 'assistant')
    if (assistantMessages.length > 0) {
      const lastMessage = assistantMessages[assistantMessages.length - 1]
      const textContent = lastMessage.parts
        .filter((part) => part.type === 'text')
        .map((part) => (part as { type: 'text'; text: string }).text)
        .join('')

      // 只有当消息完整且是新消息时才朗读
      if (textContent && textContent !== lastAssistantMessageRef.current && status === 'ready') {
        lastAssistantMessageRef.current = textContent
        // 延迟一下，确保消息已完全显示
        setTimeout(() => {
          if (speakRef.current) {
            speakRef.current(textContent)
          }
        }, 500)
      }
    }
  }, [messages, status])
  
  // 重写 sendMessage 以确保 cardContent 被传递
  const sendMessageWithCardContent = (message: { text: string }) => {
    return sendMessage(message, {
      body: {
        cardContent: cardContent,
      },
    })
  }

  // 在组件挂载时发送初始消息（由 AI 自动发送）
  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        // 发送一条用户消息，触发 AI 回复
        sendMessageWithCardContent({ text: '你好' })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSubmitting) return

    const userMessage = input.trim()
    setInput('')
    sendMessageWithCardContent({ text: userMessage })
  }

  const handleDeleteMessage = (messageId: string) => {
    setDeletedMessageIds((prev) => new Set(prev).add(messageId))
  }

  const handleComplete = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      // 调用 Server Action 进行评分和更新
      // 过滤掉已删除的消息
      const filteredMessages = messages.filter((m) => !deletedMessageIds.has(m.id))
      
      const result = await submitFeynmanReview({
        cardId: card.id,
        messages: filteredMessages
          .map((m) => {
            const content = m.parts
              .filter((part) => part.type === 'text')
              .map((part) => (part as { type: 'text'; text: string }).text)
              .join('')
            
            // 过滤掉 system 消息，只保留 user 和 assistant
            if (m.role === 'system') return null
            
            return {
              role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
              content: content,
            }
          })
          .filter((m): m is { role: 'user' | 'assistant'; content: string } => 
            m !== null && m.content.trim().length > 0
          ),
        cardContent: cardContent,
      })

      if (result.success && result.nextReviewDate) {
        const daysUntilNext = Math.ceil(
          (new Date(result.nextReviewDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )

        // 🎉 庆祝动画 - Confetti
        const triggerConfetti = () => {
          const duration = 3000
          const animationEnd = Date.now() + duration
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

          const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

          const interval: NodeJS.Timeout = setInterval(() => {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
              return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)
            
            // 从左侧发射
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            })
            
            // 从右侧发射
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            })
          }, 250)
        }

        triggerConfetti()

        // 🎲 不确定性奖励机制 - 使用奖励库
        // 获取用户ID和连续学习天数（如果未传入）
        let currentUserId = userId
        let consecutiveDays = 0
        
        if (!currentUserId) {
          try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            currentUserId = user?.id
            
            // 获取用户的连续学习天数
            if (user?.id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('streak')
                .eq('id', user.id)
                .single()
              
              if (profile) {
                consecutiveDays = profile.streak || 0
              }
            }
          } catch (error) {
            // 获取用户信息失败，使用默认值
          }
        } else {
          // 如果已有 userId，直接获取 streak
          try {
            const supabase = createClient()
            const { data: profile } = await supabase
              .from('profiles')
              .select('streak')
              .eq('id', currentUserId)
              .single()
            
            if (profile) {
              consecutiveDays = profile.streak || 0
            }
          } catch (error) {
            // 获取连续学习天数失败，使用默认值
          }
        }

        // 计算奖励（使用奖励库）
        const rewardResult = calculateReward(
          result.rating || 3,
          result.stability || 0,
          consecutiveDays,
          currentUserId
        )

        // 根据评分显示不同的消息
        const ratingMessages: Record<number, string> = {
          4: '🌟 完美！你完全理解了！',
          3: '👍 很好！理解得很到位！',
          2: '💡 不错，继续努力！',
          1: '📚 没关系，多复习几次就会更好！',
        }

        const mainMessage = ratingMessages[result.rating || 3] || '学习完成！'
        
        // 如果获得了奖励，显示奖励弹窗
        if (rewardResult.type !== 'none' && rewardResult.message) {
          // 保存奖励历史记录
          if (rewardResult.rewardItem && currentUserId) {
            saveRewardHistory(
              currentUserId,
              rewardResult.rewardItem,
              rewardResult.bonus
            )
          }
          
          setRewardResult({
            rewardItem: rewardResult.rewardItem,
            message: rewardResult.message,
            type: rewardResult.type,
            bonus: rewardResult.bonus,
          })
          setRewardDialogOpen(true)
        } else {
          // 没有奖励时，显示完成消息
          let fullMessage = mainMessage
          if (consecutiveDays > 0) {
            fullMessage = `${mainMessage} 🔥 连续学习 ${consecutiveDays} 天！`
          }
          fullMessage += ` 下次复习：${daysUntilNext} 天后`
          
          toast.success(fullMessage, { duration: 5000 })
          
          // 延迟跳转，让用户看到提示
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 2000)
        }
      } else {
        toast.error(result.error || '提交失败，请重试')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理奖励弹窗关闭
  const handleRewardDialogClose = (open: boolean) => {
    setRewardDialogOpen(open)
    if (!open && rewardResult) {
      // 弹窗关闭后，延迟跳转
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 奖励弹窗 */}
      {rewardResult && (
        <RewardDialog
          open={rewardDialogOpen}
          onOpenChange={handleRewardDialogClose}
          rewardItem={rewardResult.rewardItem}
          message={rewardResult.message}
          type={rewardResult.type}
          bonus={rewardResult.bonus}
        />
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          {/* 左侧：卡片显示 */}
          <div className="flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>概念卡片</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    学习内容
                  </h3>
                  <div className="whitespace-pre-wrap text-base">
                    {cardContent}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：聊天窗口 */}
          <div className="flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>与 AI 助手对话</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto space-y-4" ref={messagesEndRef}>
                  {messages
                    .filter((msg) => !deletedMessageIds.has(msg.id)) // 过滤已删除的消息
                    .map((message, index) => {
                      const isUser = (message.role as string) === 'user'
                      const textContent = message.parts
                        .filter((part) => part.type === 'text')
                        .map((part) => (part as { type: 'text'; text: string }).text)
                        .join('')

                      return (
                        <div
                          key={message.id || index}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              isUser
                                ? 'bg-slate-800 text-white dark:bg-slate-700'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 whitespace-pre-wrap text-sm">
                                {textContent}
                              </div>
                              {!isUser && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 flex-shrink-0"
                                  onClick={() => handleDeleteMessage(message.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>

                {/* 输入区域 */}
                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="向 AI 解释这个概念..."
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmit(e)
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <FileUpload
                      onFilesChange={setAttachedFiles}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!input.trim() || isSubmitting || status !== 'ready'}
                      >
                        {isSubmitting ? '提交中...' : '发送'}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleComplete}
                        disabled={isSubmitting}
                        variant="default"
                      >
                        完成学习
                      </Button>
                    </div>
                  </div>
                </form>

                {/* 语音聊天 */}
                <VoiceChat
                  onTranscript={(text) => {
                    setInput((prev) => prev + (prev ? ' ' : '') + text)
                  }}
                  onSpeak={(speakFn: any) => {
                    if (typeof speakFn === 'function') {
                      speakRef.current = speakFn
                    } else if (speakFn && typeof speakFn.speak === 'function') {
                      speakRef.current = speakFn.speak
                    }
                  }}
                  autoSpeak={true}
                  continuousMode={continuousMode}
                  onContinuousModeChange={setContinuousMode}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
