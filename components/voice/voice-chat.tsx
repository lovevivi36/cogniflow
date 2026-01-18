'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react'
import { toast } from 'sonner'
import { VoiceSettingsDialog, type VoiceSettings, DEFAULT_SETTINGS } from './voice-settings'

// 浏览器 API 类型定义
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}

interface VoiceChatProps {
  onTranscript?: (text: string) => void
  onSpeak?: (text: string) => void
  autoSpeak?: boolean // 是否自动朗读 AI 回复
  continuousMode?: boolean // 连续对话模式（像打电话一样）
  onContinuousModeChange?: (enabled: boolean) => void
}

/**
 * 语音聊天组件
 * 支持语音输入和输出，参考豆包的交互方式
 * - 按住按钮说话（兼容移动端）
 * - 音色、语速、音调控制
 * - 连续对话模式
 */
export function VoiceChat({
  onTranscript,
  onSpeak,
  autoSpeak = true,
  continuousMode = false,
  onContinuousModeChange,
}: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isPressingRef = useRef(false) // 用于跟踪按钮按下状态

  // 检查浏览器支持
  useEffect(() => {
    const checkSupport = () => {
      const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
      const hasSynthesis = 'speechSynthesis' in window
      setIsSupported(hasRecognition && hasSynthesis)
      
      if (!hasRecognition) {
        console.warn('Speech Recognition not supported')
      }
      if (!hasSynthesis) {
        console.warn('Speech Synthesis not supported')
      }
    }
    checkSupport()
  }, [])

  // 加载可用语音列表
  useEffect(() => {
    if (!('speechSynthesis' in window)) return

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      setAvailableVoices(voices)
    }

    loadVoices()
    // 某些浏览器需要等待 voiceschanged 事件
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // 初始化语音识别
  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true // 始终使用连续模式，保持识别状态
    recognition.interimResults = false // 只返回最终结果
    recognition.lang = 'zh-CN' // 中文

    recognition.onstart = () => {
      setIsListening(true)
      // 不显示 toast，因为已经在 toggleListening 中显示了
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // 获取所有识别结果并合并（追加模式）
      let fullTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript
      }
      
      console.log('🎤 识别结果:', fullTranscript)
      
      if (fullTranscript.trim()) {
        // 传递完整的识别文本（包含之前的内容）
        onTranscript?.(fullTranscript)
        // 不自动停止，保持识别状态直到用户点击停止
      }
    }

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      
      if (event.error === 'no-speech') {
        // 在连续模式下，no-speech 是正常的，不显示错误
        if (!continuousMode) {
          toast.error('未检测到语音，请重试')
        }
      } else if (event.error === 'not-allowed') {
        toast.error('请允许麦克风权限')
        setIsListening(false)
      } else if (event.error !== 'aborted') {
        // aborted 是用户主动停止，不显示错误
        toast.error('语音识别失败: ' + event.error)
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      // 如果用户还在保持识别状态（点击了开始但还没点击停止），自动重启
      if (isPressingRef.current) {
        // 延迟重启，避免立即重启导致的问题
        setTimeout(() => {
          if (isPressingRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (error) {
              // 可能已经在运行，忽略错误
              console.log('语音识别重启:', error)
            }
          }
        }, 100)
      } else {
        // 用户主动停止，更新状态
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isSupported, onTranscript, continuousMode])

  // 初始化语音合成
  useEffect(() => {
    if (!isSupported) return

    synthesisRef.current = window.speechSynthesis

    return () => {
      // 清理未完成的语音
      if (currentUtteranceRef.current) {
        synthesisRef.current?.cancel()
      }
    }
  }, [isSupported])

  // 切换语音输入状态（点击切换模式）
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('语音识别未初始化')
      return
    }

    if (isListening) {
      // 停止识别
      isPressingRef.current = false
      try {
        recognitionRef.current.stop()
        // 等待 onend 事件更新状态
        setTimeout(() => {
          if (!isPressingRef.current) {
            setIsListening(false)
            toast.info('🎤 已停止语音识别')
          }
        }, 200)
      } catch (error) {
        console.error('停止语音识别失败:', error)
        setIsListening(false)
        isPressingRef.current = false
        toast.info('🎤 已停止语音识别')
      }
    } else {
      // 开始识别
      isPressingRef.current = true
      try {
        recognitionRef.current.start()
        toast.info('🎤 已开始语音识别，再次点击停止')
      } catch (error) {
        console.error('启动语音识别失败:', error)
        toast.error('启动语音识别失败，请重试')
        isPressingRef.current = false
        setIsListening(false)
      }
    }
  }

  // 停止语音输入（用于连续模式自动停止）
  const stopListening = () => {
    isPressingRef.current = false
    
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  // 切换连续对话模式
  const toggleContinuousMode = () => {
    const newMode = !continuousMode
    onContinuousModeChange?.(newMode)
    
    if (newMode) {
      toast.info('📞 已开启连续对话模式（像打电话一样）')
    } else {
      toast.info('已关闭连续对话模式')
      stopListening()
    }
  }

  // 朗读文本（使用设置）
  const speak = (text: string) => {
    if (!synthesisRef.current || !text.trim()) return

    // 停止当前朗读
    synthesisRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = voiceSettings.rate
    utterance.pitch = voiceSettings.pitch
    utterance.volume = voiceSettings.volume

    // 设置音色
    if (voiceSettings.voice !== 'default') {
      const selectedVoice = availableVoices.find((v) => v.name === voiceSettings.voice)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      currentUtteranceRef.current = null
    }

    utterance.onerror = (event) => {
      console.error('语音合成错误:', event)
      setIsSpeaking(false)
      toast.error('语音播放失败')
    }

    currentUtteranceRef.current = utterance
    synthesisRef.current.speak(utterance)
  }

  // 停止朗读
  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
      setIsSpeaking(false)
      currentUtteranceRef.current = null
    }
  }

  // 暴露 speak 方法
  useEffect(() => {
    if (onSpeak) {
      // 通过回调暴露
      ;(onSpeak as any).speak = speak
    }
  }, [onSpeak, speak])

  if (!isSupported) {
    return null // 不支持时不显示
  }

  return (
    <div className="flex items-center gap-2">
      {/* 连续对话模式切换 */}
      <Button
        type="button"
        variant={continuousMode ? 'default' : 'outline'}
        size="icon"
        onClick={toggleContinuousMode}
        title={continuousMode ? '关闭连续对话' : '开启连续对话（像打电话）'}
      >
        {continuousMode ? (
          <PhoneOff className="h-4 w-4" />
        ) : (
          <Phone className="h-4 w-4" />
        )}
      </Button>

      {/* 语音输入按钮（点击切换模式） */}
      <Button
        type="button"
        variant={isListening ? 'default' : 'outline'}
        size="icon"
        onClick={toggleListening}
        disabled={isSpeaking}
        className={isListening ? 'animate-pulse' : ''}
        title={isListening ? '点击停止语音识别' : '点击开始语音识别'}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {/* 语音输出按钮 */}
      {isSpeaking ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={stopSpeaking}
          title="停止朗读"
        >
          <VolumeX className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled
          title="AI 回复将自动朗读"
        >
          <Volume2 className="h-4 w-4 opacity-50" />
        </Button>
      )}

      {/* 语音设置 */}
      <VoiceSettingsDialog
        settings={voiceSettings}
        onSettingsChange={setVoiceSettings}
        availableVoices={availableVoices}
      />
    </div>
  )
}

// 导出 speak 函数供外部使用
export function useVoiceChat(settings?: VoiceSettings) {
  const currentSettings = settings || DEFAULT_SETTINGS
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (!('speechSynthesis' in window)) return

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      setAvailableVoices(voices)
    }

    loadVoices()
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return

    const synthesis = window.speechSynthesis
    synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = currentSettings.rate
    utterance.pitch = currentSettings.pitch
    utterance.volume = currentSettings.volume

    if (currentSettings.voice !== 'default') {
      const selectedVoice = availableVoices.find((v) => v.name === currentSettings.voice)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
    }

    synthesis.speak(utterance)
  }

  const stop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  return { speak, stop }
}
