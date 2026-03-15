<!-- 
  设置弹窗组件
  功能：对话参数设置、系统提示词、导出选项
-->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>对话设置</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>
      
      <div class="settings-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-btn"
          :class="{ 'active': currentTab === tab.key }"
          @click="currentTab = tab.key"
        >
          {{ tab.name }}
        </button>
      </div>
      
      <!-- 通用设置 -->
      <div v-if="currentTab === 'general'" class="tab-content">
        <div class="form-group">
          <label>
            温度 (Temperature): {{ settings.temperature }}
            <span class="tooltip" title="控制随机性，越高回答越创意">?</span>
          </label>
          <input 
            type="range" 
            v-model.number="settings.temperature"
            min="0" 
            max="2" 
            step="0.1"
          >
          <div class="range-labels">
            <span>精确</span>
            <span>平衡</span>
            <span>创意</span>
          </div>
        </div>
        
        <div class="form-group">
          <label>
            最大生成长度: {{ settings.maxTokens }} tokens
          </label>
          <input 
            type="range" 
            v-model.number="settings.maxTokens"
            min="256" 
            max="8192" 
            step="256"
          >
        </div>
        
        <div class="form-group">
          <label>
            Top P: {{ settings.topP }}
            <span class="tooltip" title="核采样参数">?</span>
          </label>
          <input 
            type="range" 
            v-model.number="settings.topP"
            min="0" 
            max="1" 
            step="0.05"
          >
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="settings.stream">
            <span>启用流式输出（实时显示）</span>
          </label>
        </div>
      </div>
      
      <!-- 系统提示词 -->
      <div v-if="currentTab === 'system'" class="tab-content">
        <div class="form-group">
          <label>系统提示词 (System Prompt)</label>
          <textarea 
            v-model="settings.systemPrompt"
            rows="6"
            placeholder="设定AI的角色和行为方式..."
          ></textarea>
          <span class="hint">用于设定AI助手的角色和约束条件</span>
        </div>
        
        <div class="preset-prompts">
          <label>快速选择预设：</label>
          <div class="preset-buttons">
            <button 
              v-for="preset in systemPresets" 
              :key="preset.name"
              @click="settings.systemPrompt = preset.content"
            >
              {{ preset.name }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- 导出 -->
      <div v-if="currentTab === 'export'" class="tab-content">
        <div class="export-options">
          <button class="export-btn" @click="exportChat('markdown')">
            <span class="icon">📝</span>
            <div>
              <div class="export-title">导出为 Markdown</div>
              <div class="export-desc">适合阅读和分享</div>
            </div>
          </button>
          
          <button class="export-btn" @click="exportChat('json')">
            <span class="icon">📋</span>
            <div>
              <div class="export-title">导出为 JSON</div>
              <div class="export-desc">包含完整元数据</div>
            </div>
          </button>
          
          <button class="export-btn" @click="copyShareLink">
            <span class="icon">🔗</span>
            <div>
              <div class="export-title">复制分享链接</div>
              <div class="export-desc">生成临时分享链接</div>
            </div>
          </button>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" @click="resetSettings">
          恢复默认
        </button>
        <button class="btn-primary" @click="saveSettings">
          保存设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { ChatSettings } from '@/types/chat'

const props = defineProps<{
  session: {
    id: string
    settings: ChatSettings
  } | null
}>()

const emit = defineEmits<{
  close: []
  save: [settings: Partial<ChatSettings>]
}>()

const tabs = [
  { key: 'general', name: '通用' },
  { key: 'system', name: '系统提示' },
  { key: 'export', name: '导出' }
]

const currentTab = ref('general')

// 深拷贝当前设置
const settings = reactive<ChatSettings>({
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: '',
  topP: 0.9,
  stream: true,
  ...props.session?.settings
})

const systemPresets = [
  {
    name: '通用助手',
    content: '你是一个有帮助的AI助手，能够回答各种问题。'
  },
  {
    name: '代码专家',
    content: '你是一个专业的程序员，擅长编写和解释代码。请提供清晰、高效的代码示例。'
  },
  {
    name: '学术写作',
    content: '你是一个学术写作助手，帮助用户撰写论文、报告。要求逻辑清晰、用词准确。'
  },
  {
    name: '创意作家',
    content: '你是一个创意作家，擅长故事创作和文案写作。请提供富有想象力的内容。'
  }
]

const saveSettings = () => {
  emit('save', { ...settings })
}

const resetSettings = () => {
  Object.assign(settings, {
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: '',
    topP: 0.9,
    stream: true
  })
}

const exportChat = (format: 'markdown' | 'json') => {
  // 通过事件让父组件处理导出
  emit('export', format)
}

const copyShareLink = () => {
  // 模拟生成分享链接
  const fakeLink = `https://your-app.com/share/${props.session?.id}`
  navigator.clipboard.writeText(fakeLink)
  alert('链接已复制到剪贴板（演示功能）')
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
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  
  .dark & {
    background: #1f2937;
    color: #e5e5e5;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  
  .dark & {
    border-color: #374151;
  }
  
  h3 {
    margin: 0;
    font-size: 18px;
  }
  
  .btn-close {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    color: #9ca3af;
    border-radius: 8px;
    transition: all 0.2s;
    
    &:hover {
      background: #f3f4f6;
      color: #374151;
      
      .dark & {
        background: #374151;
        color: #e5e5e5;
      }
    }
  }
}

.settings-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid #e5e7eb;
  
  .dark & {
    border-color: #374151;
  }
}

.tab-btn {
  padding: 16px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
  
  &:hover {
    color: #374151;
    
    .dark & {
      color: #d1d5db;
    }
  }
  
  &.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
    font-weight: 500;
  }
  
  .dark & {
    color: #9ca3af;
  }
}

.tab-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 24px;
  
  label {
    display: block;
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    
    .dark & {
      color: #d1d5db;
    }
  }
  
  input[type="range"] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e5e7eb;
    outline: none;
    -webkit-appearance: none;
    
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
    }
    
    .dark & {
      background: #4b5563;
    }
  }
  
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
    resize: vertical;
    
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
    margin-top: 8px;
    font-size: 12px;
    color: #9ca3af;
  }
}

.tooltip {
  display: inline-flex;
  width: 16px;
  height: 16px;
  background: #e5e7eb;
  border-radius: 50%;
  font-size: 11px;
  align-items: center;
  justify-content: center;
  cursor: help;
  margin-left: 6px;
  
  .dark & {
    background: #4b5563;
    color: #9ca3af;
  }
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: #9ca3af;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  
  input {
    width: 18px;
    height: 18px;
    accent-color: #3b82f6;
  }
  
  span {
    font-weight: normal;
  }
}

.preset-prompts {
  margin-top: 20px;
  
  > label {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 12px;
  }
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  button {
    padding: 8px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    background: white;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      background: #eff6ff;
    }
    
    .dark & {
      background: #374151;
      border-color: #4b5563;
      color: #d1d5db;
      
      &:hover {
        border-color: #3b82f6;
        color: #3b82f6;
        background: #1e3a8a;
      }
    }
  }
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }
  
  .dark & {
    background: #374151;
    border-color: #4b5563;
    
    &:hover {
      background: #1e3a8a;
    }
  }
  
  .icon {
    font-size: 24px;
  }
  
  .export-title {
    font-weight: 500;
    color: #374151;
    margin-bottom: 4px;
    
    .dark & {
      color: #e5e5e5;
    }
  }
  
  .export-desc {
    font-size: 13px;
    color: #9ca3af;
  }
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  
  .dark & {
    border-color: #374151;
  }
  
  button {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
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
  
  &:hover {
    background: #2563eb;
  }
}
</style>