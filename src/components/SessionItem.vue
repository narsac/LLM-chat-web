<!-- 
  会话列表项组件
  功能：会话信息、选中状态、快捷操作、点击进入
-->
<template>
  <div 
    class="session-item"
    :class="{ active: isActive }"
    @click="$emit('select')"
  >
    <div class="session-icon">💬</div>
    <div class="session-info">
      <div class="session-title">{{ session.title }}</div>
      <div class="session-meta">
        {{ formatTime(session.updatedAt) }} · {{ session.messages.length }}条消息
      </div>
    </div>
    <button 
      class="btn-delete"
      @click.stop="$emit('delete')"
      title="删除"
    >
      🗑️
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ChatSession } from '@/types/chat'

defineProps<{
  session: ChatSession
  isActive: boolean
}>()

defineEmits<{
  select: []
  delete: []
}>()

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<style scoped lang="scss">
.session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  
  &:hover {
    background: #f3f4f6;
    
    .btn-delete {
      opacity: 1;
    }
  }
  
  &.active {
    background: #eff6ff;
    
    .dark & {
      background: #1e3a8a;
    }
    
    .session-title {
      color: #3b82f6;
      font-weight: 500;
    }
  }
  
  .dark & {
    &:hover {
      background: #262626;
    }
  }
}

.session-icon {
  font-size: 16px;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  .dark & {
    color: #e5e5e5;
  }
}

.session-meta {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.btn-delete {
  opacity: 0;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: #fee2e2;
  }
}
</style>