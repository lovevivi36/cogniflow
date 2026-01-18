'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'

export interface VoiceSettings {
  voice: string // 音色名称
  rate: number // 语速 (0.5 - 2.0)
  pitch: number // 音调 (0 - 2.0)
  volume: number // 音量 (0 - 1.0)
}

export const DEFAULT_SETTINGS: VoiceSettings = {
  voice: 'default',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
}

interface VoiceSettingsDialogProps {
  settings: VoiceSettings
  onSettingsChange: (settings: VoiceSettings) => void
  availableVoices: SpeechSynthesisVoice[]
}

/**
 * 语音设置对话框
 */
export function VoiceSettingsDialog({
  settings,
  onSettingsChange,
  availableVoices,
}: VoiceSettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState(settings)

  const handleSave = () => {
    onSettingsChange(localSettings)
  }

  // 获取中文语音列表
  const chineseVoices = availableVoices.filter(
    (voice) => voice.lang.startsWith('zh') || voice.lang.startsWith('cmn')
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="语音设置">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>语音设置</DialogTitle>
          <DialogDescription>调整 AI 语音的音色、语速和音调</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* 音色选择 */}
          <div className="space-y-2">
            <Label>音色</Label>
            <select
              value={localSettings.voice}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, voice: e.target.value })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="default">默认</option>
              {chineseVoices.map((voice, index) => (
                <option key={index} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* 语速 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>语速</Label>
              <span className="text-sm text-muted-foreground">
                {localSettings.rate.toFixed(1)}x
              </span>
            </div>
            <Slider
              value={[localSettings.rate]}
              onValueChange={([value]) =>
                setLocalSettings({ ...localSettings, rate: value })
              }
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>

          {/* 音调 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>音调</Label>
              <span className="text-sm text-muted-foreground">
                {localSettings.pitch.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[localSettings.pitch]}
              onValueChange={([value]) =>
                setLocalSettings({ ...localSettings, pitch: value })
              }
              min={0}
              max={2.0}
              step={0.1}
            />
          </div>

          {/* 音量 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>音量</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(localSettings.volume * 100)}%
              </span>
            </div>
            <Slider
              value={[localSettings.volume]}
              onValueChange={([value]) =>
                setLocalSettings({ ...localSettings, volume: value })
              }
              min={0}
              max={1.0}
              step={0.1}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLocalSettings(DEFAULT_SETTINGS)}>
              重置
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
