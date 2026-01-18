'use client'

import { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import type { Card as CardType } from '@/lib/types/card'
import type { StudyPlan } from '@/lib/types/study-plan'

interface LearningCalendarProps {
  cards: CardType[]
  studyLogs: Array<{
    date: string
    count: number
    rating: number
  }>
  userId: string
}

/**
 * 学习日历组件
 * 显示每日的学习计划和待学习卡片
 */
export function LearningCalendar({
  cards,
  studyLogs,
  userId,
}: LearningCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [customPlans, setCustomPlans] = useState<StudyPlan[]>([])

  // 加载自定义学习计划
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('study_plans')
          .select('*')
          .eq('user_id', userId)
          .in('status', ['pending', 'completed'])

        if (error) throw error
        setCustomPlans(data || [])
      } catch (error) {
        console.error('加载学习计划失败:', error)
      }
    }

    loadPlans()
  }, [userId])

  // 获取当前月份的第一天和最后一天
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // 计算待学习的卡片（排除已删除的）
  const dueCards = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return cards.filter((card) => {
      // 过滤已删除的卡片
      if ((card as any).deleted_at) {
        return false
      }
      
      const dueDate = new Date(card.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate >= today
    })
  }, [cards])

  // 按日期分组待学习卡片
  const cardsByDate = useMemo(() => {
    const grouped: Record<string, CardType[]> = {}
    
    dueCards.forEach((card) => {
      const dueDate = new Date(card.due_date)
      const dateStr = dueDate.toISOString().split('T')[0]
      if (!grouped[dateStr]) {
        grouped[dateStr] = []
      }
      grouped[dateStr].push(card)
    })
    
    return grouped
  }, [dueCards])

  // 按日期分组自定义计划
  const plansByDate = useMemo(() => {
    const grouped: Record<string, StudyPlan[]> = {}
    
    customPlans.forEach((plan) => {
      // 如果学习计划关联了卡片，检查卡片是否已被删除
      if (plan.card_id) {
        const associatedCard = cards.find((c) => c.id === plan.card_id)
        // 如果卡片不存在或已被删除，跳过该计划
        if (!associatedCard || (associatedCard as any).deleted_at) {
          return
        }
      }
      
      const dateStr = plan.scheduled_date
      if (!grouped[dateStr]) {
        grouped[dateStr] = []
      }
      grouped[dateStr].push(plan)
    })
    
    return grouped
  }, [customPlans, cards])

  // 获取某一天的学习内容
  const getDayContent = (day: number) => {
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayCards = cardsByDate[dateStr] || []
    const dayPlans = plansByDate[dateStr] || []
    
    return {
      cards: dayCards,
      plans: dayPlans,
      hasContent: dayCards.length > 0 || dayPlans.length > 0,
    }
  }

  // 获取某一天的学习日志
  const getDayLogs = (day: number) => {
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]
    return studyLogs.filter((log) => log.date.startsWith(dateStr))
  }

  // 生成日历天数数组
  const calendarDays = useMemo(() => {
    const days: Array<{ day: number; isCurrentMonth: boolean }> = []
    
    // 上个月的最后几天
    const prevMonth = new Date(year, month, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false })
    }
    
    // 当前月的天数
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true })
    }
    
    // 下个月的前几天（补齐到 6 行）
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ day, isCurrentMonth: false })
    }
    
    return days
  }, [year, month, daysInMonth, startingDayOfWeek])

  // 月份导航
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 格式化月份标题
  const monthTitle = `${year}年${month + 1}月`

  // 星期标题
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  // 工具提示内容
  const tooltipContent = (day: number) => {
    const content = getDayContent(day)
    const logs = getDayLogs(day)
    
    if (content.plans.length === 0 && content.cards.length === 0 && logs.length === 0) {
      return null
    }
    
    const parts: string[] = []
    
    // 先显示自定义计划
    if (content.plans.length > 0) {
      parts.push(`📝 自定义计划 (${content.plans.length})`)
      content.plans.forEach((plan) => {
        parts.push(`  • ${plan.title}`)
      })
    }
    
    // 再显示学习卡片
    if (content.cards.length > 0) {
      parts.push(`📚 学习卡片 (${content.cards.length})`)
      content.cards.slice(0, 3).forEach((card) => {
        const cardContent = (card as any).content || `${(card as any).front || ''}\n\n${(card as any).back || ''}`.trim()
        const preview = cardContent.length > 30 ? cardContent.substring(0, 30) + '...' : cardContent
        parts.push(`  • ${preview}`)
      })
      if (content.cards.length > 3) {
        parts.push(`  ...还有 ${content.cards.length - 3} 张卡片`)
      }
    }
    
    // 显示学习日志
    if (logs.length > 0) {
      parts.push(`✅ 已完成 ${logs.length} 次学习`)
    }
    
    return parts.join('\n')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              学习日历
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-normal">{monthTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3 rounded-full text-xs"
            >
              今天
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="space-y-1.5">
          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-light text-slate-600 dark:text-slate-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日历网格 */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map(({ day, isCurrentMonth }, index) => {
              const content = getDayContent(day)
              const logs = getDayLogs(day)
              const isToday =
                isCurrentMonth &&
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear()
              
              const tooltip = tooltipContent(day)
              
              const dayCell = (
                <div
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-xl
                    text-sm font-medium
                    ${isCurrentMonth ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}
                    ${isToday ? 'bg-gradient-to-br from-slate-200/40 to-slate-100/20 border-2 border-slate-400/50 shadow-md' : ''}
                    ${content.hasContent || logs.length > 0 ? 'bg-gradient-to-br from-slate-100/60 to-slate-50/60 dark:from-slate-800/60 dark:to-slate-900/60' : ''}
                    hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all duration-200 hover:shadow-sm
                    ${!isToday && !content.hasContent && logs.length === 0 ? 'hover:scale-105' : ''}
                  `}
                >
                  <div className="text-sm font-light mb-1">{day}</div>
                  <div className="flex items-center gap-1">
                    {content.plans.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    )}
                    {content.cards.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    )}
                    {logs.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    )}
                  </div>
                </div>
              )

              if (tooltip) {
                return (
                  <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>{dayCell}</TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <pre className="text-xs whitespace-pre-wrap">{tooltip}</pre>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                )
              }

              return <div key={index}>{dayCell}</div>
            })}
          </div>

          {/* 图例 */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-light">自定义计划</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-light">学习卡片</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-700" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-light">已完成</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
