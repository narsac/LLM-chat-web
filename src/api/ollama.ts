/**
 * Ollama API封装
 * 文档：https://github.com/ollama/ollama/blob/main/docs/api.md
 */
import type { ChatMessage, StreamChunk, ModelConfig } from '@/types/chat'

export class OllamaAPI {
  private config: ModelConfig

  constructor(config: ModelConfig) {
    this.config = config
  }

  /**
   * 获取本地可用模型列表
   */
  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.config.baseUrl}/api/tags`)
      if (!res.ok) throw new Error('Failed to fetch models')
      const data = await res.json()
      return data.models.map((m: any) => m.name)
    } catch (error) {
      console.error('获取模型列表失败:', error)
      return []
    }
  }

  /**
   * 发送对话请求（流式）
   */
  async *chatStream(messages: ChatMessage[]): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.modelId,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 2048
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama错误: ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取响应流')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          
          try {
            const chunk = JSON.parse(line)
            
            // 处理思考过程（DeepSeek-R1的特殊格式）
            let content = chunk.message?.content || ''
            let reasoningContent = ''
            
            if (content.includes('<think>') && content.includes('</think>')) {
              const match = content.match(/<think>([\s\S]*?)<\/think>/)
              if (match) {
                reasoningContent = match[1].trim()
                content = content.replace(/<think>[\s\S]*?<\/think>/, '').trim()
              }
            }

            yield {
              content,
              reasoningContent,
              done: chunk.done || false
            }
          } catch (e) {
            console.warn('解析流数据失败:', line)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * 非流式请求（备用）
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    const res = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.modelId,
        messages,
        stream: false
      })
    })
    
    if (!res.ok) throw new Error('请求失败')
    const data = await res.json()
    return data.message?.content || ''
  }
}