<!-- 
  侧边栏组件
  功能：会话列表、新建对话、删除确认、时间分组
-->
<template>
  <aside class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-header">
      <button class="btn-new" @click="$emit('new')">
        <span>+</span> 新对话
      </button>
      
      <button class="btn-collapse" @click="isCollapsed = !isCollapsed">
        {{ isCollapsed ? '→' : '←' }}
      </button>
    </div>
    
    <div class="sessions-list">
      <div v-if="sessions.length === 0" class="empty">
        暂无对话记录
      </div>
      
      <template v-else>
        <!-- 今天 -->
        <div v-if="todaySessions.length" class="session-group">
          <div class="group-title">今天</div>
          <SessionItem
            v-for="session in todaySessions"
            :key="session.id"
            :session="session"
            :is-active="currentId === session.id"
            @select="$emit('select', session.id)"
            @delete="confirmDelete(session.id)"
          />
        </div>
        
        <!-- 昨天 -->
        <div v-if="yesterdaySessions.length" class="session-group">
          <div class="group-title">昨天</div>
          <SessionItem
            v-for="session in yesterdaySessions"
            :key="session.id"
            :session="session"
            :is-active="currentId === session.id"
            @select="$emit('select', session.id)"
            @delete="confirmDelete(session.id)"
          />
        </div>
        
        <!-- 更早 -->
        <div v-if="olderSessions.length" class="session-group">
          <div class="group-title">更早</div>
          <SessionItem
            v-for="session in olderSessions"
            :key="session.id"
            :session="session"
            :is-active="currentId === session.id"
            @select="$emit('select', session.id)"
            @delete="confirmDelete(session.id)"
          />
        </div>
      </template>
    </div>
    
    <!-- 底部信息 -->
    <div class="sidebar-footer">
      <div class="user-info">
        <span class="avatar">👤</span>
        <span class="name">本地用户</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChatSession } from '@/types/chat'
import SessionItem from './SessionItem.vue'

const props = defineProps<{
  sessions: ChatSession[]
  currentId: string | null
}>()

defineEmits<{
  new: []
  select: [id: string]
  delete: [id: string]
}>()

const isCollapsed = ref(false)

// 时间分组
const todaySessions = computed(() => 
  props.sessions.filter(s => isToday(s.updatedAt))
)

const yesterdaySessions = computed(() => 
  props.sessions.filter(s => isYesterday(s.updatedAt))
)

const olderSessions = computed(() => 
  props.sessions.filter(s => !isToday(s.updatedAt) && !isYesterday(s.updatedAt))
)

// 时间判断工具函数
const isToday = (dateStr: string) => {
  const date = new Date(dateStr)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const isYesterday = (dateStr: string) => {
  const date = new Date(dateStr)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}

const confirmDelete = (id: string) => {
  if (confirm('确定删除这个对话吗？')) {
    emit('delete', id)
  }
}
</script>

<style scoped lang="scss">
.sidebar {
  width: 260px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  
  &.collapsed {
    width: 0;
    overflow: hidden;
    border-right: none;
  }
  
  .dark & {
    background: #171717;
    border-color: #374151;
  }
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
  
  .dark & {
    border-color: #374151;
  }
}

.btn-new {
  flex: 1;
  padding: 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #eff6ff;
  }
  
  .dark & {
    background: #374151;
    border-color: #4b5563;
    color: #e5e5e5;
  }
}

.btn-collapse {
  width: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  
  .dark & {
    background: #374151;
    border-color: #4b5563;
    color: #e5e5e5;
  }
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 40px 20px;
  font-size: 14px;
}

.session-group {
  margin-bottom: 16px;
}

.group-title {
  padding: 8px 12px;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  
  .dark & {
    border-color: #374151;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  
  .dark & {
    color: #e5e5e5;
  }
  
  .avatar {
    font-size: 20px;
  }
}
</style>