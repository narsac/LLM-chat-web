<template>
  <div class="chat-view" :class="{ 'dark': settingsStore.isDarkMode }">
    <!-- 侧边栏 -->
    <Sidebar 
      :sessions="chatStore.sortedSessions"
      :current-id="chatStore.currentSessionId"
      @select="chatStore.switchSession"
      @new="createNewChat"
      @delete="chatStore.deleteSession"
    />
    
    <!-- 主内容区 -->
    <div class="main-area">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <ModelSelector 
          :models="settingsStore.models"
          :current="settingsStore.currentModelId"
          @change="settingsStore.setModel"
        />
        
        <div class="actions">
          <button class="btn-icon" @click="showSettings = true" title="设置">
            ⚙️
          </button>
          <button class="btn-icon" @click="toggleTheme" title="切换主题">
            {{ settingsStore.isDarkMode ? '☀️' : '🌙' }}
          </button>
        </div>
      </header>
      
      <!-- 消息列表 -->
      <div class="chat-container">
        <div v-if="!currentSession || currentSession.messages.length === 0" class="welcome">
          <h1>🤖 AI 对话助手</h1>
          <p>支持本地Ollama模型和在线API</p>
          <div class="quick-actions">
            <button 
              v-for="prompt in quickPrompts" 
              :key="prompt"
              @click="setInput(prompt)"
            >
              {{ prompt }}
            </button>
          </div>
        </div>
        
        <div v-else class="chat-messages">
          <ChatMessage
            v-for="(msg, index) in currentSession.messages"
            :key="msg.id"
            :message="msg"
            :is-last="index === currentSession.messages.length - 1"
            @regenerate="regenerate"
          />
          
          <!-- 错误提示 -->
          <div v-if="error" class="error-banner">
            <span>❌ {{ error }}</span>
            <button @click="retryLastMessage">重试</button>
          </div>
        </div>
      </div>
      
      <!-- 输入区 -->
      <div class="input-area">
        <div class="input-wrapper">
          <textarea
            v-model="inputMessage"
            :disabled="isGenerating"
            :placeholder="isGenerating ? 'AI正在思考...' : '输入消息...'"
            rows="1"
            @keydown.enter.prevent="handleEnter"
            @input="autoResize"
            ref="inputRef"
          ></textarea>
          
          <div class="input-actions">
            <span class="token-hint" v-if="inputMessage">
              {{ inputMessage.length }} 字符
            </span>
            
            <button 
              v-if="isGenerating"
              class="btn-stop"
              @click="stopGeneration"
            >
              ⏹ 停止
            </button>
            
            <button 
              v-else
              class="btn-send"
              :disabled="!inputMessage.trim()"
              @click="sendMessage"
            >
              ➤ 发送
            </button>
          </div>
        </div>
        
        <div class="input-footer">
          <span class="hint">Enter发送，Shift+Enter换行</span>
          <button class="btn-text" @click="exportChat('markdown')">
            导出Markdown
          </button>
        </div>
      </div>
    </div>
    
    <!-- 设置弹窗 -->
    <SettingsModal
      v-if="showSettings"
      :session="currentSession"
      @close="showSettings = false"
      @save="saveSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useChat } from '@/composables/useChat'
import Sidebar from '@/components/Sidebar.vue'
import ModelSelector from '@/components/ModelSelector.vue'
import ChatMessage from '@/components/ChatMessage.vue'
import SettingsModal from '@/components/SettingsModal.vue'

const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const {
  inputMessage,
  isGenerating,
  error,
  currentSession,
  sendMessage,
  stopGeneration,
  regenerate,
  exportChat
} = useChat()

const inputRef = ref<HTMLTextAreaElement>()
const showSettings = ref(false)

// 快捷提示词
const quickPrompts = [
  '解释一下Vue3的Composition API',
  '帮我写一段快速排序代码',
  '什么是深度学习？',
  '翻译：Hello World'
]

// 创建新对话
const createNewChat = () => {
  chatStore.createSession(settingsStore.currentModelId)
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 设置输入
const setInput = (text: string) => {
  inputMessage.value = text
  nextTick(() => {
    autoResize()
    inputRef.value?.focus()
  })
}

// 处理Enter键
const handleEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) {
    // Shift+Enter换行，默认行为
    return
  }
  sendMessage()
}

// 自动调整高度
const autoResize = () => {
  const textarea = inputRef.value
  if (!textarea) return
  
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
}

// 切换主题
const toggleTheme = () => {
  settingsStore.toggleDarkMode()
}

// 重试最后一条
const retryLastMessage = () => {
  if (!currentSession.value) return
  const lastMsg = currentSession.value.messages[currentSession.value.messages.length - 1]
  if (lastMsg?.role === 'user') {
    sendMessage()
  }
}

// 保存设置
const saveSettings = (settings: any) => {
  if (currentSession.value) {
    chatStore.updateSessionSettings(currentSession.value.id, settings)
  }
  showSettings.value = false
}
</script>

<style scoped lang="scss">
.chat-view {
  display: flex;
  height: 100vh;
  background: #ffffff;
  
  &.dark {
    background: #1a1a1a;
    color: #e5e5e5;
  }
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; // 防止flex子项溢出
}

.top-bar {
  height: 60px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  
  .dark & {
    border-color: #374151;
  }
  
  .actions {
    display: flex;
    gap: 8px;
  }
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  
  &:hover {
    background: #f3f4f6;
    
    .dark & {
      background: #374151;
    }
  }
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.welcome {
  max-width: 600px;
  margin: 100px auto;
  text-align: center;
  
  h1 {
    font-size: 32px;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    color: #6b7280;
    margin-bottom: 32px;
    
    .dark & {
      color: #9ca3af;
    }
  }
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  
  button {
    padding: 12px 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    
    &:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }
    
    .dark & {
      background: #374151;
      border-color: #4b5563;
      color: #e5e5e5;
    }
  }
}

.chat-messages {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.error-banner {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  button {
    padding: 4px 12px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
}

.input-area {
  border-top: 1px solid #e5e7eb;
  padding: 20px;
  
  .dark & {
    border-color: #374151;
  }
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .dark & {
    background: #374151;
    border-color: #4b5563;
  }
  
  textarea {
    width: 100%;
    border: none;
    background: transparent;
    resize: none;
    font-size: 15px;
    line-height: 1.6;
    max-height: 200px;
    font-family: inherit;
    
    &:focus {
      outline: none;
    }
    
    &::placeholder {
      color: #9ca3af;
    }
    
    .dark & {
      color: #e5e5e5;
    }
  }
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.token-hint {
  font-size: 12px;
  color: #9ca3af;
}

.btn-send, .btn-stop {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-send {
  background: #3b82f6;
  color: white;
  
  &:hover:not(:disabled) {
    background: #2563eb;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-stop {
  background: #ef4444;
  color: white;
  
  &:hover {
    background: #dc2626;
  }
}

.input-footer {
  max-width: 800px;
  margin: 8px auto 0;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
  
  .btn-text {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    
    &:hover {
      color: #3b82f6;
    }
  }
}
</style>