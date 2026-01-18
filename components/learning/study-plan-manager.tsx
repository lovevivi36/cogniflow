'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Check, X, Calendar, Edit2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { StudyPlan } from '@/lib/types/study-plan'
import { StudyPlanStatus } from '@/lib/types/study-plan'
import type { Card as CardType } from '@/lib/types/card'
import type { Deck } from '@/lib/types/deck'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

interface StudyPlanManagerProps {
  userId: string
  cards?: CardType[] // 用于显示学习计划
  decks?: Deck[] // 牌组列表
}

/**
 * 统一的学习计划项（自定义计划 + 学习计划）
 */
interface UnifiedPlan {
  id: string
  title: string
  scheduled_date: string
  status: 'pending' | 'completed' | 'cancelled'
  completed_at?: string
  type: 'custom' | 'review' // 计划类型
  cardId?: string // 如果是学习计划，关联的卡片ID
  cardContent?: string // 卡片内容预览
}

/**
 * 学习计划管理组件
 * 合并显示自定义计划和学习计划
 */
export function StudyPlanManager({ userId, cards = [], decks = [] }: StudyPlanManagerProps) {
  const [customPlans, setCustomPlans] = useState<StudyPlan[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // 表单状态（标题、日期、牌组）
  const [formData, setFormData] = useState({
    title: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    deck_id: '',
  })

  // 加载自定义学习计划
  useEffect(() => {
    loadPlans()
  }, [userId])

  const loadPlans = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'completed'])
        .order('scheduled_date', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomPlans(data || [])
    } catch (error: any) {
      console.error('加载学习计划失败:', error)
      const errorMessage = error?.message || error?.code || JSON.stringify(error)
      
      // 检查是否是表不存在错误
      if (errorMessage.includes('study_plans') || errorMessage.includes('schema cache')) {
        toast.error('数据库表未创建，请在 Supabase 中执行迁移脚本')
        console.error('请执行迁移脚本：supabase/migrations/003_study_plans.sql')
      } else {
        toast.error('加载失败：' + errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 合并自定义计划和学习计划
  const unifiedPlans = useMemo(() => {
    const plans: UnifiedPlan[] = []

    // 添加自定义计划
    customPlans.forEach((plan) => {
      // 如果学习计划关联了卡片，检查卡片是否已被删除
      if (plan.card_id) {
        const associatedCard = cards.find((c) => c.id === plan.card_id)
        // 如果卡片不存在或已被删除，跳过该计划
        if (!associatedCard || (associatedCard as any).deleted_at) {
          return
        }
      }
      
      const deck = plan.deck_id ? decks.find((d) => d.id === plan.deck_id) : null
      plans.push({
        id: plan.id,
        title: plan.title + (deck ? ` (${deck.name})` : ''),
        scheduled_date: plan.scheduled_date,
        status: plan.status as 'pending' | 'completed' | 'cancelled',
        completed_at: plan.completed_at,
        type: 'custom',
      })
    })

    // 添加学习计划（基于卡片的 due_date）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + 30) // 显示未来30天的学习计划

    cards
      .filter((card) => {
        // 过滤已删除的卡片
        if ((card as any).deleted_at) {
          return false
        }
        const dueDate = new Date(card.due_date)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate >= today && dueDate <= futureDate
      })
      .forEach((card) => {
        const dueDate = new Date(card.due_date)
        const dateStr = dueDate.toISOString().split('T')[0]
        const cardContent = (card as any).content || `${(card as any).front || ''}\n\n${(card as any).back || ''}`.trim()
        const preview = cardContent.length > 50 ? cardContent.substring(0, 50) + '...' : cardContent

        plans.push({
          id: `study_${card.id}`,
          title: `学习：${preview}`,
          scheduled_date: dateStr,
          status: 'pending',
          type: 'review',
          cardId: card.id,
          cardContent: preview,
        })
      })

    // 按日期排序
      return plans.sort((a, b) => {
        if (a.scheduled_date !== b.scheduled_date) {
          return a.scheduled_date.localeCompare(b.scheduled_date)
        }
        // 同一天内，自定义计划优先
        if (a.type !== b.type) {
          return a.type === 'custom' ? -1 : 1
        }
        return 0
      })
    }, [customPlans, cards, decks])

  // 创建学习计划
  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入计划标题')
      return
    }

    if (!formData.scheduled_date) {
      toast.error('请选择计划日期')
      return
    }

    try {
      const supabase = createClient()
      
      // 创建学习计划
      const { data: planData, error: planError } = await supabase
        .from('study_plans')
        .insert({
          user_id: userId,
          title: formData.title.trim(),
          scheduled_date: formData.scheduled_date,
          deck_id: formData.deck_id || null,
          status: StudyPlanStatus.Pending,
        })
        .select()
        .single()

      if (planError) throw planError

      // 如果选择了牌组，在该牌组中创建对应的卡片
      let cardId: string | null = null
      if (formData.deck_id) {
        // 将 scheduled_date 转换为完整的时间戳（设置为当天的某个时间，比如上午9点）
        const scheduledDateTime = new Date(formData.scheduled_date)
        scheduledDateTime.setHours(9, 0, 0, 0) // 设置为上午9点

        const cardData = {
          deck_id: formData.deck_id,
          user_id: userId,
          content: formData.title.trim(),
          front: formData.title.trim(), // 兼容旧结构
          back: '', // 初始为空
          stability: 0,
          difficulty: 0,
          due_date: scheduledDateTime.toISOString(), // 使用计划日期作为学习日期
          state: 0, // New
        }

        const { data: cardDataResult, error: cardError } = await supabase
          .from('cards')
          .insert(cardData)
          .select()
          .single()

        if (cardError) {
          console.error('创建卡片失败:', cardError)
          // 即使卡片创建失败，学习计划已创建，所以只显示警告
          toast.warning('学习计划已创建，但创建对应卡片失败：' + cardError.message)
        } else {
          cardId = cardDataResult.id
          // 更新学习计划，关联卡片ID
          await supabase
            .from('study_plans')
            .update({ card_id: cardId })
            .eq('id', planData.id)
          
          toast.success('学习计划已创建，并在牌组中创建了对应卡片')
        }
      } else {
        toast.success('学习计划已创建')
      }

      setIsDialogOpen(false)
      setFormData({
        title: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        deck_id: '',
      })
      loadPlans()
      
      // 刷新页面以更新卡片列表
      if (cardId) {
        window.location.reload()
      }
    } catch (error: any) {
      console.error('创建学习计划失败:', error)
      const errorMessage = error?.message || error?.code || JSON.stringify(error)
      
      // 检查是否是表不存在错误
      if (errorMessage.includes('study_plans') || errorMessage.includes('schema cache')) {
        toast.error('数据库表未创建，请在 Supabase 中执行迁移脚本：supabase/migrations/003_study_plans.sql')
      } else {
        toast.error('创建失败：' + errorMessage)
      }
    }
  }

  // 开始编辑
  const handleStartEdit = (plan: UnifiedPlan) => {
    if (plan.type !== 'custom') {
      toast.error('只能编辑自定义计划')
      return
    }

    const customPlan = customPlans.find((p) => p.id === plan.id)
    if (customPlan) {
      setEditingId(plan.id)
      setFormData({
        title: customPlan.title,
        scheduled_date: customPlan.scheduled_date,
        deck_id: customPlan.deck_id || '',
      })
      setIsEditing(true)
      setIsDialogOpen(true)
    }
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingId) return

    if (!formData.title.trim()) {
      toast.error('请输入计划标题')
      return
    }

    if (!formData.scheduled_date) {
      toast.error('请选择计划日期')
      return
    }

    try {
      const supabase = createClient()
      
      // 获取当前学习计划，检查是否有关联的卡片
      const { data: currentPlan } = await supabase
        .from('study_plans')
        .select('card_id')
        .eq('id', editingId)
        .eq('user_id', userId)
        .single()

      // 更新学习计划
      const { error } = await supabase
        .from('study_plans')
        .update({
          title: formData.title.trim(),
          scheduled_date: formData.scheduled_date,
          deck_id: formData.deck_id || null,
        })
        .eq('id', editingId)
        .eq('user_id', userId)

      if (error) throw error

      // 如果学习计划有关联的卡片，同步更新卡片
      if (currentPlan?.card_id) {
        const scheduledDateTime = new Date(formData.scheduled_date)
        scheduledDateTime.setHours(9, 0, 0, 0)
        
        const { error: cardError } = await supabase
          .from('cards')
          .update({
            content: formData.title.trim(),
            front: formData.title.trim(),
            due_date: scheduledDateTime.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentPlan.card_id)
          .eq('user_id', userId)

        if (cardError) {
          console.error('更新关联卡片失败:', cardError)
          toast.warning('学习计划已更新，但更新关联卡片失败')
        }
      }

      toast.success('计划已更新')
      setIsDialogOpen(false)
      setIsEditing(false)
      setEditingId(null)
      setFormData({
        title: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        deck_id: '',
      })
      loadPlans()
      
      // 刷新页面以更新卡片列表
      if (currentPlan?.card_id) {
        window.location.reload()
      }
    } catch (error: any) {
      console.error('更新计划失败:', error)
      toast.error('更新失败：' + (error.message || '未知错误'))
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setIsDialogOpen(false)
    setIsEditing(false)
    setEditingId(null)
    setFormData({
      title: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      deck_id: '',
    })
  }

  // 完成计划
  const handleComplete = async (plan: UnifiedPlan) => {
    if (plan.type === 'review') {
      // 学习计划直接跳转到学习页面
      if (plan.cardId) {
        window.location.href = `/dashboard/study/${plan.cardId}`
      }
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('study_plans')
        .update({
          status: StudyPlanStatus.Completed,
          completed_at: new Date().toISOString(),
        })
        .eq('id', plan.id)
        .eq('user_id', userId)

      if (error) throw error

      toast.success('计划已完成！')
      loadPlans()
    } catch (error: any) {
      console.error('完成计划失败:', error)
      toast.error('操作失败：' + (error.message || '未知错误'))
    }
  }

  // 删除计划
  const handleDelete = async (plan: UnifiedPlan) => {
    if (plan.type !== 'custom') {
      toast.error('只能删除自定义计划')
      return
    }

    if (!confirm('确定要删除这个计划吗？如果计划关联了卡片，卡片也会被删除。')) return

    try {
      const supabase = createClient()
      
      // 获取学习计划，检查是否有关联的卡片
      const { data: currentPlan } = await supabase
        .from('study_plans')
        .select('card_id')
        .eq('id', plan.id)
        .eq('user_id', userId)
        .single()

      // 如果有关联的卡片，先删除卡片
      if (currentPlan?.card_id) {
        // 尝试软删除（如果数据库有 deleted_at 字段）
        const { error: softDeleteError } = await supabase
          .from('cards')
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentPlan.card_id)
          .eq('user_id', userId)

        if (softDeleteError) {
          // 如果软删除失败，使用硬删除
          const { error: deleteError } = await supabase
            .from('cards')
            .delete()
            .eq('id', currentPlan.card_id)
            .eq('user_id', userId)

          if (deleteError) {
            console.error('删除关联卡片失败:', deleteError)
            toast.warning('删除学习计划成功，但删除关联卡片失败')
          }
        }
      }

      // 删除学习计划
      const { error } = await supabase
        .from('study_plans')
        .update({
          status: StudyPlanStatus.Cancelled,
        })
        .eq('id', plan.id)
        .eq('user_id', userId)

      if (error) throw error

      toast.success('计划已删除')
      loadPlans()
      
      // 刷新页面以更新卡片列表
      if (currentPlan?.card_id) {
        window.location.reload()
      }
    } catch (error: any) {
      console.error('删除计划失败:', error)
      toast.error('操作失败：' + (error.message || '未知错误'))
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '明天'
    if (diffDays === -1) return '昨天'
    if (diffDays > 0 && diffDays <= 7) return `${diffDays}天后`
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}天前`
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  // 按日期分组计划
  const groupedPlans = useMemo(() => {
    return unifiedPlans.reduce((acc, plan) => {
      const date = plan.scheduled_date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(plan)
      return acc
    }, {} as Record<string, UnifiedPlan[]>)
  }, [unifiedPlans])

  return (
    <div className="space-y-6">
      {/* 创建计划按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">学习计划</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-normal">管理你的学习任务</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            handleCancelEdit()
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="rounded-full">
              <Plus className="h-4 w-4 mr-1.5" />
              创建学习计划
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? '编辑学习计划' : '创建学习计划'}</DialogTitle>
              <DialogDescription>
                {isEditing ? '修改你的学习计划' : '制定你的学习计划，比如"明天完成一篇5分钟的听力练习"'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">计划标题</label>
                <Input
                  placeholder="例如：完成一篇5分钟的听力练习"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">计划日期</label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">关联牌组（可选）</label>
                <Select
                  value={formData.deck_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, deck_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择牌组（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不关联牌组</SelectItem>
                    {decks.map((deck) => (
                      <SelectItem key={deck.id} value={deck.id}>
                        {deck.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  取消
                </Button>
                <Button onClick={isEditing ? handleSaveEdit : handleCreate}>
                  {isEditing ? '保存' : '创建'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 计划列表 */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">加载中...</div>
      ) : unifiedPlans.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 mx-auto mb-6 opacity-30 text-slate-400 dark:text-slate-600" />
          <p className="text-base text-slate-600 dark:text-slate-400 font-normal mb-2">还没有学习计划</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 font-normal">创建一个计划来开始你的学习之旅吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedPlans)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, datePlans]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(date)}</h4>
                </div>
                <div className="space-y-2">
                  {datePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`flex items-start justify-between p-4 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                        plan.status === StudyPlanStatus.Completed
                          ? 'bg-gradient-to-br from-green-50/60 to-green-100/40 dark:from-green-900/30 dark:to-green-800/20 border-green-200/60 dark:border-green-700/60'
                          : plan.type === 'review'
                          ? 'bg-gradient-to-br from-slate-100/60 to-slate-50/40 dark:from-slate-800/30 dark:to-slate-700/20 border-slate-300/60 dark:border-slate-600/60'
                          : 'bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 border-slate-200/60 dark:border-slate-700/60 hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-800/50'
                      }`}
                    >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">{plan.title}</span>
                            {plan.type === 'review' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex-shrink-0 font-medium">
                                学习
                              </span>
                            )}
                            {plan.type === 'custom' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0 font-medium">
                                自定义
                              </span>
                            )}
                          </div>
                          {plan.status === StudyPlanStatus.Completed && plan.completed_at && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-normal">
                              已完成于 {new Date(plan.completed_at).toLocaleString('zh-CN')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {plan.status === StudyPlanStatus.Pending && (
                            <>
                              {plan.type === 'custom' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStartEdit(plan)}
                                  className="h-8 w-8 rounded-full"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleComplete(plan)}
                                className="h-8 w-8 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              {plan.type === 'review' && plan.cardId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="h-8 px-3 text-xs rounded-full"
                                >
                                  <Link href={`/dashboard/study/${plan.cardId}`}>
                                    开始学习
                                  </Link>
                                </Button>
                              )}
                            </>
                          )}
                          {/* 自定义计划无论状态如何都可以删除 */}
                          {plan.type === 'custom' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(plan)}
                              className="h-8 w-8 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
