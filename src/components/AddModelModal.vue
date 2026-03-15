<!-- 
  添加自定义模型弹窗
  功能：配置Ollama或OpenAI格式API
-->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h3>添加自定义模型</h3>
      
      <form @submit.prevent="handleSubmit">
        <!-- 提供商选择 -->
        <div class="form-group">
          <label>提供商类型</label>
          <div class="provider-options">
            <label 
              v-for="provider in providers" 
              :key="provider.value"
              class="provider-radio"
              :class="{ 'active': form.provider === provider.value }"
            >
              <input 
                type="radio" 
                v-model="form.provider"
                :value="provider.value"
              >
              <span class="icon">{{ provider.icon }}</span>
              <span class="name">{{ provider.name }}</span>
            </label>
          </div>
        </div>
        
        <!-- 显示名称 -->
        <div class="form-group">
          <label>显示名称 <span class="required">*</span></label>
          <input 
            v-model="form.name"
            type="text"
            placeholder="例如：我的DeepSeek"
            required
          >
        </div>
        
        <!-- 基础URL -->
        <div class="form-group">
          <label>API地址 <span class="required">*</span></label>
          <input 
            v-model="form.baseUrl"
            type="url"
            :placeholder="baseUrlPlaceholder"
            required
          >
          <span class="hint">{{ baseUrlHint }}</span>
        </div>
        
        <!-- 模型ID -->
        <div class="form-group">
          <label>模型ID <span class="required">*</span></label>
          <input 
            v-model="form.modelId"
            type="text"
            :placeholder="modelIdPlaceholder"
            required
          >
        </div>
        
        <!-- API密钥（非Ollama需要） -->
        <div class="form-group" v-if="form.provider !== 'ollama'">
          <label>API密钥 <span class="required">*</span></label>
          <input 
            v-model="form.apiKey"
            type="password"
            placeholder="sk-..."
            required
          >
        </div>
        
        <!-- 能力配置 -->
        <div class="form-group">
          <label>模型能力</label>
          <div class="capabilities">
            <label class="cap-checkbox">
              <input type="checkbox" v-model="form.capabilities.streaming" checked disabled>
              <span>支持流式输出</span>
            </label>
            <label class="cap-checkbox">
              <input type="checkbox" v-model="form.capabilities.reasoning">
              <span>支持思考过程（如DeepSeek-R1）</span>
            </label>
            <label class="cap-checkbox">
              <input type="checkbox" v-model="form.capabilities.vision">
              <span>支持图片输入</span>
            </label>
          </div>
        </div>
        
        <!-- 测试连接 -->
        <div class="form-group">
          <button 
            type="button"
            class="btn-test"
            :disabled="testing"
            @click="testConnection"
          >
            {{ testing ? '测试中...' : (testResult || '测试连接') }}
          </button>
        </div>
        
        <!-- 按钮 -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">
            取消
          </button>
          <button 
            type="submit" 
            class="btn-primary"
            :disabled="!isValid"
          >
            添加模型
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import type { ModelConfig } from '@/types/chat'

const emit = defineEmits<{
  close: []
  add: [model: ModelConfig]
}>()

const providers = [
  { value: 'ollama', name: 'Ollama本地', icon: '🏠' },
  { value: 'openai', name: 'OpenAI格式API', icon: '☁️' },
  { value: 'custom', name: '自定义', icon: '⚙️' }
] as const

const form = reactive({
  provider: 'ollama' as 'ollama' | 'openai' | 'custom',
  name: '',
  baseUrl: 'http://localhost:11434',
  modelId: '',
  apiKey: '',
  capabilities: {
    streaming: true,
    reasoning: false,
    vision: false
  }
})

const testing = ref(false)
const testResult = ref<string | null>(null)

const baseUrlPlaceholder = computed(() => {
  const map = {
    ollama: 'http://localhost:11434',
    openai: 'https://api.deepseek.com/v1',
    custom: 'https://your-api.com/v1'
  }
  return map[form.provider]
})

const baseUrlHint = computed(() => {
  const map = {
    ollama: 'Ollama默认端口11434',
    openai: '例如DeepSeek、通义千问等',
    custom: '自定义API端点'
  }
  return map[form.provider]
})

const modelIdPlaceholder = computed(() => {
  const map = {
    ollama: 'deepseek-r1:14b',
    openai: 'deepseek-chat',
    custom: '模型标识'
  }
  return map[form.provider]
})

const isValid = computed(() => {
  if (!form.name || !form.baseUrl || !form.modelId) return false
  if (form.provider !== 'ollama' && !form.apiKey) return false
  return true
})

const testConnection = async () => {
  testing.value = true
  testResult.value = null
  
  try {
    if (form.provider === 'ollama') {
      const res = await fetch(`${form.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      })
      if (res.ok) {
        const data = await res.json()
        const hasModel = data.models?.some((m: any) => m.name === form.modelId)
        testResult.value = hasModel ? '✅ 连接成功，找到模型' : '⚠️ 连接成功，但未找到该模型'
      } else {
        testResult.value = '❌ 连接失败'
      }
    } else {
      // API类型简单检测
      testResult.value = form.apiKey ? '✅ 配置完整' : '❌ 需要API密钥'
    }
  } catch (e) {
    testResult.value = '❌ 无法连接到服务器'
  } finally {
    testing.value = false
  }
}

const handleSubmit = () => {
  if (!isValid.value) return
  
  const model: ModelConfig = {
    id: `custom-${Date.now()}`,
    name: form.name,
    provider: form.provider,
    baseUrl: form.baseUrl,
    apiKey: form.apiKey || undefined,
    modelId: form.modelId,
    capabilities: { ...form.capabilities }
  }
  
  emit('add', model)
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  
  .dark & {
    background: #1f2937;
    color: #e5e5e5;
  }
  
  h3 {
    margin: 0 0 20px 0;
    font-size: 20px;
  }
}

.form-group {
  margin-bottom: 20px;
  
  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    
    .dark & {
      color: #d1d5db;
    }
    
    .required {
      color: #ef4444;
    }
  }
  
  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
    
    .dark & {
      background: #374151;
      border-color: #4b5563;
      color: #e5e5e5;
    }
  }
  
  .hint {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: #9ca3af;
  }
}

.provider-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.provider-radio {
  flex: 1;
  min-width: 100px;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  
  input {
    display: none;
  }
  
  .icon {
    display: block;
    font-size: 24px;
    margin-bottom: 4px;
  }
  
  .name {
    font-size: 13px;
    color: #374151;
    
    .dark & {
      color: #d1d5db;
    }
  }
  
  &.active {
    border-color: #3b82f6;
    background: #eff6ff;
    
    .dark & {
      background: #1e3a8a;
    }
    
    .name {
      color: #3b82f6;
      font-weight: 500;
    }
  }
  
  &:hover:not(.active) {
    border-color: #d1d5db;
  }
}

.capabilities {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cap-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  
  .dark & {
    color: #d1d5db;
  }
  
  input {
    width: auto;
  }
}

.btn-test {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #f3f4f6;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .dark & {
    background: #374151;
    border-color: #4b5563;
    color: #e5e5e5;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  
  button {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.btn-secondary {
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  
  &:hover {
    background: #f9fafb;
  }
  
  .dark & {
    background: #374151;
    border-color: #4b5563;
    color: #e5e5e5;
  }
}

.btn-primary {
  border: none;
  background: #3b82f6;
  color: white;
  
  &:hover:not(:disabled) {
    background: #2563eb;
  }
}
</style>