'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Card as CardType } from '@/lib/types/card'

interface EditCardDialogProps {
  card: CardType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (cardId: string, content: string) => Promise<void>
}

/**
 * 编辑卡片对话框
 */
export function EditCardDialog({
  card,
  open,
  onOpenChange,
  onSave,
}: EditCardDialogProps) {
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (card) {
      const cardContent = (card as any).content || `${(card as any).front || ''}\n\n${(card as any).back || ''}`.trim()
      setContent(cardContent)
    } else {
      setContent('')
    }
  }, [card, open])

  const handleSave = async () => {
    if (!card || !content.trim()) return

    setIsSaving(true)
    try {
      await onSave(card.id, content)
      onOpenChange(false)
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑卡片</DialogTitle>
          <DialogDescription>修改学习内容</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>学习内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入学习内容..."
              rows={6}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !content.trim()}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
