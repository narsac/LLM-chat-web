import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import OpenAI from 'openai'
import { useUserStore } from './user'
import { useSessionStore } from './session'
import type { Message, StreamChunk } from '../types'

interface MessagesMap {
  [key: string]: Message[]
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<MessagesMap>({})
  const isLoading = ref<boolean>(false)
  const streamingContent = ref<string>('')
  
  const userStore = useUserStore()
  const sessionStore = useSessionStore()

  // 当前会话的消息
  const currentMessages = computed<Message[]>(() => {
    if (!sessionStore.currentSessionId) return []
    return messages.value[sessionStore.currentSessionId] || []
  })

  // 初始化OpenAI客户端
  const getOpenAIClient = (): OpenAI => {
    return new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY as string,
      dangerouslyAllowBrowser: true // 注意：实际生产环境应该通过后端转发
    })
  }

  // 发送消息
  const sendMessage = async (content: string): Promise<void> => {
    if (!sessionStore.currentSessionId) {
      sessionStore.createSession()
    }

    const sessionId = sessionStore.currentSessionId as string
    if (!messages.value[sessionId]) {
      messages.value[sessionId] = []
    }

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    messages.value[sessionId].push(userMessage)

    // 准备API消息历史
    const apiMessages = messages.value[sessionId].map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // 添加系统提示词（如果没有）
    if (!apiMessages.some(m => m.role === 'system')) {
      apiMessages.unshift({
        role: 'system',
        content: 'You are a helpful assistant.'
      })
    }

    // 创建助手消息占位
    const assistantMessageId = Date.now() + 1
    messages.value[sessionId].push({
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true
    })

    isLoading.value = true
    streamingContent.value = ''

    try {
      const openai = getOpenAIClient()
      const stream = await openai.chat.completions.create({
        messages: apiMessages,
        model: 'deepseek-chat',
        stream: true,
      })

      let fullContent = ''
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        fullContent += content
        streamingContent.value = fullContent
        
        // 更新消息内容
        const msgIndex = messages.value[sessionId].findIndex(
          m => m.id === assistantMessageId
        )
        if (msgIndex !== -1) {
          messages.value[sessionId][msgIndex].content = fullContent
        }
      }

      // 标记流式结束
      const msgIndex = messages.value[sessionId].findIndex(
        m => m.id === assistantMessageId
      )
      if (msgIndex !== -1) {
        messages.value[sessionId][msgIndex].streaming = false
      }

      // 更新会话标题（如果是第一条消息）
      if (messages.value[sessionId].length <= 2) {
        const session = sessionStore.sessions.find(
          s => s.id === sessionId
        )
        if (session) {
          session.title = content.substring(0, 20) + (content.length > 20 ? '...' : '')
        }
      }

    } catch (error) {
      console.error('API调用失败:', error)
      // 移除失败的助手消息
      messages.value[sessionId] = messages.value[sessionId].filter(
        m => m.id !== assistantMessageId
      )
      
      // 添加错误消息
      messages.value[sessionId].push({
        id: Date.now(),
        role: 'assistant',
        content: '抱歉，发生了错误：' + (error as Error).message,
        timestamp: new Date(),
        isError: true
      })
    } finally {
      isLoading.value = false
      streamingContent.value = ''
    }
  }

  // 清空当前会话
  const clearCurrentSession = (): void => {
    if (sessionStore.currentSessionId) {
      messages.value[sessionStore.currentSessionId] = []
    }
  }

  return {
    messages,
    currentMessages,
    isLoading,
    streamingContent,
    sendMessage,
    clearCurrentSession
  }
})