'use client'

import { LearningCalendar } from '@/components/learning/learning-calendar'
import { RewardSystem } from '@/components/learning/reward-system'
import { StudyPlanManager } from '@/components/learning/study-plan-manager'
import { motion } from 'framer-motion'
import type { Card as CardType } from '@/lib/types/card'
import type { Deck } from '@/lib/types/deck'

interface DashboardClientProps {
  cards: CardType[]
  studyLogs: Array<{
    date: string
    count: number
    rating: number
  }>
  userId: string
  studyStats: {
    totalCompleted: number
    currentStreak: number
    longestStreak: number
  }
  decks?: Deck[]
}

/**
 * 学习中心客户端组件 - Apple 风格 Bento Grid 布局
 * 包含学习日历、奖励系统和学习计划管理
 */
export function DashboardClient({
  cards,
  studyLogs,
  userId,
  studyStats,
  decks = [],
}: DashboardClientProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {/* 学习日历 - 占据 2 列 */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-2 lg:col-span-2"
      >
        <div className="h-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 shadow-enhanced-lg">
          <LearningCalendar cards={cards} studyLogs={studyLogs} userId={userId} />
        </div>
      </motion.div>

      {/* 统计 HUD - 占据 2 列 */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-2 lg:col-span-2"
      >
        <div className="h-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 shadow-enhanced-lg">
          <RewardSystem userId={userId} studyStats={studyStats} />
        </div>
      </motion.div>

      {/* 学习计划管理 - 占据全宽 */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-2 lg:col-span-4"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 shadow-enhanced-lg">
          <StudyPlanManager userId={userId} cards={cards} decks={decks} />
        </div>
      </motion.div>
    </motion.div>
  )
}
