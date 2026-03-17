<template>
  <div class="chat-input-container">
    <div class="input-wrapper" :class="{ 'focused': isFocused }">
      <textarea
        ref="textarea"
        v-model="inputMessage"
        placeholder="给 DeepSeek 发送消息"
        @keydown="handleKeyDown"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :disabled="isLoading"
        rows="1"
      ></textarea>
      
      <div class="input-tools">
        <!-- 文件上传按钮 -->
        <button 
          class="tool-btn" 
          type="button" 
          title="上传文件"
          @click="triggerFileUpload"
          :disabled="isLoading"
        >
          <span>📎</span>
        </button>
        
        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInput"
          type="file"
          class="file-input"
          @change="handleFileSelect"
          accept=".txt,.md,.json,.js,.ts,.vue,.html,.css,.pdf,.doc,.docx"
          multiple
        />
        
        <!-- 发送按钮 -->
        <button 
          class="send-btn" 
          @click="handleSend" 
          :disabled="!inputMessage.trim() || isLoading"
          :class="{ 'has-content': inputMessage.trim() }"
          :title="'发送消息 (Enter)'"
        >
          <span>⏎</span>
        </button>
      </div>
    </div>
    
    <!-- 文件预览区域 -->
    <div v-if="selectedFiles.length > 0" class="file-preview">
      <div 
        v-for="(file, index) in selectedFiles" 
        :key="index" 
        class="file-item"
      >
        <span class="file-icon">📄</span>
        <span class="file-name">{{ file.name }}</span>
        <span class="file-size">{{ formatFileSize(file.size) }}</span>
        <button class="file-remove" @click="removeFile(index)">✕</button>
      </div>
    </div>
    
    <!-- 输入提示 -->
    <div class="input-hint">
      <span class="hint-text">Enter 发送，Shift + Enter 换行</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'send', content: string, files?: File[]): void
}>()

const inputMessage = ref<string>('')
const textarea = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isFocused = ref<boolean>(false)
const selectedFiles = ref<File[]>([])

// 自动调整文本框高度
const adjustTextareaHeight = (): void => {
  const textareaEl = textarea.value
  if (textareaEl) {
    textareaEl.style.height = 'auto'
    textareaEl.style.height = Math.min(textareaEl.scrollHeight, 200) + 'px'
  }
}

// 处理键盘事件
const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  } else {
    nextTick(() => {
      adjustTextareaHeight()
    })
  }
}

// 触发文件上传
const triggerFileUpload = (): void => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

// 处理文件选择
const handleFileSelect = (event: Event): void => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    const newFiles = Array.from(input.files)
    selectedFiles.value = [...selectedFiles.value, ...newFiles]
  }
  // 清空 input 值，允许再次选择相同文件
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 移除文件
const removeFile = (index: number): void => {
  selectedFiles.value.splice(index, 1)
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 发送消息
const handleSend = (): void => {
  if ((!inputMessage.value.trim() && selectedFiles.value.length === 0) || props.isLoading) return
  
  emit('send', inputMessage.value.trim(), selectedFiles.value)
  inputMessage.value = ''
  selectedFiles.value = []
  
  // 重置文本框高度
  if (textarea.value) {
    textarea.value.style.height = 'auto'
  }
}
</script>

<style scoped>
.chat-input-container {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 24px;
  padding: 8px 8px 8px 16px;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.input-wrapper.focused {
  border-color: #10a37f;
  box-shadow: 0 4px 12px rgba(16, 163, 127, 0.1);
}

textarea {
  flex: 1;
  background: none;
  border: none;
  color: #1a1a1a;
  font-size: 16px;
  resize: none;
  max-height: 200px;
  padding: 8px 0;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
}

textarea::placeholder {
  color: #999;
}

textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-tools {
  display: flex;
  gap: 4px;
  align-items: center;
}

.tool-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.tool-btn:hover:not(:disabled) {
  background: #f5f5f5;
  color: #1a1a1a;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.file-input {
  display: none;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  color: #666;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn.has-content {
  background: #10a37f;
  border-color: #10a37f;
  color: white;
}

.send-btn:hover:not(:disabled) {
  background: #0e8c6c;
  border-color: #0e8c6c;
  color: white;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 文件预览区域 */
.file-preview {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 13px;
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-icon {
  font-size: 14px;
}

.file-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1a1a1a;
}

.file-size {
  color: #666;
  font-size: 11px;
}

.file-remove {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.file-remove:hover {
  color: #dc2626;
}

.input-hint {
  margin-top: 8px;
  text-align: center;
}

.hint-text {
  font-size: 12px;
  color: #999;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .input-wrapper {
    background: #2d2d2d;
    border-color: #404040;
  }
  
  textarea {
    color: #e5e5e5;
  }
  
  textarea::placeholder {
    color: #666;
  }
  
  .tool-btn {
    color: #999;
  }
  
  .tool-btn:hover:not(:disabled) {
    background: #404040;
    color: #e5e5e5;
  }
  
  .send-btn {
    background: #404040;
    border-color: #4a4a4a;
    color: #999;
  }
  
  .file-item {
    background: #404040;
  }
  
  .file-name {
    color: #e5e5e5;
  }
  
  .file-size {
    color: #999;
  }
  
  .hint-text {
    color: #666;
  }
}
</style>