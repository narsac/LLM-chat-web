import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Session } from '../types'

export const useSessionStore = defineStore('session', () => {
  const sessions = ref<Session[]>([
    { id: '1', title: '第一次对话', createdAt: new Date() },
    { id: '2', title: '技术讨论', createdAt: new Date() },
    { id: '3', title: '代码帮助', createdAt: new Date() },
  ])
  
  const currentSessionId = ref<string | null>(null)

  // 创建新会话
  const createSession = (): Session => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: '新对话',
      createdAt: new Date()
    }
    sessions.value.unshift(newSession)
    currentSessionId.value = newSession.id
    return newSession
  }

  // 删除会话
  const deleteSession = (id: string): void => {
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (currentSessionId.value === id) {
      currentSessionId.value = sessions.value[0]?.id || null
    }
  }

  // 重命名会话
  const renameSession = (id: string, newTitle: string): void => {
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      session.title = newTitle
    }
  }

  return {
    sessions,
    currentSessionId,
    createSession,
    deleteSession,
    renameSession
  }
})