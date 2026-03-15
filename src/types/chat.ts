// 消息角色
export type MessageRole = 'system' | 'user' | 'assistant'

// 单条消息
export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  // 思考过程（如DeepSeek的<think>标签内容）
  reasoningContent?: string
  // Token消耗（如果API返回）
  tokens?: {
    prompt: number
    completion: number
    total: number
  }
  // 是否正在生成（用于流式显示）
  isStreaming?: boolean
  // 是否报错
  error?: string
}

// 对话会话
export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  model: string          // 使用的模型
  createdAt: string
  updatedAt: string
  settings: ChatSettings
}

// 对话设置
export interface ChatSettings {
  temperature: number    // 0-2，默认0.7
  maxTokens: number      // 最大生成长度
  systemPrompt: string   // 系统提示词
  topP: number          // 默认0.9
  stream: boolean       // 是否流式输出
}

// 模型配置
export interface ModelConfig {
  id: string
  name: string          // 显示名称
  provider: 'ollama' | 'openai' | 'custom'  // 提供商
  baseUrl: string       // API地址
  apiKey?: string       // 可选（Ollama不需要）
  modelId: string       // 实际模型ID（如deepseek-r1:14b）
  capabilities: {
    streaming: boolean  // 支持流式
    reasoning: boolean // 支持思考过程（如DeepSeek-R1）
    vision: boolean    // 支持图片
  }
}

// 流式响应块
export interface StreamChunk {
  id?: string
  content?: string
  reasoningContent?: string
  done: boolean
  error?: string
}

// 导出格式
export type ExportFormat = 'markdown' | 'json' | 'html'