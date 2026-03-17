<template>
  <div class="chat-view">
    <Sidebar />
    <div class="chat-main">
      <!-- 头部 -->
      <div class="chat-header">
        <div class="header-left">
          <h2>DeepSeek Chat</h2>
        </div>
        <div class="header-right">
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="!chatStore.currentMessages.length" class="welcome-section">
          <div class="welcome-content">
            <h1 class="welcome-title">有什么可以帮忙的吗？</h1>
            <p class="welcome-subtitle">我是 DeepSeek Chat，很高兴为你服务</p>
            
            <!-- 建议问题卡片 -->
            <div class="suggestion-cards">
              <div class="suggestion-card" @click="handleSuggestionClick('写一篇关于人工智能的文章')">
                <span class="card-icon">📝</span>
                <span>写一篇关于人工智能的文章</span>
              </div>
              <div class="suggestion-card" @click="handleSuggestionClick('解释什么是量子计算')">
                <span class="card-icon">🔬</span>
                <span>解释什么是量子计算</span>
              </div>
              <div class="suggestion-card" @click="handleSuggestionClick('帮我写一个Vue3组件')">
                <span class="card-icon">💻</span>
                <span>帮我写一个Vue3组件</span>
              </div>
              <div class="suggestion-card" @click="handleSuggestionClick('翻译这段文字')">
                <span class="card-icon">🌐</span>
                <span>翻译这段文字</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-else class="message-list">
          <MessageItem
            v-for="(message, index) in chatStore.currentMessages"
            :key="message.id"
            :message="message"
            :is-consecutive="index > 0 && chatStore.currentMessages[index - 1].role === message.role"
          />
        </div>

        <!-- 加载指示器 -->
        <div v-if="chatStore.isLoading && chatStore.streamingContent" class="streaming-indicator">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-area">
        <ChatInput 
          :is-loading="chatStore.isLoading" 
          @send="handleSendMessage"
        />
        
        <!-- 底部提示 -->
        <div class="footer-note">
          <span> AI可能会犯错，请核查重要信息。</span>
          <a href="#" class="footer-link">隐私政策</a>
          <span class="separator">·</span>
          <a href="#" class="footer-link">使用条款</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '../stores/chat'
import { useSessionStore } from '../stores/session'
import Sidebar from '../components/layout/Sidebar.vue'
import MessageItem from '../components/chat/MessageItem.vue'
import ChatInput from '../components/chat/ChatInput.vue'

const route = useRoute()
const chatStore = useChatStore()
const sessionStore = useSessionStore()
const messagesContainer = ref<HTMLElement | null>(null)
const showSettings = ref(false)

// 监听路由参数变化，切换会话
watch(() => route.params.id as string, (newId: string) => {
  if (newId) {
    sessionStore.currentSessionId = newId
  }
}, { immediate: true })

// 监听消息变化，滚动到底部
watch(
  () => chatStore.currentMessages,
  () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  },
  { deep: true }
)

// 发送消息
const handleSendMessage = async (content: string): Promise<void> => {
  await chatStore.sendMessage(content)
}

// 处理建议问题点击
const handleSuggestionClick = (text: string): void => {
  handleSendMessage(text)
}

// 添加一个 ref 来监听侧边栏状态
const isSidebarCollapsed = ref(false)

// 提供方法给子组件修改
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

provide('sidebarState', {
  isCollapsed: isSidebarCollapsed,
  toggle: toggleSidebar
})
</script>

<style scoped>
.chat-view {
  display: flex;
  height: 100vh;
  background: #ffffff;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  position: relative;
}

/* 头部样式 */
.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e5e5;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.model-badge {
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 12px;
  color: #666;
}

.icon-btn {
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: #f5f5f5;
}

/* 消息容器 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  scroll-behavior: smooth;
}

/* 欢迎区域 */
.welcome-section {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.welcome-content {
  max-width: 800px;
  width: 100%;
  text-align: center;
}

.welcome-title {
  font-size: 36px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-subtitle {
  font-size: 18px;
  color: #666;
  margin-bottom: 48px;
}

/* 建议卡片 */
.suggestion-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 32px;
}

.suggestion-card {
  padding: 20px;
  background: #f9f9f9;
  border: 1px solid #eaeaea;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  font-size: 15px;
  color: #333;
}

.suggestion-card:hover {
  background: #f0f0f0;
  border-color: #d0d0d0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-icon {
  font-size: 24px;
}

/* 消息列表 */
.message-list {
  padding: 20px 0;
}

/* 流式输出指示器 */
.streaming-indicator {
  padding: 20px 24px;
  display: flex;
  justify-content: center;
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 24px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* 输入区域 */
.input-area {
  padding: 24px 24px 16px;
  background: #ffffff;
  border-top: 1px solid #e5e5e5;
}

/* 底部提示 */
.footer-note {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.footer-link {
  color: #666;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #1a1a1a;
  text-decoration: underline;
}

.separator {
  color: #ddd;
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>