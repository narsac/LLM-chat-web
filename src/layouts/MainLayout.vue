<!-- 
  主布局组件
  功能：侧边栏、顶部导航、路由视图、用户菜单
-->
<template>
  <div class="main-layout" :class="{ 'dark': settingsStore.isDarkMode }">
    <!-- 侧边栏 -->
    <Sidebar 
      :collapsed="sidebarCollapsed"
      @toggle="sidebarCollapsed = !sidebarCollapsed"
    />
    
    <!-- 主内容区 -->
    <div class="main-content" :class="{ 'expanded': sidebarCollapsed }">
      <!-- 顶部导航 -->
      <header class="top-nav">
        <div class="nav-left">
          <button class="btn-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
            <span v-if="sidebarCollapsed">→</span>
            <span v-else>←</span>
          </button>
          
          <!-- 面包屑 -->
          <nav class="breadcrumb">
            <span v-for="(item, index) in breadcrumbs" :key="index">
              <router-link v-if="item.path" :to="item.path">{{ item.name }}</router-link>
              <span v-else>{{ item.name }}</span>
              <span v-if="index < breadcrumbs.length - 1" class="separator">/</span>
            </span>
          </nav>
        </div>
        
        <div class="nav-right">
          <!-- 模型选择器 -->
          <ModelSelector
            :models="settingsStore.models"
            :current="settingsStore.currentModelId"
            @change="settingsStore.setModel"
          />
          
          <!-- 用户菜单 -->
          <div class="user-menu" v-click-outside="closeUserMenu">
            <button class="user-btn" @click="showUserMenu = !showUserMenu">
              <img :src="userStore.avatar" alt="avatar" class="avatar">
              <span class="username">{{ userStore.displayName }}</span>
              <span class="arrow">▼</span>
            </button>
            
            <Transition name="dropdown">
              <div v-if="showUserMenu" class="dropdown-menu">
                <div class="menu-header">
                  <img :src="userStore.avatar" alt="avatar" class="avatar-large">
                  <div class="user-info">
                    <div class="name">{{ userStore.displayName }}</div>
                    <div class="email">{{ userStore.userInfo?.email }}</div>
                  </div>
                </div>
                
                <div class="menu-divider"></div>
                
                <router-link to="/profile" class="menu-item" @click="showUserMenu = false">
                  <span class="icon">👤</span>
                  个人中心
                </router-link>
                
                <router-link to="/settings" class="menu-item" @click="showUserMenu = false">
                  <span class="icon">⚙️</span>
                  系统设置
                </router-link>
                
                <div class="menu-divider"></div>
                
                <button class="menu-item danger" @click="handleLogout">
                  <span class="icon">🚪</span>
                  退出登录
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>
      
      <!-- 路由视图 -->
      <main class="page-content">
        <router-view v-slot="{ Component }">
          <KeepAlive :include="['Chat']">
            <Component :is="Component" />
          </KeepAlive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useSettingsStore } from '@/stores/settingsStore'
import Sidebar from '@/components/Sidebar.vue'
import ModelSelector from '@/components/ModelSelector.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const sidebarCollapsed = ref(false)
const showUserMenu = ref(false)

// 面包屑
const breadcrumbs = computed(() => {
  const matched = route.matched
  return matched.map((record, index) => ({
    name: record.meta.title || record.name,
    path: index < matched.length - 1 ? record.path : null
  })).filter(item => item.name)
})

const closeUserMenu = () => {
  showUserMenu.value = false
}

const handleLogout = () => {
  showUserMenu.value = false
  userStore.logout()
}

// 点击外部指令
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    el._clickOutside = (e: Event) => {
      if (!el.contains(e.target as Node)) binding.value()
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', el._clickOutside)
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  min-height: 100vh;
  background: #f3f4f6;
  
  &.dark {
    background: #111827;
    color: #e5e5e5;
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 260px;
  transition: margin-left 0.3s;
  
  &.expanded {
    margin-left: 64px;
  }
}

// 顶部导航
.top-nav {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  
  .dark & {
    background: #1f2937;
    border-color: #374151;
  }
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-toggle {
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  transition: all 0.2s;
  
  &:hover {
    background: #e5e7eb;
  }
  
  .dark & {
    background: #374151;
    color: #9ca3af;
    
    &:hover {
      background: #4b5563;
    }
  }
}

.breadcrumb {
  font-size: 14px;
  color: #6b7280;
  
  a {
    color: #3b82f6;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  .separator {
    margin: 0 8px;
    color: #d1d5db;
  }
  
  .dark & {
    color: #9ca3af;
  }
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

// 用户菜单
.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #d1d5db;
    background: #f9fafb;
  }
  
  .dark & {
    background: #374151;
    border-color: #4b5563;
    color: #e5e5e5;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
  
  .username {
    font-size: 14px;
    font-weight: 500;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .arrow {
    font-size: 10px;
    color: #9ca3af;
  }
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  z-index: 200;
  overflow: hidden;
  
  .dark & {
    background: #1f2937;
    border-color: #374151;
  }
}

.menu-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f9fafb;
  
  .dark & {
    background: #374151;
  }
  
  .avatar-large {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }
  
  .user-info {
    .name {
      font-weight: 600;
      color: #1f2937;
      
      .dark & {
        color: #e5e5e5;
      }
    }
    
    .email {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
      
      .dark & {
        color: #9ca3af;
      }
    }
  }
}

.menu-divider {
  height: 1px;
  background: #e5e7eb;
  
  .dark & {
    background: #374151;
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #374151;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  
  &:hover {
    background: #f3f4f6;
  }
  
  .dark & {
    color: #e5e5e5;
    
    &:hover {
      background: #374151;
    }
  }
  
  &.danger {
    color: #ef4444;
    
    &:hover {
      background: #fee2e2;
    }
    
    .dark & {
      &:hover {
        background: rgba(239, 68, 68, 0.1);
      }
    }
  }
  
  .icon {
    font-size: 18px;
  }
}

// 页面内容
.page-content {
  flex: 1;
  overflow: hidden;
}

// 动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// 响应式
@media (max-width: 768px) {
  .main-content {
    margin-left: 0 !important;
  }
  
  .username {
    display: none;
  }
}
</style>