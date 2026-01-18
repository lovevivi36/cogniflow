'use client'

import { Button } from '@/components/ui/button'
import { RotateCcw, X } from 'lucide-react'
import { restoreCard, restoreDeck, permanentDeleteCard, permanentDeleteDeck } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Card as CardType } from '@/lib/types/card'
import type { Deck } from '@/lib/types/deck'

interface TrashClientProps {
  cards: CardType[]
  decks: Deck[]
}

/**
 * 回收站客户端组件
 */
export function TrashClient({ cards, decks }: TrashClientProps) {
  const router = useRouter()

  const handleRestoreCard = async (cardId: string) => {
    const result = await restoreCard({ id: cardId })
    if (result.success) {
      toast.success('卡片已恢复')
      router.refresh()
    } else {
      toast.error(result.error || '恢复失败')
    }
  }

  const handleRestoreDeck = async (deckId: string) => {
    const result = await restoreDeck({ id: deckId })
    if (result.success) {
      toast.success('牌组已恢复')
      router.refresh()
    } else {
      toast.error(result.error || '恢复失败')
    }
  }

  const handlePermanentDeleteCard = async (cardId: string) => {
    if (!confirm('确定要永久删除这张卡片吗？此操作无法撤销！')) {
      return
    }

    const result = await permanentDeleteCard({ id: cardId })
    if (result.success) {
      toast.success('卡片已永久删除')
      router.refresh()
    } else {
      toast.error(result.error || '删除失败')
    }
  }

  const handlePermanentDeleteDeck = async (deckId: string) => {
    if (!confirm('确定要永久删除这个牌组吗？此操作无法撤销！')) {
      return
    }

    const result = await permanentDeleteDeck({ id: deckId })
    if (result.success) {
      toast.success('牌组已永久删除')
      router.refresh()
    } else {
      toast.error(result.error || '删除失败')
    }
  }

  return (
    <>
      {/* 已删除的卡片 */}
      {cards && cards.length > 0 && (
        <div className="space-y-2 mb-6">
          {cards.map((card) => {
            const cardContent = (card as any).content || `${(card as any).front || ''}\n\n${(card as any).back || ''}`.trim()
            const deletedAt = (card as any).deleted_at
            return (
              <div
                key={card.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
              >
                <div className="flex-1">
                  <p className="text-sm line-clamp-2">{cardContent || '无内容'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    删除时间：{deletedAt ? new Date(deletedAt).toLocaleString('zh-CN') : '未知'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleRestoreCard(card.id)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    恢复
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handlePermanentDeleteCard(card.id)}>
                    <X className="h-4 w-4 mr-2" />
                    永久删除
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 已删除的牌组 */}
      {decks && decks.length > 0 && (
        <div className="space-y-2">
          {decks.map((deck) => {
            const deletedAt = (deck as any).deleted_at
            return (
              <div
                key={deck.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
              >
                <div className="flex-1">
                  <p className="font-semibold">{deck.name}</p>
                  {deck.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {deck.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    删除时间：{deletedAt ? new Date(deletedAt).toLocaleString('zh-CN') : '未知'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleRestoreDeck(deck.id)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    恢复
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handlePermanentDeleteDeck(deck.id)}>
                    <X className="h-4 w-4 mr-2" />
                    永久删除
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(!cards || cards.length === 0) && (!decks || decks.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-8">
          回收站为空
        </p>
      )}
    </>
  )
}
