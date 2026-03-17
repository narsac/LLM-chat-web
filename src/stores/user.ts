import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserInfo } from '../types'

export const useUserStore = defineStore('user', () => {
  const isLoggedIn = ref<boolean>(false)
  const userInfo = ref<UserInfo | null>(null)
  const token = ref<string>('')

  // 登录
  const login = async (email: string, password: string): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        isLoggedIn.value = true
        userInfo.value = { email, name: '测试用户' }
        token.value = 'mock-token-' + Date.now()
        resolve({ success: true })
      }, 1000)
    })
  }

  // 登出
  const logout = (): void => {
    isLoggedIn.value = false
    userInfo.value = null
    token.value = ''
  }

  return { isLoggedIn, userInfo, token, login, logout }
})