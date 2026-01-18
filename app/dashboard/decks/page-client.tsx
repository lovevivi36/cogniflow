'use client'

import { useState } from 'react'
import { DeckItem } from '@/components/decks/deck-item'
import { EditDeckDialog } from '@/components/decks/edit-deck-dialog'
import { updateDeck, deleteDeck } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Deck } from '@/lib/types/deck'

interface DecksClientProps {
  decks: Deck[]
}

/**
 * 牌组列表客户端组件
 * 处理牌组的增删查改
 */
export function DecksClient({ decks }: DecksClientProps) {
  const router = useRouter()
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleEdit = (deck: Deck) => {
    setEditingDeck(deck)
    setIsEditDialogOpen(true)
  }

  const handleSave = async (deckId: string, name: string, description?: string) => {
    const result = await updateDeck({ id: deckId, name, description })
    if (result.success) {
      toast.success('牌组已更新')
      router.refresh()
    } else {
      toast.error(result.error || '更新失败')
    }
  }

  const handleDelete = async (deckId: string) => {
    if (!confirm('确定要删除这个牌组吗？删除后无法恢复。')) {
      return
    }

    const result = await deleteDeck({ id: deckId })
    if (result.success) {
      toast.success('牌组已删除')
      router.refresh()
    } else {
      toast.error(result.error || '删除失败')
    }
  }

  if (decks.length === 0) {
    return null
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => (
          <DeckItem
            key={deck.id}
            deck={deck}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={true}
          />
        ))}
      </div>

      <EditDeckDialog
        deck={editingDeck}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSave}
      />
    </>
  )
}
