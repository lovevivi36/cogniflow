'use client'

import { useState } from 'react'
import { CardItem } from '@/components/cards/card-item'
import { EditCardDialog } from '@/components/cards/edit-card-dialog'
import { updateCard, deleteCard } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Card as CardType } from '@/lib/types/card'

interface DeckDetailClientProps {
  cards: CardType[]
}

/**
 * 牌组详情客户端组件
 * 处理卡片的增删查改
 */
export function DeckDetailClient({ cards }: DeckDetailClientProps) {
  const router = useRouter()
  const [editingCard, setEditingCard] = useState<CardType | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleEdit = (card: CardType) => {
    setEditingCard(card)
    setIsEditDialogOpen(true)
  }

  const handleSave = async (cardId: string, content: string) => {
    const result = await updateCard({ id: cardId, content })
    if (result.success) {
      toast.success('卡片已更新')
      router.refresh()
    } else {
      toast.error(result.error || '更新失败')
    }
  }

  const handleDelete = async (cardId: string) => {
    if (!confirm('确定要删除这张卡片吗？删除后可以在回收站中恢复。')) {
      return
    }

    const result = await deleteCard({ id: cardId })
    if (result.success) {
      toast.success('卡片已删除')
      router.refresh()
    } else {
      toast.error(result.error || '删除失败')
    }
  }

  if (cards.length === 0) {
    return null
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={true}
          />
        ))}
      </div>

      <EditCardDialog
        card={editingCard}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSave}
      />
    </>
  )
}
