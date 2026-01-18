'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { calculateRetention, getReviewSuggestion } from '@/lib/rewards'
import type { Card as CardType } from '@/lib/types/card'

interface ReviewStatsProps {
  cards: CardType[]
}

/**
 * 复习统计组件
 * 显示艾宾浩斯遗忘曲线和进度统计
 */
export function ReviewStats({ cards }: ReviewStatsProps) {
  // 计算统计数据
  const now = new Date()
  const stats = {
    total: cards.length,
    new: cards.filter((c) => c.state === 0).length,
    learning: cards.filter((c) => c.state === 1).length,
    review: cards.filter((c) => c.state === 2).length,
    relearning: cards.filter((c) => c.state === 3).length,
  }

  // 计算平均记忆保留率
  const cardsWithRetention = cards
    .filter((c) => c.stability > 0)
    .map((c) => {
      const elapsedDays = Math.max(
        0,
        Math.floor((now.getTime() - new Date(c.due_date).getTime()) / (1000 * 60 * 60 * 24))
      )
      return calculateRetention(c.stability, elapsedDays)
    })

  const avgRetention =
    cardsWithRetention.length > 0
      ? cardsWithRetention.reduce((a, b) => a + b, 0) / cardsWithRetention.length
      : 0

  // 计算紧急程度分布
  const urgencyDistribution = cards.map((c) => {
    if (c.stability === 0) return { level: 'new', count: 1 }
    
    const elapsedDays = Math.max(
      0,
      Math.floor((now.getTime() - new Date(c.due_date).getTime()) / (1000 * 60 * 60 * 24))
    )
    const retention = calculateRetention(c.stability, elapsedDays)
    
    if (retention < 0.5) return { level: 'urgent', count: 1 }
    if (retention < 0.7) return { level: 'soon', count: 1 }
    return { level: 'ok', count: 1 }
  }).reduce((acc, item) => {
    acc[item.level] = (acc[item.level] || 0) + item.count
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 总体统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">复习概览</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>总卡片数</span>
              <span className="font-semibold">{stats.total}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>新卡片</span>
              <span className="font-semibold">{stats.new}</span>
            </div>
            <Progress value={(stats.new / stats.total) * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>学习中</span>
              <span className="font-semibold">{stats.learning}</span>
            </div>
            <Progress value={(stats.learning / stats.total) * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>复习中</span>
              <span className="font-semibold">{stats.review}</span>
            </div>
            <Progress value={(stats.review / stats.total) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* 记忆保留率 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">记忆强度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>平均记忆保留率</span>
              <span className="font-semibold">{(avgRetention * 100).toFixed(1)}%</span>
            </div>
            <Progress value={avgRetention * 100} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {getReviewSuggestion(avgRetention)}
            </p>
          </div>
          
          {/* 紧急程度分布 */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs">
              <span className="text-red-500">紧急 ({urgencyDistribution.urgent || 0})</span>
              <span className="text-yellow-500">即将 ({urgencyDistribution.soon || 0})</span>
              <span className="text-green-500">正常 ({urgencyDistribution.ok || 0})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 艾宾浩斯曲线可视化 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">遗忘曲线</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              基于艾宾浩斯遗忘曲线，记忆会随时间自然衰退
            </p>
            <div className="h-32 flex items-end justify-between gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((day) => {
                // 简化的遗忘曲线：R = e^(-t/S)，假设平均稳定性为 5 天
                const avgStability = 5
                const retention = Math.exp(-day / avgStability)
                const height = retention * 100
                
                return (
                  <div key={day} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-primary rounded-t transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-muted-foreground mt-1">{day}天</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              及时复习可以减缓遗忘速度
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
