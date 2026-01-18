import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

// 创建 DeepSeek 客户端（兼容 OpenAI API）
const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

/**
 * 费曼学习法聊天 API
 * AI 人设：好奇的 12 岁学生
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, cardContent } = body

    // TextStreamChatTransport 会发送 UIMessage[] 格式
    let uiMessages: UIMessage[] = []
    if (messages && Array.isArray(messages)) {
      // 检查是否是 UIMessage 格式（有 parts 和 id 属性）
      if (messages.length > 0 && 'parts' in messages[0] && 'id' in messages[0]) {
        uiMessages = messages as UIMessage[]
      } else {
        // 转换为 UIMessage 格式（兼容旧格式）
        uiMessages = messages.map((msg: { role: string; content: string }, index: number) => ({
          id: `msg-${Date.now()}-${index}`,
          role: msg.role === 'user' ? 'user' : 'assistant',
          parts: [{ type: 'text' as const, text: msg.content }],
        }))
      }
    }

    if (!cardContent) {
      return new Response('Missing cardContent', { status: 400 })
    }

    // 构建系统提示词（12 岁学生人设）
    const systemPrompt = `你是一个好奇的 12 岁学生，正在学习以下内容。你的目标是：
1. 通过提问和讨论来理解这个概念
2. 用简单、口语化的语言表达
3. 保持好奇心，多问"为什么"和"怎么"
4. 回复要简短，目的是让用户多说，而不是自己长篇大论
5. 如果用户解释不清楚，要追问细节

学习内容：
${cardContent}

记住：你是学生，不是老师。你的回复应该简短、口语化，目的是诱导用户多说。`

    // 转换消息格式：UIMessage[] -> ModelMessage[]
    const modelMessages = await convertToModelMessages(uiMessages)

    // 添加系统消息
    const formattedMessages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      ...modelMessages,
    ]

    // 使用 streamText 进行流式响应
    const result = await streamText({
      model: deepseek.chat('deepseek-chat'),
      messages: formattedMessages,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
