'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash2, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Card as CardType } from '@/lib/types/card'

interface CardItemProps {
  card: CardType
  onEdit?: (card: CardType) => void
  onDelete?: (cardId: string) => void
  showActions?: boolean
}

/**
 * 卡片项组件
 * 显示卡片信息，包括学习日期和预计复习日期
 */
export function CardItem({ card, onEdit, onDelete, showActions = true }: CardItemProps) {
  const isDue = new Date(card.due_date) <= new Date()
  const stateLabels = ['新卡片', '学习中', '复习中', '重新学习']
  
  const cardContent = (card as any).content || `${(card as any).front || ''}\n\n${(card as any).back || ''}`.trim()
  
  // 计算距离复习的天数
  const daysUntilReview = Math.ceil(
    (new Date(card.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  
  // 格式化日期
  const createdDate = format(new Date(card.created_at), 'yyyy-MM-dd')
  const reviewDate = format(new Date(card.due_date), 'yyyy-MM-dd HH:mm')

  return (
    <Card
      className={`hover:shadow-lg transition-shadow ${
        isDue ? 'border-slate-400 dark:border-slate-600 border-2' : ''
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardDescription className="flex items-center gap-2 flex-wrap">
              <span>状态：{stateLabels[card.state]}</span>
              {isDue && (
                <span className="text-slate-700 dark:text-slate-300 font-semibold">· 待复习</span>
              )}
            </CardDescription>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(card)}>
                    <Edit className="h-4 w-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(card.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm line-clamp-4 mb-4">
          {cardContent || '无内容'}
        </p>
        
        {/* 日期信息 */}
        <div className="space-y-2 mb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>创建：{createdDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>
              复习：{reviewDate}
              {daysUntilReview > 0 && (
                <span className="ml-1">({daysUntilReview}天后)</span>
              )}
              {daysUntilReview <= 0 && (
                <span className="ml-1 text-slate-700 dark:text-slate-300 font-semibold">(已到期)</span>
              )}
            </span>
          </div>
        </div>

        <Button asChild className="w-full" variant={isDue ? 'default' : 'outline'}>
          <Link href={`/dashboard/study/${card.id}`}>
            {isDue ? '开始复习' : '查看卡片'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
