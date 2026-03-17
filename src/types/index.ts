// 消息角色类型
export type MessageRole = 'system' | 'user' | 'assistant'

// 消息接口
export interface Message {
  id: string | number
  role: MessageRole
  content: string
  timestamp: Date
  streaming?: boolean
  isError?: boolean
}

// 会话接口
export interface Session {
  id: string
  title: string
  createdAt: Date
}

// 用户信息接口
export interface UserInfo {
  email: string
  name: string
}

// API流式响应块接口
export interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string
    }
  }>
}