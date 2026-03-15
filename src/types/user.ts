/**
 * 用户相关类型定义
 */

export interface UserInfo {
  id: string
  username: string
  nickname?: string
  email: string
  avatar?: string
  role: 'user' | 'admin'
  createdAt: string
  lastLoginAt?: string
  settings?: UserSettings
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: boolean
}

export interface LoginForm {
  username: string
  password: string
  remember?: boolean
}

export interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
  email: string
  nickname?: string
  agreeTerms: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: UserInfo
  message?: string
}

// 登录方式
export type LoginType = 'password' | 'email' | 'github' | 'google'