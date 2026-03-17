<template>
  <div class="message-wrapper" :class="{ 'consecutive': isConsecutive }">
    <div class="message" :class="message.role">
      <div class="message-avatar">
        <div class="avatar-circle" :class="message.role">
          <span>{{ message.role === 'user' ? '👤' : 'DeepSeek' }}</span>
        </div>
      </div>
      <div class="message-content-wrapper">
        <div class="message-sender">
          {{ message.role === 'user' ? '你' : 'DeepSeek Chat' }}
        </div>
        <div class="message-content" v-html="renderedContent"></div>
        <div v-if="message.streaming" class="streaming-cursor"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '../../utils/markdown'
import type { Message } from '../../types'

const props = defineProps<{
  message: Message
  isConsecutive?: boolean
}>()

const emit = defineEmits<{
  (e: 'regenerate'): void
}>()

const renderedContent = computed<string>(() => {
  if (!props.message.content) return ''
  return renderMarkdown(props.message.content)
})

const copyMessage = (): void => {
  navigator.clipboard.writeText(props.message.content)
  // 可以添加一个复制成功的提示
}

const regenerateMessage = (): void => {
  emit('regenerate')
}
</script>

<style scoped>
.message-wrapper {
  padding: 8px 24px;
  transition: background 0.2s;
}

.message-wrapper:hover {
  background: #fafafa;
}

.message-wrapper.consecutive {
  padding-top: 4px;
}

.message {
  display: flex;
  gap: 16px;
  max-width: 900px;
  margin: 0 auto;
}

/* 头像样式 */
.message-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

.avatar-circle.user {
  background: #10a37f;
  color: white;
}

.avatar-circle.assistant {
  background: #f5f5f5;
  color: #1a1a1a;
  border: 1px solid #e5e5e5;
}

/* 消息内容区域 */
.message-content-wrapper {
  flex: 1;
  min-width: 0;
}

.message-sender {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.message-content {
  font-size: 16px;
  line-height: 1.6;
  color: #1a1a1a;
  word-wrap: break-word;
}

/* Markdown 内容样式 */
.message-content :deep(p) {
  margin: 0 0 12px 0;
}

.message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.message-content :deep(pre) {
  background: #f6f8fa;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  margin: 12px 0;
}

.message-content :deep(code) {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
  font-size: 14px;
}

.message-content :deep(blockquote) {
  margin: 12px 0;
  padding: 0 16px;
  color: #666;
  border-left: 4px solid #e5e5e5;
}

.message-content :deep(ul), 
.message-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.message-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.message-content :deep(a) {
  color: #10a37f;
  text-decoration: none;
}

.message-content :deep(a:hover) {
  text-decoration: underline;
}

.message-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.message-content :deep(th),
.message-content :deep(td) {
  border: 1px solid #e5e5e5;
  padding: 8px 12px;
  text-align: left;
}

.message-content :deep(th) {
  background: #f5f5f5;
  font-weight: 600;
}

/* 流式光标 */
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 20px;
  background: #10a37f;
  margin-left: 4px;
  animation: blink 1s infinite;
  vertical-align: middle;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 操作按钮 */
.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.action-btn {
  padding: 6px;
  background: transparent;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
  color: #1a1a1a;
}
</style>