/**
 * 流式响应处理组合式函数
 * 功能：统一处理SSE和ReadableStream，支持多种API格式
 */
import { ref } from 'vue'

interface StreamOptions {
  onChunk?: (chunk: string) => void
  onReasoning?: (reasoning: string) => void
  onDone?: () => void
  onError?: (error: string) => void
}

export function useStreaming() {
  const isStreaming = ref(false)
  const abortController = ref<AbortController | null>(null)

  /**
   * 处理标准SSE流
   */
  const handleSSE = async (
    url: string,
    body: unknown,
    options: StreamOptions = {}
  ): Promise<void> => {
    isStreaming.value = true
    
    abortController.value = new AbortController()

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(body),
        signal: abortController.value.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              options.onDone?.()
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || 
                              parsed.content || 
                              ''
              
              if (content) {
                options.onChunk?.(content)
              }

              // DeepSeek特殊字段
              const reasoning = parsed.choices?.[0]?.delta?.reasoning_content
              if (reasoning) {
                options.onReasoning?.(reasoning)
              }

            } catch {
              // 非JSON数据直接作为内容
              options.onChunk?.(data)
            }
          }
        }
      }

      options.onDone?.()

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('请求已取消')
      } else {
        options.onError?.(err.message)
      }
    } finally {
      isStreaming.value = false
      abortController.value = null
    }
  }

  /**
   * 处理NDJSON流（Ollama格式）
   */
  const handleNDJSON = async (
    url: string,
    body: unknown,
    options: StreamOptions = {}
  ): Promise<void> => {
    isStreaming.value = true
    abortController.value = new AbortController()

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortController.value.signal
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const parsed = JSON.parse(line)
            
            if (parsed.done) {
              options.onDone?.()
              return
            }

            const content = parsed.message?.content || parsed.response || ''
            if (content) {
              options.onChunk?.(content)
            }

          } catch {
            // 忽略解析错误
          }
        }
      }

      options.onDone?.()

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        options.onError?.(err.message)
      }
    } finally {
      isStreaming.value = false
      abortController.value = null
    }
  }

  /**
   * 取消当前请求
   */
  const cancel = () => {
    abortController.value?.abort()
  }

  return {
    isStreaming,
    handleSSE,
    handleNDJSON,
    cancel
  }
}