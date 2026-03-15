/**
 * 对话核心逻辑
 * 功能：消息管理、流式处理、错误处理、自动保存
 */
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { OllamaAPI } from '@/api/ollama'
import { OpenAIAPI } from '@/api/openai'
import type { ChatMessage, ChatSession, StreamChunk } from '@/types/chat'

export function useChat() {
  const chatStore = useChatStore()
  const settingsStore = useSettingsStore()
  
  // 当前输入
  const inputMessage = ref('')
  // 是否正在生成
  const isGenerating = ref(false)
  // 当前流式消息ID（用于增量更新）
  const streamingMessageId = ref<string | null>(null)
  // 错误信息
  const error = ref<string | null>(null)

  // 当前会话
  const currentSession = computed(() => chatStore.currentSession)

  // 获取API实例
  const getAPI = () => {
    const model = settingsStore.currentModel
    if (model.provider === 'ollama') {
      return new OllamaAPI(model)
    }
    return new OpenAIAPI(model)
  }

  /**
   * 发送消息
   */
  const sendMessage = async () => {
    const content = inputMessage.value.trim()
    if (!content || isGenerating.value) return

    // 1. 添加用户消息
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }
    
    chatStore.addMessage(userMessage)
    inputMessage.value = ''
    error.value = null

    // 2. 准备历史消息（添加系统提示词）
    const messages: ChatMessage[] = []
    if (currentSession.value?.settings.systemPrompt) {
      messages.push({
        id: 'system',
        role: 'system',
        content: currentSession.value.settings.systemPrompt,
        timestamp: new Date().toISOString()
      })
    }
    messages.push(...(currentSession.value?.messages || []))

    // 3. 创建占位AI消息
    const aiMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    }
    
    chatStore.addMessage(aiMessage)
    streamingMessageId.value = aiMessage.id
    isGenerating.value = true

    // 4. 流式请求
    try {
      const api = getAPI()
      const stream = api.chatStream(messages)
      let fullContent = ''
      let fullReasoning = ''

      for await (const chunk of stream) {
        if (chunk.error) throw new Error(chunk.error)
        
        fullContent += chunk.content || ''
        fullReasoning += chunk.reasoningContent || ''

        // 增量更新消息
        chatStore.updateMessage(aiMessage.id, {
          content: fullContent,
          reasoningContent: fullReasoning || undefined,
          isStreaming: !chunk.done
        })

        // 滚动到底部（可通过事件触发）
        scrollToBottom()
      }

      // 5. 完成，生成标题（如果是第一条对话）
      if (currentSession.value && currentSession.value.messages.length === 2) {
        generateTitle(content)
      }

    } catch (err: any) {
      error.value = err.message
      chatStore.updateMessage(aiMessage.id, {
        error: err.message,
        isStreaming: false
      })
    } finally {
      isGenerating.value = false
      streamingMessageId.value = null
    }
  }

  /**
   * 生成会话标题（使用模型总结）
   */
  const generateTitle = async (firstMessage: string) => {
    try {
      const api = getAPI()
      // 截取前50字作为标题，或使用模型生成
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
      chatStore.updateSessionTitle(currentSession.value!.id, title)
    } catch (e) {
      console.error('生成标题失败:', e)
    }
  }

  /**
   * 停止生成
   */
  const stopGeneration = () => {
    // 实际实现需要AbortController，这里简化处理
    isGenerating.value = false
    if (streamingMessageId.value) {
      chatStore.updateMessage(streamingMessageId.value, {
        isStreaming: false
      })
    }
  }

  /**
   * 重新生成最后一条回复
   */
  const regenerate = async () => {
    if (!currentSession.value) return
    
    const messages = currentSession.value.messages
    if (messages.length < 2) return
    
    // 找到最后一条用户消息
    let lastUserIndex = messages.length - 1
    while (lastUserIndex >= 0 && messages[lastUserIndex].role !== 'user') {
      lastUserIndex--
    }
    
    if (lastUserIndex < 0) return
    
    // 删除最后的AI回复
    const lastUserMsg = messages[lastUserIndex]
    chatStore.deleteMessagesAfter(lastUserIndex)
    
    // 重新发送
    inputMessage.value = lastUserMsg.content
    await sendMessage()
  }

  /**
   * 导出对话
   */
  const exportChat = (format: 'markdown' | 'json') => {
    if (!currentSession.value) return
    
    const session = currentSession.value
    let content = ''
    let filename = ''
    let mimeType = ''

    if (format === 'markdown') {
      content = `# ${session.title}\n\n`
      session.messages.forEach(msg => {
        const role = msg.role === 'user' ? '**用户**' : '**AI**'
        content += `### ${role} (${new Date(msg.timestamp).toLocaleString()})\n\n${msg.content}\n\n`
        if (msg.reasoningContent) {
          content += `> 思考过程：\n> ${msg.reasoningContent.replace(/\n/g, '\n> ')}\n\n`
        }
      })
      filename = `chat-${session.id}.md`
      mimeType = 'text/markdown'
    } else {
      content = JSON.stringify(session, null, 2)
      filename = `chat-${session.id}.json`
      mimeType = 'application/json'
    }

    // 下载文件
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // 滚动到底部（简单实现）
  const scrollToBottom = () => {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }, 50)
  }

  return {
    inputMessage,
    isGenerating,
    error,
    currentSession,
    sendMessage,
    stopGeneration,
    regenerate,
    exportChat
  }
}