<!-- 
  应用根组件
  功能：路由视图、全局状态初始化、主题管理、错误边界
-->
<template>
  <div id="app" :class="{ 'dark': isDarkMode }">
    <!-- 全局加载指示器 -->
    <div v-if="globalLoading" class="global-loading">
      <div class="spinner"></div>
      <span>{{ globalLoadingText }}</span>
    </div>
    
    <!-- 全局通知 -->
    <div class="global-notifications">
      <TransitionGroup name="notification">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification"
          :class="notification.type"
        >
          <span class="icon">{{ notificationIcons[notification.type] }}</span>
          <span class="message">{{ notification.message }}</span>
          <button class="close" @click="removeNotification(notification.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
    
    <!-- 路由视图 -->
    <router-view v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <KeepAlive :include="['ChatView']">
          <Component :is="Component" />
        </KeepAlive>
      </Transition>
    </router-view>
    
    <!-- 版本信息（开发环境） -->
    <div v-if="isDev" class="dev-badge">
      DEV {{ appVersion }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, computed, onErrorCaptured, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUserStore } from '@/stores/userStore'

const settingsStore = useSettingsStore()
const userStore = useUserStore()

const isDarkMode = computed(() => settingsStore.isDarkMode)
const isDev = import.meta.env.DEV
const appVersion = import.meta.env.VITE_APP_VERSION || '0.0.0'

// 全局加载
const globalLoading = ref(false)
const globalLoadingText = ref('加载中...')

// 通知系统
interface Notification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

const notifications = ref<Notification[]>([])
let notificationId = 0

const notificationIcons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
}

/**
 * 显示通知
 */
const showNotification = (
  message: string, 
  type: Notification['type'] = 'info',
  duration = 3000
) => {
  const id = ++notificationId
  const notification: Notification = { id, type, message, duration }
  
  notifications.value.push(notification)
  
  // 自动移除
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }
  
  return id
}

/**
 * 移除通知
 */
const removeNotification = (id: number) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

/**
 * 设置全局加载
 */
const setGlobalLoading = (loading: boolean, text = '加载中...') => {
  globalLoading.value = loading
  globalLoadingText.value = text
}

// 提供给子组件
provide('notification', showNotification)
provide('setLoading', setGlobalLoading)

// 错误捕获
onErrorCaptured((err, instance, info) => {
  console.error('全局错误捕获:', err)
  console.error('组件:', instance)
  console.error('信息:', info)
  
  showNotification(
    err instanceof Error ? err.message : '发生未知错误',
    'error',
    5000
  )
  
  return false // 阻止错误继续传播
})

// 初始化
onMounted(() => {
  // 恢复用户会话
  if (userStore.token) {
    userStore.restoreSession().catch(() => {
      // 恢复失败，清除状态
      userStore.logout(false)
    })
  }
  
  // 应用主题
  if (settingsStore.isDarkMode) {
    document.documentElement.classList.add('dark')
  }
  
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    if (settingsStore.isDarkMode) {
      document.documentElement.classList.toggle('dark', e.matches)
    }
  })
})
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: background 0.3s, color 0.3s;
}

// 全局加载
.global-loading {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 9999;
  color: white;
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 全局通知
.global-notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
  backdrop-filter: blur(10px);
  
  .icon {
    font-size: 20px;
    flex-shrink: 0;
  }
  
  .message {
    flex: 1;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .close {
    width: 24px;
    height: 24px;
    border: none;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }
  
  &.success {
    background: rgba(16, 185, 129, 0.95);
    color: white;
  }
  
  &.error {
    background: rgba(239, 68, 68, 0.95);
    color: white;
  }
  
  &.warning {
    background: rgba(245, 158, 11, 0.95);
    color: white;
  }
  
  &.info {
    background: rgba(59, 130, 246, 0.95);
    color: white;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 通知动画
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

// 页面切换动画
.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

// 开发环境标识
.dev-badge {
  position: fixed;
  bottom: 10px;
  right: 10px;
  padding: 4px 12px;
  background: #f59e0b;
  color: white;
  font-size: 12px;
  font-weight: bold;
  border-radius: 20px;
  z-index: 9999;
  pointer-events: none;
}
</style>