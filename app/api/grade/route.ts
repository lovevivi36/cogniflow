import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

// 创建 DeepSeek 客户端（兼容 OpenAI API）
// baseURL 需要明确包含 /v1 以确保正确访问端点
const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

/**
 * AI 评分 API
 * 根据聊天记录评估用户的理解程度（1-4分）
 */
export async function POST(req: Request) {
  try {
    const { messages, cardContent } = await req.json()

    // 验证输入
    const schema = z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })),
      cardContent: z.string(),
    })

    const validated = schema.parse({ messages, cardContent })

    // 构建评分 Prompt
    const gradingPrompt = `你是一个评分系统。请根据用户对学习内容的理解和解释质量，给出1-4分的评分：

评分标准：
1分 = 完全没理解，解释错误或完全离题
2分 = 部分理解，但有很多空白和模糊点
3分 = 理解好，但表达还可以更简洁清晰
4分 = 很好，能简洁明了、有条理地解释概念

学习内容：
${validated.cardContent}

对话记录：
${validated.messages.map(m => `${m.role}: ${m.content}`).join('\n')}

请只返回一个数字（1、2、3或4），不要其他文字。`

    // 调用 DeepSeek 进行评分
    // 使用 .chat() 方法强制使用 Chat Completions 端点
    const result = await generateText({
      model: deepseek.chat('deepseek-chat'),
      prompt: gradingPrompt,
    })

    // 解析评分
    const ratingText = result.text.trim()
    const rating = parseInt(ratingText, 10)

    if (isNaN(rating) || rating < 1 || rating > 4) {
      // 如果 AI 返回的不是有效数字，尝试从文本中提取
      const match = ratingText.match(/[1-4]/)
      if (match) {
        return Response.json({ rating: parseInt(match[0], 10) })
      }
      // 默认返回 2（中等评分）
      return Response.json({ rating: 2 })
    }

    return Response.json({ rating })
  } catch (error) {
    console.error('Grading API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
