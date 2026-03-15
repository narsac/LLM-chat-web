/**
 * 对话状态管理
 * 功能：会话CRUD、消息管理、持久化
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatSession, ChatMessage, ChatSettings } from '@/types/chat'
import { storage } from '@/utils/storage'

// 默认设置
const defaultSettings: ChatSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: '你是一个有帮助的AI助手。',
  topP: 0.9,
  stream: true
}

export const useChatStore = defineStore('chat', () => {
  // State
  const sessions = ref<ChatSession[]>(storage.get('chat-sessions') || [])
  const currentSessionId = ref<string | null>(storage.get('current-session-id'))
  const isLoading = ref(false)

  // Getters 
  const currentSession = computed(() => 
    sessions.value.find(s => s.id === currentSessionId.value) || null
  )

  const sortedSessions = computed(() => 
    [...sessions.value].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  )

  // Actions
  
  /**
   * 创建新会话
   */
  const createSession = (modelId: string): ChatSession => {
    const session: ChatSession = {
      id: `session-${Date.now()}`,
      title: '新对话',
      messages: [],
      model: modelId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: { ...defaultSettings }
    }
    
    sessions.value.unshift(session)
    currentSessionId.value = session.id
    saveToStorage()
    
    return session
  }

  /**
   * 切换会话
   */
  const switchSession = (id: string) => {
    currentSessionId.value = id
    storage.set('current-session-id', id)
  }

  /**
   * 删除会话
   */
  const deleteSession = (id: string) => {
    const index = sessions.value.findIndex(s => s.id === id)
    if (index > -1) {
      sessions.value.splice(index, 1)
      
      // 如果删除的是当前会话，切换到第一个
      if (currentSessionId.value === id) {
        currentSessionId.value = sessions.value[0]?.id || null
      }
      
      saveToStorage()
    }
  }

  /**
   * 更新会话标题
   */
  const updateSessionTitle = (id: string, title: string) => {
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      session.title = title
      session.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  /**
   * 添加消息
   */
  const addMessage = (message: ChatMessage) => {
    const session = currentSession.value
    if (!session) return
    
    session.messages.push(message)
    session.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  /**
   * 更新消息（用于流式更新）
   */
  const updateMessage = (messageId: string, updates: Partial<ChatMessage>) => {
    const session = currentSession.value
    if (!session) return
    
    const message = session.messages.find(m => m.id === messageId)
    if (message) {
      Object.assign(message, updates)
      saveToStorage()
    }
  }

  /**
   * 删除消息及之后所有消息（用于重新生成）
   */
  const deleteMessagesAfter = (index: number) => {
    const session = currentSession.value
    if (!session) return
    
    session.messages = session.messages.slice(0, index + 1)
    saveToStorage()
  }

  /**
   * 更新会话设置
   */
  const updateSessionSettings = (id: string, settings: Partial<ChatSettings>) => {
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      session.settings = { ...session.settings, ...settings }
      saveToStorage()
    }
  }

  /**
   * 持久化
   */
  const saveToStorage = () => {
    storage.set('chat-sessions', sessions.value)
    storage.set('current-session-id', currentSessionId.value)
  }

  // 初始化：如果没有会话，创建一个
  if (sessions.value.length === 0) {
    createSession('deepseek-r1:14b')
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    sortedSessions,
    createSession,
    switchSession,
    deleteSession,
    updateSessionTitle,
    addMessage,
    updateMessage,
    deleteMessagesAfter,
    updateSessionSettings
  }
})