/**
 * 用户状态管理
 * 功能：登录/注册/登出、Token管理、用户信息、权限控制
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storage } from '@/utils/storage'
import type { UserInfo, LoginForm, RegisterForm, AuthResponse } from '@/types/user'

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const useUserStore = defineStore('user', () => {
  // ==================== State ====================
  const token = ref<string>(storage.get('access_token') || '')
  const refreshToken = ref<string>(storage.get('refresh_token') || '')
  const userInfo = ref<UserInfo | null>(storage.get('user_info'))
  const isLoading = ref(false)
  const loginError = ref<string | null>(null)

  // ==================== Getters ====================
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  
  const displayName = computed(() => 
    userInfo.value?.nickname || userInfo.value?.username || '用户'
  )

  const avatar = computed(() => 
    userInfo.value?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo.value?.username || 'guest'}`
  )

  // ==================== Actions ====================

  /**
   * 用户登录
   */
  const login = async (form: LoginForm): Promise<boolean> => {
    isLoading.value = true
    loginError.value = null
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      const data: AuthResponse = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || '登录失败')
      }
      
      // 保存Token
      setTokens(data.accessToken, data.refreshToken)
      userInfo.value = data.user
      
      // 持久化
      storage.set('user_info', data.user)
      
      return true
      
    } catch (error: any) {
      loginError.value = error.message
      return false
      
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 用户注册
   */
  const register = async (form: RegisterForm): Promise<boolean> => {
    isLoading.value = true
    loginError.value = null
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || '注册失败')
      }
      
      // 注册成功后自动登录
      return await login({
        username: form.username,
        password: form.password
      })
      
    } catch (error: any) {
      loginError.value = error.message
      return false
      
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 退出登录
   */
  const logout = (redirect: boolean = true) => {
    // 清除状态
    token.value = ''
    refreshToken.value = ''
    userInfo.value = null
    
    // 清除存储
    storage.remove('access_token')
    storage.remove('refresh_token')
    storage.remove('user_info')
    
    // 可选：调用后端登出接口使Token失效
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.value}` }
    }).catch(() => {})
    
    // 跳转登录页
    if (redirect) {
      const router = useRouter()
      router.push('/login')
    }
  }

  /**
   * 刷新Token
   */
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken.value) return false
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken.value })
      })
      
      if (!response.ok) throw new Error('刷新失败')
      
      const data: AuthResponse = await response.json()
      setTokens(data.accessToken, data.refreshToken)
      
      return true
      
    } catch {
      // 刷新失败，需要重新登录
      logout(false)
      return false
    }
  }

  /**
   * 恢复会话（页面刷新后）
   */
  const restoreSession = async (): Promise<boolean> => {
    if (!token.value) return false
    
    try {
      // 验证Token有效性并获取最新用户信息
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      
      if (response.status === 401) {
        // Token过期，尝试刷新
        const refreshed = await refreshAccessToken()
        if (!refreshed) return false
        
        // 刷新成功，重新获取用户信息
        return await restoreSession()
      }
      
      if (!response.ok) throw new Error('获取用户信息失败')
      
      const data = await response.json()
      userInfo.value = data.user
      storage.set('user_info', data.user)
      
      return true
      
    } catch (error) {
      console.error('恢复会话失败:', error)
      logout(false)
      return false
    }
  }

  /**
   * 更新用户信息
   */
  const updateUserInfo = async (updates: Partial<UserInfo>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) throw new Error('更新失败')
      
      const data = await response.json()
      userInfo.value = { ...userInfo.value, ...data.user } as UserInfo
      storage.set('user_info', userInfo.value)
      
      return true
      
    } catch (error: any) {
      console.error('更新用户信息失败:', error)
      return false
    }
  }

  /**
   * 修改密码
   */
  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '修改失败')
      }
      
      return true
      
    } catch (error: any) {
      console.error('修改密码失败:', error)
      throw error
    }
  }

  // ==================== 辅助函数 ====================
  
  const setTokens = (access: string, refresh: string) => {
    token.value = access
    refreshToken.value = refresh
    storage.set('access_token', access)
    storage.set('refresh_token', refresh)
  }

  return {
    // State
    token,
    userInfo,
    isLoading,
    loginError,
    // Getters
    isLoggedIn,
    isAdmin,
    displayName,
    avatar,
    // Actions
    login,
    register,
    logout,
    refreshAccessToken,
    restoreSession,
    updateUserInfo,
    changePassword
  }
})