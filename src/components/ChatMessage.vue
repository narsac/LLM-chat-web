<!-- 
  单条消息组件
  功能：区分用户/AI、Markdown渲染、思考过程折叠、复制功能
-->
<template>
  <div 
    class="message"
    :class="[message.role, { 'streaming': message.isStreaming }]"
  >
    <!-- 头像 -->
    <div class="avatar">
      <div v-if="message.role === 'user'" class="user-avatar">👤</div>
      <div v-else class="ai-avatar">🤖</div>
    </div>
    
    <!-- 内容 -->
    <div class="content-wrapper">
      <!-- 思考过程（可折叠） -->
      <div 
        v-if="message.reasoningContent" 
        class="reasoning-block"
        :class="{ 'expanded': showReasoning }"
      >
        <div class="reasoning-header" @click="showReasoning = !showReasoning">
          <span>💭 思考过程</span>
          <span class="toggle">{{ showReasoning ? '▼' : '▶' }}</span>
        </div>
        <div v-show="showReasoning" class="reasoning-content">
          <pre>{{ message.reasoningContent }}</pre>
        </div>
      </div>
      
      <!-- 主内容 -->
      <div class="message-content" v-html="renderedContent"></div>
      
      <!-- 操作栏 -->
      <div class="message-actions" v-if="message.role === 'assistant' && !message.isStreaming">
        <button @click="copyContent" title="复制">
          {{ copied ? '✅ 已复制' : '📋 复制' }}
        </button>
        <button v-if="isLast" @click="$emit('regenerate')" title="重新生成">
          🔄 重新生成
        </button>
      </div>
      
      <!-- 流式指示器 -->
      <div v-if="message.isStreaming" class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <!-- 错误提示 -->
      <div v-if="message.error" class="error-msg">
        ⚠️ {{ message.error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChatMessage } from '@/types/chat'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{
  message: ChatMessage
  isLast?: boolean
}>()

defineEmits<{
  regenerate: []
}>()

const showReasoning = ref(false)
const copied = ref(false)

// 渲染Markdown
const renderedContent = computed(() => {
  return renderMarkdown(props.message.content)
})

// 复制内容
const copyContent = () => {
  navigator.clipboard.writeText(props.message.content)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
</script>

<style scoped lang="scss">
.message {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  
  &.user {
    background: #f9fafb;
    
    .dark & {
      background: #262626;
    }
  }
  
  &.assistant {
    background: transparent;
  }
}

.avatar {
  flex-shrink: 0;
  
  .user-avatar, .ai-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background: #e5e7eb;
    
    .dark & {
      background: #374151;
    }
  }
  
  .ai-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}

.content-wrapper {
  flex: 1;
  min-width: 0;
}

.reasoning-block {
  margin-bottom: 12px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  
  .dark & {
    border-color: #4b5563;
  }
}

.reasoning-header {
  padding: 8px 12px;
  background: #f3f4f6;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
  
  .dark & {
    background: #374151;
    color: #9ca3af;
  }
  
  .toggle {
    font-size: 10px;
  }
}

.reasoning-content {
  padding: 12px;
  background: #fafafa;
  font-size: 13px;
  color: #4b5563;
  max-height: 300px;
  overflow-y: auto;
  
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: monospace;
  }
  
  .dark & {
    background: #1f2937;
    color: #d1d5db;
  }
}

.message-content {
  line-height: 1.7;
  font-size: 15px;
  
  :deep(p) {
    margin: 0 0 12px 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(pre) {
    margin: 12px 0;
    border-radius: 8px;
    overflow: hidden;
  }
  
  :deep(code) {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
  }
  
  :deep(ul, ol) {
    margin: 12px 0;
    padding-left: 24px;
  }
}

.message-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  
  button {
    padding: 4px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: white;
    font-size: 12px;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s;
    
    &:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }
    
    .dark & {
      background: #374151;
      border-color: #4b5563;
      color: #9ca3af;
    }
  }
}

.typing-indicator {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  
  span {
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out both;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes typing {
  0%, 80%, 100% { 
    transform: scale(0);
    opacity: 0.5;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

.error-msg {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 6px;
  color: #991b1b;
  font-size: 13px;
}
</style>