/**
 * 全局设置管理
 * 功能：模型配置、主题、API密钥管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ModelConfig } from '@/types/chat'
import { storage } from '@/utils/storage'

// 预设模型配置
const presetModels: ModelConfig[] = [
  {
    id: 'ollama-deepseek',
    name: 'DeepSeek R1 (本地)',
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    modelId: 'deepseek-r1:14b',
    capabilities: {
      streaming: true,
      reasoning: true,
      vision: false
    }
  },
  {
    id: 'ollama-llama',
    name: 'Llama 3 (本地)',
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    modelId: 'llama3:latest',
    capabilities: {
      streaming: true,
      reasoning: false,
      vision: false
    }
  },
  {
    id: 'deepseek-api',
    name: 'DeepSeek (API)',
    provider: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    modelId: 'deepseek-chat',
    apiKey: '', // 用户填写
    capabilities: {
      streaming: true,
      reasoning: true,
      vision: false
    }
  }
]

export const useSettingsStore = defineStore('settings', () => {
  const models = ref<ModelConfig[]>(storage.get('custom-models') || presetModels)
  const currentModelId = ref<string>(storage.get('current-model') || 'ollama-deepseek')
  const isDarkMode = ref<boolean>(storage.get('dark-mode') || false)

  const currentModel = computed(() => 
    models.value.find(m => m.id === currentModelId.value) || models.value[0]
  )

  const setModel = (id: string) => {
    currentModelId.value = id
    storage.set('current-model', id)
  }

  const addCustomModel = (config: ModelConfig) => {
    models.value.push(config)
    storage.set('custom-models', models.value)
  }

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
    storage.set('dark-mode', isDarkMode.value)
    document.documentElement.classList.toggle('dark', isDarkMode.value)
  }

  // 初始化主题
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  }

  return {
    models,
    currentModelId,
    currentModel,
    isDarkMode,
    setModel,
    addCustomModel,
    toggleDarkMode
  }
})