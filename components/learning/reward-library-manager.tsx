'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Lock, Unlock, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  RewardItem,
  RewardRarity,
  RARITY_CONFIG,
  type RewardLibrary,
} from '@/lib/types/reward'
import {
  loadRewardLibrary,
  saveRewardLibrary,
  getDefaultRewardLibrary,
} from '@/lib/rewards-library'

interface RewardLibraryManagerProps {
  userId: string
}

/**
 * 奖励库管理组件 - 简化版，参考图片设计
 */
export function RewardLibraryManager({ userId }: RewardLibraryManagerProps) {
  const [library, setLibrary] = useState<RewardLibrary>(getDefaultRewardLibrary())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    weight: 10,
    rarity: RewardRarity.Common,
  })

  // 加载奖励库
  useEffect(() => {
    const loaded = loadRewardLibrary(userId)
    setLibrary(loaded)
  }, [userId])

  // 按级别分组显示
  const groupedRewards = useMemo(() => {
    const groups: Record<RewardRarity, RewardItem[]> = {
      [RewardRarity.Legendary]: [],
      [RewardRarity.Epic]: [],
      [RewardRarity.Rare]: [],
      [RewardRarity.Common]: [],
    }

    library.items.forEach((item) => {
      groups[item.rarity].push(item)
    })

    return groups
  }, [library])

  // 计算总权重
  const totalWeight = useMemo(() => {
    return library.items
      .filter((item) => item.enabled)
      .reduce((sum, item) => sum + item.weight, 0)
  }, [library])

  // 计算每个级别的权重和概率
  const rarityWeights = useMemo(() => {
    const weights: Record<RewardRarity, number> = {
      [RewardRarity.Common]: 0,
      [RewardRarity.Rare]: 0,
      [RewardRarity.Epic]: 0,
      [RewardRarity.Legendary]: 0,
    }

    library.items
      .filter((item) => item.enabled)
      .forEach((item) => {
        weights[item.rarity] += item.weight
      })

    return weights
  }, [library])

  const rarityProbabilities = useMemo(() => {
    const probabilities: Record<RewardRarity, string> = {
      [RewardRarity.Common]: '0',
      [RewardRarity.Rare]: '0',
      [RewardRarity.Epic]: '0',
      [RewardRarity.Legendary]: '0',
    }

    if (totalWeight > 0) {
      ;[RewardRarity.Common, RewardRarity.Rare, RewardRarity.Epic, RewardRarity.Legendary].forEach((rarity) => {
        probabilities[rarity] = ((rarityWeights[rarity] / totalWeight) * 100).toFixed(1)
      })
    }

    return probabilities
  }, [rarityWeights, totalWeight])

  // 创建新奖励
  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('请输入奖励内容')
      return
    }

    const newItem: RewardItem = {
      id: `custom_${Date.now()}`,
      name: formData.name.trim(),
      description: '',
      rarity: formData.rarity,
      weight: formData.weight,
      icon: RARITY_CONFIG[formData.rarity].icon,
      enabled: true,
    }

    const newLibrary: RewardLibrary = {
      ...library,
      items: [...library.items, newItem],
    }

    setLibrary(newLibrary)
    saveRewardLibrary(userId, newLibrary)
    toast.success('奖励已添加')

    // 重置表单
    setFormData({
      name: '',
      weight: 10,
      rarity: RewardRarity.Common,
    })
  }

  // 处理表单提交（创建或保存）
  const handleSubmit = () => {
    if (editingId) {
      handleSaveEdit()
    } else {
      handleCreate()
    }
  }

  // 更新权重
  const handleUpdateWeight = (id: string, weight: number) => {
    const newLibrary: RewardLibrary = {
      ...library,
      items: library.items.map((item) =>
        item.id === id ? { ...item, weight: Math.max(0, Math.min(100, weight)) } : item
      ),
    }

    setLibrary(newLibrary)
    saveRewardLibrary(userId, newLibrary)
  }

  // 切换启用状态
  const handleToggleEnabled = (id: string) => {
    const newLibrary: RewardLibrary = {
      ...library,
      items: library.items.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      ),
    }

    setLibrary(newLibrary)
    saveRewardLibrary(userId, newLibrary)
  }

  // 开始编辑
  const handleStartEdit = (item: RewardItem) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      weight: item.weight,
      rarity: item.rarity,
    })
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingId) return

    if (!formData.name.trim()) {
      toast.error('请输入奖励内容')
      return
    }

    const newLibrary: RewardLibrary = {
      ...library,
      items: library.items.map((item) =>
        item.id === editingId
          ? {
              ...item,
              name: formData.name.trim(),
              weight: formData.weight,
              rarity: formData.rarity,
              icon: RARITY_CONFIG[formData.rarity].icon,
            }
          : item
      ),
    }

    setLibrary(newLibrary)
    saveRewardLibrary(userId, newLibrary)
    toast.success('奖励已更新')

    // 重置编辑状态
    setEditingId(null)
    setFormData({
      name: '',
      weight: 10,
      rarity: RewardRarity.Common,
    })
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      weight: 10,
      rarity: RewardRarity.Common,
    })
  }

  // 删除奖励
  const handleDelete = (id: string) => {
    if (!confirm('确定要删除这个奖励吗？')) return

    const newLibrary: RewardLibrary = {
      ...library,
      items: library.items.filter((item) => item.id !== id),
    }

    setLibrary(newLibrary)
    saveRewardLibrary(userId, newLibrary)
    toast.success('奖励已删除')
  }

  return (
    <div className="space-y-6">
      {/* 统计面板 */}
      <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl p-4">
        <div className="grid grid-cols-5 gap-4">
          {[
            RewardRarity.Legendary,
            RewardRarity.Epic,
            RewardRarity.Rare,
            RewardRarity.Common,
          ].map((rarity) => {
            const config = RARITY_CONFIG[rarity]
            return (
              <div key={rarity} className="text-center">
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  {config.name}概率
                </div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {rarityProbabilities[rarity]}%
                </div>
              </div>
            )
          })}
          <div className="text-center">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-medium">总权重</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalWeight}</div>
          </div>
        </div>
      </div>

      {/* 添加/编辑奖励输入区域 */}
      <div className="flex items-center gap-2">
        {editingId && (
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            编辑中...
          </div>
        )}
        <Input
          placeholder={editingId ? "编辑奖励内容..." : "输入奖励内容..."}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="flex-1"
        />
        <Input
          type="number"
          min="1"
          max="100"
          value={formData.weight}
          onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 10 })}
          className="w-20"
        />
        <Select
          value={formData.rarity}
          onValueChange={(value) => setFormData({ ...formData, rarity: value as RewardRarity })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RARITY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.icon} {config.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          {editingId && (
            <Button onClick={handleCancelEdit} variant="outline" size="sm">
              取消
            </Button>
          )}
          <Button onClick={handleSubmit} size="icon" className="h-10 w-10">
            {editingId ? (
              <span className="text-sm">保存</span>
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 奖励列表 - 按级别分组显示 */}
      {[
        RewardRarity.Legendary,
        RewardRarity.Epic,
        RewardRarity.Rare,
        RewardRarity.Common,
      ].map((rarity) => {
        const items = groupedRewards[rarity]
        if (items.length === 0) return null
        const config = RARITY_CONFIG[rarity]

        return (
          <div key={rarity} className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {config.icon} {config.name}
            </h4>
            <div className="space-y-2">
              {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {item.name}
                </div>
              </div>
              {editingId === item.id ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancelEdit}
                    className="h-6 w-6"
                  >
                    <span className="text-xs">取消</span>
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartEdit(item)}
                    className="h-6 w-6"
                    title="编辑"
                  >
                    <Edit2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="h-6 w-6"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4 text-slate-600 dark:text-slate-400 hover:text-red-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleEnabled(item.id)}
                    className="h-6 w-6"
                    title={item.enabled ? '禁用' : '启用'}
                  >
                    {item.enabled ? (
                      <Unlock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-slate-400 dark:text-slate-600" />
                    )}
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={item.weight}
                    onChange={(e) => handleUpdateWeight(item.id, parseInt(e.target.value) || 0)}
                    className="w-16 h-8 text-sm"
                    title="权重"
                  />
                </>
              )}
            </div>
              ))}
            </div>
          </div>
        )
      })}

      {library.items.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
          <p>还没有奖励，创建一个吧！</p>
        </div>
      )}
    </div>
  )
}
