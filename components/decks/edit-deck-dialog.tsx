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
import type { Deck } from '@/lib/types/deck'

interface EditDeckDialogProps {
  deck: Deck | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (deckId: string, name: string, description?: string) => Promise<void>
}

/**
 * 编辑牌组对话框
 */
export function EditDeckDialog({
  deck,
  open,
  onOpenChange,
  onSave,
}: EditDeckDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (deck) {
      setName(deck.name)
      setDescription(deck.description || '')
    } else {
      setName('')
      setDescription('')
    }
  }, [deck, open])

  const handleSave = async () => {
    if (!deck || !name.trim()) return

    setIsSaving(true)
    try {
      await onSave(deck.id, name, description || undefined)
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
          <DialogTitle>编辑牌组</DialogTitle>
          <DialogDescription>修改牌组名称和描述</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>牌组名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入牌组名称..."
            />
          </div>
          <div className="space-y-2">
            <Label>描述（可选）</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入牌组描述..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
