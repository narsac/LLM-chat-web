/**
 * Ollama API组合式函数
 * 功能：模型管理、对话生成、流式处理
 */
import { ref } from 'vue'
import type { ChatMessage, ModelConfig } from '@/types/chat'

export function useOllama(config: ModelConfig) {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 获取本地模型列表
   */
  const listModels = async (): Promise<string[]> => {
    try {
      const res = await fetch(`${config.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      })
      
      if (!res.ok) throw new Error('获取模型列表失败')
      
      const data = await res.json()
      return data.models?.map((m: any) => m.name) || []
    } catch (err: any) {
      error.value = err.message
      return []
    }
  }

  /**
   * 检查模型是否存在
   */
  const checkModel = async (modelName: string): Promise<boolean> => {
    const models = await listModels()
    return models.includes(modelName)
  }

  /**
   * 拉取模型（下载）
   */
  const pullModel = async (modelName: string, onProgress?: (progress: number) => void): Promise<boolean> => {
    try {
      const response = await fetch(`${config.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true })
      })

      if (!response.ok) throw new Error('拉取模型失败')

      const reader = response.body?.getReader()
      if (!reader) return false

      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.completed && data.total) {
              const progress = (data.completed / data.total) * 100
              onProgress?.(Math.round(progress))
            }
          } catch {
            // 忽略解析错误
          }
        }
      }

      return true
      
    } catch (err: any) {
      error.value = err.message
      return false
    }
  }

  /**
   * 生成对话（流式）
   */
  const generate = async function* (
    messages: ChatMessage[],
    options: {
      temperature?: number
      maxTokens?: number
      system?: string
    } = {}
  ): AsyncGenerator<{ content: string; done: boolean; reasoning?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.modelId,
          messages: [
            ...(options.system ? [{ role: 'system', content: options.system }] : []),
            ...messages.map(m => ({ role: m.role, content: m.content }))
          ],
          stream: true,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 2048
          }
        })
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || '请求失败')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应')

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
              
              if (chunk.done) {
                yield { content: '', done: true }
                return
              }

              let content = chunk.message?.content || ''
              let reasoning = ''

              // 解析思考过程（DeepSeek-R1格式）
              if (content.includes('<think>')) {
                const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/)
                if (thinkMatch) {
                  reasoning = thinkMatch[1].trim()
                  content = content.replace(/<think>[\s\S]*?<\/think>/, '').trim()
                }
              }

              yield { content, done: false, reasoning }

            } catch (e) {
              console.warn('解析流数据失败:', line)
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

    } catch (err: any) {
      error.value = err.message
      yield { content: `错误: ${err.message}`, done: true }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 简单生成（非流式）
   */
  const generateSimple = async (
    prompt: string,
    options: { system?: string } = {}
  ): Promise<string> => {
    try {
      const res = await fetch(`${config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.modelId,
          prompt,
          system: options.system,
          stream: false
        })
      })

      if (!res.ok) throw new Error('生成失败')
      
      const data = await res.json()
      return data.response || ''

    } catch (err: any) {
      error.value = err.message
      return ''
    }
  }

  return {
    isLoading,
    error,
    listModels,
    checkModel,
    pullModel,
    generate,
    generateSimple
  }
}