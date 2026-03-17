<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- 侧边栏头部 -->
    <div class="sidebar-header">
      <div class="logo-area">
        <span v-if="!isCollapsed" class="logo-text">LLM-chat</span>
      </div>
      
      <!-- 隐藏/显示侧边栏按钮 -->
      <button 
        class="toggle-btn" 
        @click="toggleSidebar" 
        :title="isCollapsed ? '展开侧边栏' : '折叠侧边栏'"
      >
        <span class="toggle-icon">{{ isCollapsed ? '▶' : '◀' }}</span>
      </button>
    </div>
    
    <!-- 新对话按钮 -->
    <div class="new-chat-section">
      <button class="new-chat-btn" @click="handleNewChat" :title="'新对话'">
        <span class="icon">➕</span>
        <span v-if="!isCollapsed">新的聊天</span>
      </button>
    </div>
    
    <!-- 会话列表 -->
    <div class="sessions-list">
      <div class="sessions-header" v-if="!isCollapsed">
        <span>对话历史</span>
      </div>
      
      <div
        v-for="session in sessionStore.sessions"
        :key="session.id"
        class="session-item"
        :class="{ 
          active: session.id === sessionStore.currentSessionId,
          collapsed: isCollapsed 
        }"
        @click="switchSession(session.id)"
      >
        <span class="session-icon">💬</span>
        <span v-if="!isCollapsed" class="session-title">{{ session.title }}</span>
        <button 
          v-if="!isCollapsed" 
          class="delete-btn" 
          @click.stop="deleteSession(session.id)"
          title="删除对话"
        >
          <span class="delete-icon">🗑️</span>
        </button>
      </div>
      
      <!-- 空状态提示 -->
      <div v-if="sessionStore.sessions.length === 0 && !isCollapsed" class="empty-state">
        暂无对话历史
      </div>
    </div>
    
    <!-- 用户信息 -->
    <div class="user-info" v-if="userStore.isLoggedIn">
      <div class="user-avatar">
        <span>{{ userStore.userInfo?.name?.charAt(0) || 'U' }}</span>
      </div>
      <div v-if="!isCollapsed" class="user-details">
        <div class="user-name">{{ userStore.userInfo?.name }}</div>
        <div class="user-email">{{ userStore.userInfo?.email }}</div>
      </div>
      <button 
        class="logout-btn" 
        @click="handleLogout"
        :title="'退出登录'"
      >
        <span class="logout-icon">🚪</span>
        <span v-if="!isCollapsed" class="logout-text">退出</span>
      </button>
    </div>
    
    <!-- 未登录状态 -->
    <div v-else class="user-info">
      <div class="user-avatar">
        <span>👤</span>
      </div>
      <div v-if="!isCollapsed" class="user-details">
        <div class="user-name">未登录</div>
        <button class="login-link" @click="goToLogin">去登录</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSessionStore } from '../../stores/session'
import { useUserStore } from '../../stores/user'
import { useChatStore } from '../../stores/chat'
import { useRouter } from 'vue-router'

const sessionStore = useSessionStore()
const userStore = useUserStore()
const chatStore = useChatStore()
const router = useRouter()

const isCollapsed = ref<boolean>(false)

// 切换侧边栏
const toggleSidebar = (): void => {
  isCollapsed.value = !isCollapsed.value
}

const handleNewChat = (): void => {
  const newSession = sessionStore.createSession()
  chatStore.clearCurrentSession()
  router.push(`/chat/${newSession.id}`)
}

const switchSession = (sessionId: string): void => {
  sessionStore.currentSessionId = sessionId
  router.push(`/chat/${sessionId}`)
}

const deleteSession = (id: string): void => {
  if (confirm('确定要删除这个对话吗？')) {
    sessionStore.deleteSession(id)
    if (sessionStore.sessions.length > 0) {
      router.push(`/chat/${sessionStore.sessions[0].id}`)
    } else {
      router.push('/')
    }
  }
}

const handleLogout = (): void => {
  userStore.logout()
  router.push('/login')
}

const goToLogin = (): void => {
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  background: #ffffff;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
  height: 100vh;
  transition: width 0.3s ease;
  position: relative;
  border-right: 1px solid #e5e5e5;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.02);
}

.sidebar.collapsed {
  width: 70px;
}

/* 侧边栏头部 */
.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

/* 折叠/展开按钮 */
.toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.toggle-btn:hover {
  background: #e5e5e5;
  color: #1a1a1a;
}

.toggle-icon {
  font-size: 14px;
  font-weight: bold;
}

/* 新对话区域 */
.new-chat-section {
  padding: 16px;
}

.new-chat-btn {
  width: 100%;
  padding: 12px;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  color: #1a1a1a;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
}

.new-chat-btn:hover {
  background: #e5e5e5;
  border-color: #d0d0d0;
}

.new-chat-btn .icon {
  font-size: 16px;
}

/* 会话列表 */
.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
}

.sessions-header {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.session-item {
  padding: 10px 12px;
  margin-bottom: 2px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  position: relative;
  white-space: nowrap;
  color: #4a4a4a;
}

.session-item:hover {
  background: #f5f5f5;
}

.session-item.active {
  background: #f0f9f4;
  color: #10a37f;
}

.session-item.active .session-icon {
  color: #10a37f;
}

.session-item.collapsed {
  padding: 10px;
  justify-content: center;
}

.session-item.collapsed .session-icon {
  margin: 0;
  font-size: 20px;
}

.session-icon {
  font-size: 16px;
  color: #999;
  flex-shrink: 0;
  transition: color 0.2s;
}

.session-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}

.delete-btn {
  opacity: 0;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  transition: opacity 0.2s, color 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.delete-btn:hover {
  background: #ffebeb;
  color: #ff4d4d;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

/* 空状态 */
.empty-state {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
  background: #fafafa;
  border-radius: 8px;
  margin-top: 8px;
}

/* 用户信息区域 */
.user-info {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fafafa;
}

.sidebar.collapsed .user-info {
  padding: 16px 8px;
  justify-content: center;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #10a37f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
  font-size: 16px;
}

.user-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-link {
  background: none;
  border: none;
  color: #10a37f;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  text-align: left;
  margin-top: 2px;
}

.login-link:hover {
  text-decoration: underline;
}

.logout-btn {
  padding: 6px 12px;
  border-radius: 6px;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-size: 13px;
  flex-shrink: 0;
}

.sidebar.collapsed .logout-btn {
  padding: 8px;
}

.logout-btn:hover {
  background: #ffebeb;
  border-color: #ffcdcd;
  color: #ff4d4d;
}

.logout-icon {
  font-size: 14px;
}

.logout-text {
  font-size: 13px;
}

/* 滚动条样式 */
.sessions-list::-webkit-scrollbar {
  width: 6px;
}

.sessions-list::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.sessions-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.sessions-list::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

/* 暗色模式 - 可选，但主要保持白色主题 */
@media (prefers-color-scheme: dark) {
  .sidebar {
    background: #ffffff; /* 保持白色，忽略系统暗色模式 */
  }
}
</style>